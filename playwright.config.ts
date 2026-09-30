import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for the S008 consumer browser harness.
 *
 * The harness owns its server: `tests/browser/harness.spec.ts` starts the real
 * Node-adapter production handler through the shared owned-server boundary on
 * an OS-assigned loopback port. There is no `webServer` block and no fixed
 * port. Only bundled headless Chromium is qualified in this initial lane; no
 * browser channel substitution or host configuration is used.
 */
export default defineConfig({
  testDir: "./tests/browser",
  testMatch: /.*\.spec\.ts/,
  // The fault control only runs when the harness spawns it deliberately with
  // SUIK_BROWSER_FAULT_RUN set, so the default lane never fails on it.
  testIgnore: process.env["SUIK_BROWSER_FAULT_RUN"]
    ? []
    : ["**/fault-run.spec.ts"],
  fullyParallel: false,
  forbidOnly: true,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  // Failure traces and screenshots stay in an ignored output tree.
  outputDir: "tests/browser/.output",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
