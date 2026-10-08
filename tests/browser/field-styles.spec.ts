import { writeFileSync } from "node:fs";
import { buildFieldConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Field styles ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildFieldConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildFieldConsumer(custom);
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
      const file = info.outputPath("installed-field.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-field", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("source field controls geometry focus states and invisible native select overlay remain exact", async ({
      page,
    }, info) => {
      const root = page.locator("#address"),
        surface = root.locator(".kit-field-surface"),
        input = page.locator("#address-control"),
        area = page.locator("#body-control"),
        select = page.locator("#choice-control");
      await expect(root).toHaveCSS("display", "grid");
      await expect(root).toHaveCSS("gap", "8px");
      await expect(surface).toHaveCSS("display", "grid");
      await expect(surface).toHaveCSS("padding", "10px 12px");
      await expect(surface).toHaveCSS("border-top-left-radius", "7px");
      for (const control of [input, area, select]) {
        await expect(control).toHaveCSS("border-top-left-radius", "6px");
        await expect(control).toHaveCSS("box-sizing", "border-box");
      }
      await expect(input).toHaveCSS("min-height", "44px");
      await expect(input).toHaveCSS("padding", "10px 12px");
      await expect(area).toHaveCSS("min-height", "112px");
      await expect(area).toHaveCSS("resize", "vertical");
      await expect(select).toHaveCSS("appearance", "none");
      await expect(select).toHaveCSS("padding-right", "40px");
      await page
        .getByRole("button", { name: "Focus input ref", exact: true })
        .click();
      await input.press("Tab");
      await input.focus();
      await expect(input).toHaveCSS("outline-width", "2px");
      await expect(input).toHaveCSS("outline-style", "solid");
      const overlay = page.locator("#select-convenience-control"),
        selectSurface = page.locator(
          "#select-convenience .kit-select-field-surface",
        ),
        row = page.locator("#select-convenience .kit-select-field-value-row"),
        icon = page.locator("#select-convenience .kit-select-icon");
      await expect(overlay).toHaveCSS("position", "absolute");
      await expect(overlay).toHaveCSS("opacity", "0");
      await expect(overlay).toHaveCSS("z-index", "1");
      await expect(row).toHaveCSS("pointer-events", "none");
      await expect(row).toHaveCSS("z-index", "2");
      await expect(icon).toHaveCSS("pointer-events", "none");
      await expect(icon).toHaveCSS("right", "12px");
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      const observed = await overlay.evaluate((node) => ({
        native: node.getBoundingClientRect().toJSON(),
        surface: node.parentElement!.getBoundingClientRect().toJSON(),
      }));
      expect(observed.native.width).toBeCloseTo(observed.surface.width, 1);
      expect(observed.native.height).toBeCloseTo(observed.surface.height, 1);
      await selectSurface.click();
      await expect(overlay).toBeFocused();
      await overlay.press("Escape");
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(input).toHaveAttribute("data-invalid", "true");
      const danger = await input.evaluate((node) => {
        const reference = document.createElement("span");
        reference.style.color = "var(--kit-color-danger)";
        node.parentElement!.appendChild(reference);
        const color = getComputedStyle(reference).color;
        reference.remove();
        return color;
      });
      await expect(input).toHaveCSS("border-top-color", danger);
      await page
        .getByRole("button", { name: "Toggle field disabled", exact: true })
        .click();
      await expect(root).toHaveCSS("opacity", "0.55");
      await expect(input).toHaveCSS("cursor", "not-allowed");
      await expect(input).toBeDisabled();
      const file = info.outputPath("source-field-geometry.json");
      writeFileSync(file, JSON.stringify(observed, null, 2));
      await info.attach("source-field-geometry", {
        path: file,
        contentType: "application/json",
      });
    });
    test("exact source customization radius chains RTL icon geometry and reduced motion retain native behavior", async ({
      page,
    }) => {
      const input = page.locator("#address-control"),
        surface = page.locator("#address .kit-field-surface"),
        icon = page.locator("#select-convenience .kit-select-icon");
      await page
        .getByRole("button", { name: "Toggle field theme", exact: true })
        .click();
      await expect(input).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(surface).toHaveCSS("border-top-left-radius", "11px 9px");
      await expect(input).toHaveCSS("padding-top", "12px");
      await expect(input).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(page.locator("#address")).toHaveCSS("gap", "12px");
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(page.locator("#address-message-error")).toHaveCSS(
        "color",
        "rgb(180, 0, 0)",
      );
      await page
        .getByRole("button", { name: "Toggle field direction", exact: true })
        .click();
      await expect(input).toHaveCSS("direction", "rtl");
      await expect(icon).toHaveCSS("left", "12px");
      await expect(page.locator("#choice-control")).toHaveCSS(
        "padding-left",
        "40px",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(input).toHaveCSS("transition-duration", "0s");
      await page
        .getByRole("button", { name: "Toggle field theme", exact: true })
        .click();
      await expect(input).toHaveCSS("border-top-left-radius", "6px");
      await expect(surface).toHaveCSS("border-top-left-radius", "7px");
    });
  });
