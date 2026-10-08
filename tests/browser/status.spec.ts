import { writeFileSync } from "node:fs";
import { buildStatusConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Status ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildStatusConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildStatusConsumer(custom);
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
    test("native paragraph attributes and meaningful dynamic children retain node identity", async ({
      page,
    }) => {
      const status = page.locator("#main");
      const node = await status.elementHandle();
      expect(await status.evaluate((node) => node.tagName)).toBe("P");
      await expect(status).toHaveClass("kit-status caller retained");
      await expect(status).toHaveAttribute("data-caller", "preserved");
      await expect(status).toHaveAttribute("data-state", "caller-owned");
      await expect(status).toHaveAttribute("title", "Save state");
      await expect(status).toHaveAttribute("role", "status");
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(status).toHaveAttribute("aria-atomic", "true");
      await expect(status).not.toHaveAttribute("href");
      await expect(status).toHaveText("Decorative duplicate Saved changes.");
      await expect(status.locator("#label")).toHaveCount(1);
      await expect(page.locator("#ref-proof")).toHaveText("P");
      await page
        .getByRole("button", { name: "Update label", exact: true })
        .click();
      await expect(status).toHaveText("Decorative duplicate Updated message.");
      expect(
        await node!.evaluate(
          (element) => element === document.getElementById("main"),
        ),
      ).toBe(true);
    });
    test("actual accessible tree preserves native status defaults decorative exclusion and caller overrides", async ({
      page,
    }, info) => {
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      const statuss = tree.nodes.filter(
        (node) => !node.ignored && node.role?.value === "status",
      );
      expect(statuss).toHaveLength(7);
      const named = statuss.find(
        (node) => node.name?.value === "Save feedback",
      );
      expect(named).toBeDefined();
      const properties = (node: (typeof statuss)[number]) =>
        Object.fromEntries(
          (node.properties ?? []).map((p) => [p.name, p.value.value]),
        );
      const normal = statuss.filter(
        (node) => properties(node).live === "polite",
      );
      expect(normal).toHaveLength(5);
      for (const node of normal)
        expect(properties(node)).toMatchObject({
          live: "polite",
          atomic: true,
        });
      const documentNode = await session.send("DOM.getDocument");
      const nodeFor = async (selector: string) => {
        const found = await session.send("DOM.querySelector", {
          nodeId: documentNode.root.nodeId,
          selector,
        });
        const described = await session.send("DOM.describeNode", {
          nodeId: found.nodeId,
        });
        const node = statuss.find(
          (item) => item.backendDOMNodeId === described.node.backendNodeId,
        );
        expect(node).toBeDefined();
        return node!;
      };
      const override = await nodeFor("#native-overrides");
      const control = await nodeFor("#native-off-control");
      expect(properties(override)).toEqual(properties(control));
      expect(properties(override)).not.toHaveProperty("live");
      for (const id of ["native-overrides", "native-off-control"]) {
        await expect(page.locator(`#${id}`)).toHaveAttribute(
          "aria-live",
          "off",
        );
        await expect(page.locator(`#${id}`)).toHaveAttribute(
          "aria-atomic",
          "false",
        );
        await expect(page.locator(`#${id}`)).toHaveAttribute(
          "aria-relevant",
          "removals",
        );
      }
      // Chromium exposes an until-found status node with no accessible children.
      expect((await nodeFor("#until-found")).childIds).toEqual([]);
      expect(
        tree.nodes.filter(
          (node) =>
            !node.ignored && node.name?.value === "Decorative duplicate",
        ),
      ).toHaveLength(0);
      expect(
        tree.nodes.some(
          (node) => !node.ignored && node.name?.value === "Saved changes.",
        ),
      ).toBe(true);
      expect(
        tree.nodes.some(
          (node) =>
            !node.ignored && node.name?.value === "Native control message",
        ),
      ).toBe(true);
      expect(
        tree.nodes.some(
          (node) =>
            !node.ignored &&
            node.name?.value === "Decorative feedback duplicate",
        ),
      ).toBe(false);
      await expect(page.locator("#decorative")).toHaveAttribute(
        "role",
        "status",
      );
      await expect(page.locator("#decorative")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      const empty = await page.locator("#empty").elementHandle();
      const focus = await page.evaluate(() => document.activeElement?.tagName);
      await page
        .getByRole("button", { name: "Update label", exact: true })
        .click();
      await expect(page.locator("#empty")).toHaveText("Later message");
      expect(
        await empty!.evaluate(
          (node) => node === document.getElementById("empty"),
        ),
      ).toBe(true);
      await expect(
        page.getByRole("button", { name: "Update label", exact: true }),
      ).toBeFocused();
      expect(focus).toBe("BODY");
      const updated = await session.send("Accessibility.getFullAXTree");
      expect(
        updated.nodes.some(
          (node) => !node.ignored && node.name?.value === "Updated message.",
        ),
      ).toBe(true);
      expect(
        updated.nodes.filter(
          (node) =>
            !node.ignored && node.name?.value === "Decorative duplicate",
        ),
      ).toHaveLength(0);
      await info.attach("native-status-accessibility", {
        body: JSON.stringify({ initial: tree, updated }, null, 2),
        contentType: "application/json",
      });
      await session.detach();
    });
    test("caller focus and events retain native paragraph keyboard and form behavior", async ({
      page,
    }) => {
      const status = page.locator("#main");
      await page
        .getByRole("button", { name: "Focus status", exact: true })
        .click();
      await expect(status).toBeFocused();
      await expect(status).toHaveAttribute("tabindex", "-1");
      await status.click();
      await status.press("Enter");
      await status.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 0; resets 0",
      );
      expect(
        await status.evaluate((node) =>
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
      await expect(status).toHaveText("Decorative duplicate Updated message.");
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
        .getByRole("button", { name: "Toggle status", exact: true })
        .click();
      await expect(page.locator("#main")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle status", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("P");
      await expect(page.locator("#main")).toHaveText(
        "Decorative duplicate Saved changes.",
      );
    });
    test("all five source declarations and four inherited hook overrides remain computed with RTL and reduced motion", async ({
      page,
    }) => {
      const style = () =>
        page.locator("#main").evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            margin: c.margin,
            color: c.color,
            size: c.fontSize,
            weight: c.fontWeight,
            line: c.lineHeight,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      expect(await style()).toMatchObject({
        margin: "0px",
        color: "rgb(17, 24, 39)",
        size: "16px",
        weight: "400",
        line: "22.4px",
      });
      await page.locator("#theme").evaluate((node) => {
        (node as HTMLElement).style.cssText =
          "--kit-status-color:rgb(100,20,40);--kit-status-font-size:24px;--kit-status-font-weight:600;--kit-status-line-height:1.5";
      });
      expect(await style()).toMatchObject({
        margin: "0px",
        color: "rgb(100, 20, 40)",
        size: "24px",
        weight: "600",
        line: "36px",
      });
      await page
        .locator("#theme")
        .evaluate((node) => ((node as HTMLElement).style.cssText = ""));
      expect(await style()).toMatchObject({
        color: "rgb(17, 24, 39)",
        size: "16px",
        weight: "400",
        line: "22.4px",
      });
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
    test("source urgent role politeness atomic options update one retained native paragraph", async ({
      page,
    }) => {
      const status = page.locator("#main");
      const node = await status.elementHandle();
      await expect(status).toHaveAttribute("role", "status");
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(status).toHaveAttribute("aria-atomic", "true");
      await page
        .getByRole("button", { name: "Toggle source options", exact: true })
        .click();
      await expect(status).toHaveAttribute("role", "alert");
      await expect(status).toHaveAttribute("aria-live", "assertive");
      await expect(status).toHaveAttribute("aria-atomic", "false");
      await expect(page.getByRole("alert")).toHaveCount(1);
      expect(
        await node!.evaluate(
          (node) => node === document.getElementById("main"),
        ),
      ).toBe(true);
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      const actual = tree.nodes.filter(
        (node) => !node.ignored && node.role?.value === "alert",
      );
      expect(actual).toHaveLength(1);
      expect(
        Object.fromEntries(
          (actual[0]!.properties ?? []).map((p) => [p.name, p.value.value]),
        ),
      ).toMatchObject({ live: "assertive", atomic: false });
      await session.detach();
      await page
        .getByRole("button", { name: "Toggle source options", exact: true })
        .click();
      await expect(status).toHaveAttribute("role", "status");
      await expect(status).toHaveAttribute("aria-live", "polite");
      await expect(status).toHaveAttribute("aria-atomic", "true");
      await expect(page.getByRole("alert")).toHaveCount(0);
    });
    test("actual baseline live theme and caller colors retain measured readable text combinations", async ({
      page,
    }, info) => {
      const pair = async (id: string) =>
        page.locator(`#${id}`).evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            foreground: c.color,
            background:
              c.backgroundColor === "rgba(0, 0, 0, 0)"
                ? getComputedStyle(document.getElementById("theme")!)
                    .backgroundColor
                : c.backgroundColor,
          };
        });
      const baseline = await pair("main");
      expect(baseline).toEqual({
        foreground: "rgb(17, 24, 39)",
        background: "rgb(255, 255, 255)",
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
      await expect(page.locator("#styled")).toHaveAccessibleName(
        "Save feedback",
      );
      await expect(page.locator("#styled")).toHaveText(
        "Save feedback Needs review",
      );
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
      const file = info.outputPath("status-color-combinations.json");
      writeFileSync(file, JSON.stringify(measured, null, 2));
      await info.attach("status-color-combinations", {
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
        expect(body).toContain('class="kit-status caller retained"');
        expect(body).toContain('aria-labelledby="named-heading"');
        expect(body).toContain('id="ref-proof">none');
        expect(body.match(/role="status"/g)).toHaveLength(8);
        expect(body).toContain('aria-live="polite"');
        expect(body).toContain('aria-atomic="true"');
        for (let other = 0; other < 8; other++)
          if (other !== index) expect(body).not.toContain(`Request-${other}`);
      }
      await expect(page.locator("#main")).toHaveText(
        "Decorative duplicate Saved changes.",
      );
    });
  });
