import { writeFileSync } from "node:fs";
import { buildSeparatorConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Separator ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildSeparatorConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildSeparatorConsumer(custom);
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

    test("native semantic orientation names description and decorative concealment match actual accessible tree", async ({
      page,
    }, info) => {
      const main = page.locator("#main");
      expect(
        await main.evaluate((node) => ({
          tag: node.tagName,
          text: node.textContent,
          children: node.children.length,
        })),
      ).toEqual({ tag: "DIV", text: "", children: 0 });
      await expect(main).toHaveAttribute("role", "separator");
      await expect(main).toHaveAttribute("aria-orientation", "horizontal");
      await expect(main).toHaveAttribute("data-orientation", "horizontal");
      await expect(main).toHaveAccessibleName("Section boundary");
      await expect(main).toHaveAccessibleDescription(
        "Application section boundary description",
      );
      await expect(page.locator("#decorative")).toHaveAttribute("role", "none");
      await expect(page.locator("#decorative")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(page.locator("#decorative")).not.toHaveAttribute(
        "aria-orientation",
      );
      await expect(page.locator("#decorative")).toHaveAttribute(
        "data-orientation",
        "vertical",
      );
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      const one = (name: string) => {
        const nodes = tree.nodes.filter(
          (n) =>
            !n.ignored &&
            n.role?.value === "separator" &&
            n.name?.value === name,
        );
        expect(nodes).toHaveLength(1);
        return Object.fromEntries(
          (nodes[0]!.properties ?? [])
            .filter((p) => p.name === "orientation")
            .map((p) => [p.name, p.value.value]),
        );
      };
      expect(one("Section boundary")).toEqual(one("Native boundary"));
      expect(one("Section boundary")).toEqual({ orientation: "horizontal" });
      expect(one("Caller boundary")).toEqual({ orientation: "vertical" });
      expect(
        tree.nodes.some(
          (n) =>
            !n.ignored &&
            ["Decorative duplicate", "Caller concealed boundary"].includes(
              String(n.name?.value),
            ),
        ),
      ).toBe(false);
      const file = info.outputPath("separator-accessible-tree.json");
      writeFileSync(file, JSON.stringify(tree, null, 2));
      await info.attach("separator-accessible-tree", {
        path: file,
        contentType: "application/json",
      });
      await session.detach();
    });
    test("live orientation and decorative changes synchronize semantic attrs and geometry on one node", async ({
      page,
    }) => {
      const main = page.locator("#main");
      const node = await main.elementHandle();
      const geometry = () =>
        main.evaluate((node) => ({
          width: node.getBoundingClientRect().width,
          height: node.getBoundingClientRect().height,
        }));
      expect(await geometry()).toEqual({ width: 320, height: 1 });
      await page
        .getByRole("button", { name: "Toggle orientation", exact: true })
        .click();
      await expect(main).toHaveAttribute("aria-orientation", "vertical");
      await expect(main).toHaveAttribute("data-orientation", "vertical");
      expect(await geometry()).toEqual({ width: 1, height: 80 });
      await page
        .getByRole("button", { name: "Toggle decoration", exact: true })
        .click();
      await expect(main).toHaveAttribute("role", "none");
      await expect(main).toHaveAttribute("aria-hidden", "true");
      await expect(main).not.toHaveAttribute("aria-orientation");
      await expect(
        page.getByRole("separator", { name: "Section boundary", exact: true }),
      ).toHaveCount(0);
      expect(await geometry()).toEqual({ width: 1, height: 80 });
      expect(
        await node!.evaluate(
          (node) => node === document.getElementById("main"),
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Toggle orientation", exact: true })
        .click();
      await expect(main).toHaveAttribute("data-orientation", "horizontal");
      expect(await geometry()).toEqual({ width: 320, height: 1 });
      await page
        .getByRole("button", { name: "Toggle decoration", exact: true })
        .click();
      await expect(main).toHaveAttribute("role", "separator");
      await expect(main).not.toHaveAttribute("aria-hidden");
      await expect(main).toHaveAttribute("aria-orientation", "horizontal");
      await expect(main).toHaveAccessibleName("Section boundary");
      await expect(page.locator("#ref-proof")).toHaveText("DIV");
    });
    test("caller class attributes focus pointer keyboard and form defaults stay native", async ({
      page,
    }) => {
      const main = page.locator("#main");
      await expect(main).toHaveClass("kit-separator caller retained");
      await expect(main).toHaveAttribute("title", "Source boundary");
      await expect(main).toHaveAttribute("data-caller", "preserved");
      await expect(main).toHaveAttribute("data-state", "caller-owned");
      await expect(main).not.toHaveAttribute("aria-live");
      await expect(main).not.toHaveAttribute("aria-valuenow");
      await page
        .getByRole("button", { name: "Focus separator", exact: true })
        .click();
      await expect(main).toBeFocused();
      await main.click();
      await main.press("Enter");
      await main.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 0; resets 0",
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
        "Clicks 1; keys 2; submits 1; resets 1",
      );
      await expect(main).toHaveAttribute("aria-orientation", "horizontal");
    });
    test("native hiding until found and conditional teardown preserve actual div bindings", async ({
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
        .getByRole("button", { name: "Toggle separator", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle separator", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("DIV");
      await expect(page.locator("#main")).toHaveAccessibleName(
        "Section boundary",
      );
    });
    test("all six source declarations live border geometry themes caller overrides and RTL motion retain exact values", async ({
      page,
    }, info) => {
      const style = (id: string) =>
        page.locator(id).evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            flex: c.flex,
            width: c.width,
            height: c.height,
            background: c.backgroundColor,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      const baseline = await style("#main");
      expect(baseline).toMatchObject({
        flex: "0 0 auto",
        width: "320px",
        height: "1px",
        background: "rgb(209, 213, 219)",
      });
      const caller = await style("#styled");
      expect(caller).toMatchObject({
        width: "3px",
        height: "48px",
        background: "rgb(80, 90, 100)",
      });
      await page
        .getByRole("button", { name: "Toggle orientation", exact: true })
        .click();
      expect(await style("#main")).toMatchObject({
        width: "1px",
        height: "80px",
      });
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      const night = await style("#main");
      expect(night).toMatchObject({
        width: "3px",
        height: "80px",
        background: "rgb(140, 150, 170)",
      });
      expect(await style("#styled")).toEqual(caller);
      await page
        .getByRole("button", { name: "Toggle orientation", exact: true })
        .click();
      expect(await style("#main")).toMatchObject({
        width: "320px",
        height: "3px",
      });
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
          bar: baseline.background,
          surface: "rgb(255, 255, 255)",
        },
        {
          name: "application-night",
          bar: night.background,
          surface: "rgb(25, 30, 40)",
        },
        { name: "caller", bar: caller.background, surface: "rgb(25, 30, 40)" },
      ].map((pair) => {
        const a = luminance(pair.bar),
          b = luminance(pair.surface);
        return {
          ...pair,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        };
      });
      expect(pairs[0]!.ratio).toBeLessThan(3);
      expect(pairs[1]!.ratio).toBeGreaterThanOrEqual(3);
      const file = info.outputPath("source-separator-contrast-concerns.json");
      writeFileSync(file, JSON.stringify(pairs, null, 2));
      await info.attach("source-separator-contrast-concerns", {
        path: file,
        contentType: "application/json",
      });
      const png = info.outputPath("actual-separator-theme.png");
      await page.locator("#theme").screenshot({ path: png });
      await info.attach("actual-separator-theme", {
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
        height: "1px",
        background: "rgb(209, 213, 219)",
      });
    });
    test("eight concurrent production SSR responses isolate names roles orientation refs and decoration", async ({
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
        expect(body).toContain(
          'id="counts">Clicks 0; keys 0; submits 0; resets 0',
        );
        expect(body.match(/role="separator"/g)).toHaveLength(5);
        expect(body.match(/role="none"/g)).toHaveLength(1);
        const main = body.match(/<div[^>]*id="main"[^>]*>/)![0];
        expect(main).toContain('aria-orientation="horizontal"');
        expect(main).toContain('data-orientation="horizontal"');
        const decorative = body.match(/<div[^>]*id="decorative"[^>]*>/)![0];
        expect(decorative).toContain('aria-hidden="true"');
        expect(decorative).not.toContain("aria-orientation=");
        for (let other = 0; other < 8; other++)
          if (other !== i) expect(body).not.toContain("Request-" + other);
      }
      await expect(page.locator("#main")).toHaveAccessibleName(
        "Section boundary",
      );
    });
  });
