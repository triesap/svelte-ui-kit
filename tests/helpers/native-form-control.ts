import { expect, type Page } from "@playwright/test";

/** Shared fixture contract for Checkbox and Switch's real native form field. */
export async function qualifyUnnamedCheckboxReset(page: Page): Promise<void> {
  const seed = page.locator("#seed");
  const click = (name: string) =>
    page.getByRole("button", { name, exact: true }).click();
  for (const name of ["Remove seed name", "Empty seed name"]) {
    await click(name);
    await expect(seed).toBeChecked();
    expect(
      await page
        .locator("#seed-form")
        .evaluate((node) => [...new FormData(node as HTMLFormElement)]),
    ).toEqual([]);
    await seed.click();
    await expect(seed).not.toBeChecked();
    expect(
      await page
        .locator("#seed-form")
        .evaluate((node) => (node as HTMLFormElement).checkValidity()),
    ).toBe(false);
    expect(
      await page
        .locator("#seed-form")
        .evaluate((node) => [...new FormData(node as HTMLFormElement)]),
    ).toEqual([]);
    await click("Restore seed");
    await expect(seed).toBeChecked();
    await expect(page.locator("#seed-state")).toHaveText("true");
    await click("Toggle reset cancellation");
    await seed.click();
    await click("Restore seed");
    // Join the next timer turn after the reset handlers, rather than accepting
    // an assertion before their deferred cancellation check has run.
    await page.evaluate(
      () => new Promise<void>((resolve) => setTimeout(resolve, 0)),
    );
    await expect(seed).not.toBeChecked();
    await click("Toggle reset cancellation");
    await click("Restore seed");
    await expect(seed).toBeChecked();
  }
}
