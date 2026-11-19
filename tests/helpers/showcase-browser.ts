/** Shared public-showcase observations in both native framework hosts. */
import { expect, type Page } from "@playwright/test";
export async function verifyShowcase(
  page: Page,
  url: string,
  catalog: readonly string[],
  output: (name: string) => string,
) {
  await page.goto(url);
  await expect(page.locator("[data-showcase]")).toHaveAttribute(
    "data-ready",
    "true",
  );
  expect(await page.locator("meta[name=viewport]").count()).toBe(1);
  expect(
    await page
      .locator("[data-kit-item]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-kit-item")).sort(),
      ),
  ).toEqual([...catalog].sort());
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(255, 255, 255)",
  );
  await expect(
    page.getByRole("button", { name: "Default", exact: true }),
  ).toHaveCSS("border-top-left-radius", "999px");
  await page.getByRole("button", { name: "Clicked 0", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Clicked 1", exact: true }),
  ).toBeVisible();
  const name = page.getByRole("textbox", { name: "Full name", exact: true });
  await name.fill("");
  await page
    .getByRole("button", { name: "Submit example", exact: true })
    .click();
  await expect(page.locator("[data-showcase-submissions]")).toContainText(
    "Submitted 0 times",
  );
  expect(
    await name.evaluate((node: HTMLInputElement) => node.validity.valueMissing),
  ).toBe(true);
  await name.fill("Grace");
  await page
    .getByRole("textbox", { name: "Low-level composition", exact: true })
    .fill("Local demonstration");
  await page
    .getByRole("button", { name: "Submit example", exact: true })
    .click();
  await expect(page.locator("[data-showcase-submissions]")).toContainText(
    "Submitted 1 times",
  );
  await page.getByRole("button", { name: "Reset form", exact: true }).click();
  await expect(name).toHaveValue("Ada");
  await expect(page.locator("[data-showcase-submissions]")).toContainText(
    "Submitted 0 times",
  );
  await expect(
    page.locator('[data-kit-item="field"] .kit-select-icon svg'),
  ).toHaveAttribute("aria-hidden", "true");
  await page
    .getByRole("button", { name: "Choose display density", exact: true })
    .click();
  await page
    .getByRole("menuitemradio", { name: "Compact", exact: true })
    .click();
  await expect(
    page.getByRole("menuitemradio", { name: "Compact", exact: true }),
  ).toHaveAttribute("aria-checked", "true");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: output(`showcase-${width}.png`),
      fullPage: true,
      animations: "disabled",
    });
  }
}
