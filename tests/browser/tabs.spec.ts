import { writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { buildTabsConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
const control = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const selected = async (page: Page, value: string) => {
  for (const item of ["a", "b", "c"])
    await expect(page.locator(`#tab-${item}`)).toHaveAttribute(
      "aria-selected",
      String(value === item),
    );
  await expect(page.locator("#value")).toHaveText(
    new RegExp(`^${value}; callbacks \\d+$`),
  );
};
for (const custom of [false, true])
  test.describe(`installed Tabs behavior ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildTabsConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildTabsConsumer(custom);
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
      const file = info.outputPath("installed-tabs.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-tabs", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("automatic horizontal arrows Home End skip disabled triggers and respect clamp and wrap", async ({
      page,
    }) => {
      const a = page.locator("#tab-a"),
        b = page.locator("#tab-b"),
        c = page.locator("#tab-c");
      await expect(a).toHaveAttribute("tabindex", "0");
      await expect(b).toHaveAttribute("tabindex", "-1");
      await a.press("ArrowRight");
      await expect(b).toBeFocused();
      await selected(page, "b");
      await b.press("ArrowRight");
      await expect(c).toBeFocused();
      await selected(page, "c");
      await c.press("ArrowRight");
      await expect(c).toBeFocused();
      await selected(page, "c");
      await control(page, "Toggle tabs loop").click();
      await c.press("ArrowRight");
      await expect(a).toBeFocused();
      await selected(page, "a");
      await a.press("End");
      await selected(page, "c");
      await c.press("Home");
      await selected(page, "a");
      await expect(page.locator("#tab-disabled")).toHaveAttribute(
        "aria-selected",
        "false",
      );
      await expect(page.locator("#submits")).toHaveText("0");
    });
    test("manual focus activation and RTL vertical options preserve native keyboard policy", async ({
      page,
    }) => {
      const a = page.locator("#tab-a"),
        b = page.locator("#tab-b"),
        c = page.locator("#tab-c");
      await control(page, "Toggle candidate manual").click();
      await a.press("ArrowRight");
      await expect(b).toBeFocused();
      await selected(page, "a");
      await b.press("Enter");
      await selected(page, "b");
      await b.press("ArrowRight");
      await expect(c).toBeFocused();
      await selected(page, "b");
      await c.press("Space");
      await selected(page, "c");
      await control(page, "Toggle candidate manual").click();
      await control(page, "Toggle tabs direction").click();
      await c.press("ArrowRight");
      await expect(b).toBeFocused();
      await selected(page, "b");
      await control(page, "Toggle candidate vertical").click();
      await expect(page.locator("#tabs-list")).toHaveAttribute(
        "aria-orientation",
        "vertical",
      );
      await b.press("ArrowUp");
      await selected(page, "a");
      await a.press("ArrowDown");
      await selected(page, "b");
      await control(page, "Focus bound tab A").click();
      await expect(a).toBeFocused();
      await selected(page, "a");
    });
    test("actual refs classes callbacks cancellation and group disabled match pinned ordering", async ({
      page,
    }) => {
      await expect(page.locator("#refs")).toHaveText("DIV;DIV;SECTION");
      await expect(page.locator("#part-refs")).toHaveText(
        "BUTTON;DIV;BUTTON;SECTION",
      );
      await expect(
        page.getByRole("tablist", { name: "Candidate settings", exact: true }),
      ).toHaveAttribute("id", "tabs-list");
      await expect(page.locator("#tabs-root")).toHaveClass(
        "kit-tabs caller retained",
      );
      await expect(page.locator("#tab-a")).toHaveClass(
        "kit-tabs-trigger caller-trigger retained",
      );
      await control(page, "Toggle candidate manual").click();
      await page.locator("#tab-b").click();
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await control(page, "Toggle tab cancellation").click();
      await page.locator("#tab-a").click();
      await selected(page, "b");
      await expect(page.locator("#clicks")).toHaveText("1");
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await control(page, "Toggle candidate disabled").click();
      for (const id of ["a", "b", "c"])
        await expect(page.locator(`#tab-${id}`)).toBeDisabled();
      await page
        .locator("#tab-a")
        .evaluate((node) => (node as HTMLButtonElement).click());
      await selected(page, "b");
      await expect(page.locator("#clicks")).toHaveText("1");
      await expect(page.locator("#delegated-tab-a")).not.toBeDisabled();
      await control(page, "Toggle candidate disabled").click();
      await control(page, "Set candidate tab B").click();
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
    });
    test("native hidden panels retain actual input node and state without submitting the surrounding form", async ({
      page,
    }) => {
      const input = page.getByRole("textbox", {
        name: "Panel A state",
        exact: true,
      });
      await input.fill("installed retained state");
      const handle = await input.elementHandle();
      await page.locator("#tab-b").click();
      await expect(page.locator("#panel-a")).toHaveCount(1);
      await expect(page.locator("#panel-a")).toHaveAttribute("hidden", "");
      expect(await handle!.evaluate((node) => node.isConnected)).toBe(true);
      await expect(page.locator("#panel-a input")).toHaveValue(
        "installed retained state",
      );
      await page.locator("#tab-a").click();
      await expect(input).toBeVisible();
      await expect(input).toHaveValue("installed retained state");
      for (const id of ["a", "b", "c"])
        await expect(page.locator(`#tab-${id}`)).toHaveAttribute(
          "type",
          "button",
        );
      await expect(page.locator("#submits")).toHaveText("0");
      await control(page, "Set candidate tab B").click();
      await expect(page.locator("#panel-b")).toBeVisible();
      await expect(page.locator("#value")).toHaveText("b; callbacks 2");
    });
    test("dynamic trigger and panel destruction clears actual refs and reciprocal native registrations", async ({
      page,
    }) => {
      await expect(page.locator("#dynamic-refs")).toHaveText("BUTTON;DIV");
      await page.locator("#tab-c").click();
      await control(page, "Toggle tab C").click();
      await expect(page.locator("#tab-c")).toHaveCount(0);
      await expect(page.locator("#dynamic-refs")).toHaveText("none;DIV");
      await expect(page.locator("#panel-c")).toBeVisible();
      await expect(page.locator("#panel-c")).not.toHaveAttribute(
        "aria-labelledby",
      );
      await expect(page.locator("#value")).toHaveText("c; callbacks 1");
      await control(page, "Toggle panel C").click();
      await expect(page.locator("#dynamic-refs")).toHaveText("none;none");
      await expect(page.locator("#panel-c")).toHaveCount(0);
      await expect(page.locator("#panel-a")).toBeHidden();
      await expect(page.locator("#panel-b")).toBeHidden();
      await control(page, "Toggle tab C").click();
      await expect(page.locator("#dynamic-refs")).toHaveText("BUTTON;none");
      await expect(page.locator("#tab-c")).not.toHaveAttribute("aria-controls");
      await control(page, "Toggle panel C").click();
      await expect(page.locator("#dynamic-refs")).toHaveText("BUTTON;DIV");
      await expect(page.locator("#tab-c")).toHaveAttribute(
        "aria-controls",
        "panel-c",
      );
      await expect(page.locator("#panel-c")).toHaveAttribute(
        "aria-labelledby",
        "tab-c",
      );
      await page.locator("#tab-a").press("ArrowRight");
      await page.locator("#tab-b").press("ArrowRight");
      await expect(page.locator("#tab-c")).toBeFocused();
      await selected(page, "c");
    });
    test("default delegated and raw native instances retain exact links without shared selection", async ({
      page,
    }) => {
      for (const prefix of ["", "delegated-", "raw-"])
        for (const value of ["a", "b"]) {
          await expect(page.locator(`#${prefix}tab-${value}`)).toHaveAttribute(
            "aria-controls",
            `${prefix}panel-${value}`,
          );
          await expect(
            page.locator(`#${prefix}panel-${value}`),
          ).toHaveAttribute("aria-labelledby", `${prefix}tab-${value}`);
        }
      await expect(page.locator("#delegated-panel-a")).toHaveAttribute(
        "hidden",
        "",
      );
      await page.locator("#delegated-tab-a").click();
      await expect(page.locator("#delegated-panel-a")).toBeVisible();
      await expect(page.locator("#delegated-panel-b")).toHaveAttribute(
        "hidden",
        "",
      );
      await expect(page.locator("#delegated-tab-a")).toHaveAttribute(
        "data-delegated",
        "trigger",
      );
      await expect(page.locator("#delegated-panel-a")).toHaveAttribute(
        "data-delegated",
        "content",
      );
      await page.locator("#raw-tab-b").click();
      await expect(page.locator("#raw-panel-b")).toBeVisible();
      await selected(page, "a");
      await expect(page.locator("#value")).toHaveText("a; callbacks 0");
    });
    test("concurrent same-worker SSR preserves a b c empty selection and per-instance state", async ({
      request,
      page,
    }, info) => {
      const responses = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const value = ["a", "b", "c", ""][i % 4]!;
          const url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("value", value);
          const response = await request.get(url.href);
          expect(response.ok()).toBe(true);
          const html = await response.text();
          for (const item of ["a", "b", "c"]) {
            const trigger = html.match(
              new RegExp(`<button(?=[^>]*id="tab-${item}")[^>]*>`),
            )?.[0];
            const panel = html.match(
              new RegExp(`<div(?=[^>]*id="panel-${item}")[^>]*>`),
            )?.[0];
            expect(trigger).toBeTruthy();
            expect(panel).toBeTruthy();
            expect(trigger).toContain(`aria-selected="${value === item}"`);
            expect(/\bhidden(?:\s|>|=)/.test(panel!)).toBe(value !== item);
          }
          expect(
            html.match(/<button(?=[^>]*id="delegated-tab-b")[^>]*>/)?.[0],
          ).toContain('aria-selected="true"');
          expect(
            html.match(/<button(?=[^>]*id="raw-tab-a")[^>]*>/)?.[0],
          ).toContain('aria-selected="true"');
          const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(
            (match) => match[1],
          );
          expect(new Set(ids).size).toBe(ids.length);
          return { value, html };
        }),
      );
      const file = info.outputPath("concurrent-tabs-ssr.json");
      writeFileSync(file, JSON.stringify(responses, null, 2));
      await info.attach("concurrent-tabs-ssr", {
        path: file,
        contentType: "application/json",
      });
      for (const value of ["a", "b", "c", ""]) {
        const url = new URL(consumer.route, hosted.baseURL);
        url.searchParams.set("value", value);
        await page.goto(url.href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await selected(page, value);
        await expect(page.locator("#value")).toHaveText(
          `${value}; callbacks 0`,
        );
        for (const item of ["a", "b", "c"]) {
          if (item === value)
            await expect(page.locator(`#panel-${item}`)).toBeVisible();
          else await expect(page.locator(`#panel-${item}`)).toBeHidden();
        }
      }
    });
    test("native generated IDs survive actual SSR to hydration and link independently in repeated groups", async ({
      page,
      request,
    }, info) => {
      const url = new URL(consumer.route, hosted.baseURL);
      url.searchParams.set("value", "b");
      const response = await request.get(url.href);
      expect(response.ok()).toBe(true);
      const html = await response.text();
      const before = await page.evaluate((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        return [...doc.querySelectorAll("[data-auto-group]")].map((group) => ({
          group: group.getAttribute("data-auto-group"),
          root: group.id,
          triggers: [...group.querySelectorAll("[data-auto-trigger]")].map(
            (n) => ({ value: n.getAttribute("data-auto-trigger"), id: n.id }),
          ),
          panels: [...group.querySelectorAll("[data-auto-panel]")].map((n) => ({
            value: n.getAttribute("data-auto-panel"),
            id: n.id,
          })),
        }));
      }, html);
      await page.goto(url.href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await selected(page, "b");
      await expect(page.locator("#panel-b")).toBeVisible();
      for (const group of before) {
        const root = page.locator(`[data-auto-group="${group.group}"]`);
        await expect(root).toHaveAttribute("id", group.root);
        for (const item of group.triggers) {
          expect(item.id).not.toBe("");
          const trigger = root.locator(`[data-auto-trigger="${item.value}"]`);
          const panel = group.panels.find((p) => p.value === item.value)!;
          await expect(trigger).toHaveAttribute("id", item.id);
          await expect(trigger).toHaveAttribute("aria-controls", panel.id);
          await expect(
            root.locator(`[data-auto-panel="${panel.value}"]`),
          ).toHaveAttribute("id", panel.id);
          await expect(
            root.locator(`[data-auto-panel="${panel.value}"]`),
          ).toHaveAttribute("aria-labelledby", item.id);
        }
      }
      await page
        .locator('[data-auto-group="0"] [data-auto-trigger="b"]')
        .click();
      await expect(
        page.locator('[data-auto-group="0"] [data-auto-panel="b"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-auto-group="1"] [data-auto-panel="a"]'),
      ).toBeVisible();
      await selected(page, "b");
      const file = info.outputPath("native-tabs-identity.json");
      writeFileSync(file, JSON.stringify({ before, html }, null, 2));
      await info.attach("native-tabs-identity", {
        path: file,
        contentType: "application/json",
      });
    });
  });
