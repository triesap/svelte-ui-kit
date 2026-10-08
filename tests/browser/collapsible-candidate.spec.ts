import { writeFileSync } from "node:fs";
import { buildCollapsibleCandidate } from "../helpers/collapsible-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
let consumer: ReturnType<typeof buildCollapsibleCandidate>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildCollapsibleCandidate();
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
  const file = info.outputPath("collapsible-candidate.json");
  writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
  await info.attach("collapsible-candidate", {
    path: file,
    contentType: "application/json",
  });
  await page.goto(new URL(consumer.route, hosted.baseURL).href);
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
});
test("candidate binding refs native keyboard and state completion callbacks remain intact", async ({
  page,
}) => {
  const trigger = page.locator("#disclosure-trigger"),
    content = page.locator("#disclosure-content");
  await expect(page.locator("#refs")).toHaveText("DIV;BUTTON;DIV;SECTION");
  await expect(trigger).toHaveAttribute("aria-controls", "disclosure-content");
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toBeHidden();
  await trigger.click();
  await expect(content).toBeVisible();
  await expect(page.locator("#state")).toHaveText(
    "true; callbacks 1; clicks 1",
  );
  await expect(page.locator("#completed")).toHaveText("true");
  await trigger.press("Space");
  await expect(content).toBeHidden();
  await expect(page.locator("#state")).toHaveText(
    "false; callbacks 2; clicks 1",
  );
  await expect(page.locator("#completed")).toHaveText("false");
  await trigger.press("Enter");
  await expect(content).toBeVisible();
  await expect(page.locator("#state")).toHaveText(
    "true; callbacks 3; clicks 1",
  );
  await page
    .getByRole("button", { name: "Set candidate open", exact: true })
    .click();
  await expect(content).toBeHidden();
  await expect(page.locator("#state")).toHaveText(
    "false; callbacks 3; clicks 1",
  );
  await page
    .getByRole("button", { name: "Focus candidate ref", exact: true })
    .click();
  await expect(trigger).toBeFocused();
});
test("caller attrs classes cancellation and disabled refuse native activation without losing children", async ({
  page,
}) => {
  const trigger = page.locator("#disclosure-trigger");
  for (const [id, kind] of [
    ["disclosure", "root"],
    ["disclosure-trigger", "trigger"],
    ["disclosure-content", "content"],
  ])
    await expect(page.locator(`#${id}`)).toHaveAttribute("data-caller", kind!);
  await expect(page.locator("#disclosure")).toHaveClass(
    "kit-collapsible caller retained",
  );
  await expect(trigger).toHaveClass("kit-collapsible-trigger caller-trigger");
  await expect(page.locator("#disclosure-content")).toHaveClass(
    "kit-collapsible-content caller-content",
  );
  await page
    .getByRole("button", { name: "Toggle candidate cancellation", exact: true })
    .click();
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator("#state")).toHaveText(
    "false; callbacks 0; clicks 1",
  );
  await page
    .getByRole("button", { name: "Toggle candidate disabled", exact: true })
    .click();
  await expect(trigger).toBeDisabled();
  await trigger.evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.locator("#state")).toHaveText(
    "false; callbacks 0; clicks 1",
  );
  await expect(page.locator("#delegated-trigger")).not.toBeDisabled();
});
test("native closed content retains the actual input and forceMount exposes its closed visual policy", async ({
  page,
}) => {
  const trigger = page.locator("#disclosure-trigger"),
    content = page.locator("#disclosure-content");
  await expect(content).toHaveCount(1);
  await trigger.click();
  const input = page.getByRole("textbox", {
    name: "Disclosure state",
    exact: true,
  });
  await input.fill("retained disclosure");
  const node = await input.elementHandle();
  await trigger.click();
  await expect(content).toBeHidden();
  expect(await node!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(content.locator("input")).toHaveValue("retained disclosure");
  await page
    .getByRole("button", { name: "Toggle candidate force mount", exact: true })
    .click();
  await expect(content).toBeVisible();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await expect(content).toHaveAttribute("data-state", "closed");
  await expect(input).toHaveValue("retained disclosure");
  await page
    .getByRole("button", { name: "Toggle candidate force mount", exact: true })
    .click();
  await expect(content).toBeHidden();
});
test("all delegated snippet props include actual open state while raw native identities link independently", async ({
  page,
}) => {
  await expect(page.locator("#delegated-root")).toHaveAttribute(
    "data-delegated",
    "root",
  );
  await expect(page.locator("#delegated-trigger")).toHaveAttribute(
    "aria-controls",
    "delegated-content",
  );
  await expect(page.locator("#delegated-content")).toHaveAttribute(
    "data-delegated-open",
    "true",
  );
  await page.locator("#delegated-trigger").click();
  await expect(page.locator("#delegated-content")).toHaveAttribute(
    "data-delegated-open",
    "false",
  );
  await expect(page.locator("#delegated-content")).toBeHidden();
  await expect(page.locator("#raw-trigger")).toHaveAttribute(
    "aria-controls",
    "raw-content",
  );
  await page.locator("#raw-trigger").click();
  await expect(page.locator("#raw-content")).toBeVisible();
  await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
    "aria-expanded",
    "false",
  );
});
