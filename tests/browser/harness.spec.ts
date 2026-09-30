import { spawnSync } from "node:child_process";
import path from "node:path";

import { expect, test } from "./browser-issues";
import { startFixtureServer, type OwnedServer } from "./fixture-server";

/**
 * S008 production browser harness for the maintained consumer fixture.
 *
 * The harness starts the built Node-adapter production handler through the
 * shared owned-server boundary on an OS-assigned loopback port and drives the
 * real page with Playwright's bundled headless Chromium. It asserts the
 * accessible heading/labels, Tab and Shift+Tab focus order, native checkbox
 * keyboard activation, form navigation with a request-time query update, a
 * real client-state interaction that only works after hydration executes, and
 * the pinned Bits switch semantics.
 *
 * The shared `browserIssues` fixture collects page exceptions, console errors
 * and hydration warnings for the whole test lifecycle and fails teardown.
 * Unexpected server stderr/exits also fail the lane. A dedicated end-to-end
 * control runs the gate as a bounded child process with an injected fault and
 * proves that the child run fails, rather than only asserting a collector.
 */

const PACKAGE_ROOT = process.cwd();
const PLAYWRIGHT_CLI = path.join(
  PACKAGE_ROOT,
  "node_modules",
  "@playwright/test",
  "cli.js",
);
const PLAYWRIGHT_CONFIG = path.join(PACKAGE_ROOT, "playwright.config.ts");
const FAULT_SPEC = "tests/browser/fault-run.spec.ts";
const FAULT_OUTPUT_DIR = path.join(
  PACKAGE_ROOT,
  "tests/browser/.output/fault-control",
);
const NESTED_RUN_TIMEOUT_MS = 240_000;

let server: OwnedServer | undefined;
let baseURL = "";

test.beforeAll(async () => {
  const started = await startFixtureServer();
  server = started.server;
  baseURL = started.baseURL;
});

test.afterAll(async () => {
  if (!server) return;
  // Drain stdio first so a shutdown-time exit or stderr is observed.
  await server.stop();
  const failure = server.failure();
  if (failure) throw failure;
});

async function openHome(page: import("@playwright/test").Page): Promise<void> {
  await page.goto(baseURL);
  await expect(
    page.getByRole("heading", { name: "Consumer fixture qualification" }),
  ).toBeVisible();
  // Wait for the client mount marker instead of a fixed sleep, so interactions
  // run only after hydration has completed.
  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
}

async function openCompatibility(
  page: import("@playwright/test").Page,
): Promise<void> {
  await page.goto(`${baseURL}compatibility`);
  await expect(
    page.getByRole("heading", { name: "Compatibility qualification" }),
  ).toBeVisible();
  await expect(page.locator("main")).toHaveAttribute("data-hydrated", "true");
}

test("the page renders its accessible heading and labelled controls", async ({
  page,
}) => {
  await openHome(page);
  await expect(page.getByLabel("Name")).toBeVisible();
  await expect(page.getByRole("button", { name: "Render name" })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Enable notifications" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Increment" })).toBeVisible();
});

test("Tab and Shift+Tab follow the documented focus order", async ({
  page,
}) => {
  await openHome(page);

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
});

test("the native checkbox toggles with the keyboard", async ({ page }) => {
  await openHome(page);
  const checkbox = page.getByRole("checkbox", {
    name: "Enable notifications",
  });
  await checkbox.focus();
  const initial = await checkbox.isChecked();

  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked({ checked: !initial });
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked({ checked: initial });
});

test("form submission navigates and renders the request-local server value", async ({
  page,
}) => {
  await openHome(page);
  await page.getByLabel("Name").fill("browser");
  await page.getByRole("button", { name: "Render name" }).click();

  await expect(page).toHaveURL(/\?name=browser/);
  await expect(page.getByTestId("server-value")).toHaveText(
    "Server value: browser",
  );
});

test("hydration executes and client state updates the DOM", async ({
  page,
}) => {
  await openHome(page);
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 0");

  await page.getByTestId("counter").click();
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 1");
  await page.getByTestId("counter").click();
  await expect(page.getByTestId("click-count")).toHaveText("Clicks: 2");
});

test("the Bits switch exposes accessible semantics and a delegated child button", async ({
  page,
}) => {
  await openCompatibility(page);
  const control = page.getByRole("switch", {
    name: "Enable compatibility notifications",
  });
  await expect(control).toBeVisible();
  await expect(control).toHaveAttribute("aria-checked", "false");
  await expect(control).toHaveAttribute("data-state", "unchecked");
  // The child snippet forwards a real native button, with no nested buttons.
  await expect(control).toHaveJSProperty("tagName", "BUTTON");
  expect(await control.locator("button").count()).toBe(0);
  // The primitive's hidden input renders outside the child branch (a sibling).
  await expect(
    page.locator('input[type="checkbox"][name="notifications"]'),
  ).toHaveCount(1);
  // The real pinned Switch.Thumb renders its own state-marked span.
  const thumb = page.getByTestId("switch-thumb");
  await expect(thumb).toHaveJSProperty("tagName", "SPAN");
  await expect(thumb).toHaveAttribute("data-state", "unchecked");
});

test("pointer activation updates the switch state", async ({ page }) => {
  await openCompatibility(page);
  const control = page.getByRole("switch", {
    name: "Enable compatibility notifications",
  });
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("switch-state")).toHaveText("on");
  await control.click();
  await expect(control).toHaveAttribute("aria-checked", "false");
});

test("keyboard Space activation updates the switch state", async ({ page }) => {
  await openCompatibility(page);
  const control = page.getByRole("switch", {
    name: "Enable compatibility notifications",
  });
  await control.focus();
  await page.keyboard.press("Space");
  await expect(control).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("switch-state")).toHaveText("on");
});

test("programmatic state updates flow back into the primitive", async ({
  page,
}) => {
  await openCompatibility(page);
  const control = page.getByRole("switch", {
    name: "Enable compatibility notifications",
  });
  await page.getByTestId("toggle").click();
  await expect(control).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("switch-state")).toHaveText("on");
  await page.getByTestId("toggle").click();
  await expect(control).toHaveAttribute("aria-checked", "false");
});

test("the bound ref is the delegated switch element and can take focus", async ({
  page,
}) => {
  await openCompatibility(page);
  const control = page.getByRole("switch", {
    name: "Enable compatibility notifications",
  });
  await expect(control).not.toBeFocused();
  await page.getByTestId("focus").click();
  await expect(control).toBeFocused();
});

test("an injected browser fault fails a bounded harness run", () => {
  // Run the gate as a real, bounded child browser run with a deliberate fault
  // injected by the fault spec. The child must exit nonzero, proving the gate
  // fails an actual run rather than only recording a collector entry.
  const result = spawnSync(
    process.execPath,
    [
      PLAYWRIGHT_CLI,
      "test",
      "--config",
      PLAYWRIGHT_CONFIG,
      // A dedicated output directory prevents the nested run's artifacts from
      // colliding with this run's while it executes.
      "--output",
      FAULT_OUTPUT_DIR,
      FAULT_SPEC,
    ],
    {
      cwd: PACKAGE_ROOT,
      env: { ...process.env, SUIK_BROWSER_FAULT_RUN: "1" },
      encoding: "utf8",
      timeout: NESTED_RUN_TIMEOUT_MS,
    },
  );
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  expect(
    result.error,
    `the nested browser run reported an error (possible timeout): ${String(result.error)}`,
  ).toBeUndefined();
  expect(
    result.status,
    `the faulted browser run must fail\n${output}`,
  ).not.toBe(0);
  expect(output).toContain("injected browser fault");
});
