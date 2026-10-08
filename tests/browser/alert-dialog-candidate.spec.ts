import { writeFileSync } from "node:fs";
import { buildAlertDialogCandidate } from "../helpers/alert-dialog-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test.describe("actual unregistered Alert Dialog S117 composition", () => {
  let consumer: ReturnType<typeof buildAlertDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildAlertDialogCandidate();
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
    await page.goto(new URL("alert-dialog-candidate", hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
  });
  test("explicit open binding tracks primitive and parent updates in both directions", async ({
    page,
  }) => {
    const trigger = page.locator("#trigger");
    await expect(trigger).toHaveAttribute("type", "button");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#content")).toHaveAttribute(
      "role",
      "alertdialog",
    );
    await expect(page.locator("#content")).toHaveAttribute(
      "data-alert-dialog-content",
      "",
    );
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
    await expect(trigger).toHaveClass(
      "kit-alert-dialog-trigger caller retained",
    );
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
    await expect(trigger).toHaveClass(
      "kit-alert-dialog-trigger delegated-caller",
    );
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator("#delegated-content")).toBeVisible();
    await page.locator("#delegated-close").click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#refs")).toHaveText("BUTTON/BUTTON");
  });
});

test.describe("actual unregistered Alert Dialog S118 composition", () => {
  let consumer: ReturnType<typeof buildAlertDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildAlertDialogCandidate("content");
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
  for (const mode of ["inline", "body", "selector", "element"])
    test(`native ${mode} portal preserves Content Overlay refs and real naming`, async ({
      page,
    }) => {
      await page.goto(
        new URL(`${consumer.route}?portal=${mode}`, hosted.baseURL).href,
      );
      const content = page.locator("#default-content");
      const overlay = page.locator("#default-overlay");
      await expect(content).toBeVisible();
      await expect(content).toHaveAttribute("role", "alertdialog");
      await expect(content).toHaveAccessibleName("Default content title");
      await expect(content).toHaveAccessibleDescription(
        "Actual default children",
      );
      await expect(content).toHaveClass(
        "kit-alert-dialog-content caller retained",
      );
      await expect(content).toHaveAttribute("data-caller", "preserved");
      await expect(overlay).toHaveClass(
        "kit-alert-dialog-overlay overlay-caller retained",
      );
      await expect(overlay).toHaveAttribute("data-caller", "overlay-preserved");
      await expect(page.locator("#refs")).toHaveText("DIV/SECTION/DIV");
      const parent = await content.evaluate(
        (node) => node.parentElement?.id || node.parentElement?.tagName,
      );
      expect(parent).toBe(
        mode === "inline" ? "MAIN" : mode === "body" ? "BODY" : "portal-host",
      );
      await content.press("Escape");
      await expect(content).toBeVisible();
      await expect(page.locator("#events")).toContainText("Escapes 1");
    });
  test("outside defaults to native ignore and explicit close policy preserves caller cancellation", async ({
    page,
  }) => {
    await page.locator("h1").click();
    await expect(page.locator("#default-content")).toBeVisible();
    await page.goto(
      new URL(`${consumer.route}?policy=close`, hosted.baseURL).href,
    );
    await expect(page.locator("#default-content")).toBeVisible();
    await page.locator("h1").click();
    await expect(page.locator("#events")).toContainText("outside 1");
    await expect(page.locator("#default-content")).toBeVisible();
    await page.goto(
      new URL(`${consumer.route}?policy=close&allow=1`, hosted.baseURL).href,
    );
    await expect(page.locator("#default-content")).toBeVisible();
    await page.locator("h1").click();
    await expect(page.locator("#default-content")).toHaveCount(0);
  });
  test("default and delegated children retain actual props forceMount state and refs", async ({
    page,
  }) => {
    const delegated = page.locator("#delegated-content");
    await expect(delegated).toHaveCount(1);
    await expect(delegated).toBeHidden();
    await expect(delegated).toHaveAttribute("data-child-open", "false");
    await page.locator("#toggle-delegated").click();
    await expect(delegated).toBeVisible();
    await expect(delegated).toHaveAttribute("role", "alertdialog");
    await expect(delegated).toHaveAccessibleName("Delegated content title");
    await expect(delegated).toHaveClass(
      "kit-alert-dialog-content delegated-caller",
    );
    await expect(delegated).toHaveAttribute("data-child-open", "true");
    await expect(page.locator("#refs")).toHaveText("DIV/SECTION/DIV");
    await page.locator("#toggle-delegated").click();
    await expect(delegated).toBeHidden();
    await expect(delegated).toHaveAttribute("data-state", "closed");
  });
});

test.describe("actual unregistered Alert Dialog S119 decision composition", () => {
  let consumer: ReturnType<typeof buildAlertDialogCandidate>;
  let hosted: FixtureServer;
  test.beforeAll(async () => {
    test.setTimeout(240000);
    consumer = buildAlertDialogCandidate("actions");
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
  test("actual native labels relationships classes and all eight refs are preserved", async ({
    page,
  }) => {
    await expect(page.locator("#content")).toHaveAccessibleName(
      "Decision title",
    );
    await expect(page.locator("#content")).toHaveAccessibleDescription(
      "Decision description",
    );
    await expect(page.locator("#candidate-title")).toHaveClass(
      "kit-alert-dialog-title caller-title retained",
    );
    await expect(page.locator("#candidate-title")).toHaveAttribute(
      "aria-level",
      "2",
    );
    await expect(page.locator("#candidate-action")).toHaveClass(
      "kit-alert-dialog-action caller-action",
    );
    await expect(page.locator("#candidate-cancel")).toHaveClass(
      "kit-alert-dialog-cancel caller-cancel",
    );
    await expect(page.locator("#candidate-action")).toHaveAttribute(
      "data-caller",
      "action",
    );
    await expect(page.locator("#candidate-cancel")).toHaveAttribute(
      "data-caller",
      "cancel",
    );
    await expect(page.locator("#refs")).toHaveText(
      "DIV/DIV/BUTTON/BUTTON/H3/P/BUTTON/BUTTON",
    );
  });
  test("native Action leaves open and application explicitly owns successful close", async ({
    page,
  }) => {
    await page.locator("#candidate-action").click();
    await expect(page.locator("#state")).toContainText(
      "Open true; delegated true; actions 1",
    );
    await expect(page.locator("#state")).toContainText("submits 0; changes 0");
    await page.locator("#candidate-action").press("Enter");
    await expect(page.locator("#state")).toContainText("actions 2");
    await expect(page.locator("#content")).toBeVisible();
    await page.locator("#action-closes").check();
    await page.locator("#candidate-action").click();
    await expect(page.locator("#state")).toContainText(
      "Open false; delegated true; actions 3",
    );
    await expect(page.locator("#content")).toHaveCount(0);
  });
  test("Cancel caller cancellation and disabled guards precede native close", async ({
    page,
  }) => {
    await page.locator("#cancel-events").check();
    await page.locator("#candidate-cancel").click();
    await page.locator("#candidate-cancel").press("Enter");
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#state")).toContainText(
      "cancels 1; keys 1; submits 0; changes 0",
    );
    await page.locator("#disabled").check();
    await expect(page.locator("#candidate-action")).toBeDisabled();
    await expect(page.locator("#candidate-cancel")).toBeDisabled();
    await page
      .locator("#candidate-cancel")
      .evaluate((node) => (node as HTMLButtonElement).click());
    await page
      .locator("#candidate-action")
      .evaluate((node) => (node as HTMLButtonElement).click());
    await expect(page.locator("#state")).toContainText(
      "actions 0; cancels 1; keys 1",
    );
    await page.locator("#disabled").uncheck();
    await page.locator("#cancel-events").uncheck();
    await page.locator("#candidate-cancel").click();
    await expect(page.locator("#state")).toContainText("Open false");
    await expect(page.locator("#state")).toContainText(
      "cancels 2; keys 1; submits 0; changes 1",
    );
  });
  test("native Cancel keyboard Enter and Space close without duplicate click or submit", async ({
    page,
  }) => {
    await page.locator("#candidate-cancel").press("Enter");
    await expect(page.locator("#state")).toContainText("Open false");
    await expect(page.locator("#state")).toContainText(
      "cancels 0; keys 1; submits 0; changes 1",
    );
    await page.locator("#reopen").click();
    await page.locator("#candidate-cancel").press("Space");
    await expect(page.locator("#state")).toContainText("Open false");
    await expect(page.locator("#state")).toContainText(
      "cancels 0; keys 2; submits 0; changes 2",
    );
  });
  test("explicit submit and reset types remain native form opt ins", async ({
    page,
  }) => {
    await expect(page.locator("#candidate-action")).toHaveAttribute(
      "type",
      "button",
    );
    await expect(page.locator("#candidate-cancel")).toHaveAttribute(
      "type",
      "button",
    );
    await expect(page.locator("#submit-action")).toHaveAttribute(
      "type",
      "submit",
    );
    await expect(page.locator("#reset-action")).toHaveAttribute(
      "type",
      "reset",
    );
    await page.locator("#submit-action").click();
    await expect(page.locator("#state")).toContainText("submits 1");
    await expect(page.locator("#content")).toBeVisible();
  });
  test("all delegated label and decision hooks render actual props and native semantics", async ({
    page,
  }) => {
    await expect(page.locator("#delegated-content")).toHaveAccessibleName(
      "Delegated decision title",
    );
    await expect(
      page.locator("#delegated-content"),
    ).toHaveAccessibleDescription("Delegated decision description");
    await expect(page.locator("#delegated-title")).toHaveAttribute(
      "aria-level",
      "3",
    );
    await expect(page.locator("#delegated-action")).toHaveClass(
      "kit-alert-dialog-action delegated-action",
    );
    await expect(page.locator("#delegated-cancel")).toHaveClass(
      "kit-alert-dialog-cancel delegated-cancel",
    );
    await expect(page.locator("#delegated-action")).toHaveAttribute(
      "data-delegated",
      "actual",
    );
    await page.locator("#delegated-action").click();
    await expect(page.locator("#delegated-content")).toBeVisible();
    await expect(page.locator("#state")).toContainText("actions 1");
    await page.locator("#delegated-cancel").click();
    await expect(page.locator("#delegated-content")).toHaveCount(0);
    await expect(page.locator("#content")).toBeVisible();
    await expect(page.locator("#state")).toContainText(
      "Open true; delegated false",
    );
  });
});
