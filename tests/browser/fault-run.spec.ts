import { expect, test } from "./browser-issues";
import { startFixtureServer, type OwnedServer } from "./fixture-server";

/**
 * Fault-injection control for the S008 browser gate.
 *
 * This spec is excluded from the default lane by `playwright.config.ts`
 * unless `SUIK_BROWSER_FAULT_RUN` is set. The harness spawns it as a bounded
 * child Playwright run and asserts that the child fails because of the
 * injected browser fault. It intentionally injects a console error, a
 * hydration warning and a page exception; the shared automatic issue fixture
 * must fail teardown. No product code is modified.
 */

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

test("a browser fault injected at runtime fails the automated gate", async ({
  page,
}) => {
  await page.goto(baseURL);
  const pageErrorSeen = page.waitForEvent("pageerror");
  await page.evaluate(() => {
    console.error("injected browser fault: console error");
    console.warn("hydration mismatch: injected browser fault");
  });
  await page.evaluate(() => {
    setTimeout(() => {
      throw new Error("injected browser fault: page error");
    }, 0);
  });
  await pageErrorSeen;
  await expect(page.locator("body")).toBeVisible();
});
