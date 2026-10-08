import { writeFileSync } from "node:fs";
import { buildTabsConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Tabs styles ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildTabsConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildTabsConsumer(custom);
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
      const file = info.outputPath("installed-tabs.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-tabs", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("source layout selected panel disabled and focus states use actual native DOM", async ({
      page,
    }, info) => {
      await expect(page.locator("#tabs-root")).toHaveCSS("display", "grid");
      await expect(page.locator("#tabs-root")).toHaveCSS("gap", "16px");
      await expect(page.locator("#tabs-list")).toHaveCSS("display", "flex");
      await expect(page.locator("#tabs-list")).toHaveCSS("gap", "4px");
      const a = page.locator("#tab-a"),
        b = page.locator("#tab-b");
      await expect(a).toHaveCSS("border-top-left-radius", "6px");
      await expect(a).toHaveCSS("min-height", "40px");
      await expect(a).toHaveCSS("padding", "8px 12px");
      await expect(page.locator("#panel-a")).toHaveCSS("padding", "12px 0px");
      await expect(page.locator("#panel-b")).toHaveCSS("display", "none");
      await expect(page.locator("#tab-disabled")).toBeDisabled();
      await expect(page.locator("#tab-disabled")).toHaveCSS("opacity", "0.55");
      await expect(page.locator("#tab-disabled")).toHaveCSS(
        "cursor",
        "not-allowed",
      );
      await expect(a).toHaveAttribute("data-state", "active");
      await expect(b).toHaveAttribute("data-state", "inactive");
      await b.press("Space");
      await expect(b).toHaveCSS("outline-width", "2px");
      await expect(b).toHaveCSS("outline-style", "solid");
      await expect(page.locator("#panel-a")).toHaveCSS("display", "none");
      await expect(page.locator("#panel-b")).toBeVisible();
      const observed = await b.evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          background: style.backgroundColor,
          color: style.color,
          radius: style.borderRadius,
          rect: node.getBoundingClientRect().toJSON(),
        };
      });
      const file = info.outputPath("source-tabs-paint.json");
      writeFileSync(file, JSON.stringify(observed, null, 2));
      await info.attach("source-tabs-paint", {
        path: file,
        contentType: "application/json",
      });
      await page
        .getByRole("button", { name: "Toggle candidate vertical", exact: true })
        .click();
      await expect(page.locator("#tabs-list")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
      await expect(page.locator("#tabs-list")).toHaveCSS(
        "flex-direction",
        "column",
      );
      await expect(page.locator("#tabs-list")).toHaveCSS(
        "align-items",
        "flex-start",
      );
    });
    test("source hook and radius overrides remain live with RTL and reduced motion", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Toggle tabs theme", exact: true })
        .click();
      const a = page.locator("#tab-a");
      await expect(a).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(a).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(page.locator("#tabs-root")).toHaveCSS("gap", "20px");
      await expect(page.locator("#panel-a")).toHaveCSS("padding-top", "10px");
      await page
        .getByRole("button", { name: "Toggle tabs direction", exact: true })
        .click();
      await expect(a).toHaveCSS("direction", "rtl");
      await expect(a).toHaveCSS("min-height", "40px");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(a).toHaveCSS("animation-name", "none");
      await expect(a).toHaveCSS("transition-duration", "0s");
      await page
        .getByRole("button", { name: "Toggle tabs theme", exact: true })
        .click();
      await expect(a).toHaveCSS("border-top-left-radius", "6px");
      await expect(page.locator("#tabs-root")).toHaveCSS("gap", "16px");
    });
  });
