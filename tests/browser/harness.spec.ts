import { test, expect, type ConsoleMessage, type Page } from "@playwright/test";

import { DEFAULT_LAUNCHER, startOwnedServer } from "../smoke/owned-server.mjs";

/**
 * S008 production browser harness for the maintained consumer fixture.
 *
 * The harness starts the built Node-adapter production handler through the
 * shared owned-server boundary on an OS-assigned loopback port and drives the
 * real page with Playwright's bundled headless Chromium. It asserts the
 * accessible heading/labels, Tab and Shift+Tab focus order, native checkbox
 * keyboard activation, form navigation with a request-time query update, and a
 * real client-state interaction that only works after hydration executes.
 *
 * Unexpected server stderr/exits, page exceptions, console errors and
 * hydration warnings fail the lane. A dedicated control proves the collector
 * detects those signals rather than ignoring them.
 */

let server: ReturnType<typeof startOwnedServer> | undefined;
let baseURL = "";

test.beforeAll(async () => {
  server = startOwnedServer({ args: [DEFAULT_LAUNCHER] });
  const port = await server.ready;
  baseURL = `http://127.0.0.1:${port}/`;
});

test.afterEach(() => {
  // The owned server must not have written stderr or exited during a test.
  expect(server?.failure() ?? null).toBeNull();
});

test.afterAll(async () => {
  if (!server) return;
  const failure = server.failure();
  await server.stop();
  if (failure) throw failure;
});

/** Attach a strict collector for page exceptions, console errors and hydration warnings. */
function collectPageIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on("pageerror", (error) => {
    issues.push(`page error: ${error.message}`);
  });
  page.on("console", (message: ConsoleMessage) => {
    const text = message.text();
    if (message.type() === "error") {
      issues.push(`console error: ${text}`);
    }
    if (message.type() === "warning" && /hydration/i.test(text)) {
      issues.push(`hydration warning: ${text}`);
    }
  });
  return issues;
}

function expectNoIssues(issues: string[]): void {
  expect(issues, `browser issues:\n${issues.join("\n")}`).toEqual([]);
}

async function openHome(page: Page): Promise<string[]> {
  const issues = collectPageIssues(page);
  await page.goto(baseURL);
  await expect(
    page.getByRole("heading", { name: "Consumer fixture qualification" }),
  ).toBeVisible();
  // Wait for the client mount marker instead of a fixed sleep, so interactions
  // run only after hydration has completed.
  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
  return issues;
}

test("the page renders its accessible heading and labelled controls", async ({
  page,
}) => {
  const issues = await openHome(page);
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Render name" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Enable notifications" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Increment" })).toBeVisible();
  expectNoIssues(issues);
});

test("Tab and Shift+Tab follow the documented focus order", async ({
  page,
}) => {
  const issues = await openHome(page);

  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Name")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Render name" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("checkbox", { name: "Enable notifications" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Increment" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("checkbox", { name: "Enable notifications" }),
  ).toBeFocused();

  expectNoIssues(issues);
});

test("the native checkbox toggles with the keyboard", async ({ page }) => {
  const issues = await openHome(page);
  const checkbox = page.getByRole("checkbox", {
    name: "Enable notifications",
  });
  await checkbox.focus();
  const initial = await checkbox.isChecked();

  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked({ checked: !initial });
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked({ checked: initial });

  expectNoIssues(issues);
});

test("form submission navigates and renders the request-local server value", async ({
  page,
}) => {
  const issues = await openHome(page);
  await page.getByLabel("Name").fill("browser");
  await page.getByRole("button", { name: "Render name" }).click();

  await expect(page).toHaveURL(/\?name=browser/);
  await expect(page.getByTestId("server-value")).toHaveText(
    "Server value: browser",
  );

  expectNoIssues(issues);
});

test("hydration executes and client state updates the DOM", async ({
  page,
}) => {
  const issues = await openHome(page);
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 0");

  await page.getByTestId("counter").click();
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 1");
  await page.getByTestId("counter").click();
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 2");

  expectNoIssues(issues);
});

test("the browser gate detects page exceptions, console errors and hydration warnings", async ({
  page,
}) => {
  const issues = collectPageIssues(page);
  await page.goto(baseURL);

  await page.evaluate(() => {
    console.error("injected console error");
    console.warn("hydration_mismatch: injected hydration warning");
  });
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("injected page error");
    }, 0);
  });

  await expect
    .poll(() => issues.length, { message: "expected injected browser issues" })
    .toBeGreaterThanOrEqual(3);
  expect(issues.some((issue) => issue.includes("console error"))).toBe(true);
  expect(issues.some((issue) => issue.includes("hydration warning"))).toBe(
    true,
  );
  expect(issues.some((issue) => issue.includes("page error"))).toBe(true);
});
