import { writeFileSync } from "node:fs";
import { buildCollapsibleConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Collapsible styles ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCollapsibleConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCollapsibleConsumer(custom);
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
      const file = info.outputPath("installed-collapsible.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-collapsible", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("source disclosure layout padding radius focus and disabled states match actual native elements", async ({
      page,
    }, info) => {
      const root = page.locator("#disclosure"),
        trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await expect(root).toHaveCSS("display", "grid");
      await expect(root).toHaveCSS("gap", "8px");
      const nativeDisplay = await page.evaluate(() => {
        const grid = document.createElement("div"),
          button = document.createElement("button");
        grid.style.display = "grid";
        button.style.display = "inline-flex";
        grid.appendChild(button);
        document.body.appendChild(grid);
        const result = {
          authored: button.style.display,
          computed: getComputedStyle(button).display,
        };
        grid.remove();
        return result;
      });
      expect(nativeDisplay).toEqual({
        authored: "inline-flex",
        computed: "flex",
      });
      await expect(trigger).toHaveCSS("display", nativeDisplay.computed);
      await expect(trigger).toHaveCSS("min-height", "40px");
      await expect(trigger).toHaveCSS("padding", "8px 12px");
      await expect(trigger).toHaveCSS("border-top-left-radius", "6px");
      await expect(content).toHaveCSS("padding", "8px 0px");
      await expect(content).toBeHidden();
      await trigger.press("Space");
      await expect(trigger).toHaveCSS("outline-width", "2px");
      await expect(trigger).toHaveCSS("outline-style", "solid");
      await expect(content).toBeVisible();
      await expect(content).toHaveAttribute("data-state", "open");
      await expect(trigger).toHaveAttribute(
        "aria-controls",
        "disclosure-content",
      );
      const observed = await content.evaluate((node) => ({
        style: node.getAttribute("style"),
        rect: node.getBoundingClientRect().toJSON(),
        padding: getComputedStyle(node).padding,
      }));
      expect(observed.rect.height).toBeGreaterThan(0);
      const file = info.outputPath("source-collapsible-measurement.json");
      writeFileSync(file, JSON.stringify(observed, null, 2));
      await info.attach("source-collapsible-measurement", {
        path: file,
        contentType: "application/json",
      });
      await page
        .getByRole("button", { name: "Toggle candidate disabled", exact: true })
        .click();
      await expect(trigger).toBeDisabled();
      await expect(trigger).toHaveCSS("opacity", "0.55");
      await expect(trigger).toHaveCSS("cursor", "not-allowed");
      await expect(content).toBeVisible();
    });
    test("exact source hooks and radius chain remain live with RTL and reduced motion", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await page
        .getByRole("button", { name: "Toggle collapsible theme", exact: true })
        .click();
      await expect(trigger).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(trigger).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(page.locator("#disclosure")).toHaveCSS("gap", "20px");
      await expect(content).toHaveCSS("padding-top", "10px");
      await page
        .getByRole("button", {
          name: "Toggle collapsible direction",
          exact: true,
        })
        .click();
      await expect(trigger).toHaveCSS("direction", "rtl");
      await expect(trigger).toHaveCSS("min-height", "40px");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(trigger).toHaveCSS("transition-duration", "0s");
      await expect(content).toHaveCSS("animation-name", "none");
      await page
        .getByRole("button", { name: "Toggle collapsible theme", exact: true })
        .click();
      await expect(trigger).toHaveCSS("border-top-left-radius", "6px");
      await expect(page.locator("#disclosure")).toHaveCSS("gap", "8px");
    });
  });
