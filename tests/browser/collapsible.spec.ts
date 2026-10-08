import { writeFileSync } from "node:fs";
import { buildCollapsibleConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Collapsible behavior ${custom ? "custom" : "default"}`, () => {
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
    test("installed binding refs native keyboard and state completion callbacks remain intact", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await expect(page.locator("#refs")).toHaveText("DIV;BUTTON;DIV;SECTION");
      await expect(trigger).toHaveAttribute(
        "aria-controls",
        "disclosure-content",
      );
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toBeHidden();
      await trigger.click();
      await expect(content).toBeVisible();
      await expect(page.locator("#state")).toHaveText(
        "true; callbacks 1; clicks 1",
      );
      await expect(page.locator("#completed")).toHaveText("true");
      await trigger.press("Space");
      await expect(content).toBeHidden();
      await expect(page.locator("#state")).toHaveText(
        "false; callbacks 2; clicks 1",
      );
      await expect(page.locator("#completed")).toHaveText("false");
      await trigger.press("Enter");
      await expect(content).toBeVisible();
      await expect(page.locator("#state")).toHaveText(
        "true; callbacks 3; clicks 1",
      );
      await page
        .getByRole("button", { name: "Set candidate open", exact: true })
        .click();
      await expect(content).toBeHidden();
      await expect(page.locator("#state")).toHaveText(
        "false; callbacks 3; clicks 1",
      );
      await page
        .getByRole("button", { name: "Focus candidate ref", exact: true })
        .click();
      await expect(trigger).toBeFocused();
    });
    test("caller attrs classes cancellation and disabled refuse native activation without losing children", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger");
      for (const [id, kind] of [
        ["disclosure", "root"],
        ["disclosure-trigger", "trigger"],
        ["disclosure-content", "content"],
      ])
        await expect(page.locator(`#${id}`)).toHaveAttribute(
          "data-caller",
          kind!,
        );
      await expect(page.locator("#disclosure")).toHaveClass(
        "kit-collapsible caller retained",
      );
      await expect(trigger).toHaveClass(
        "kit-collapsible-trigger caller-trigger",
      );
      await expect(page.locator("#disclosure-content")).toHaveClass(
        "kit-collapsible-content caller-content",
      );
      await page
        .getByRole("button", {
          name: "Toggle candidate cancellation",
          exact: true,
        })
        .click();
      await trigger.click();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator("#state")).toHaveText(
        "false; callbacks 0; clicks 1",
      );
      await page
        .getByRole("button", { name: "Toggle candidate disabled", exact: true })
        .click();
      await expect(trigger).toBeDisabled();
      await trigger.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator("#state")).toHaveText(
        "false; callbacks 0; clicks 1",
      );
      await expect(page.locator("#delegated-trigger")).not.toBeDisabled();
    });
    test("native closed content retains the actual input and forceMount exposes its closed visual policy", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await expect(content).toHaveCount(1);
      await trigger.click();
      const input = page.getByRole("textbox", {
        name: "Disclosure state",
        exact: true,
      });
      await input.fill("retained disclosure");
      const node = await input.elementHandle();
      await trigger.click();
      await expect(content).toBeHidden();
      expect(await node!.evaluate((node) => node.isConnected)).toBe(true);
      await expect(content.locator("input")).toHaveValue("retained disclosure");
      await page
        .getByRole("button", {
          name: "Toggle candidate force mount",
          exact: true,
        })
        .click();
      await expect(content).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toHaveAttribute("data-state", "closed");
      await expect(input).toHaveValue("retained disclosure");
      await page
        .getByRole("button", {
          name: "Toggle candidate force mount",
          exact: true,
        })
        .click();
      await expect(content).toBeHidden();
    });
    test("all delegated snippet props include actual open state while raw native identities link independently", async ({
      page,
    }) => {
      await expect(page.locator("#delegated-root")).toHaveAttribute(
        "data-delegated",
        "root",
      );
      await expect(page.locator("#delegated-trigger")).toHaveAttribute(
        "aria-controls",
        "delegated-content",
      );
      await expect(page.locator("#delegated-content")).toHaveAttribute(
        "data-delegated-open",
        "true",
      );
      await page.locator("#delegated-trigger").click();
      await expect(page.locator("#delegated-content")).toHaveAttribute(
        "data-delegated-open",
        "false",
      );
      await expect(page.locator("#delegated-content")).toBeHidden();
      await expect(page.locator("#raw-trigger")).toHaveAttribute(
        "aria-controls",
        "raw-content",
      );
      await page.locator("#raw-trigger").click();
      await expect(page.locator("#raw-content")).toBeVisible();
      await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    });

    test("accordion-like independent recipes preserve native generated IDs from SSR through hydration", async ({
      page,
      request,
    }, info) => {
      const response = await request.get(
        new URL(consumer.route, hosted.baseURL).href,
      );
      expect(response.ok()).toBe(true);
      const html = await response.text();
      const before = await page.evaluate((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return [...doc.querySelectorAll("[data-auto-group]")].map((root) => ({
          group: root.getAttribute("data-auto-group"),
          root: root.id,
          trigger: root.querySelector("[data-auto-trigger]")!.id,
          content: root.querySelector("[data-auto-content]")!.id,
        }));
      }, html);
      expect(before).toHaveLength(2);
      expect(
        new Set(before.flatMap((r) => [r.root, r.trigger, r.content])).size,
      ).toBe(6);
      for (const item of before) {
        const root = page.locator(`[data-auto-group="${item.group}"]`);
        expect(item.root).not.toBe("");
        expect(item.trigger).not.toBe("");
        expect(item.content).not.toBe("");
        await expect(root).toHaveAttribute("id", item.root);
        await expect(root.locator("[data-auto-trigger]")).toHaveAttribute(
          "id",
          item.trigger,
        );
        await expect(root.locator("[data-auto-trigger]")).toHaveAttribute(
          "aria-controls",
          item.content,
        );
        await expect(root.locator("[data-auto-content]")).toHaveAttribute(
          "id",
          item.content,
        );
      }
      const first = page.locator('[data-auto-group="0"]'),
        second = page.locator('[data-auto-group="1"]');
      await expect(first.locator("[data-auto-content]")).toBeHidden();
      await expect(second.locator("[data-auto-content]")).toBeVisible();
      await first
        .getByRole("button", { name: "Recipe item 1", exact: true })
        .press("Enter");
      await expect(first.locator("[data-auto-content]")).toBeVisible();
      await expect(second.locator("[data-auto-content]")).toBeVisible();
      await second
        .getByRole("button", { name: "Recipe item 2", exact: true })
        .press("Space");
      await expect(second.locator("[data-auto-content]")).toBeHidden();
      await expect(first.locator("[data-auto-content]")).toBeVisible();
      await expect(page.locator("#state")).toHaveText(
        "false; callbacks 0; clicks 0",
      );
      await expect(page.locator("#submits")).toHaveText("0");
      const file = info.outputPath("native-collapsible-identity.json");
      writeFileSync(file, JSON.stringify({ html, before }, null, 2));
      await info.attach("native-collapsible-identity", {
        path: file,
        contentType: "application/json",
      });
    });

    test("caller motion uses native measured dimensions and presence completes exit before hiding", async ({
      page,
    }, info) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await page
        .getByRole("button", { name: "Toggle disclosure motion", exact: true })
        .click();
      await trigger.click();
      await expect(content).toBeVisible();
      await expect(page.locator("#completed")).toHaveText("true");
      const measured = await content.evaluate((node) => ({
        height: getComputedStyle(node).getPropertyValue(
          "--bits-collapsible-content-height",
        ),
        width: getComputedStyle(node).getPropertyValue(
          "--bits-collapsible-content-width",
        ),
        rect: node.getBoundingClientRect().toJSON(),
        animation: getComputedStyle(node).animationName,
      }));
      expect(parseFloat(measured.height)).toBeGreaterThan(0);
      expect(parseFloat(measured.width)).toBeGreaterThan(0);
      expect(measured.rect.height).toBeGreaterThan(0);
      const exiting = await page.evaluate(async () => {
        (
          document.querySelector("#disclosure-trigger") as HTMLButtonElement
        ).click();
        await new Promise(requestAnimationFrame);
        await new Promise(requestAnimationFrame);
        const node = document.querySelector(
          "#disclosure-content",
        ) as HTMLElement;
        const animations = node.getAnimations();
        for (const animation of animations) animation.pause();
        return {
          hidden: node.hidden,
          ending: node.hasAttribute("data-ending-style"),
          animations: animations.map(
            (animation) => (animation as CSSAnimation).animationName,
          ),
        };
      });
      expect(exiting.hidden).toBe(false);
      expect(exiting.ending).toBe(true);
      expect(exiting.animations).toHaveLength(1);
      expect(exiting.animations[0]).toMatch(/disclosure-close$/);
      await expect(content).toHaveAttribute("data-state", "closed");
      await expect(content).toBeVisible();
      await content.evaluate((node) =>
        node.getAnimations().forEach((animation) => animation.finish()),
      );
      await expect(content).toBeHidden();
      await expect(page.locator("#completed")).toHaveText("false");
      await expect(page.locator("#completions")).toHaveText("2");
      await expect(page.locator("#submits")).toHaveText("0");
      const file = info.outputPath("caller-collapsible-motion.json");
      writeFileSync(file, JSON.stringify({ measured, exiting }, null, 2));
      await info.attach("caller-collapsible-motion", {
        path: file,
        contentType: "application/json",
      });
    });

    test("rapid toggles and reduced motion settle to the latest state with retained child DOM", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await page
        .getByRole("button", { name: "Toggle disclosure motion", exact: true })
        .click();
      await trigger.click();
      await expect(page.locator("#completed")).toHaveText("true");
      await content.locator("input").fill("survives native presence");
      const node = await content.locator("input").elementHandle();
      for (let index = 0; index < 9; index++)
        await trigger.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(content).toBeHidden();
      await expect(page.locator("#completed")).toHaveText("false");
      expect(await node!.evaluate((node) => node.isConnected)).toBe(true);
      await expect(content.locator("input")).toHaveValue(
        "survives native presence",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await trigger.press("Enter");
      await expect(content).toBeVisible();
      await expect(content).toHaveCSS("animation-name", "none");
      await expect(page.locator("#completed")).toHaveText("true");
      await trigger.press("Space");
      await expect(content).toBeHidden();
      await expect(page.locator("#completed")).toHaveText("false");
      await expect(page.locator("#submits")).toHaveText("0");
    });

    test("unmount during exit clears actual refs and native scheduled completion before a fresh remount", async ({
      page,
    }) => {
      const trigger = page.locator("#disclosure-trigger"),
        content = page.locator("#disclosure-content");
      await page
        .getByRole("button", { name: "Toggle disclosure motion", exact: true })
        .click();
      await trigger.click();
      await expect(page.locator("#completed")).toHaveText("true");
      const detached = await content.elementHandle();
      await page.evaluate(() => {
        (
          document.querySelector("#disclosure-trigger") as HTMLButtonElement
        ).click();
        (
          Array.from(document.querySelectorAll("button")).find(
            (n) => n.textContent === "Toggle disclosure mount",
          ) as HTMLButtonElement
        ).click();
      });
      await expect(trigger).toHaveCount(0);
      await expect(page.locator("#refs")).toHaveText("none;none;none;SECTION");
      expect(await detached!.evaluate((node) => node.isConnected)).toBe(false);
      await page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 600)),
      );
      await expect(page.locator("#completions")).toHaveText("1");
      await expect(page.locator("#completed")).toHaveText("true");
      await page
        .getByRole("button", { name: "Toggle disclosure mount", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText("DIV;BUTTON;DIV;SECTION");
      await expect(content).toBeHidden();
      await expect(trigger).toHaveAttribute(
        "aria-controls",
        "disclosure-content",
      );
      await trigger.press("Enter");
      await expect(content).toBeVisible();
      await expect(page.locator("#completions")).toHaveText("2");
    });

    test("concurrent same-worker SSR and both initial hydration states keep each disclosure request local", async ({
      request,
      page,
    }, info) => {
      const responses = await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          const open = index % 2 === 1,
            url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("open", String(open));
          const response = await request.get(url.href);
          expect(response.ok()).toBe(true);
          const html = await response.text();
          for (const prefix of ["disclosure", "raw"]) {
            const trigger = html.match(
              new RegExp(`<button(?=[^>]*id="${prefix}-trigger")[^>]*>`),
            )?.[0];
            const content = html.match(
              new RegExp(`<div(?=[^>]*id="${prefix}-content")[^>]*>`),
            )?.[0];
            expect(trigger).toContain(`aria-expanded="${open}"`);
            expect(content).toBeTruthy();
            expect(/\bhidden(?:\s|>|=)/.test(content!)).toBe(!open);
            // The later Content registers after the preceding Trigger on this server render.
            expect(trigger).not.toContain("aria-controls");
          }
          expect(html).toContain("Details body");
          const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
          expect(new Set(ids).size).toBe(ids.length);
          return { open, html };
        }),
      );
      const file = info.outputPath("concurrent-collapsible-ssr.json");
      writeFileSync(file, JSON.stringify(responses, null, 2));
      await info.attach("concurrent-collapsible-ssr", {
        path: file,
        contentType: "application/json",
      });
      for (const open of [false, true]) {
        const url = new URL(consumer.route, hosted.baseURL);
        url.searchParams.set("open", String(open));
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await expect(page.locator("#state")).toHaveText(
          `${open}; callbacks 0; clicks 0`,
        );
        await expect(page.locator("#completions")).toHaveText("0");
        for (const prefix of ["disclosure", "raw"]) {
          await expect(page.locator(`#${prefix}-trigger`)).toHaveAttribute(
            "aria-expanded",
            String(open),
          );
          await expect(page.locator(`#${prefix}-trigger`)).toHaveAttribute(
            "aria-controls",
            `${prefix}-content`,
          );
          if (open)
            await expect(page.locator(`#${prefix}-content`)).toBeVisible();
          else await expect(page.locator(`#${prefix}-content`)).toBeHidden();
        }
        await expect(page.locator("#delegated-content")).toBeVisible();
      }
    });
  });
