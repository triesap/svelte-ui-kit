import { expect, test } from "./browser-issues";
import { startFixtureServer, type OwnedServer } from "./fixture-server";

/**
 * Fault-injection control for the S008 browser gate.
 *
 * This spec is excluded from the default lane by `playwright.config.ts` unless
 * `SUIK_BROWSER_FAULT_RUN` is set. The harness spawns it as a bounded child
 * Playwright run and asserts that the child fails with the intended
 * diagnostic. `SUIK_BROWSER_FAULT_KIND` selects one fault:
 *
 *   clean                no fault; the gate must pass
 *   console              a console error during the test body
 *   hydration            a hydration warning during the test body
 *   pageerror            a page exception during the test body
 *   teardown-console     a console error during page-related fixture teardown
 *   teardown-hydration   a hydration warning during page-related teardown
 *   teardown-pageerror   a page exception during page-related teardown
 *
 * The teardown faults prove the collector assertion runs after dependent
 * fixtures are torn down. No product code is modified.
 */

const FAULT_KIND = process.env["SUIK_BROWSER_FAULT_KIND"] ?? "clean";

let server: OwnedServer | undefined;
let baseURL = "";

test.beforeAll(async () => {
  const started = await startFixtureServer();
  server = started.server;
  baseURL = started.baseURL;
});

test.afterAll(async () => {
  if (!server) return;
  await server.stop();
  const failure = server.failure();
  if (failure) throw failure;
});

type FaultPage = import("@playwright/test").Page;

async function emitConsoleError(page: FaultPage): Promise<void> {
  const seen = page.waitForEvent("console", (message) => {
    return message.type() === "error";
  });
  await page.evaluate(() => {
    console.error("injected browser fault: console error");
  });
  await seen;
}

async function emitHydrationWarning(page: FaultPage): Promise<void> {
  const seen = page.waitForEvent("console", (message) => {
    return message.type() === "warning";
  });
  await page.evaluate(() => {
    console.warn("hydration mismatch: injected browser fault");
  });
  await seen;
}

async function emitPageError(page: FaultPage): Promise<void> {
  const seen = page.waitForEvent("pageerror");
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("injected browser fault: page error");
    }, 0);
  });
  await seen;
}

async function emitBodyFault(page: FaultPage): Promise<void> {
  switch (FAULT_KIND) {
    case "console":
      return emitConsoleError(page);
    case "hydration":
      return emitHydrationWarning(page);
    case "pageerror":
      return emitPageError(page);
    default:
      return;
  }
}

async function emitTeardownFault(page: FaultPage): Promise<void> {
  switch (FAULT_KIND) {
    case "teardown-console":
      return emitConsoleError(page);
    case "teardown-hydration":
      return emitHydrationWarning(page);
    case "teardown-pageerror":
      return emitPageError(page);
    default:
      return;
  }
}

// A dependent fixture whose teardown runs before the `page` override closes
// the page and asserts the collected issues.
const faultTest = test.extend<{ teardownFault: void }>({
  teardownFault: [
    async ({ page }, use) => {
      await use();
      await emitTeardownFault(page);
    },
    { auto: true },
  ],
});

faultTest(
  "the maintained browser gate observes the injected fault",
  async ({ page }) => {
    await page.goto(baseURL);
    await expect(page.locator("body")).toBeVisible();
    await emitBodyFault(page);
  },
);
