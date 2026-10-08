import { readFileSync, writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { buildRadioConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

async function instrumentReset(page: Page) {
  await page.addInitScript(() => {
    const live: {
      target: EventTarget;
      listener: EventListenerOrEventListenerObject | null;
    }[] = [];
    (
      window as unknown as { __radioResetListeners: typeof live }
    ).__radioResetListeners = live;
    const add = EventTarget.prototype.addEventListener;
    const remove = EventTarget.prototype.removeEventListener;
    const captures = (
      options?: boolean | AddEventListenerOptions | EventListenerOptions,
    ) =>
      options === true ||
      (typeof options === "object" && options.capture === true);
    EventTarget.prototype.addEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | AddEventListenerOptions,
    ) {
      if (
        type === "reset" &&
        captures(options) &&
        !live.some(
          (entry) => entry.target === this && entry.listener === listener,
        )
      )
        live.push({ target: this, listener });
      return add.call(this, type, listener, options);
    };
    EventTarget.prototype.removeEventListener = function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject | null,
      options?: boolean | EventListenerOptions,
    ) {
      if (type === "reset" && captures(options)) {
        const index = live.findIndex(
          (entry) => entry.target === this && entry.listener === listener,
        );
        if (index >= 0) live.splice(index, 1);
      }
      return remove.call(this, type, listener, options);
    };
  });
}
const listeners = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __radioResetListeners: unknown[] })
        .__radioResetListeners.length,
  );
const button = (page: Page, name: string) =>
  page.getByRole("button", { name, exact: true });
const formData = (page: Page) =>
  page
    .locator("#radio-form")
    .evaluate((node) => [...new FormData(node as HTMLFormElement)]);

for (const custom of [false, true]) {
  test.describe(`installed Radio behavior ${custom ? "custom" : "default"}`, () => {
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
      await instrumentReset(page);
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("vertical arrows Home End skip disabled choices and follow native loop boundaries", async ({
      page,
    }) => {
      const a = page.locator("#radio-a"),
        b = page.locator("#radio-b"),
        c = page.locator("#radio-c");
      await expect(a).toHaveAttribute("tabindex", "0");
      await expect(b).toHaveAttribute("tabindex", "-1");
      await a.press("ArrowDown");
      await expect(b).toBeFocused();
      await expect(b).toBeChecked();
      await b.press("ArrowDown");
      await expect(c).toBeFocused();
      await expect(c).toBeChecked();
      await c.press("ArrowDown");
      await expect(a).toBeFocused();
      await expect(a).toBeChecked();
      await a.press("End");
      await expect(c).toBeChecked();
      await c.press("Home");
      await expect(a).toBeChecked();
      await button(page, "Toggle radio loop").click();
      await a.press("End");
      await c.press("ArrowDown");
      await expect(c).toBeFocused();
      await expect(c).toBeChecked();
      await expect(page.locator('input[name="choice"]')).toHaveValue("c");
      await expect(page.locator("#radio-disabled")).not.toBeChecked();
    });
    test("horizontal and RTL navigation preserve native selection and focus paint", async ({
      page,
    }) => {
      const a = page.locator("#radio-a"),
        b = page.locator("#radio-b"),
        c = page.locator("#radio-c");
      await button(page, "Toggle radio orientation").click();
      await expect(page.locator("#radio-group")).toHaveAttribute(
        "data-orientation",
        "horizontal",
      );
      await a.press("ArrowRight");
      await expect(b).toBeChecked();
      await expect(b).toBeFocused();
      await b.press("ArrowLeft");
      await expect(a).toBeChecked();
      await button(page, "Toggle radio direction").click();
      await a.press("ArrowRight");
      await expect(c).toBeChecked();
      await expect(c).toBeFocused();
      await expect(c).toHaveCSS("outline-width", "2px");
      await expect(c).toHaveCSS("direction", "rtl");
      await expect(c).toHaveCSS("width", "16px");
      await button(page, "Toggle radio theme").click();
      await expect(c).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(c).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(a).toHaveCSS("background-image", "none");
    });
    test("labels binding refs callbacks and caller cancellation stay synchronized", async ({
      page,
    }) => {
      const a = page.locator("#radio-a"),
        b = page.locator("#radio-b");
      await expect(
        page.getByRole("radiogroup", { name: "Choice set", exact: true }),
      ).toHaveAttribute("id", "radio-group");
      await expect(a).toHaveAccessibleName("Choice A");
      await expect(page.locator("#refs")).toHaveText("DIV;BUTTON");
      await page.getByText("Choice B", { exact: true }).click();
      await expect(b).toBeChecked();
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await button(page, "Focus radio ref").click();
      await expect(a).toBeFocused();
      await expect(b).toBeChecked();
      await button(page, "Toggle radio cancellation").click();
      await a.click();
      await expect(b).toBeChecked();
      await expect(page.locator("#clicks")).toHaveText("1");
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await button(page, "Clear radio value").click();
      await button(page, "Set radio B").click();
      await expect(b).toBeChecked();
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await expect(page.locator('input[name="choice"]')).toHaveValue("b");
    });
    test("readonly keeps navigation without selection and group disabled refuses activation", async ({
      page,
    }) => {
      const a = page.locator("#radio-a"),
        b = page.locator("#radio-b");
      await button(page, "Toggle radio readonly").click();
      await a.press("ArrowDown");
      await expect(b).toBeFocused();
      await expect(a).toBeChecked();
      await b.press("Space");
      await b.click();
      await expect(a).toBeChecked();
      await expect(page.locator("#value")).toHaveText("a; callbacks 0");
      await button(page, "Toggle radio group disabled").click();
      await expect(a).toBeDisabled();
      await expect(b).toBeDisabled();
      await a.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator("#clicks")).toHaveText("0");
      await expect(page.locator('input[name="choice"]')).toBeDisabled();
      expect(await formData(page)).toEqual([]);
      await button(page, "Toggle radio group disabled").click();
      await button(page, "Toggle radio readonly").click();
      await b.press("Space");
      await expect(b).toBeChecked();
    });
    test("one native value field submits and validates required disabled and unnamed groups", async ({
      page,
    }) => {
      const input = page.locator('input[name="choice"]');
      await expect(input).toHaveCount(1);
      await expect(input).toHaveAttribute("type", "text");
      await expect(page.locator("#radio-form input")).toHaveCount(1);
      await expect(page.locator("#unnamed-group + input")).toHaveCount(0);
      expect(await formData(page)).toEqual([["choice", "a"]]);
      await page.locator("#radio-b").click();
      await button(page, "Submit radio").click();
      await expect(page.locator("#submitted")).toHaveText("choice=b");
      await expect(page.locator("#submits")).toHaveText("1");
      await button(page, "Clear radio value").click();
      expect(
        await page
          .locator("#radio-form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      ).toBe(false);
      await button(page, "Submit radio").click();
      await expect(page.locator("#submits")).toHaveText("1");
      await expect(page.locator("#radio-b")).toHaveAttribute("tabindex", "0");
      await expect(page.locator("#radio-b")).toBeFocused();
      await button(page, "Toggle radio group disabled").click();
      expect(
        await page
          .locator("#radio-form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      ).toBe(true);
      await button(page, "Submit radio").click();
      await expect(page.locator("#submitted")).toHaveText("");
      await expect(page.locator("#submits")).toHaveText("2");
    });
    test("current form reset restores initial bound value after cancellation without callbacks", async ({
      page,
    }) => {
      await page.locator("#radio-b").click();
      await button(page, "Toggle radio reset cancellation").click();
      await button(page, "Reset radio").click();
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await expect(page.locator('input[name="choice"]')).toHaveValue("b");
      await button(page, "Toggle radio reset cancellation").click();
      await button(page, "Reset radio").click();
      await expect(page.locator("#value")).toHaveText("a; callbacks 1");
      await expect(page.locator("#radio-a")).toBeChecked();
      await expect(page.locator('input[name="choice"]')).toHaveValue("a");
      await button(page, "Set radio B").click();
      await page
        .locator("#life-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
      await page.locator("#radio-form").evaluate((node) => {
        const old = node as HTMLFormElement;
        const next = document.createElement("form");
        next.id = old.id;
        old.replaceWith(next);
        while (old.firstChild) next.appendChild(old.firstChild);
        old.reset();
      });
      await expect(page.locator('input[name="choice"]')).toHaveValue("b");
      await page
        .locator("#radio-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(page.locator("#value")).toHaveText("a; callbacks 1");
      await expect(page.locator('input[name="choice"]')).toHaveValue("a");
    });
    test("dynamic choices retain native string authority while navigation uses live enabled items", async ({
      page,
    }) => {
      await page.locator("#radio-c").click();
      await button(page, "Toggle radio C").click();
      await expect(page.locator("#radio-c")).toHaveCount(0);
      await expect(page.locator("#value")).toHaveText("c; callbacks 1");
      await expect(page.locator('input[name="choice"]')).toHaveValue("c");
      await page.locator("#radio-a").press("Space");
      await page.locator("#radio-a").press("ArrowDown");
      await expect(page.locator("#radio-b")).toBeChecked();
      await button(page, "Toggle radio C").click();
      await page.locator("#radio-b").press("ArrowDown");
      await expect(page.locator("#radio-c")).toBeChecked();
      await expect(page.locator("#radio-c")).toBeFocused();
    });
    test("empty value arrows match actual raw native focus policy and Space selects", async ({
      page,
    }) => {
      await button(page, "Clear radio value").click();
      await page.locator("#radio-a").press("ArrowDown");
      await expect(page.locator("#radio-b")).toBeFocused();
      await expect(page.locator("#value")).toHaveText("; callbacks 0");
      await expect(page.locator('input[name="choice"]')).toHaveValue("");
      await page.locator("#native-empty-a").press("ArrowDown");
      await expect(page.locator("#native-empty-b")).toBeFocused();
      await expect(page.locator("#native-empty-value")).toHaveText("");
      await page.locator("#radio-b").press("Space");
      await expect(page.locator("#radio-b")).toBeChecked();
      await page.locator("#native-empty-b").press("Space");
      await expect(page.locator("#native-empty-value")).toHaveText("b");
      await expect(page.locator("#value")).toHaveText("b; callbacks 1");
    });
    test("SSR state stays isolated in concurrent actual worker responses and hydrates the same named value", async ({
      page,
      request,
    }, info) => {
      const values = ["a", "b", "c", ""];
      const responses = await Promise.all(
        Array.from({ length: 12 }, async (_, i) => {
          const value = values[i % values.length]!;
          const url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("value", value);
          const response = await request.get(url.href);
          expect(response.ok()).toBe(true);
          const html = await response.text();
          for (const item of ["a", "b", "c"]) {
            const tag = html.match(
              new RegExp(`<button[^>]*id="radio-${item}"[^>]*>`),
            )?.[0];
            expect(tag).toBeTruthy();
            expect(tag).toContain(`aria-checked="${item === value}"`);
          }
          expect(html).toMatch(/id="life-a"[^>]*aria-checked="true"/);
          expect(html.match(/name="choice"/g)).toHaveLength(1);
          return { value, html };
        }),
      );
      const artifact = info.outputPath("concurrent-radio-ssr.json");
      writeFileSync(artifact, JSON.stringify(responses, null, 2));
      await info.attach("concurrent-radio-ssr", {
        path: artifact,
        contentType: "application/json",
      });
      const url = new URL(consumer.route, hosted.baseURL);
      url.searchParams.set("value", "b");
      await page.goto(url.href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await expect(page.locator("#radio-b")).toBeChecked();
      await expect(page.locator('input[name="choice"]')).toHaveValue("b");
      await expect(page.locator("#value")).toHaveText("b; callbacks 0");
    });
    test("destroy during reset removes actual listener and timer then remounts one owner", async ({
      page,
    }) => {
      await expect.poll(() => listeners(page)).toBe(2);
      await page.locator("#life-b").click();
      await expect(page.locator("#life-value")).toHaveText("b");
      await button(page, "Reset and remove radio").click();
      await expect(page.locator("#life-group")).toHaveCount(0);
      await expect(page.locator("#life-value")).toHaveText("b");
      await expect.poll(() => listeners(page)).toBe(1);
      await button(page, "Remount radio").click();
      await expect(page.locator("#life-b")).toBeChecked();
      await expect.poll(() => listeners(page)).toBe(2);
      await expect(page.locator('input[name="life"]')).toHaveCount(1);
    });
  });
  test.describe(`Radio cleanup causal control ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildRadioConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildRadioConsumer(custom, (root, config) => {
        const file = `${root}/${config.uiDir}/radio/group.svelte`;
        const source = readFileSync(file, "utf8");
        const timer =
          "for (const timer of pending) window.clearTimeout(timer);";
        const listener = 'tree.removeEventListener("reset", reset, true);';
        expect(source.split(timer)).toHaveLength(2);
        expect(source.split(listener)).toHaveLength(2);
        writeFileSync(
          file,
          source
            .replace(
              timer,
              "// Owned causal control: pending timer cleanup removed.",
            )
            .replace(
              listener,
              "// Owned causal control: reset listener cleanup removed.",
            ),
        );
      });
      consumer.evidence.ownedMutation =
        "radio-reset-listener-and-timer-cleanup-removed";
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
    test("missing real cleanup leaks an owner and changes destroyed state so the positive detectors fail", async ({
      page,
    }, info) => {
      const file = info.outputPath("owned-radio-cleanup-control.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("owned-radio-cleanup-control", {
        path: file,
        contentType: "application/json",
      });
      await instrumentReset(page);
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await expect.poll(() => listeners(page)).toBe(2);
      await page.locator("#life-b").click();
      await button(page, "Reset and remove radio").click();
      await expect(page.locator("#life-group")).toHaveCount(0);
      await expect(page.locator("#life-value")).toHaveText("a");
      await expect.poll(() => listeners(page)).toBe(2);
      await button(page, "Remount radio").click();
      await expect(page.locator("#life-a")).toBeChecked();
      await expect.poll(() => listeners(page)).toBe(3);
    });
  });
}
