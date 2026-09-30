import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

import { expect, test } from "./browser-issues";
import { startFixtureServer, type OwnedServer } from "./fixture-server";
import { fetchRoute } from "../smoke/owned-server.mjs";

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
 * The shared `page` override collects page exceptions, console errors and
 * hydration warnings for the whole lifecycle and asserts them after the page
 * is closed and drained. Bounded child runs prove each fault class fails the
 * gate with its intended diagnostic, including faults emitted during teardown,
 * followed by a clean restoration run. Startup-ownership controls prove a
 * rejected `startFixtureServer` readiness stops its owned child.
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
const FIXTURE_FAULT_SERVER = path.join(
  PACKAGE_ROOT,
  "tests",
  "browser",
  "fixture-fault-server.mjs",
);
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

// ---------------------------------------------------------------------------
// Bounded real-run browser fault controls
// ---------------------------------------------------------------------------

/**
 * Build the environment for an owned child process. When NO_COLOR is present,
 * the conflicting FORCE_COLOR is removed from the child copy only; the parent
 * environment is never mutated and stderr is never filtered.
 */
function ownedChildEnv(extra: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env, ...extra };
  if (env["NO_COLOR"] !== undefined) {
    delete env["FORCE_COLOR"];
  }
  return env;
}

function runFaultChild(kind: string): {
  readonly output: string;
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly error: Error | undefined;
} {
  const result = spawnSync(
    process.execPath,
    [
      PLAYWRIGHT_CLI,
      "test",
      "--config",
      PLAYWRIGHT_CONFIG,
      // A dedicated output directory per kind prevents nested-run artifact
      // collisions with this run and with sibling fault runs.
      "--output",
      path.join(FAULT_OUTPUT_DIR, kind),
      FAULT_SPEC,
    ],
    {
      cwd: PACKAGE_ROOT,
      env: ownedChildEnv({
        SUIK_BROWSER_FAULT_RUN: "1",
        SUIK_BROWSER_FAULT_KIND: kind,
      }),
      encoding: "utf8",
      timeout: NESTED_RUN_TIMEOUT_MS,
    },
  );
  return {
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
    status: result.status,
    signal: result.signal,
    error: result.error,
  };
}

interface FailureArtifacts {
  readonly screenshots: string[];
  readonly traces: string[];
  readonly total: number;
}

/**
 * List the nonempty failure artifacts an owned nested run left behind. Only
 * `.png` screenshots and `.zip` traces are counted; empty files are ignored so
 * a zero-byte placeholder can never satisfy the assertion.
 */
function listFailureArtifacts(dir: string): FailureArtifacts {
  const screenshots: string[] = [];
  const traces: string[] = [];
  let total = 0;
  const walk = (current: string): void => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const abs = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile()) {
        total += 1;
        if (statSync(abs).size === 0) continue;
        if (entry.name.endsWith(".png")) screenshots.push(abs);
        else if (entry.name.endsWith(".zip")) traces.push(abs);
      }
    }
  };
  if (existsSync(dir)) walk(dir);
  return { screenshots, traces, total };
}

interface FaultCase {
  readonly kind: string;
  readonly marker: string;
}

const FAULT_CASES: readonly FaultCase[] = [
  {
    kind: "console",
    marker: "console error: injected browser fault: console error",
  },
  {
    kind: "hydration",
    marker: "hydration warning: hydration mismatch: injected browser fault",
  },
  {
    kind: "pageerror",
    marker: "page error: injected browser fault: page error",
  },
  {
    kind: "teardown-console",
    marker: "console error: injected browser fault: console error",
  },
  {
    kind: "teardown-hydration",
    marker: "hydration warning: hydration mismatch: injected browser fault",
  },
  {
    kind: "teardown-pageerror",
    marker: "page error: injected browser fault: page error",
  },
  {
    kind: "body-assert",
    marker: "body-assert-probe",
  },
];

for (const fault of FAULT_CASES) {
  test(`the ${fault.kind} fault fails a bounded run for its diagnostic`, () => {
    const outputDir = path.join(FAULT_OUTPUT_DIR, fault.kind);
    // Own the artifact directory so a stale sibling run can never satisfy the
    // evidence assertions below.
    rmSync(outputDir, { recursive: true, force: true });
    const result = runFaultChild(fault.kind);
    expect(
      result.error,
      `the nested ${fault.kind} run reported an error (possible timeout): ${String(result.error)}`,
    ).toBeUndefined();
    expect(
      result.signal,
      `the nested ${fault.kind} run was signalled`,
    ).toBeNull();
    expect(
      result.status,
      `the ${fault.kind} fault must fail\n${result.output}`,
    ).not.toBe(0);
    expect(result.output).toContain(fault.marker);

    const artifacts = listFailureArtifacts(outputDir);
    expect(
      artifacts.screenshots.length,
      `the ${fault.kind} fault must retain a nonempty failure screenshot\n${result.output}`,
    ).toBeGreaterThan(0);
    expect(
      artifacts.traces.length,
      `the ${fault.kind} fault must retain a nonempty trace\n${result.output}`,
    ).toBeGreaterThan(0);
  });
}

test("a clean restoration run passes after the injected faults", () => {
  const outputDir = path.join(FAULT_OUTPUT_DIR, "clean");
  rmSync(outputDir, { recursive: true, force: true });
  const result = runFaultChild("clean");
  expect(
    result.error,
    `the clean run reported an error (possible timeout): ${String(result.error)}`,
  ).toBeUndefined();
  expect(result.signal).toBeNull();
  expect(
    result.status,
    `the clean run must pass after the faults\n${result.output}`,
  ).toBe(0);
  // A passing run restores a clean, artifact-free output directory.
  const artifacts = listFailureArtifacts(outputDir);
  expect(
    artifacts.screenshots.length,
    "a clean run must not retain a failure screenshot",
  ).toBe(0);
  expect(artifacts.traces.length, "a clean run must not retain a trace").toBe(
    0,
  );
});

// ---------------------------------------------------------------------------
// Startup ownership controls
// ---------------------------------------------------------------------------

function isPidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function waitForPidExit(
  pid: number,
  timeoutMs = 5_000,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (!isPidAlive(pid)) return true;
    await new Promise((resolve) => setTimeout(resolve, 25));
  }
  return !isPidAlive(pid);
}

interface FaultReport {
  readonly pid: number;
  readonly port: number;
}

function readFaultReport(reportPath: string): FaultReport {
  return JSON.parse(readFileSync(reportPath, "utf8")) as FaultReport;
}

for (const fault of ["malformed", "silent"] as const) {
  test(`startFixtureServer stops its owned child after a ${fault} rejection`, async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), "suik-fixture-fault-"));
    const reportPath = path.join(dir, "report.json");
    // An unrelated owned server must keep running and healthy throughout.
    const unrelated = await startFixtureServer();
    try {
      let thrown: unknown;
      try {
        await startFixtureServer({
          launcher: FIXTURE_FAULT_SERVER,
          env: {
            SUIK_FIXTURE_FAULT: fault,
            SUIK_FIXTURE_REPORT: reportPath,
          },
          startTimeoutMs: 2_000,
        });
      } catch (error) {
        thrown = error;
      }
      const message = thrown instanceof Error ? thrown.message : String(thrown);
      expect(message).toMatch(
        fault === "malformed"
          ? /unreadable port line/
          : /did not report a port/,
      );

      expect(unrelated.server.failure()).toBeNull();
      const probe = await fetchRoute(unrelated.baseURL);
      expect(probe.status).toBe(200);

      const report = readFaultReport(reportPath);
      expect(await waitForPidExit(report.pid)).toBe(true);
      await expect(
        fetch(`http://127.0.0.1:${report.port}/`, {
          signal: AbortSignal.timeout(1_000),
        }),
      ).rejects.toThrow();
    } finally {
      await unrelated.server.stop();
      rmSync(dir, { recursive: true, force: true });
    }
  });
}

test("a malformed readiness retains the observed child failure", async () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "suik-fixture-fault-"));
  const reportPath = path.join(dir, "report.json");
  try {
    let thrown: unknown;
    try {
      await startFixtureServer({
        launcher: FIXTURE_FAULT_SERVER,
        env: {
          SUIK_FIXTURE_FAULT: "malformed",
          SUIK_FIXTURE_REPORT: reportPath,
        },
        startTimeoutMs: 2_000,
      });
    } catch (error) {
      thrown = error;
    }
    expect(thrown).toBeInstanceOf(AggregateError);
    expect((thrown as Error).message).toMatch(/unreadable port line/);
    expect((thrown as AggregateError).errors.length).toBeGreaterThanOrEqual(2);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a spawn failure leaves an unrelated owned server untouched", async () => {
  const unrelated = await startFixtureServer();
  try {
    let thrown: unknown;
    try {
      await startFixtureServer({
        command: path.join(
          PACKAGE_ROOT,
          "tests",
          "browser",
          "no-such-executable",
        ),
      });
    } catch (error) {
      thrown = error;
    }
    const message = thrown instanceof Error ? thrown.message : String(thrown);
    expect(message).toMatch(/ENOENT|spawn/i);
    expect(unrelated.server.failure()).toBeNull();
  } finally {
    await unrelated.server.stop();
  }
});

test("startFixtureServer returns a live handle on success and stops it cleanly", async () => {
  const started = await startFixtureServer();
  try {
    const response = await fetchRoute(started.baseURL);
    expect(response.status).toBe(200);
    expect(started.server.failure()).toBeNull();
  } finally {
    const info = await started.server.stop();
    expect(info).not.toBeNull();
  }
  expect(started.server.isClosed()).toBe(true);
  expect(started.server.failure()).toBeNull();
});
