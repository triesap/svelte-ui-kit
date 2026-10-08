import { writeFileSync } from "node:fs";
import { buildOverlayCompositionConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import type { Page } from "@playwright/test";
async function state(page: Page) {
  return JSON.parse(await page.locator("#state").innerText());
}
async function open(page: Page, kind: string) {
  await page.locator("#outer-trigger").click();
  await expect(
    page.locator(kind === "alert" ? "#alert-content" : "#outer-content"),
  ).toBeVisible();
  if (kind === "nested") {
    await page.locator("#nested-alert-trigger").click();
    await expect(page.locator("#alert-content")).toBeVisible();
  }
  await page.locator("#nested-menu-trigger").click();
  await expect(page.locator("#nested-menu")).toBeVisible();
}
for (const custom of [false, true])
  test.describe(`overlay composition ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildOverlayCompositionConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildOverlayCompositionConsumer(custom);
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
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
    });
    for (const kind of ["dialog", "alert", "nested"]) {
      test(`${kind} Escape dismisses one native layer and returns to each live trigger`, async ({
        page,
      }) => {
        await page.goto(
          new URL(`${consumer.route}?kind=${kind}`, hosted.baseURL).href,
        );
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        await open(page, kind);
        await page.keyboard.press("Escape");
        await expect(page.locator("#nested-menu")).toHaveCount(0);
        await expect(page.locator("#nested-menu-trigger")).toBeFocused();
        expect((await state(page)).outerOpen).toBe(true);
        if (kind === "nested") expect((await state(page)).alertOpen).toBe(true);
        await page.keyboard.press("Escape");
        if (kind === "nested") {
          await expect(page.locator("#alert-content")).toHaveCount(0);
          await expect(page.locator("#nested-alert-trigger")).toBeFocused();
          expect((await state(page)).outerOpen).toBe(true);
          await page.keyboard.press("Escape");
        }
        await expect(page.locator("#outer-content")).toHaveCount(0);
        await expect(page.locator("#alert-content")).toHaveCount(0);
        await expect(page.locator("#outer-trigger")).toBeFocused();
        expect((await state(page)).outerOpen).toBe(false);
      });
      test(`${kind} outside interaction preserves native parent distinctions and Menu ownership`, async ({
        page,
      }) => {
        await page.goto(
          new URL(`${consumer.route}?kind=${kind}`, hosted.baseURL).href,
        );
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        await open(page, kind);
        await page
          .locator(kind === "dialog" ? "#dialog-other" : "#alert-other")
          .click();
        await expect(page.locator("#nested-menu")).toHaveCount(0);
        expect((await state(page)).outerOpen).toBe(true);
        if (kind !== "dialog") {
          await page.locator("#alert-action").click();
          expect((await state(page)).actions).toBe(1);
          await expect(page.locator("#alert-content")).toBeVisible();
          await page
            .locator('[data-overlay="alert"]')
            .click({ position: { x: 2, y: 2 } });
          await expect(page.locator("#alert-content")).toBeVisible();
          await page.locator("#alert-cancel").click();
          if (kind === "nested") {
            await expect(page.locator("#nested-alert-trigger")).toBeFocused();
            await expect(page.locator("#outer-content")).toBeVisible();
            await page.locator("#outer-close").click();
          }
        } else
          await page
            .locator('[data-overlay="dialog"]')
            .click({ position: { x: 2, y: 2 } });
        await expect(page.locator("#outer-content")).toHaveCount(0);
        await expect(page.locator("#alert-content")).toHaveCount(0);
        await expect(page.locator("#outer-trigger")).toBeFocused();
      });
      test(`${kind} rapid parent presence and whole root destruction release native refs and layers`, async ({
        page,
      }) => {
        await page.goto(
          new URL(`${consumer.route}?kind=${kind}`, hosted.baseURL).href,
        );
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        for (let cycle = 0; cycle < 3; cycle++) {
          await open(page, kind);
          await page
            .locator("#burst")
            .evaluate((node) => (node as HTMLButtonElement).click());
          await expect(page.locator("#nested-menu")).toHaveCount(0);
          await expect(
            page.locator(
              kind === "alert" ? "#alert-content" : "#outer-content",
            ),
          ).toBeVisible();
          await page.keyboard.press("Escape");
          await expect(page.locator("#outer-content")).toHaveCount(0);
          await expect(page.locator("#alert-content")).toHaveCount(0);
          await expect(page.locator("#outer-trigger")).toBeFocused();
          const current = await state(page);
          expect(current.menuRef).toBe(null);
          expect(current.outerRef).toBe(null);
          expect(current.alertRef).toBe(null);
        }
        await open(page, kind);
        const trigger = await page.locator("#outer-trigger").elementHandle();
        await page
          .locator("#toggle-mounted")
          .evaluate((node) => (node as HTMLButtonElement).click());
        await expect(page.locator("#outer-trigger")).toHaveCount(0);
        await expect(page.locator("#nested-menu")).toHaveCount(0);
        await expect(page.locator("#outer-content")).toHaveCount(0);
        await expect(page.locator("#alert-content")).toHaveCount(0);
        expect(await trigger!.evaluate((node) => node.isConnected)).toBe(false);
        await page.locator("#toggle-mounted").click();
        await expect(page.locator("#outer-trigger")).toBeVisible();
        await open(page, kind);
        await page.keyboard.press("Escape");
        await expect(page.locator("#nested-menu-trigger")).toBeFocused();
      });
    }
  });
