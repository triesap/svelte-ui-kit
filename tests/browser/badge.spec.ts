import { writeFileSync } from "node:fs";
import { buildBadgeConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Badge ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildBadgeConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildBadgeConsumer(custom);
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
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("native span attributes and meaningful dynamic children retain node identity", async ({
      page,
    }) => {
      const badge = page.locator("#main");
      const node = await badge.elementHandle();
      expect(await badge.evaluate((node) => node.tagName)).toBe("SPAN");
      await expect(badge).toHaveClass("kit-badge caller retained");
      await expect(badge).toHaveAttribute("data-caller", "preserved");
      await expect(badge).toHaveAttribute("data-state", "caller-owned");
      await expect(badge).toHaveAttribute("title", "Queue state");
      await expect(badge).not.toHaveAttribute("role");
      await expect(badge).not.toHaveAttribute("aria-live");
      await expect(badge).not.toHaveAttribute("href");
      await expect(badge).toHaveText("Queued");
      await expect(badge.locator("#label")).toHaveCount(1);
      await expect(page.locator("#ref-proof")).toHaveText("SPAN");
      await page
        .getByRole("button", { name: "Update label", exact: true })
        .click();
      await expect(badge).toHaveText("Ready");
      expect(
        await node!.evaluate(
          (element) => element === document.getElementById("main"),
        ),
      ).toBe(true);
    });
    test("caller focus and events retain native span keyboard and form behavior", async ({
      page,
    }) => {
      const badge = page.locator("#main");
      await page
        .getByRole("button", { name: "Focus badge", exact: true })
        .click();
      await expect(badge).toBeFocused();
      await expect(badge).toHaveAttribute("tabindex", "-1");
      await badge.click();
      await badge.press("Enter");
      await badge.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 0; resets 0",
      );
      expect(
        await badge.evaluate((node) =>
          Array.from(new FormData(node.closest("form")!).entries()),
        ),
      ).toEqual([["native-field", "preserved"]]);
      await page
        .getByRole("button", { name: "Update label", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit native form", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset native form", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 1; resets 1",
      );
      await expect(badge).toHaveText("Ready");
    });
    test("native hiding and conditional teardown preserve binding cleanup", async ({
      page,
    }) => {
      await expect(page.locator("#until-found")).toHaveAttribute(
        "hidden",
        "until-found",
      );
      expect(
        await page
          .locator("#until-found")
          .evaluate((node) => getComputedStyle(node).contentVisibility),
      ).toBe("hidden");
      const old = await page.locator("#main").elementHandle();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toHaveAttribute("hidden");
      await expect(page.locator("#main")).toBeHidden();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toBeVisible();
      await page
        .getByRole("button", { name: "Toggle badge", exact: true })
        .click();
      await expect(page.locator("#main")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle badge", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("SPAN");
      await expect(page.locator("#main")).toHaveText("Queued");
    });
    test("all source presentation declarations and radius fallback chains remain actual computed values", async ({
      page,
    }) => {
      const badge = page.locator("#main");
      const style = () =>
        badge.evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            display: c.display,
            align: c.alignItems,
            radius: c.borderRadius,
            padding: c.padding,
            font: c.fontFamily,
            size: c.fontSize,
            weight: c.fontWeight,
            line: c.lineHeight,
            color: c.color,
            background: c.backgroundColor,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      expect(await style()).toMatchObject({
        display: "inline-flex",
        align: "center",
        radius: "999px",
        padding: "2px 8px",
        font: "monospace",
        size: "12px",
        weight: "600",
        line: "12px",
        color: "rgb(17, 24, 39)",
        background: "rgb(243, 244, 246)",
      });
      for (const radius of ["10px", "6px", "18px", "3px", "999px"]) {
        await page
          .getByRole("button", { name: "Next radius", exact: true })
          .click();
        expect((await style()).radius).toBe(radius);
      }
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await style()).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
      expect(
        await page
          .locator("#styled")
          .evaluate((node) => getComputedStyle(node).borderRadius),
      ).toBe("2px");
    });
    test("actual baseline live theme and caller colors retain measured readable text combinations", async ({
      page,
    }, info) => {
      const pair = async (id: string) =>
        page.locator(`#${id}`).evaluate((node) => {
          const c = getComputedStyle(node);
          return { foreground: c.color, background: c.backgroundColor };
        });
      const baseline = await pair("main");
      expect(baseline).toEqual({
        foreground: "rgb(17, 24, 39)",
        background: "rgb(243, 244, 246)",
      });
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      const night = await pair("main");
      expect(night).toEqual({
        foreground: "rgb(240, 245, 250)",
        background: "rgb(35, 40, 50)",
      });
      const caller = await pair("styled");
      expect(caller).toEqual({
        foreground: "rgb(120, 20, 40)",
        background: "rgb(250, 240, 230)",
      });
      await expect(page.locator("#styled")).toHaveAttribute(
        "aria-label",
        "Caller status",
      );
      await expect(page.locator("#styled")).toHaveText("Needs review");
      const luminance = (rgb: string) => {
        const channels = rgb
          .match(/\d+/g)!
          .map(Number)
          .slice(0, 3)
          .map((c) => {
            const s = c / 255;
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
          });
        return (
          channels[0]! * 0.2126 + channels[1]! * 0.7152 + channels[2]! * 0.0722
        );
      };
      const measured = Object.entries({ baseline, night, caller }).map(
        ([name, colors]) => {
          const a = luminance(colors.foreground),
            b = luminance(colors.background);
          const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
          expect(ratio).toBeGreaterThanOrEqual(4.5);
          return { name, ...colors, ratio };
        },
      );
      const file = info.outputPath("badge-color-combinations.json");
      writeFileSync(file, JSON.stringify(measured, null, 2));
      await info.attach("badge-color-combinations", {
        path: file,
        contentType: "application/json",
      });
    });
    test("concurrent production SSR keeps application labels and native naming request-local", async ({
      request,
      page,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const response = await request.get(
            new URL(`${consumer.route}?label=Request-${index}`, hosted.baseURL)
              .href,
          );
          expect(response.status()).toBe(200);
          return { index, body: await response.text() };
        }),
      );
      for (const { index, body } of responses) {
        expect(body).toContain(`id="label">Request-${index}`);
        expect(body).toContain(
          'id="counts">Clicks 0; keys 0; submits 0; resets 0',
        );
        expect(body).toContain('class="kit-badge caller retained"');
        expect(body).toContain('aria-label="Caller status"');
        for (let other = 0; other < 8; other++)
          if (other !== index) expect(body).not.toContain(`Request-${other}`);
      }
      await expect(page.locator("#main")).toHaveText("Queued");
    });
  });
