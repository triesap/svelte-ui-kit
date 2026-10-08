import { writeFileSync } from "node:fs";
import { buildSkeletonConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Skeleton ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildSkeletonConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildSkeletonConsumer(custom);
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

    test("empty concealed spans add no readable or live region content alongside owning region state", async ({
      page,
    }, info) => {
      const main = page.locator("#main");
      expect(
        await main.evaluate((node) => ({
          tag: node.tagName,
          text: node.textContent,
          children: node.children.length,
          tabindex: node.getAttribute("tabindex"),
        })),
      ).toEqual({ tag: "SPAN", text: "", children: 0, tabindex: null });
      await expect(main).toHaveAttribute("aria-hidden", "true");
      await expect(main).not.toHaveAttribute("role");
      await expect(main).not.toHaveAttribute("aria-live");
      await expect(
        page.getByRole("region", { name: "Profile", exact: true }),
      ).toHaveAttribute("aria-busy", "true");
      await expect(page.getByRole("status")).toHaveCount(1);
      await expect(page.getByRole("status")).toHaveText("Loading profile");
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      expect(
        tree.nodes.filter(
          (n) =>
            !n.ignored &&
            n.role?.value === "StaticText" &&
            n.name?.value === "Loading profile",
        ),
      ).toHaveLength(1);
      expect(
        tree.nodes.some(
          (n) =>
            !n.ignored &&
            [
              "Concealed duplicate",
              "Concealed native duplicate",
              "Decorative placeholder",
            ].includes(String(n.name?.value)),
        ),
      ).toBe(false);
      const file = info.outputPath("skeleton-accessible-tree.json");
      writeFileSync(file, JSON.stringify(tree, null, 2));
      await info.attach("skeleton-accessible-tree", {
        path: file,
        contentType: "application/json",
      });
      await session.detach();
    });
    test("application loading changes own busy text and content while span refs clear and remount", async ({
      page,
    }) => {
      const old = await page.locator("#main").elementHandle();
      await page
        .getByRole("button", { name: "Toggle loading", exact: true })
        .click();
      await expect(page.locator("#region")).toHaveAttribute(
        "aria-busy",
        "false",
      );
      await expect(page.locator("#loading-status")).toHaveText("Profile ready");
      await expect(page.locator("#content")).toHaveText(
        "Loaded profile content",
      );
      await expect(page.locator("#main")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await expect(
        page.getByRole("button", { name: "Toggle loading", exact: true }),
      ).toBeFocused();
      await expect(page.getByRole("status")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Toggle loading", exact: true })
        .click();
      await expect(page.locator("#region")).toHaveAttribute(
        "aria-busy",
        "true",
      );
      await expect(page.locator("#ref-proof")).toHaveText("SPAN");
      await expect(page.locator("#loading-status")).toHaveText(
        "Loading profile",
      );
      await expect(page.locator("#main")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
    });
    test("caller attrs styles pointer callback and native form defaults never create focusable loading controls", async ({
      page,
    }) => {
      const main = page.locator("#main");
      await expect(main).toHaveClass("kit-skeleton caller retained");
      await expect(main).toHaveAttribute("title", "Decorative placeholder");
      await expect(main).toHaveAttribute("data-caller", "preserved");
      await expect(main).toHaveAttribute("data-state", "caller-owned");
      await expect(main).toHaveAttribute("aria-label", "Loading profile");
      await page
        .getByRole("button", { name: "Attempt native focus", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Attempt native focus", exact: true }),
      ).toBeFocused();
      await expect(main).not.toBeFocused();
      await main.click();
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; submits 0; resets 0",
      );
      expect(
        await main.evaluate((node) =>
          Array.from(new FormData(node.closest("form")!).entries()),
        ),
      ).toEqual([["native-field", "preserved"]]);
      await page
        .getByRole("button", { name: "Submit native form", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset native form", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; submits 1; resets 1",
      );
      await expect(page.locator("#region")).toHaveAttribute(
        "aria-busy",
        "true",
      );
    });
    test("native hiding until found and conditional teardown preserve bindings", async ({
      page,
    }) => {
      const old = await page.locator("#main").elementHandle();
      await expect(page.locator("#until-found")).toHaveAttribute(
        "hidden",
        "until-found",
      );
      expect(
        await page
          .locator("#until-found")
          .evaluate((node) => getComputedStyle(node).contentVisibility),
      ).toBe("hidden");
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toBeHidden();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toBeVisible();
      await page
        .getByRole("button", { name: "Toggle skeleton", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle skeleton", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("SPAN");
    });
    test("all four source declarations minimum dimensions radius grammar live surfaces and reduced motion remain computed", async ({
      page,
    }, info) => {
      const style = (id: string) =>
        page.locator(id).evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            display: c.display,
            width: c.width,
            height: c.height,
            min: c.minBlockSize,
            radius: c.borderRadius,
            background: c.backgroundColor,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      const baseline = await style("#main");
      expect(baseline).toMatchObject({
        display: "block",
        width: "320px",
        height: "16px",
        min: "16px",
        radius: "4px",
        background: "rgb(243, 244, 246)",
      });
      expect(await style("#small")).toMatchObject({
        height: "16px",
        min: "16px",
      });
      const caller = await style("#styled");
      expect(caller).toMatchObject({
        width: "80px",
        height: "24px",
        radius: "50%",
        background: "rgb(140, 150, 170)",
      });
      for (const radius of ["8px", "6px", "12px", "3px", "50% / 25%", "4px"]) {
        await page
          .getByRole("button", { name: "Next radius", exact: true })
          .click();
        expect((await style("#main")).radius).toBe(radius);
        expect((await style("#styled")).radius).toBe("50%");
      }
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      const night = await style("#main");
      expect(night).toMatchObject({
        background: "rgb(50, 60, 75)",
        height: "16px",
        radius: "4px",
      });
      expect(await style("#styled")).toEqual(caller);
      const luminance = (rgb: string) => {
        const c = rgb
          .match(/\d+/g)!
          .map(Number)
          .slice(0, 3)
          .map((c) => {
            const x = c / 255;
            return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          });
        return c[0]! * 0.2126 + c[1]! * 0.7152 + c[2]! * 0.0722;
      };
      const pairs = [
        {
          name: "source-baseline",
          placeholder: baseline.background,
          surface: "rgb(255, 255, 255)",
        },
        {
          name: "application-night",
          placeholder: night.background,
          surface: "rgb(25, 30, 40)",
        },
        {
          name: "caller",
          placeholder: caller.background,
          surface: "rgb(25, 30, 40)",
        },
      ].map((pair) => {
        const a = luminance(pair.placeholder),
          b = luminance(pair.surface);
        return {
          ...pair,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      expect(pairs[0]!.ratio).toBeLessThan(3);
      expect(pairs[1]!.ratio).toBeLessThan(3);
      expect(pairs[2]!.ratio).toBeGreaterThanOrEqual(3);
      const file = info.outputPath("decorative-skeleton-surface-contrast.json");
      writeFileSync(file, JSON.stringify(pairs, null, 2));
      await info.attach("decorative-skeleton-surface-contrast", {
        path: file,
        contentType: "application/json",
      });
      const png = info.outputPath("actual-skeleton-theme.png");
      await page.locator("#theme").screenshot({ path: png });
      await info.attach("actual-skeleton-theme", {
        path: png,
        contentType: "image/png",
      });
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await style("#main")).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      expect(await style("#main")).toMatchObject({
        background: "rgb(243, 244, 246)",
      });
    });
    test("eight concurrent production SSR responses keep owning region names loading state and hidden empty spans isolated", async ({
      request,
      page,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, async (_, i) => {
          const response = await request.get(
            new URL(consumer.route + "?label=Request-" + i, hosted.baseURL)
              .href,
          );
          expect(response.status()).toBe(200);
          return { i, body: await response.text() };
        }),
      );
      for (const { i, body } of responses) {
        expect(body).toContain('aria-label="Request-' + i + '"');
        expect(body).toContain('id="ref-proof">none');
        expect(body).toContain('id="counts">Clicks 0; submits 0; resets 0');
        expect(body.match(/role="status"/g)).toHaveLength(1);
        expect(body).toContain('aria-busy="true"');
        for (const id of ["main", "styled", "small", "until-found"]) {
          const tag = body.match(
            new RegExp('<span[^>]*id="' + id + '"[^>]*>'),
          )![0];
          expect(tag).toContain('aria-hidden="true"');
          expect(tag).not.toMatch(/role=|aria-live=|tabindex=/);
          expect(body).toContain(tag + "</span>");
        }
        for (let other = 0; other < 8; other++)
          if (other !== i) expect(body).not.toContain("Request-" + other);
      }
      await expect(
        page.getByRole("region", { name: "Profile", exact: true }),
      ).toHaveAttribute("aria-busy", "true");
      await expect(page.locator("#ref-proof")).toHaveText("SPAN");
    });
  });
