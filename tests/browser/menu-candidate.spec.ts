import { writeFileSync } from "node:fs";
import { buildMenuCandidate } from "../helpers/menu-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test.describe("actual incremental Menu S123 composition", () => {
  let consumer: ReturnType<typeof buildMenuCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildMenuCandidate();
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
    const file = info.outputPath("candidate-artifact.json");
    writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
    await info.attach("candidate-artifact", {
      path: file,
      contentType: "application/json",
    });
    await page.goto(new URL(consumer.route, hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("pointer activation and explicit parent updates preserve controlled state", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 1; pointers 1; clicks 1; keys 0",
    );
    await page.locator("#item").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toContainText("changes 2");
    await page.locator("#parent-open").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await page.locator("#parent-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
  for (const key of ["Enter", "Space", "ArrowDown"]) {
    test(`native ${key} activation preserves caller handler and actual refs`, async ({
      page,
    }) => {
      const trigger = page.locator("#trigger");
      await expect(trigger).toHaveClass("kit-menu-trigger caller retained");
      await expect(trigger).toHaveAttribute("type", "button");
      await expect(trigger).toHaveAttribute("title", "Native menu trigger");
      await expect(trigger).toHaveAttribute("data-caller", "preserved");
      await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
      await trigger.press(key);
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator("#state")).toHaveText(
        "Open true; changes 1; pointers 0; clicks 0; keys 1",
      );
    });
  }
  test("pointer and keyboard cancellation precede native activation", async ({
    page,
  }) => {
    await page.locator("#cancel").click();
    const trigger = page.locator("#trigger");
    await trigger.click();
    await trigger.press("Enter");
    await trigger.press("Space");
    await trigger.press("ArrowDown");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; pointers 1; clicks 1; keys 3",
    );
  });
  test("disabled native button refuses pointer and programmatic activation", async ({
    page,
  }) => {
    await page.locator("#disable").click();
    const trigger = page.locator("#trigger");
    await expect(trigger).toBeDisabled();
    await trigger.click({ force: true });
    await trigger.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#state")).toContainText("Open false; changes 0");
  });
  test("delegated props and uncontrolled default remain actual native composition", async ({
    page,
  }) => {
    const trigger = page.locator("#delegated");
    await expect(trigger).toHaveClass("kit-menu-trigger delegated-caller");
    await expect(trigger).toHaveAttribute("data-delegated", "actual");
    await trigger.click();
    await expect(page.locator("#delegated-content")).toBeVisible();
    await page.locator("#delegated-item").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    const uncontrolled = page.locator("#uncontrolled-trigger");
    await expect(uncontrolled).toHaveAttribute("aria-expanded", "false");
    await uncontrolled.click();
    await expect(page.locator("#uncontrolled-state")).toHaveText("true");
    await page.locator("#uncontrolled-item").click();
    await expect(page.locator("#uncontrolled-state")).toHaveText("false");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
  });
  test("initially open hydration retains candidate and direct native state", async ({
    page,
  }) => {
    await page.goto(
      new URL(`${consumer.route}?initial=open`, hosted.baseURL).href,
    );
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await expect(page.locator("#trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#native-trigger")).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#native-content")).toBeVisible();
  });
});
