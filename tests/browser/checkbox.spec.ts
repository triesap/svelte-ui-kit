import { readFileSync, writeFileSync } from "node:fs";
import { buildCheckboxConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Checkbox ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCheckboxConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCheckboxConsumer(custom);
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
      await page.addInitScript(() => {
        const live: {
          target: EventTarget;
          listener: EventListenerOrEventListenerObject | null;
        }[] = [];
        (
          window as unknown as { __checkboxResetListeners: typeof live }
        ).__checkboxResetListeners = live;
        const add = EventTarget.prototype.addEventListener,
          remove = EventTarget.prototype.removeEventListener;
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
      await page.goto(new URL("qualification/checkbox", hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("pointer, keyboard, programmatic state and refs use actual primitive bindings", async ({
      page,
    }) => {
      const control = page.getByRole("checkbox", {
        name: "Enable feature",
        exact: true,
      });
      await expect(control).not.toBeChecked();
      await expect(
        page.getByRole("checkbox", { name: "Initially enabled", exact: true }),
      ).toBeChecked();
      await expect(page.locator('input[name="enabled"]')).toHaveCount(1);
      await control.click();
      await expect(control).toBeChecked();
      await expect(page.locator("#state")).toHaveText("true");
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 1; clicks 1; last true",
      );
      await control.press("Space");
      await expect(control).not.toBeChecked();
      await control.press("Enter");
      await expect(control).not.toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 2; clicks 1; last false",
      );
      await page
        .getByRole("button", { name: "Set state", exact: true })
        .click();
      await expect(control).toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 2; clicks 1; last false",
      );
      await expect(control).toHaveClass("kit-checkbox caller retained");
      await expect(control).toHaveAttribute("data-caller", "preserved");
      await expect(page.locator("#ref")).toHaveText("BUTTON");
      await page
        .getByRole("button", { name: "Focus bound checkbox", exact: true })
        .click();
      await expect(control).toBeFocused();
    });
    test("caller cancellation and disabled state preserve upstream event ordering", async ({
      page,
    }) => {
      const control = page.locator("#control");
      await page
        .getByRole("button", { name: "Toggle cancellation", exact: true })
        .click();
      await control.click();
      await expect(control).not.toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 0; clicks 1; last false",
      );
      await page
        .getByRole("button", { name: "Toggle cancellation", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Toggle disabled", exact: true })
        .click();
      await expect(control).toBeDisabled();
      await control.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(control).not.toBeChecked();
      await expect(page.locator('input[name="enabled"]')).toBeDisabled();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 0; clicks 1; last false",
      );
    });
    test("native form contribution, required and disabled behavior use one real checkbox", async ({
      page,
    }) => {
      const control = page.locator("#control");
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submitted")).toHaveText("");
      await control.click();
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submitted")).toHaveText("enabled=yes");
      await control.click();
      await page
        .getByRole("button", { name: "Toggle required", exact: true })
        .click();
      await expect(control).toHaveAttribute("aria-required", "true");
      expect(
        await page
          .locator("#main-form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      ).toBe(false);
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submits")).toHaveText("2");
      await page
        .getByRole("button", { name: "Toggle disabled", exact: true })
        .click();
      expect(
        await page
          .locator("#main-form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submits")).toHaveText("3");
      await expect(page.locator("#submitted")).toHaveText("");
      await expect(
        page.locator('#main-form input[type="checkbox"]'),
      ).toHaveCount(1);
    });
    test("initially checked seed and canceled reset stay coherent", async ({
      page,
    }) => {
      const seed = page.locator("#seed");
      await expect(seed).toBeChecked();
      await seed.click();
      await expect(seed).not.toBeChecked();
      await page
        .getByRole("button", { name: "Restore seed", exact: true })
        .click();
      await expect(seed).toBeChecked();
      await expect(page.locator("#seed-state")).toHaveText("true");
      await expect(page.locator('input[name="seed"]')).toBeChecked();
      await seed.click();
      await expect(seed).not.toBeChecked();
      await page
        .getByRole("button", { name: "Toggle reset cancellation", exact: true })
        .click();
      await expect(page.locator("#cancel-state")).toHaveText("true");
      await page
        .getByRole("button", { name: "Restore seed", exact: true })
        .click();
      await expect(page.locator("#reset-prevented")).toHaveText("true");
      await expect(seed).not.toBeChecked();
      await expect(page.locator("#seed-state")).toHaveText("false");
      await expect(page.locator('input[name="seed"]')).not.toBeChecked();
    });
    test("external native form association forwards actual value without duplicate inputs", async ({
      page,
    }) => {
      const control = page.locator("#external");
      await expect(control).toBeChecked();
      await expect(page.locator('input[name="outside"]')).toHaveCount(1);
      await expect(page.locator('input[name="outside"]')).toHaveAttribute(
        "form",
        "external-form",
      );
      await page
        .getByRole("button", { name: "Submit external", exact: true })
        .click();
      await expect(page.locator("#external-submitted")).toHaveText(
        "outside=yes",
      );
      await control.click();
      await page
        .getByRole("button", { name: "Submit external", exact: true })
        .click();
      await expect(page.locator("#external-submitted")).toHaveText("");
    });
    test("external reset follows native same-id owner replacement and cancellation", async ({
      page,
    }) => {
      const control = page.locator("#external");
      const field = page.locator('input[name="outside"]');
      await control.click();
      await expect(control).not.toBeChecked();
      await page.evaluate(() => {
        const old = document.getElementById("external-form")!;
        const replacement = document.createElement("form");
        replacement.id = old.id;
        old.replaceWith(replacement);
        replacement.reset();
      });
      await expect(field).toBeChecked();
      await expect(control).toBeChecked();
      await control.click();
      await page.evaluate(() => {
        const owner = document.getElementById(
          "external-form",
        ) as HTMLFormElement;
        owner.addEventListener("reset", (event) => event.preventDefault(), {
          once: true,
        });
        owner.reset();
      });
      await expect(field).not.toBeChecked();
      await expect(control).not.toBeChecked();
      await page
        .locator("#seed-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(control).not.toBeChecked();
      await page
        .locator("#external-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(field).toBeChecked();
      await expect(control).toBeChecked();
      await expect(field).toHaveCount(1);
    });
    test("native reset restores bound state and coherent submitted value", async ({
      page,
    }) => {
      const control = page.locator("#control");
      await control.click();
      await expect(control).toBeChecked();
      await page
        .getByRole("button", { name: "Reset state", exact: true })
        .click();
      await expect(control).not.toBeChecked();
      await expect(page.locator("#state")).toHaveText("false");
      await expect(page.locator('input[name="enabled"]')).not.toBeChecked();
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submitted")).toHaveText("");
    });
    test("reset teardown cannot update a removed instance or leak a duplicate form field", async ({
      page,
    }) => {
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __checkboxResetListeners: unknown[] })
                .__checkboxResetListeners.length,
          ),
        )
        .toBe(4);
      await page.locator("#lifecycle").click();
      await expect(page.locator("#lifecycle-state")).toHaveText("true");
      await page
        .getByRole("button", { name: "Reset and remove", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).toHaveCount(0);
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __checkboxResetListeners: unknown[] })
                .__checkboxResetListeners.length,
          ),
        )
        .toBe(3);
      await expect(page.locator('input[name="lifecycle"]')).toHaveCount(0);
      await page
        .getByRole("button", { name: "Remount checkbox", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).toBeChecked();
      await expect(page.locator("#lifecycle-state")).toHaveText("true");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __checkboxResetListeners: unknown[] })
                .__checkboxResetListeners.length,
          ),
        )
        .toBe(4);
      await expect(page.locator('input[name="lifecycle"]')).toHaveCount(1);
    });
    test("fixed source SVG selection geometry themes focus RTL and reduced motion render", async ({
      page,
    }) => {
      const control = page.locator("#control"),
        mark = page.locator("#main-form .kit-checkbox-indicator").first();
      await expect(control).toHaveCSS("width", "16px");
      await expect(control).toHaveCSS("height", "16px");
      await expect(mark).toHaveCSS("width", "16px");
      await expect(mark).toHaveCSS("height", "16px");
      await expect(mark).toHaveCSS("opacity", "0");
      await expect(control).toHaveCSS("border-top-left-radius", "4px");
      await expect(mark).toHaveAttribute("viewBox", "0 0 16 16");
      await expect(mark.locator("path")).toHaveAttribute(
        "d",
        "M3.25 8.25 6.5 11.5 12.75 4.75",
      );
      const tokenColor = (name: string) =>
        page.locator("#main-form").evaluate((node, property) => {
          const probe = document.createElement("span");
          probe.style.color = `var(${property})`;
          node.appendChild(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        }, name);
      await expect(control).toHaveCSS(
        "background-color",
        await tokenColor("--kit-color-surface"),
      );
      await control.press("Space");
      await expect(mark).toHaveCSS("opacity", "1");
      await expect(control).toHaveCSS(
        "background-color",
        await tokenColor("--kit-color-primary"),
      );
      await expect(mark.locator("path")).toHaveCSS(
        "stroke",
        await tokenColor("--kit-color-selection-indicator"),
      );
      await expect(control).toHaveCSS("outline-style", "solid");
      await expect(control).toHaveCSS("outline-width", "2px");
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await expect(control).toHaveCSS("direction", "rtl");
      await expect(mark).toHaveCSS("width", "16px");
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      await expect(control).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(control).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(mark.locator("path")).toHaveCSS("stroke", "rgb(7, 8, 9)");
      await page
        .getByRole("button", { name: "Toggle disabled", exact: true })
        .click();
      await expect(control).toHaveCSS(
        "opacity",
        await control.evaluate((node) =>
          String(
            Number(
              getComputedStyle(node).getPropertyValue("--kit-disabled-opacity"),
            ),
          ),
        ),
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(control).toHaveCSS("transition-duration", "0s");
      await expect(mark).toHaveCSS("width", "16px");
    });
    test("visible label activation and readonly refusal retain native semantics", async ({
      page,
    }) => {
      const control = page.locator("#control");
      await page.getByText("Enable feature", { exact: true }).click();
      await expect(control).toBeChecked();
      await page
        .getByRole("button", { name: "Toggle readonly", exact: true })
        .click();
      await expect(control).toHaveAttribute("aria-readonly", "true");
      await control.click();
      await control.press("Space");
      await expect(control).toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 1; clicks 3; last true",
      );
      await page
        .getByRole("button", { name: "Toggle readonly", exact: true })
        .click();
      await control.press("Space");
      await expect(control).not.toBeChecked();
      const native = page.locator("#native-readonly");
      await native.click();
      await native.press("Space");
      await expect(native).toBeChecked();
      await expect(page.locator("#native-readonly-events")).toHaveText("2");
    });
    test("mixed bindings callbacks and native field submission are independent", async ({
      page,
    }) => {
      const control = page.locator("#control"),
        field = page.locator('input[name="enabled"]');
      await page
        .getByRole("button", { name: "Toggle mixed", exact: true })
        .click();
      await expect(control).toHaveAttribute("aria-checked", "mixed");
      await expect(page.locator("#mixed-state")).toHaveText(
        "true; callbacks 0",
      );
      await expect
        .poll(() =>
          field.evaluate((node) => (node as HTMLInputElement).indeterminate),
        )
        .toBe(true);
      await expect(field).not.toBeChecked();
      await expect(
        page.locator("#main-form .kit-checkbox-indicator path").first(),
      ).toHaveAttribute("d", "M3.25 8 12.75 8");
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submitted")).toHaveText("");
      await control.press("Space");
      await expect(control).toBeChecked();
      await expect(control).toHaveAttribute("aria-checked", "true");
      await expect(page.locator("#mixed-state")).toHaveText(
        "false; callbacks 1",
      );
      await expect
        .poll(() =>
          field.evaluate((node) => (node as HTMLInputElement).indeterminate),
        )
        .toBe(false);
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 1; clicks 0; last true",
      );
      await page
        .getByRole("button", { name: "Submit state", exact: true })
        .click();
      await expect(page.locator("#submitted")).toHaveText("enabled=yes");
    });
    test("uncanceled native reset preserves current mixed property and canceled reset preserves both values", async ({
      page,
    }, info) => {
      const control = page.locator("#control"),
        field = page.locator('input[name="enabled"]');
      await control.click();
      await page
        .getByRole("button", { name: "Toggle mixed", exact: true })
        .click();
      const native = await page.evaluate(() => {
        const form = document.createElement("form"),
          input = document.createElement("input");
        input.type = "checkbox";
        input.defaultChecked = false;
        form.appendChild(input);
        document.body.appendChild(form);
        input.checked = true;
        input.indeterminate = true;
        form.reset();
        const actual = {
          checked: input.checked,
          indeterminate: input.indeterminate,
        };
        form.remove();
        return actual;
      });
      expect(native).toEqual({ checked: false, indeterminate: true });
      await page
        .locator("#main-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(control).toHaveAttribute("aria-checked", "mixed");
      await expect(field).not.toBeChecked();
      await expect(page.locator("#state")).toHaveText("false");
      await expect
        .poll(() =>
          field.evaluate((node) => (node as HTMLInputElement).indeterminate),
        )
        .toBe(true);
      await control.press("Space");
      await page
        .getByRole("button", { name: "Toggle mixed", exact: true })
        .click();
      await page.locator("#main-form").evaluate((node) => {
        node.addEventListener("reset", (event) => event.preventDefault(), {
          once: true,
        });
        (node as HTMLFormElement).reset();
      });
      await expect(field).toBeChecked();
      await expect(control).toHaveAttribute("aria-checked", "mixed");
      await expect(page.locator("#state")).toHaveText("true");
      const file = info.outputPath("native-mixed-reset.json");
      writeFileSync(file, JSON.stringify(native));
      await info.attach("native-mixed-reset", {
        path: file,
        contentType: "application/json",
      });
    });
    test("initial checked and mixed SSR hydrate locally and concurrent request states remain independent", async ({
      page,
      request,
    }, info) => {
      const cases = Array.from({ length: 12 }, (_, index) => ({
        checked: index % 2 === 0,
        mixed: index % 3 === 0,
      }));
      const responses = await Promise.all(
        cases.map(async (state) => {
          const url = new URL("qualification/checkbox", hosted.baseURL);
          url.searchParams.set("checked", String(state.checked));
          url.searchParams.set("mixed", String(state.mixed));
          const response = await request.get(url.href);
          expect(response.status()).toBe(200);
          const body = await response.text();
          const root = body.match(/<button(?=[^>]*id="control")[^>]*>/)?.[0];
          expect(root).toBeTruthy();
          expect(root).toContain(
            `aria-checked="${state.mixed ? "mixed" : state.checked}"`,
          );
          const field = body.match(/<input(?=[^>]*name="enabled")[^>]*>/)?.[0];
          expect(field).toBeTruthy();
          expect(/(?:\s)checked(?:[=\s>])/.test(field!)).toBe(state.checked);
          return { state, body };
        }),
      );
      const file = info.outputPath("checkbox-request-states.json");
      writeFileSync(
        file,
        JSON.stringify({ artifact: consumer.evidence, responses }, null, 2),
      );
      await info.attach("checkbox-request-states", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(
        new URL(
          "qualification/checkbox?checked=true&mixed=true",
          hosted.baseURL,
        ).href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await expect(page.locator("#control")).toHaveAttribute(
        "aria-checked",
        "mixed",
      );
      await expect(page.locator('input[name="enabled"]')).toBeChecked();
      await expect
        .poll(() =>
          page
            .locator('input[name="enabled"]')
            .evaluate((node) => (node as HTMLInputElement).indeterminate),
        )
        .toBe(true);
      await expect(
        page.locator('#main-form input[type="checkbox"]'),
      ).toHaveCount(1);
    });
    test("required validation focuses the real visible ref and form owner can change dynamically", async ({
      page,
    }) => {
      const control = page.locator("#control");
      await page
        .getByRole("button", { name: "Toggle required", exact: true })
        .click();
      expect(
        await page
          .locator("#main-form")
          .evaluate((node) => (node as HTMLFormElement).reportValidity()),
      ).toBe(false);
      await expect(control).toBeFocused();
      const external = page.locator("#external"),
        field = page.locator('input[name="outside"]');
      await external.click();
      await page
        .getByRole("button", {
          name: "Reassociate external owner",
          exact: true,
        })
        .click();
      await expect(external).not.toHaveAttribute("form");
      await expect(page.locator("#native-readonly")).not.toHaveAttribute(
        "form",
      );
      await expect(field).toHaveAttribute("form", "alternate-form");
      await page
        .locator("#external-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(field).not.toBeChecked();
      await expect(external).not.toBeChecked();
      await page
        .locator("#alternate-form")
        .evaluate((node) => (node as HTMLFormElement).reset());
      await expect(field).toBeChecked();
      await expect(external).toBeChecked();
      await expect(field).toHaveCount(1);
    });
  });

for (const custom of [false, true])
  test.describe(`Checkbox reset cleanup causal control ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCheckboxConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCheckboxConsumer(custom, (root, config) => {
        const file = `${root}/${config.uiDir}/checkbox.svelte`;
        const source = readFileSync(file, "utf8");
        const cleanup =
          "for (const timer of pending) window.clearTimeout(timer);";
        expect(source.split(cleanup)).toHaveLength(2);
        writeFileSync(
          file,
          source
            .replace(
              cleanup,
              "// Owned causal control: pending timer cleanup removed.",
            )
            .replace(
              'tree.removeEventListener("reset", reset, true);',
              "// Owned causal control: reset listener cleanup removed.",
            ),
        );
      });
      consumer.evidence.ownedMutation = "checkbox-reset-timer-cleanup-removed";
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
    test("actual missing cleanup changes the destroyed instance state and fails the preservation detector", async ({
      page,
    }, info) => {
      const artifact = info.outputPath("owned-reset-cleanup-control.json");
      writeFileSync(artifact, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("owned-reset-cleanup-control", {
        path: artifact,
        contentType: "application/json",
      });
      await page.addInitScript(() => {
        const live: {
          target: EventTarget;
          listener: EventListenerOrEventListenerObject | null;
        }[] = [];
        (
          window as unknown as { __checkboxResetListeners: typeof live }
        ).__checkboxResetListeners = live;
        const add = EventTarget.prototype.addEventListener,
          remove = EventTarget.prototype.removeEventListener;
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
      await page.goto(new URL("qualification/checkbox", hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await page.locator("#lifecycle").click();
      await expect(page.locator("#lifecycle-state")).toHaveText("true");
      await page
        .getByRole("button", { name: "Reset and remove", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).toHaveCount(0);
      await expect(page.locator("#lifecycle-state")).toHaveText("false");
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __checkboxResetListeners: unknown[] })
                .__checkboxResetListeners.length,
          ),
        )
        .toBe(4);
      await page
        .getByRole("button", { name: "Remount checkbox", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).not.toBeChecked();
      await expect
        .poll(() =>
          page.evaluate(
            () =>
              (window as unknown as { __checkboxResetListeners: unknown[] })
                .__checkboxResetListeners.length,
          ),
        )
        .toBe(5);
      await expect(page.locator('input[name="lifecycle"]')).toHaveCount(1);
    });
  });
