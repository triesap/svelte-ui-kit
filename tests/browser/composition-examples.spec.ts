import { writeFileSync } from "node:fs";
import { buildCompositionExamplesConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`app-owned examples ${custom ? "custom" : "default"}`, () => {
    let app: ReturnType<typeof buildCompositionExamplesConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      app = buildCompositionExamplesConsumer(custom);
      try {
        hosted = await startFixtureServer({ handler: app.handler });
      } catch (error) {
        app.cleanup();
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
        app?.cleanup();
      }
    });
    test.beforeEach(async ({ page }, info) => {
      writeFileSync(
        info.outputPath("installed-examples.json"),
        JSON.stringify(app.evidence, null, 2),
      );
      await page.goto(new URL(app.route, hosted.baseURL).href);
      await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
    });
    test("independent keyboard disclosures and semantic local links", async ({
      page,
    }) => {
      const first = page.getByRole("button", {
        name: "Who owns the source?",
        exact: true,
      });
      const second = page.getByRole("button", {
        name: "Who owns interaction?",
        exact: true,
      });
      await expect(first).toHaveAttribute("aria-expanded", "false");
      await first.focus();
      await page.keyboard.press("Enter");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.getByText("The application owns generated source.", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(second).toHaveAttribute("aria-expanded", "false");
      await second.focus();
      await page.keyboard.press("Space");
      await expect(second).toHaveAttribute("aria-expanded", "true");
      await expect(first).toHaveAttribute("aria-expanded", "true");
      const anchor = page.getByRole("link", { name: "Read ownership details" });
      await expect(anchor).toHaveAttribute("href", "#examples-details");
      await anchor.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#examples-details$/);
      const router = page.getByRole("link", {
        name: "Go to the application form",
      });
      await expect(router).toHaveAttribute("href", "#examples-form");
      await router.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/#examples-form$/);
    });
    test("native form submits application-owned alert and status feedback", async ({
      page,
    }) => {
      await page
        .getByRole("textbox", { name: "Project title" })
        .fill("Example app");
      const save = page.getByRole("button", {
        name: "Save application settings",
      });
      await save.focus();
      await page.keyboard.press("Enter");
      await expect(page.getByRole("alert")).toHaveText(
        "Accept the source ownership agreement.",
      );
      const checkbox = page.getByRole("checkbox", {
        name: "Accept source ownership",
      });
      await checkbox.focus();
      await page.keyboard.press("Space");
      await expect(checkbox).toHaveAttribute("aria-checked", "true");
      await save.click();
      await expect(page.getByRole("alert")).toHaveCount(0);
      await expect(page.getByRole("status")).toHaveText(
        "Saved Example app; consent yes.",
      );
      await expect(page.getByRole("status")).toHaveAttribute(
        "aria-live",
        "polite",
      );
      await expect(page.locator('input[name="consent"]')).toHaveCount(1);
    });
    test("portaled dialog inherits live application theme and restores keyboard focus", async ({
      page,
    }) => {
      const trigger = page.getByRole("button", {
        name: "Review source ownership",
      });
      await trigger.focus();
      await page.keyboard.press("Enter");
      const dialog = page.getByRole("dialog", { name: "Application review" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-describedby", /.+/);
      await expect(
        page.locator("#examples-portal").getByRole("dialog"),
      ).toHaveCount(1);
      expect(
        await dialog.evaluate((node) => getComputedStyle(node).backgroundColor),
      ).toBe("rgb(240, 245, 250)");
      await page.getByRole("button", { name: "Switch dialog theme" }).click();
      expect(
        await dialog.evaluate((node) => getComputedStyle(node).backgroundColor),
      ).toBe("rgb(20, 30, 40)");
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  });
