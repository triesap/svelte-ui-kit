import { writeFileSync } from "node:fs";

import {
  expect,
  test as base,
  type ConsoleMessage,
  type Page,
  type TestInfo,
} from "@playwright/test";

/**
 * Strict browser issue collector shared by the S008 harness and its fault
 * control. It records page exceptions, console errors and hydration warnings
 * for the whole page lifecycle.
 */
export function createIssueCollector(page: Page): string[] {
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

/**
 * Shared Playwright test object.
 *
 * The built-in `page` fixture is overridden so enforcement runs after the page
 * lifecycle completes: collection starts before the test navigates, the test
 * body and every dependent fixture teardown finish, `page.close()` drains the
 * page's events, and only then are the collected page exceptions, console
 * errors and hydration warnings asserted. Closing the page here (rather than
 * asserting in an automatic fixture that depends on `page`) closes the gap
 * where a fault emitted during page/context teardown was previously missed.
 *
 * Because enforcement runs after `page.close()`, Playwright can no longer
 * screenshot the page when the collector assertion finally fails. A usable
 * failure screenshot is therefore captured while the page is still available
 * (before close, with no sleeps) and attached to the failing test. A capture or
 * attachment error is swallowed so it can never replace the original browser
 * diagnostic. Body assertion failures keep Playwright's ordinary failure
 * artifacts, which are captured before this override's teardown runs. It never
 * blanket-ignores a browser message.
 */
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use, testInfo: TestInfo) => {
    const issues = createIssueCollector(page);
    await use(page);
    const screenshot = await captureFailureScreenshot(page);
    await page.close();
    if (issues.length > 0) {
      await attachFailureScreenshot(testInfo, screenshot);
      expect(
        issues,
        `browser issues detected during the test lifecycle:\n${issues.join("\n")}`,
      ).toEqual([]);
    }
  },
});

/**
 * Capture a failure screenshot while the page is still open. Returns null
 * rather than throwing, so a capture problem never masks the real diagnostic.
 */
async function captureFailureScreenshot(page: Page): Promise<Buffer | null> {
  try {
    return await page.screenshot({ fullPage: false });
  } catch {
    return null;
  }
}

/**
 * Attach the captured failure screenshot. The PNG is written into the test's
 * own output directory so it is retained as a real, nonempty artifact even
 * under a reporter that does not persist in-memory attachments, then attached
 * by path. A missing capture or an attachment problem is ignored here; the
 * collected browser issue remains the diagnostic.
 */
async function attachFailureScreenshot(
  testInfo: TestInfo,
  screenshot: Buffer | null,
): Promise<void> {
  if (screenshot === null) return;
  try {
    const file = testInfo.outputPath("collected-browser-issues.png");
    writeFileSync(file, screenshot);
    await testInfo.attach("collected-browser-issues", {
      path: file,
      contentType: "image/png",
    });
  } catch {
    // Evidence capture must not replace the original browser diagnostic.
  }
}

export { expect };
