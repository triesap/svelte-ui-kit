import { writeFileSync } from "node:fs";
import { buildTabsCandidate } from "../helpers/tabs-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
let consumer: ReturnType<typeof buildTabsCandidate>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildTabsCandidate();
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
  const file = info.outputPath("tabs-candidate.json");
  writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
  await info.attach("tabs-candidate", {
    path: file,
    contentType: "application/json",
  });
  await page.goto(new URL(consumer.route, hosted.baseURL).href);
  await expect(page.locator('[data-ready="true"]')).toBeVisible();
});
test("candidate Root List bind native selection refs attrs and delegated rendering", async ({
  page,
}) => {
  await expect(page.locator("#refs")).toHaveText("DIV;DIV;SECTION");
  await expect(page.locator("#tabs-root")).toHaveClass(
    "kit-tabs caller retained",
  );
  await expect(page.locator("#tabs-list")).toHaveClass(
    "kit-tabs-list caller-list",
  );
  await expect(
    page.getByRole("tablist", { name: "Candidate settings", exact: true }),
  ).toHaveAttribute("id", "tabs-list");
  await expect(page.locator("#tabs-root")).toHaveAttribute(
    "data-caller",
    "root",
  );
  await expect(page.locator("#tabs-list")).toHaveAttribute(
    "data-caller",
    "list",
  );
  await expect(page.locator("#tab-a")).toHaveAttribute(
    "aria-controls",
    "panel-a",
  );
  await expect(page.locator("#panel-a")).toHaveAttribute(
    "aria-labelledby",
    "tab-a",
  );
  await page.locator("#tab-b").click();
  await expect(page.locator("#value")).toHaveText("b; callbacks 1");
  await expect(page.locator("#panel-b")).toBeVisible();
  await expect(page.locator("#panel-a")).toBeHidden();
  await page.locator("#tab-a").click();
  await page
    .getByRole("button", { name: "Set candidate tab B", exact: true })
    .click();
  await expect(page.locator("#value")).toHaveText("b; callbacks 2");
  await expect(page.locator("#delegated-root")).toHaveClass(
    "kit-tabs delegated-caller",
  );
  await expect(page.locator("#delegated-list")).toHaveAttribute(
    "role",
    "tablist",
  );
  await expect(page.locator("#delegated-tab-b")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#delegated-panel-b")).toBeVisible();
});
test("candidate forwards RTL clamp manual vertical and disabled options to raw remaining primitives", async ({
  page,
}) => {
  const a = page.locator("#tab-a"),
    b = page.locator("#tab-b");
  await a.press("ArrowRight");
  await expect(a).toBeFocused();
  await expect(a).toHaveAttribute("aria-selected", "true");
  await a.press("ArrowLeft");
  await expect(b).toHaveAttribute("aria-selected", "true");
  await b.press("ArrowLeft");
  await expect(b).toBeFocused();
  await page
    .getByRole("button", { name: "Toggle candidate vertical", exact: true })
    .click();
  await expect(page.locator("#tabs-list")).toHaveAttribute(
    "aria-orientation",
    "vertical",
  );
  await b.press("ArrowUp");
  await expect(a).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "Toggle candidate manual", exact: true })
    .click();
  await a.press("ArrowDown");
  await expect(b).toBeFocused();
  await expect(a).toHaveAttribute("aria-selected", "true");
  await b.press("Space");
  await expect(b).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("button", { name: "Toggle candidate disabled", exact: true })
    .click();
  await expect(a).toBeDisabled();
  await expect(b).toBeDisabled();
  await a.evaluate((node) => (node as HTMLButtonElement).click());
  await expect(b).toHaveAttribute("aria-selected", "true");
  await page.locator("#delegated-tab-b").press("ArrowRight");
  await expect(page.locator("#delegated-tab-a")).toHaveAttribute(
    "aria-selected",
    "true",
  );
});
