import { writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildCatalogHydrationConsumer } from "../helpers/generated-consumer.js";

async function identity(page: Page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map((e) => e.id);
    const unresolved = [
      ...document.querySelectorAll(
        "[for], [aria-labelledby], [aria-describedby], [aria-controls]",
      ),
    ].flatMap((e) =>
      ["for", "aria-labelledby", "aria-describedby", "aria-controls"].flatMap(
        (attr) =>
          (e.getAttribute(attr) ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .filter((id) => !document.getElementById(id))
            .map((id) => ({ tag: e.tagName, attr, id })),
      ),
    );
    return { ids, unresolved };
  });
}
async function states(page: Page, seed: string, on: boolean) {
  const root = page.locator(`[data-instance="${seed}"]`);
  await expect(root.locator('input[name="valid-text"]')).toHaveValue(seed);
  await expect(root.locator('textarea[name="valid-area"]')).toHaveValue(
    `${seed} area`,
  );
  await expect(
    root.getByRole("switch", { name: "Switch", exact: true }).first(),
  ).toHaveAttribute("data-state", on ? "checked" : "unchecked");
  await expect(
    root.getByRole("checkbox", { name: "Checked", exact: true }).first(),
  ).toHaveAttribute("data-state", on ? "checked" : "unchecked");
  await expect(root.locator('.kit-radio[data-state="checked"]')).toHaveCount(2);
  await expect(
    root.getByRole("checkbox", { name: "Indeterminate", exact: true }).first(),
  ).toHaveAttribute("aria-checked", on ? "mixed" : "false");
  await expect(
    root.locator('.kit-radio[data-state="checked"]').first(),
  ).toHaveAttribute("data-value", on ? "b" : "a");
  await expect(
    root.locator('.kit-tabs-trigger[aria-selected="true"]'),
  ).toHaveText([on ? "B" : "A", on ? "B" : "A"]);
  await expect(
    root.locator(".kit-collapsible-trigger").first(),
  ).toHaveAttribute("data-state", on ? "open" : "closed");
  const progress = root.locator(".kit-progress").first();
  if (on) await expect(progress).toHaveAttribute("value", "25");
  else await expect(progress).not.toHaveAttribute("value");
}
for (const custom of [false, true])
  test.describe(`full catalog hydration ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCatalogHydrationConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCatalogHydrationConsumer(custom);
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
    for (const on of [false, true])
      test(`initial values, multiple instances and conditional remount on=${on}`, async ({
        page,
      }, info) => {
        writeFileSync(
          info.outputPath("installed-artifact.json"),
          JSON.stringify(consumer.evidence, null, 2),
        );
        const response = await page.goto(
          `${hosted.baseURL}${consumer.route}?request=browser-${on}&on=${+on}&extra=1`,
        );
        const html = await response!.text();
        expect(html).toContain('data-ready="false"');
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        const seed = `browser-${on}`;
        await states(page, seed, on);
        await states(page, `${seed}-extra`, !on);
        const initial = await identity(page);
        expect(new Set(initial.ids).size).toBe(initial.ids.length);
        expect(initial.unresolved).toEqual([]);
        const serverFields = await page.evaluate(
          (source) =>
            [
              ...new DOMParser()
                .parseFromString(source, "text/html")
                .querySelectorAll("input[id],textarea[id],select[id]"),
            ].map((e) => e.id),
          html,
        );
        expect(
          await page
            .locator("input[id],textarea[id],select[id]")
            .evaluateAll((nodes) => nodes.map((e) => e.id)),
        ).toEqual(serverFields);
        await page
          .locator(`[data-instance="${seed}"] input[name="valid-text"]`)
          .fill("local edit");
        await page.locator("#toggle-extra").click();
        await expect(page.locator("[data-instance]")).toHaveCount(1);
        await expect(
          page.locator(`[data-instance="${seed}"] input[name="valid-text"]`),
        ).toHaveValue("local edit");
        await page.locator("#toggle-extra").click();
        await states(page, `${seed}-extra`, !on);
        await page.locator("#toggle-mounted").click();
        await expect(page.locator("[data-instance]")).toHaveCount(0);
        await page.locator("#toggle-mounted").click();
        await states(page, seed, on);
        await states(page, `${seed}-extra`, !on);
        const remounted = await identity(page);
        expect(new Set(remounted.ids).size).toBe(remounted.ids.length);
        expect(remounted.unresolved).toEqual([]);
        writeFileSync(
          info.outputPath("identity.json"),
          JSON.stringify({ serverFields, initial, remounted }, null, 2),
        );
      });
    for (const kind of ["dialog", "alert", "menu"] as const)
      for (const portal of ["inline", "body", "custom"] as const)
        test(`initial ${kind} open with ${portal} portal hydrates native relationships and closes`, async ({
          page,
        }, info) => {
          writeFileSync(
            info.outputPath("installed-artifact.json"),
            JSON.stringify(consumer.evidence, null, 2),
          );
          const response = await page.goto(
            `${hosted.baseURL}${consumer.route}?request=overlay-${kind}&on=1&extra=1&open=${kind}&portal=${portal}`,
          );
          expect(response!.status()).toBe(200);
          await expect(page.locator("main")).toHaveAttribute(
            "data-ready",
            "true",
          );
          const content = page.getByRole(
            kind === "alert" ? "alertdialog" : kind,
          );
          await expect(content).toBeVisible();
          if (kind !== "menu") {
            await expect(content).toHaveAccessibleName(
              kind === "alert" ? "Alert title" : "Dialog title",
            );
            await expect(content).toHaveAccessibleDescription(
              kind === "alert" ? "Alert description" : "Dialog description",
            );
          }
          expect(
            await content.evaluate((e) => ({
              instance: !!e.closest("[data-instance]"),
              host: !!e.closest("#catalog-host"),
            })),
          ).toEqual({
            instance: portal === "inline",
            host: portal === "custom",
          });
          const open = await identity(page);
          expect(new Set(open.ids).size).toBe(open.ids.length);
          expect(open.unresolved).toEqual([]);
          await page.keyboard.press("Escape");
          await expect(content).toHaveCount(0);
          await states(page, `overlay-${kind}`, true);
          await states(page, `overlay-${kind}-extra`, false);
          await page.locator("#toggle-extra").click();
          await expect(page.locator("[data-instance]")).toHaveCount(1);
          writeFileSync(
            info.outputPath("open-identity.json"),
            JSON.stringify(open, null, 2),
          );
        });
  });
