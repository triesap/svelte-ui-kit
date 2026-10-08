import { writeFileSync } from "node:fs";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Menu keyboard ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildMenuConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildMenuConsumer(custom, "menu-keyboard");
      try {
        hosted = await startFixtureServer({ handler: consumer.handler });
      } catch (error) {
        consumer.cleanup();
        throw error;
      }
    });
    test.afterAll(async () => {
      try {
        if (hosted) {
          await hosted.server.stop();
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        consumer?.cleanup();
      }
    });
    test.beforeEach(async ({ page }, info) => {
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("keyboard opens with first-item focus and roving loop skips disabled items", async ({
      page,
    }) => {
      await page.locator("#trigger").press("Enter");
      await expect(page.locator("#apple")).toBeFocused();
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("#banana")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.locator("#large")).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("ArrowUp");
      await expect(page.locator("#large")).toBeFocused();
      await page.keyboard.press("Home");
      await expect(page.locator("#apple")).toBeFocused();
      await expect(page.locator("#content")).toHaveAccessibleName("Actions");
    });
    test("native DOM-text typeahead focuses actual item and preserves nonclosing selection", async ({
      page,
    }) => {
      await page.locator("#trigger").press("ArrowDown");
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("b");
      await expect(page.locator("#banana")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#state")).toContainText("selections 1");
    });
    for (const key of ["Enter", "Space"])
      test(`ordinary ${key} selection closes and restores trigger focus`, async ({
        page,
      }) => {
        await page.locator("#trigger").press("Enter");
        await expect(page.locator("#apple")).toBeFocused();
        await expect(page.locator("#apple")).toBeFocused();
        await page.keyboard.press(key);
        await expect(page.locator("#content")).toHaveCount(0);
        await expect(page.locator("#trigger")).toBeFocused();
        await expect(page.locator("#state")).toContainText(
          "Open false; value small; selections 1",
        );
      });
    test("keyboard radio selection updates bound value callback and visible checked indicator", async ({
      page,
    }) => {
      await page.locator("#trigger").press("Enter");
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("End");
      await expect(page.locator("#large")).toBeFocused();
      await page.keyboard.press("Space");
      await expect(page.locator("#state")).toContainText(
        "Open true; value large; selections 1; changes 1",
      );
      await expect(page.locator("#large")).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(page.locator("#large-indicator")).toBeVisible();
      await expect(page.locator("#small-indicator")).toBeHidden();
    });
    test("caller cancellation prevents selection close and radio value changes", async ({
      page,
    }) => {
      await page.locator("#cancel-selection").check();
      await page.locator("#trigger").press("Enter");
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page.locator("#content")).toBeVisible();
      await page.keyboard.press("End");
      await page.keyboard.press("Space");
      await expect(page.locator("#state")).toContainText(
        "Open true; value small; selections 2; changes 0",
      );
    });
    test("disabled items reject actual pointer and direct keyboard events", async ({
      page,
    }) => {
      await page.locator("#trigger").press("Enter");
      await expect(page.locator("#apple")).toBeFocused();
      await page.locator("#disabled").click({ force: true });
      await page.locator("#disabled").dispatchEvent("keydown", {
        key: "Enter",
        bubbles: true,
        cancelable: true,
      });
      await expect(page.locator("#state")).toContainText(
        "Open true; value small; selections 0",
      );
    });
    test("Escape outside and caller dismissal cancellation preserve native focus policy", async ({
      page,
    }) => {
      await page.locator("#cancel-dismiss").check();
      await page.locator("#trigger").press("Enter");
      await expect(page.locator("#apple")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.locator("#content")).toBeVisible();
      await page.locator("h1").click();
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#state")).toContainText(
        "escapes 1; outside 1",
      );
      await page.locator("#cancel-dismiss").uncheck();
      await page.locator("#apple").press("Escape");
      await expect(page.locator("#content")).toHaveCount(0);
      await expect(page.locator("#trigger")).toBeFocused();
      await page.locator("#trigger").click();
      await page.locator("h1").click();
      await expect(page.locator("#content")).toHaveCount(0);
    });
    test("nested Menu dismisses before Dialog and restores each actual trigger", async ({
      page,
    }) => {
      await page.locator("#dialog-trigger").click();
      await expect(page.locator("#dialog-content")).toBeVisible();
      await page.locator("#nested-trigger").press("Enter");
      await expect(page.locator("#nested-first")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.locator("#nested-content")).toHaveCount(0);
      await expect(page.locator("#dialog-content")).toBeVisible();
      await expect(page.locator("#nested-trigger")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.locator("#dialog-content")).toHaveCount(0);
      await expect(page.locator("#dialog-trigger")).toBeFocused();
    });
    test("pinned textValue limitation matches direct native control while DOM text remains searchable", async ({
      page,
    }) => {
      for (const prefix of ["alias", "native-alias"]) {
        await page.locator(`#${prefix}-trigger`).press("Enter");
        await expect(page.locator(`#${prefix}-first`)).toBeFocused();
        await expect(page.locator(`#${prefix}-item`)).toHaveAttribute(
          "textvalue",
          "Alias",
        );
        await page.keyboard.press("a");
        await expect(page.locator(`#${prefix}-first`)).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(page.locator(`#${prefix}-content`)).toHaveCount(0);
        await page.goto(new URL(consumer.route, hosted.baseURL).href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await page.locator(`#${prefix}-trigger`).press("Enter");
        await expect(page.locator(`#${prefix}-first`)).toBeFocused();
        await page.keyboard.press("z");
        await expect(page.locator(`#${prefix}-item`)).toBeFocused();
        await page.keyboard.press("Escape");
      }
    });
    test("RTL preserves native vertical navigation selection and focus return", async ({
      page,
    }) => {
      await page.goto(new URL(`${consumer.route}?rtl=1`, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await page.locator("#trigger").press("Space");
      await expect(page.locator("#apple")).toBeFocused();
      await expect(page.locator("#content").locator("..")).toHaveAttribute(
        "dir",
        "rtl",
      );
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("#banana")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.locator("#trigger")).toBeFocused();
    });
  });
