import {
  expect,
  test as base,
  type ConsoleMessage,
  type Page,
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
 * The `browserIssues` fixture is automatic: collection starts before the test
 * navigates and the assertion runs in fixture teardown, so a fault observed
 * only after the test body (for example during teardown) still fails the run.
 * It never blanket-ignores a browser message.
 */
export const test = base.extend<{ browserIssues: string[] }>({
  browserIssues: [
    async ({ page }, use) => {
      const issues = createIssueCollector(page);
      await use(issues);
      expect(
        issues,
        `browser issues detected during the test lifecycle:\n${issues.join("\n")}`,
      ).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
