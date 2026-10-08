import { writeFileSync } from "node:fs";
import { buildTabsCandidate } from "../helpers/tabs-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
let consumer: ReturnType<typeof buildTabsCandidate>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildTabsCandidate(true);
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
  const file = info.outputPath("tabs-parts.json");
  writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
  await info.attach("tabs-parts", {
    path: file,
    contentType: "application/json",
  });
  await page.goto(new URL(consumer.route, hosted.baseURL).href);
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
});
test("four native parts preserve exact relationships refs classes and both snippet forms", async ({
  page,
}) => {
  await expect(page.locator("#part-refs")).toHaveText(
    "BUTTON;DIV;BUTTON;SECTION",
  );
  await expect(page.locator("#tab-a")).toHaveClass(
    "kit-tabs-trigger caller-trigger retained",
  );
  await expect(page.locator("#panel-a")).toHaveClass(
    "kit-tabs-panel caller-panel",
  );
  await expect(page.locator("#tab-a")).toHaveAttribute(
    "data-caller",
    "trigger",
  );
  await expect(page.locator("#panel-a")).toHaveAttribute(
    "data-caller",
    "content",
  );
  for (const prefix of ["", "delegated-", "raw-"])
    for (const value of ["a", "b"]) {
      await expect(page.locator(`#${prefix}tab-${value}`)).toHaveAttribute(
        "aria-controls",
        `${prefix}panel-${value}`,
      );
      await expect(page.locator(`#${prefix}panel-${value}`)).toHaveAttribute(
        "aria-labelledby",
        `${prefix}tab-${value}`,
      );
    }
  await expect(page.locator("#delegated-tab-a")).toHaveAttribute(
    "data-delegated",
    "trigger",
  );
  await expect(page.locator("#delegated-panel-a")).toHaveAttribute(
    "data-delegated",
    "content",
  );
  await expect(page.locator("#delegated-panel-a")).toHaveAttribute(
    "hidden",
    "",
  );
  await expect(page.locator("#delegated-panel-b")).toBeVisible();
  await page.locator("#delegated-tab-a").click();
  await expect(page.locator("#delegated-panel-a")).toBeVisible();
  await expect(page.locator("#delegated-panel-b")).toHaveAttribute(
    "hidden",
    "",
  );
});
test("hidden panel state stays mounted across actual selection and programmatic binding", async ({
  page,
}) => {
  const input = page.getByRole("textbox", {
    name: "Panel A state",
    exact: true,
  });
  await input.fill("retained child");
  const original = await input.elementHandle();
  await page.locator("#tab-b").click();
  await expect(page.locator("#panel-a")).toHaveCount(1);
  await expect(page.locator("#panel-a")).toHaveAttribute("hidden", "");
  expect(await original!.evaluate((node) => node.isConnected)).toBe(true);
  await expect(page.locator("#panel-a input")).toHaveValue("retained child");
  await page.locator("#tab-a").click();
  await expect(input).toBeVisible();
  await expect(input).toHaveValue("retained child");
  await page
    .getByRole("button", { name: "Set candidate tab B", exact: true })
    .click();
  await expect(page.locator("#panel-b")).toBeVisible();
  await expect(page.locator("#value")).toHaveText("b; callbacks 2");
});
test("manual click cancellation precedes activation and disabled trigger refuses caller interaction", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "Toggle candidate manual", exact: true })
    .click();
  await page.locator("#tab-b").click();
  await page
    .getByRole("button", { name: "Toggle tab cancellation", exact: true })
    .click();
  await page.locator("#tab-a").click();
  await expect(page.locator("#tab-b")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#value")).toHaveText("b; callbacks 1");
  await expect(page.locator("#clicks")).toHaveText("1");
  await page.locator("#tab-a").press("Enter");
  await expect(page.locator("#tab-a")).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#tab-disabled")).toBeDisabled();
  await page
    .locator("#tab-disabled")
    .evaluate((node) => (node as HTMLButtonElement).click());
  await expect(page.locator("#tab-a")).toHaveAttribute("aria-selected", "true");
});
