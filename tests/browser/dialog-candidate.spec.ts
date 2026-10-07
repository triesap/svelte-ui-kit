import { writeFileSync } from "node:fs";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test.describe("actual unregistered Dialog S106 composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate();
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
    await page.goto(new URL("dialog-candidate", hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("explicit open binding tracks primitive and parent updates in both directions", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await expect(trigger).toHaveAttribute("type", "button");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#state")).toContainText(
      "Open true; changes 1; clicks 1",
    );
    await page.locator("#close").click();
    await expect(page.locator("#state")).toContainText("Open false; changes 2");
    await page.locator("#parent-open").click();
    await expect(page.locator("#content")).toBeVisible();
    await page.locator("#parent-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#content")).toHaveCount(0);
  });
  test("native keyboard activation and refs forward without duplicate handlers", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await expect(trigger).toHaveClass("kit-dialog-trigger caller retained");
    await expect(trigger).toHaveAttribute("data-caller", "preserved");
    await expect(trigger).toHaveAttribute("title", "Native trigger");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
    await trigger.press("Enter");
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 1; clicks 0; keys 1",
    );
    await page.locator("#close").click();
    await trigger.press("Space");
    await expect(page.locator("#state")).toHaveText(
      "Open true; changes 3; clicks 0; keys 2",
    );
  });
  test("caller cancellation and native disabled guard activation", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await page.locator("#cancel").click();
    await trigger.click();
    await trigger.press("Enter");
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; clicks 1; keys 1",
    );
    await page.locator("#disable").click();
    await expect(trigger).toBeDisabled();
    await trigger.evaluate((element) => (element as HTMLButtonElement).click());
    await expect(page.locator("#state")).toHaveText(
      "Open false; changes 0; clicks 1; keys 1",
    );
  });
  test("delegated child receives actual merged native props and bound ref", async ({
    page,
  }) => {
    const trigger = page.locator("#delegated");
    await expect(trigger).toHaveAttribute("data-delegated", "actual");
    await expect(trigger).toHaveClass("kit-dialog-trigger delegated-caller");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#delegated-content")).toBeVisible();
    await page.locator("#delegated-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
  });
});

test.describe("actual unregistered Dialog S107 portal composition", () => {
  let consumer: ReturnType<typeof buildDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildDialogCandidate("portal-overlay");
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
  test("default body, selector, actual Element and disabled inline targets retain primitive placement", async ({
    page,
  }) => {
    await expect(page.locator("body > #body-overlay")).toBeVisible();
    await expect(page.locator("body > #body-content")).toBeVisible();
    await expect(
      page.locator("#selector-target > #selector-overlay"),
    ).toBeVisible();
    await expect(
      page.locator("#selector-target > #selector-content"),
    ).toBeVisible();
    await expect(
      page.locator("#element-target > #element-overlay"),
    ).toHaveCount(1);
    await expect(
      page.locator("#element-target > #element-content"),
    ).toBeVisible();
    await expect(page.locator("#inline-host > #inline-overlay")).toHaveCount(1);
    await expect(page.locator("#inline-host > #inline-content")).toBeVisible();
    await expect(page.locator("#body-overlay")).toHaveClass(
      "kit-dialog-overlay caller",
    );
    await expect(page.locator("#body-overlay")).toHaveAttribute(
      "data-state",
      "open",
    );
  });
  test("Overlay default and delegated snippet shapes carry live state, classes and actual refs", async ({
    page,
  }) => {
    await expect(page.locator("#body-state")).toHaveText("true");
    await expect(page.locator("#selector-overlay")).toHaveAttribute(
      "data-open",
      "true",
    );
    await expect(page.locator("#selector-overlay")).toHaveClass(
      "kit-dialog-overlay delegated",
    );
    await expect(page.locator("#inline-overlay")).toHaveClass(
      "kit-dialog-overlay inline-caller",
    );
    await expect(page.locator("#inline-overlay")).toHaveAttribute(
      "data-caller",
      "preserved",
    );
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION");
    await expect(page.locator("#element-overlay")).toHaveAttribute(
      "data-dialog-overlay",
      "",
    );
  });
});
