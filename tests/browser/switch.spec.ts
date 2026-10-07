import { writeFileSync } from "node:fs";
import { buildSwitchConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Switch ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildSwitchConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildSwitchConsumer(custom);
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
      await page.goto(new URL("qualification/switch", hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("pointer, keyboard, programmatic state and refs use actual primitive bindings", async ({
      page,
    }) => {
      const control = page.getByRole("switch", {
        name: "Enable feature",
        exact: true,
      });
      await expect(control).not.toBeChecked();
      await expect(
        page.getByRole("switch", { name: "Initially enabled", exact: true }),
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
      await expect(control).toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 3; clicks 1; last true",
      );
      await page
        .getByRole("button", { name: "Set state", exact: true })
        .click();
      await expect(control).not.toBeChecked();
      await expect(page.locator("#events")).toHaveText(
        "Callbacks 3; clicks 1; last true",
      );
      await expect(control).toHaveClass("kit-switch caller retained");
      await expect(control).toHaveAttribute("data-caller", "preserved");
      await expect(page.locator("#ref")).toHaveText("BUTTON");
      await page
        .getByRole("button", { name: "Focus bound switch", exact: true })
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
      await page.locator("#lifecycle").click();
      await expect(page.locator("#lifecycle-state")).toHaveText("true");
      await page
        .getByRole("button", { name: "Reset and remove", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).toHaveCount(0);
      await expect(page.locator('input[name="lifecycle"]')).toHaveCount(0);
      await page
        .getByRole("button", { name: "Remount switch", exact: true })
        .click();
      await expect(page.locator("#lifecycle")).toBeChecked();
      await expect(page.locator("#lifecycle-state")).toHaveText("true");
      await expect(page.locator('input[name="lifecycle"]')).toHaveCount(1);
    });
    test("source track, circular thumb, exact hooks, RTL and reduced motion render", async ({
      page,
    }) => {
      const control = page.locator("#control"),
        thumb = control.locator(".kit-switch-thumb");
      await expect(control).toHaveCSS("border-top-left-radius", "4px");
      await expect(thumb).toHaveCSS("border-top-left-radius", "999px");
      await expect(thumb).toHaveCSS("width", "14px");
      await expect(thumb).toHaveCSS("height", "14px");
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
        await tokenColor("--kit-color-border-strong"),
      );
      await expect(thumb).toHaveCSS(
        "background-color",
        await tokenColor("--kit-color-surface"),
      );
      const offset = () =>
        thumb.evaluate((node) => {
          const parent = node.closest(".kit-switch")!;
          return (
            Math.round(
              (node.getBoundingClientRect().left -
                parent.getBoundingClientRect().left) *
                100,
            ) / 100
          );
        });
      await expect.poll(offset).toBe(2);
      await control.click();
      await expect(control).toHaveCSS(
        "background-color",
        await tokenColor("--kit-color-primary"),
      );
      await expect.poll(offset).toBe(16);
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await expect.poll(offset).toBe(2);
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      await expect(control).toHaveCSS("background-color", "rgb(4, 5, 6)");
      await expect(control).toHaveCSS("border-top-left-radius", "8px 5px");
      await expect(thumb).toHaveCSS("background-color", "rgb(7, 8, 9)");
      await expect(thumb).toHaveCSS("border-top-left-radius", "2px");
      await expect(thumb).toHaveCSS("transition-duration", "0.3s");
      await expect(thumb).toHaveCSS("transition-timing-function", "linear");
      await control.click();
      await expect(control).toHaveCSS("background-color", "rgb(1, 2, 3)");
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(control).toHaveCSS("transition-duration", "0s");
      await expect(thumb).toHaveCSS("transition-duration", "0s");
      await expect(thumb).toBeVisible();
    });
  });
