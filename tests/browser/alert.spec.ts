import { writeFileSync } from "node:fs";
import { buildAlertConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Alert ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildAlertConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildAlertConsumer(custom);
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
    test("native div attributes and meaningful dynamic children retain node identity", async ({
      page,
    }) => {
      const alert = page.locator("#main");
      const node = await alert.elementHandle();
      expect(await alert.evaluate((node) => node.tagName)).toBe("DIV");
      await expect(alert).toHaveClass("kit-alert caller retained");
      await expect(alert).toHaveAttribute("data-caller", "preserved");
      await expect(alert).toHaveAttribute("data-state", "caller-owned");
      await expect(alert).toHaveAttribute("title", "Connection state");
      await expect(alert).toHaveAttribute("role", "alert");
      await expect(alert).not.toHaveAttribute("aria-live");
      await expect(alert).not.toHaveAttribute("href");
      await expect(alert).toHaveText(
        "Decorative duplicate Network request failed.",
      );
      await expect(alert.locator("#label")).toHaveCount(1);
      await expect(page.locator("#ref-proof")).toHaveText("DIV");
      await page
        .getByRole("button", { name: "Update label", exact: true })
        .click();
      await expect(alert).toHaveText(
        "Decorative duplicate Connection restored.",
      );
      expect(
        await node!.evaluate(
          (element) => element === document.getElementById("main"),
        ),
      ).toBe(true);
    });
    test("actual accessible tree preserves native alert defaults decorative exclusion and caller overrides", async ({
      page,
    }, info) => {
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      const alerts = tree.nodes.filter(
        (node) => !node.ignored && node.role?.value === "alert",
      );
      expect(alerts).toHaveLength(7);
      const named = alerts.find(
        (node) => node.name?.value === "Connection problem",
      );
      expect(named).toBeDefined();
      const properties = (node: (typeof alerts)[number]) =>
        Object.fromEntries(
          (node.properties ?? []).map((p) => [p.name, p.value.value]),
        );
      const normal = alerts.filter(
        (node) => properties(node).live === "assertive",
      );
      expect(normal).toHaveLength(5);
      for (const node of normal)
        expect(properties(node)).toMatchObject({
          live: "assertive",
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
        const node = alerts.find(
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
      // Chromium exposes an until-found alert node with no accessible children.
      expect((await nodeFor("#until-found")).childIds).toEqual([]);
      expect(
        tree.nodes.filter(
          (node) =>
            !node.ignored && node.name?.value === "Decorative duplicate",
        ),
      ).toHaveLength(0);
      expect(
        tree.nodes.some(
          (node) =>
            !node.ignored && node.name?.value === "Network request failed.",
        ),
      ).toBe(true);
      expect(
        tree.nodes.some(
          (node) =>
            !node.ignored && node.name?.value === "Native control message",
        ),
      ).toBe(true);
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
          (node) =>
            !node.ignored && node.name?.value === "Connection restored.",
        ),
      ).toBe(true);
      expect(
        updated.nodes.filter(
          (node) =>
            !node.ignored && node.name?.value === "Decorative duplicate",
        ),
      ).toHaveLength(0);
      await info.attach("native-alert-accessibility", {
        body: JSON.stringify({ initial: tree, updated }, null, 2),
        contentType: "application/json",
      });
      await session.detach();
    });
    test("caller focus and events retain native div keyboard and form behavior", async ({
      page,
    }) => {
      const alert = page.locator("#main");
      await page
        .getByRole("button", { name: "Focus alert", exact: true })
        .click();
      await expect(alert).toBeFocused();
      await expect(alert).toHaveAttribute("tabindex", "-1");
      await alert.click();
      await alert.press("Enter");
      await alert.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 0; resets 0",
      );
      expect(
        await alert.evaluate((node) =>
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
      await expect(alert).toHaveText(
        "Decorative duplicate Connection restored.",
      );
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
        .getByRole("button", { name: "Toggle alert", exact: true })
        .click();
      await expect(page.locator("#main")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle alert", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("DIV");
      await expect(page.locator("#main")).toHaveText(
        "Decorative duplicate Network request failed.",
      );
    });
    test("all source presentation declarations and radius fallback chains remain actual computed values", async ({
      page,
    }) => {
      const alert = page.locator("#main");
      const style = () =>
        alert.evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            display: c.display,
            box: c.boxSizing,
            borderWidth: c.borderTopWidth,
            borderStyle: c.borderTopStyle,
            borderColor: c.borderTopColor,
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
        display: "block",
        radius: "6px",
        padding: "12px 16px",
        font: "monospace",
        size: "20px",
        weight: "400",
        line: "normal",
        color: "rgb(17, 24, 39)",
        background: "rgb(255, 255, 255)",
        box: "border-box",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgb(209, 213, 219)",
      });
      for (const radius of ["10px", "6px", "18px", "3px", "6px"]) {
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
        "Connection problem",
      );
      await expect(page.locator("#styled")).toHaveText(
        "Connection problem Needs review",
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
      const file = info.outputPath("alert-color-combinations.json");
      writeFileSync(file, JSON.stringify(measured, null, 2));
      await info.attach("alert-color-combinations", {
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
        expect(body).toContain('class="kit-alert caller retained"');
        expect(body).toContain('aria-labelledby="named-heading"');
        expect(body).toContain('id="ref-proof">none');
        expect(body.match(/role="alert"/g)).toHaveLength(7);
        for (let other = 0; other < 8; other++)
          if (other !== index) expect(body).not.toContain(`Request-${other}`);
      }
      await expect(page.locator("#main")).toHaveText(
        "Decorative duplicate Network request failed.",
      );
    });
  });
