import { writeFileSync } from "node:fs";
import { buildRadioConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Radio styles ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildRadioConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildRadioConsumer(custom);
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
      const file = info.outputPath("installed-radio.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-radio", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("actual native item paints the fixed source radial indicator and forwards names refs and classes", async ({
      page,
    }, info) => {
      const a = page.locator("#radio-a"),
        b = page.locator("#radio-b");
      await expect(page.locator("#refs")).toHaveText("DIV;BUTTON");
      await expect(page.locator("#radio-group")).toHaveClass(
        "kit-radio-group caller retained",
      );
      await expect(page.locator("#radio-group")).toHaveAttribute(
        "role",
        "radiogroup",
      );
      await expect(a).toHaveClass("kit-radio");
      await expect(a).toBeChecked();
      for (const item of [a, b]) {
        await expect(item).toHaveCSS("width", "16px");
        await expect(item).toHaveCSS("height", "16px");
        await expect(item).toHaveCSS("border-top-left-radius", "999px");
      }
      await expect(b).toHaveCSS("background-image", "none");
      await expect(page.locator("#radio-disabled")).toBeDisabled();
      await expect(page.locator("#radio-disabled")).toHaveCSS(
        "cursor",
        "not-allowed",
      );
      await expect(page.locator('input[name="choice"]')).toHaveCount(1);
      await expect(page.locator('input[name="choice"]')).toHaveCSS(
        "width",
        "1px",
      );
      const color = await a.evaluate((node) => {
        const parent = node.parentElement!;
        const probe = document.createElement("span");
        probe.style.color = "var(--kit-color-selection-indicator)";
        parent.appendChild(probe);
        const color = getComputedStyle(probe).color;
        probe.remove();
        return color;
      });
      const paint = await a.evaluate(
        (node) => getComputedStyle(node).backgroundImage,
      );
      expect(paint).toContain("radial-gradient(circle");
      expect(paint).toContain(color);
      expect(paint).toContain("28%");
      expect(paint).toContain("30%");
      const file = info.outputPath("source-radio-paint.json");
      writeFileSync(
        file,
        JSON.stringify({
          paint,
          color,
          width: await a.evaluate((node) => node.getBoundingClientRect().width),
          height: await a.evaluate(
            (node) => node.getBoundingClientRect().height,
          ),
        }),
      );
      await info.attach("source-radio-paint", {
        path: file,
        contentType: "application/json",
      });
      await b.press("Space");
      await expect(a).not.toBeChecked();
      await expect(b).toBeChecked();
      await expect(a).toHaveCSS("background-image", "none");
      await expect(b).toHaveCSS("outline-style", "solid");
      await expect(b).toHaveCSS("outline-width", "2px");
    });
    test("exact source radius and semantic theme overrides remain live under RTL and reduced motion", async ({
      page,
    }) => {
      const item = page.locator("#radio-a");
      await page
        .getByRole("button", { name: "Toggle radio theme", exact: true })
        .click();
      await expect(item).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(item).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect
        .poll(() =>
          item.evaluate((node) => getComputedStyle(node).backgroundImage),
        )
        .toContain("rgb(7, 8, 9)");
      await page
        .getByRole("button", { name: "Toggle radio direction", exact: true })
        .click();
      await expect(item).toHaveCSS("direction", "rtl");
      await expect(item).toHaveCSS("width", "16px");
      await expect(item).toHaveCSS("height", "16px");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(item).toHaveCSS("transition-duration", "0s");
      await expect(item).toHaveCSS("animation-name", "none");
      await page
        .getByRole("button", { name: "Toggle radio theme", exact: true })
        .click();
      await expect(item).toHaveCSS("border-top-left-radius", "999px");
    });
  });
