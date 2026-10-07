import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { buildDialogConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`installed Dialog interactions ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildDialogConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildDialogConsumer(custom, "dialog-interactions");
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
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("native accessible name, focus trap and return focus work through actual installed refs", async ({
      page,
    }) => {
      await page.locator("#trigger").press("Enter");
      const content = page.getByRole("dialog", {
        name: "Main accessible dialog",
        exact: true,
      });
      await expect(content).toBeVisible();
      await expect(content).toHaveAttribute("aria-labelledby", "title");
      await expect(content).toHaveAttribute("aria-describedby", "description");
      await expect(page.locator("#draft")).toBeFocused();
      await expect(page.locator("#refs")).toHaveText("BUTTON/DIV");
      for (let i = 0; i < 12; i++) {
        await page.keyboard.press(i < 6 ? "Tab" : "Shift+Tab");
        expect(
          await page.evaluate(() =>
            document
              .querySelector("#content")
              ?.contains(document.activeElement),
          ),
        ).toBe(true);
      }
      await page.locator("#close").click();
      await expect(content).toHaveCount(0);
      await expect(page.locator("#trigger")).toBeFocused();
      await expect(page.locator("#refs")).toHaveText("BUTTON/none");
      await expect(page.locator("#state")).toContainText("complete false,");
    });
    test("Escape and outside dismissal honor exact forwarded cancellation policies", async ({
      page,
    }) => {
      await page.locator("#trigger").click();
      await page.locator("#cancel-escape").click();
      await page.keyboard.press("Escape");
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#state")).toContainText("escapes 1");
      await page.locator("#cancel-outside").click();
      await page.locator("#overlay").click({ position: { x: 8, y: 8 } });
      await expect(page.locator("#content")).toBeVisible();
      await page.locator("#cancel-outside").click();
      await page.locator("#overlay").click({ position: { x: 8, y: 8 } });
      await expect(page.locator("#content")).toHaveCount(0);
      await expect(page.locator("#trigger")).toBeFocused();
      await page.locator("#trigger").click();
      await page.locator("#cancel-escape").click();
      await page.keyboard.press("Escape");
      await expect(page.locator("#content")).toHaveCount(0);
    });
    test("controlled parent and uncontrolled state updates preserve native per-instance behavior", async ({
      page,
    }) => {
      await page.locator("#parent-open").click();
      await expect(page.locator("#trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await page.locator("#parent-close").click();
      await expect(page.locator("#content")).toHaveCount(0);
      await page.locator("#uncontrolled-trigger").press("Space");
      await expect(
        page.getByRole("dialog", {
          name: "Uncontrolled accessible dialog",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator("#uncontrolled-state")).toHaveText("true");
      await page.locator("#uncontrolled-close").click();
      await expect(page.locator("#uncontrolled-content")).toHaveCount(0);
      await expect(page.locator("#uncontrolled-state")).toHaveText("false");
      await expect(page.locator("#uncontrolled-trigger")).toBeFocused();
    });
    test("nested native layers dismiss only the top dialog and return focus through the stack", async ({
      page,
    }) => {
      await page.locator("#trigger").click();
      await page.locator("#nested-trigger").click();
      await expect(page.locator("#nested-content")).toBeVisible();
      await expect(page.locator("#nested-input")).toBeFocused();
      await page.keyboard.press("Tab");
      expect(
        await page.evaluate(() =>
          document
            .querySelector("#nested-content")
            ?.contains(document.activeElement),
        ),
      ).toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.locator("#nested-content")).toHaveCount(0);
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#nested-trigger")).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(page.locator("#content")).toHaveCount(0);
      await expect(page.locator("#trigger")).toBeFocused();
    });
    test("interrupted native presence settles open then closes without stranding focus or DOM", async ({
      page,
    }) => {
      await page.locator("#trigger").click();
      await page.locator("#burst").click();
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#trigger")).toHaveAttribute(
        "aria-expanded",
        "true",
      );
      await expect(page.locator("#content")).not.toHaveAttribute(
        "data-starting-style",
        "",
      );
      await expect
        .poll(() =>
          page
            .locator("#content")
            .evaluate(
              (element) =>
                element.getAnimations().filter((a) => a.playState === "running")
                  .length,
            ),
        )
        .toBe(0);
      await page.locator("#close").click();
      await expect(page.locator("#content")).toHaveCount(0);
      await expect(page.locator("#overlay")).toHaveCount(0);
      await expect(page.locator("#trigger")).toBeFocused();
      await expect(page.locator("#state")).toContainText("Open false");
      await expect(page.locator("#state")).toContainText("false,");
    });
    test("completion callbacks preserve the exact pinned native portal sequence", async ({
      page,
    }) => {
      await page.locator("#trigger").click();
      await expect(page.locator("#content")).toBeVisible();
      await page.locator("#close").click();
      await expect(page.locator("#content")).toHaveCount(0);
      await expect(page.locator("#state")).toContainText("complete false,");
      await page.locator("#native-trigger").click();
      await expect(page.locator("#native-content")).toBeVisible();
      await page.locator("#native-close").click();
      await expect(page.locator("#native-content")).toHaveCount(0);
      await expect(page.locator("#native-completes")).toHaveText("false,");
    });
    test("actual autofocus cancellation is preserved and missing accessible-name input is caught", async ({
      page,
    }) => {
      await page.locator("#cancel-autofocus").click();
      await page.locator("#trigger").click();
      await expect(page.locator("#content")).toBeVisible();
      await expect(page.locator("#draft")).not.toBeFocused();
      await page.locator("#close").click();
      await expect(page.locator("#content")).toHaveCount(0);
      await page.goto(
        new URL(`${consumer.route}?nameless=1`, hosted.baseURL).href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await page.locator("#trigger").click();
      const content = page.locator("#content");
      await expect(content).toBeVisible();
      await assert.rejects(async () => {
        await expect(content).toHaveAccessibleName(/\S/, { timeout: 1000 });
      }, /accessible name|AccessibleName|toHaveAccessibleName/);
    });
  });
