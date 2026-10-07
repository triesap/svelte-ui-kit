import { writeFileSync } from "node:fs";
import { buildSpinnerConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true]) {
  test.describe(`generated Spinner ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildSpinnerConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildSpinnerConsumer(custom);
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
      const artifact = info.outputPath("generated-consumer.json");
      writeFileSync(artifact, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: artifact,
        contentType: "application/json",
      });
      await page.goto(new URL("qualification/spinner", hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("default geometry resists broad radius overrides and inherits theme", async ({
      page,
    }) => {
      const read = () =>
        page.locator("#default .kit-spinner-mark").evaluate((node) => {
          const css = getComputedStyle(node);
          return {
            width: css.width,
            height: css.height,
            radius: css.borderTopLeftRadius,
            duration: css.animationDuration,
            color: css.borderBlockStartColor,
            animation: css.animationName,
          };
        });
      const before = await read();
      expect(before).toMatchObject({
        width: "16px",
        height: "16px",
        radius: "999px",
        duration: "0.9s",
        animation: "kit-spinner-rotate",
      });
      expect(before.color).toBe(
        await page
          .locator("section")
          .evaluate((node) => getComputedStyle(node).color),
      );
      await page.getByRole("button", { name: "Toggle theme" }).click();
      const after = await read();
      expect(after.color).not.toBe(before.color);
      expect(after.color).toBe(
        await page
          .locator("section")
          .evaluate((node) => getComputedStyle(node).color),
      );
      await expect(page.locator("#default")).toHaveClass(
        "kit-spinner caller retained",
      );
      await expect(page.locator("#default")).toHaveAttribute(
        "data-caller",
        "preserved",
      );
    });
    test("exact shape and all native CSS hooks are honored", async ({
      page,
    }) => {
      const css = await page
        .locator("#override .kit-spinner-mark")
        .evaluate((node) => {
          const style = getComputedStyle(node);
          return {
            width: style.width,
            height: style.height,
            radius: style.borderTopLeftRadius,
            border: style.borderLeftWidth,
            track: style.borderLeftColor,
            color: style.borderBlockStartColor,
            duration: style.animationDuration,
          };
        });
      expect(css).toEqual({
        width: "32px",
        height: "24px",
        radius: "8px 12px",
        border: "3px",
        track: "rgb(1, 2, 3)",
        color: "rgb(4, 5, 6)",
        duration: "1.5s",
      });
    });
    test("status labels and decoration remain distinct through hydration and changes", async ({
      page,
    }) => {
      await expect(page.getByRole("status")).toHaveCount(4);
      await expect(page.locator("#default .kit-spinner-label")).toHaveText(
        "Loading",
      );
      await expect(page.locator("#named .kit-spinner-label")).toHaveText(
        "Saving",
      );
      await expect(page.locator("#decorative")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(page.locator("#decorative .kit-spinner-label")).toHaveCount(
        0,
      );
      await page.getByRole("button", { name: "Change label" }).click();
      await expect(page.locator("#dynamic .kit-spinner-label")).toHaveText(
        "Complete",
      );
      await page.getByRole("button", { name: "Toggle decoration" }).click();
      await expect(page.getByRole("status")).toHaveCount(3);
      await expect(page.locator("#dynamic")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(page.locator("#dynamic .kit-spinner-label")).toHaveCount(0);
      await page.getByRole("button", { name: "Toggle decoration" }).click();
      await expect(page.locator("#dynamic .kit-spinner-label")).toHaveCount(1);
      await expect(page.locator("#dynamic .kit-spinner-label")).toHaveText(
        "Complete",
      );
    });
    test("reduced motion stops rotation and retains a visible meaningful status", async ({
      page,
    }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(page.locator("#default .kit-spinner-mark")).toBeVisible();
      await expect(page.locator("#default .kit-spinner-mark")).toHaveCSS(
        "animation-name",
        "none",
      );
      await expect(page.locator("#default")).toHaveAttribute("role", "status");
      await expect(page.locator("#default .kit-spinner-label")).toHaveText(
        "Loading",
      );
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await expect(page.locator("#default .kit-spinner-mark")).toHaveCSS(
        "animation-name",
        "kit-spinner-rotate",
      );
    });
  });
}
