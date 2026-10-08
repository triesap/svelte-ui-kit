import { writeFileSync } from "node:fs";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Menu styles ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildMenuConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildMenuConsumer(custom);
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
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("actual installed inner design leaves primitive outer geometry intact", async ({
      page,
    }) => {
      await page.locator("#generated-trigger").click();
      const content = page.locator("#generated-content");
      await expect(content).toBeVisible();
      const actual = await content.evaluate((node) => {
        const inner = getComputedStyle(node),
          outer = node.parentElement!;
        return {
          position: inner.position,
          display: inner.display,
          width: inner.minInlineSize,
          z: inner.zIndex,
          outer: outer.hasAttribute("data-bits-floating-content-wrapper"),
          outerPosition: getComputedStyle(outer).position,
          outerTransform: outer.style.transform,
          outerClass: outer.className,
        };
      });
      expect(actual).toEqual({
        position: "static",
        display: "grid",
        width: "192px",
        z: "50",
        outer: true,
        outerPosition: "absolute",
        outerTransform: expect.stringMatching(/translate/),
        outerClass: "",
      });
      const indicator = page.locator("#generated-indicator");
      await expect(indicator).toBeVisible();
      expect(
        await indicator.evaluate((node) => getComputedStyle(node).inlineSize),
      ).toBe("16px");
      await page.locator("#generated-radio").focus();
      await expect(page.locator("#generated-radio")).toHaveAttribute(
        "data-highlighted",
        "",
      );
    });
    test("component role default radius chain and live token overrides resolve on installed DOM", async ({
      page,
    }) => {
      await page.locator("#generated-trigger").click();
      const content = page.locator("#generated-content");
      const radius = () =>
        content.evaluate((node) => getComputedStyle(node).borderTopLeftRadius);
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--kit-radius-default",
          "11px",
        ),
      );
      await expect.poll(radius).toBe("11px");
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--kit-radius-overlay",
          "13px",
        ),
      );
      await expect.poll(radius).toBe("13px");
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--kit-menu-content-radius",
          "17px",
        ),
      );
      await expect.poll(radius).toBe("17px");
      await page.evaluate(() =>
        document.documentElement.style.setProperty(
          "--kit-menu-content-background",
          "rgb(21, 34, 55)",
        ),
      );
      expect(
        await content.evaluate(
          (node) => getComputedStyle(node).backgroundColor,
        ),
      ).toBe("rgb(21, 34, 55)");
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(
        await content.evaluate(
          (node) => getComputedStyle(node).transitionDuration,
        ),
      ).toBe("0s");
    });
  });
