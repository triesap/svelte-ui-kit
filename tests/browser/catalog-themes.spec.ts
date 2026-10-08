import { writeFileSync } from "node:fs";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildCatalogThemesConsumer } from "../helpers/generated-consumer.js";
import type { Page } from "@playwright/test";

const families: [string, string, "ink" | "surface"][] = [
  [".kit-alert", "color", "ink"],
  [".kit-avatar-fallback", "color", "ink"],
  [".kit-badge", "color", "ink"],
  [".kit-button--primary", "background-color", "ink"],
  [".kit-card", "color", "ink"],
  [".kit-checkbox[data-state=checked]", "background-color", "ink"],
  [".kit-collapsible-trigger", "color", "ink"],
  [".kit-dialog-trigger", "color", "ink"],
  [".kit-alert-dialog-trigger", "color", "ink"],
  [".kit-field-label", "color", "ink"],
  [".kit-menu-trigger", "color", "ink"],
  [".kit-progress", "accent-color", "ink"],
  [".kit-radio[data-state=checked]", "background-color", "ink"],
  [".kit-separator", "background-color", "ink"],
  [".kit-skeleton", "background-color", "surface"],
  [".kit-spinner-mark", "border-block-start-color", "ink"],
  [".kit-status", "color", "ink"],
  [".kit-switch[data-state=checked]", "background-color", "ink"],
  [".kit-tabs-trigger", "color", "ink"],
  [".kit-anchor", "color", "ink"],
];
const palette = {
  globalOne: { ink: "rgb(31, 41, 51)", surface: "rgb(211, 212, 213)" },
  globalTwo: { ink: "rgb(61, 71, 81)", surface: "rgb(181, 182, 183)" },
  nestedOne: { ink: "rgb(91, 101, 111)", surface: "rgb(151, 152, 153)" },
  nestedTwo: { ink: "rgb(121, 131, 141)", surface: "rgb(221, 222, 223)" },
};
async function catalog(
  page: Page,
  scope: string,
  colors: typeof palette.globalOne,
) {
  const records: unknown[] = [];
  for (const [selector, property, role] of families) {
    const node = page.locator(`${scope} ${selector}`).first();
    await expect(node).toHaveCSS(property, colors[role]);
    records.push({
      selector,
      property,
      role,
      value: await node.evaluate(
        (e, p) => getComputedStyle(e).getPropertyValue(p),
        property,
      ),
    });
  }
  expect(await page.locator(`${scope} .kit-anchor`).count()).toBe(2); // Anchor + RouterLink.
  const inheritance = await page.locator(scope).evaluate((scope) =>
    [...scope.querySelectorAll("[class]")]
      .filter((node) =>
        [...node.classList].some((name) => name.startsWith("kit-")),
      )
      .map((node) => ({
        classes: [...node.classList],
        ink: getComputedStyle(node).getPropertyValue("--kit-color-text").trim(),
      })),
  );
  expect(inheritance.length).toBeGreaterThan(families.length);
  const inherited = await page
    .locator(scope)
    .evaluate((e) =>
      getComputedStyle(e).getPropertyValue("--kit-color-text").trim(),
    );
  expect([...new Set(inheritance.map((row) => row.ink))]).toEqual([inherited]);
  return { records, inheritance };
}

for (const custom of [false, true])
  test.describe(`catalog themes ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCatalogThemesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCatalogThemesConsumer(custom);
      try {
        hosted = await startFixtureServer({ handler: consumer.handler });
      } catch (error) {
        consumer.cleanup();
        throw error;
      }
    });
    test.afterAll(async () => {
      try {
        if (hosted) {
          await hosted.server.stop();
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        consumer?.cleanup();
      }
    });
    test.beforeEach(async ({ page }, info) => {
      expect(page.isClosed()).toBe(false);
      writeFileSync(
        info.outputPath("installed-artifact.json"),
        JSON.stringify(consumer.evidence, null, 2),
      );
      expect(Object.keys(consumer.evidence.themeSyncPreservation)).toHaveLength(
        4,
      );
    });
    test("complete global and nested catalog changes inherit live and application-owned persistence survives reload", async ({
      page,
    }, info) => {
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator("#theme-qualification")).toHaveAttribute(
        "data-ready",
        "true",
      );
      const before = {
        global: await catalog(page, "#global-catalog", palette.globalOne),
        nested: await catalog(page, "#nested-catalog", palette.nestedOne),
      };
      await page.locator("#change-global").click();
      await catalog(page, "#global-catalog", palette.globalTwo);
      await catalog(page, "#nested-catalog", palette.nestedOne);
      await page.locator("#change-nested").click();
      const after = {
        global: await catalog(page, "#global-catalog", palette.globalTwo),
        nested: await catalog(page, "#nested-catalog", palette.nestedTwo),
      };
      expect(
        await page.evaluate(() => localStorage.getItem("catalog-theme")),
      ).toBe("two");
      await page.reload();
      await expect(page.locator("#theme-qualification")).toHaveAttribute(
        "data-ready",
        "true",
      );
      await catalog(page, "#global-catalog", palette.globalTwo);
      await catalog(page, "#nested-catalog", palette.nestedOne);
      writeFileSync(
        info.outputPath("catalog-theme-effects.json"),
        JSON.stringify({ before, after }, null, 2),
      );
    });
    for (const kind of ["dialog", "alert", "menu"])
      for (const host of ["body", "nested"]) {
        test(`${kind} open ${host} portal follows its real theme ancestor`, async ({
          page,
        }, info) => {
          await page.goto(
            new URL(
              `${consumer.route}?kind=${kind}&host=${host}`,
              hosted.baseURL,
            ).href,
          );
          await expect(page.locator("#theme-qualification")).toHaveAttribute(
            "data-ready",
            "true",
          );
          await page.locator("#theme-trigger").click();
          const content = page.locator("#theme-content");
          await expect(content).toBeVisible();
          const before =
            host === "body" ? palette.globalOne : palette.nestedOne;
          const after = host === "body" ? palette.globalTwo : palette.nestedTwo;
          await expect(content).toHaveCSS("color", before.ink);
          await expect(content).toHaveCSS("background-color", before.surface);
          await page
            .locator(
              host === "body" ? "#open-change-global" : "#open-change-nested",
            )
            .click();
          await expect(content).toHaveAttribute("data-state", "open");
          await expect(content).toHaveCSS("color", after.ink);
          await expect(content).toHaveCSS("background-color", after.surface);
          expect(
            await content.evaluate((e) =>
              [...(e as HTMLElement).style].filter((name) =>
                name.startsWith("--kit-"),
              ),
            ),
          ).toEqual([]);
          const parent = await content.evaluate((e) => ({
            directBody: e.parentElement === document.body,
            nested: !!e.closest("#nested-host"),
            outerStyle: e.parentElement?.getAttribute("style"),
          }));
          expect(parent.nested).toBe(host === "nested");
          if (kind !== "menu") expect(parent.directBody).toBe(host === "body");
          writeFileSync(
            info.outputPath("open-portal-theme.json"),
            JSON.stringify({ kind, host, before, after, parent }, null, 2),
          );
          await page.keyboard.press("Escape");
          await expect(content).toHaveCount(0);
          await expect(page.locator("#theme-trigger")).toBeFocused();
        });
      }
  });
