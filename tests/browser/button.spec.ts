import { writeFileSync } from "node:fs";
import { buildButtonConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Button ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildButtonConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildButtonConsumer(custom);
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
      await page.goto(new URL("qualification/button", hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("native click, Enter and Space forward once without submitting by default", async ({
      page,
    }) => {
      const action = page.locator("#action");
      await expect(action).toHaveAttribute("type", "button");
      await action.click();
      await action.press("Enter");
      await action.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 3; submits 0; resets 0",
      );
      await expect(action).toHaveClass(
        "kit-button kit-button--primary kit-button--md caller retained",
      );
      await expect(action).toHaveAttribute("data-caller", "preserved");
      await expect(action).toHaveAttribute("title", "Native title");
      await expect(page.locator("#ref-proof")).toHaveText("BUTTON");
      await page
        .getByRole("button", { name: "Focus bound button", exact: true })
        .click();
      await expect(action).toBeFocused();
    });
    test("explicit submit and reset preserve actual native form data", async ({
      page,
    }) => {
      const input = page.getByRole("textbox", { name: "Draft", exact: true });
      await input.fill("edited");
      await page.locator("#submit").click();
      await expect(page.locator("#submitted")).toHaveText(
        "draft=edited&intent=save",
      );
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 0; submits 1; resets 0",
      );
      await page.locator("#reset").click();
      await expect(input).toHaveValue("initial");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 0; submits 1; resets 1",
      );
      await page.locator("#submit").press("Enter");
      await expect(page.locator("#submitted")).toHaveText(
        "draft=initial&intent=save",
      );
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 0; submits 2; resets 1",
      );
    });
    test("disabled and loading guard activation, retain children and expose one loading name", async ({
      page,
    }) => {
      const action = page.locator("#action");
      await page
        .getByRole("button", { name: "Toggle disabled", exact: true })
        .click();
      await expect(action).toBeDisabled();
      await action.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 0; submits 0; resets 0",
      );
      await page
        .getByRole("button", { name: "Toggle disabled", exact: true })
        .click();
      await expect(action).toBeEnabled();
      await page
        .getByRole("button", { name: "Toggle loading", exact: true })
        .click();
      await expect(action).toBeDisabled();
      await expect(action).toHaveAttribute("aria-busy", "true");
      await expect(action).toHaveAccessibleName("Loading");
      await expect(action.locator(".kit-button-content")).toHaveText(
        "Save draft",
      );
      await expect(action.locator(".kit-button-content")).toBeHidden();
      await expect(action.locator(".kit-spinner")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(page.getByRole("status")).toHaveCount(0);
      await action.evaluate((node) => (node as HTMLButtonElement).click());
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 0; submits 0; resets 0",
      );
      await page
        .getByRole("button", { name: "Change loading label", exact: true })
        .click();
      await expect(action).toHaveAccessibleName("Saving changes");
      await expect(action.locator(".kit-button-loading-label")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Toggle loading", exact: true })
        .click();
      await expect(action).toBeEnabled();
      await expect(action).not.toHaveAttribute("aria-busy", "true");
      await expect(action).toHaveAccessibleName("Save draft");
      await expect(action.locator(".kit-button-content")).toBeVisible();
      await expect(action.locator(".kit-spinner")).toHaveCount(0);
      await action.click();
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; submits 0; resets 0",
      );
    });
    test("variant, size, keyboard focus, inherited radius and exact theme hooks render", async ({
      page,
    }) => {
      const action = page.locator("#action");
      await expect(action).toHaveCSS("border-top-left-radius", "9px");
      await expect(action).toHaveCSS("min-height", "40px");
      await page
        .getByRole("button", { name: "Cycle variant", exact: true })
        .click();
      await expect(action).toHaveClass(/kit-button--secondary/);
      await page
        .getByRole("button", { name: "Cycle variant", exact: true })
        .click();
      await expect(action).toHaveClass(/kit-button--ghost/);
      await page
        .getByRole("button", { name: "Cycle variant", exact: true })
        .click();
      await expect(action).toHaveClass(/kit-button--primary/);
      await page
        .getByRole("button", { name: "Cycle size", exact: true })
        .click();
      await expect(action).toHaveCSS("min-height", "32px");
      await page
        .getByRole("button", { name: "Cycle size", exact: true })
        .click();
      await expect(action).toHaveCSS("min-height", "48px");
      await page
        .getByRole("button", { name: "Toggle customization", exact: true })
        .click();
      await expect(action).toHaveCSS("border-top-left-radius", "12px 6px");
      await expect(action).toHaveCSS("background-color", "rgb(1, 2, 3)");
      await expect(action).toHaveCSS("color", "rgb(250, 251, 252)");
      await expect(page.locator("#busy-default .kit-spinner")).toHaveCSS(
        "width",
        "25px",
      );
      await expect(page.locator("#busy-default .kit-spinner-mark")).toHaveCSS(
        "width",
        "25px",
      );
      await expect(page.locator("#busy-default")).toHaveAccessibleName(
        "Loading",
      );
      await page.getByRole("textbox", { name: "Draft", exact: true }).focus();
      await page.keyboard.press("Tab");
      await expect(action).toBeFocused();
      expect(
        await action.evaluate((node) => node.matches(":focus-visible")),
      ).toBe(true);
      await expect(action).toHaveCSS("outline-width", "4px");
      await expect(action).toHaveCSS("outline-offset", "5px");
    });
  });
