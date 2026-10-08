import { writeFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildPackagedConsumer } from "../helpers/packaged-consumer.js";

async function identity(page: Page) {
  return page.evaluate(() => {
    const ids = [...document.querySelectorAll("[id]")].map(
      (element) => element.id,
    );
    const missing = [
      ...document.querySelectorAll(
        "[for], [aria-labelledby], [aria-describedby], [aria-controls]",
      ),
    ].flatMap((element) =>
      ["for", "aria-labelledby", "aria-describedby", "aria-controls"].flatMap(
        (attribute) =>
          (element.getAttribute(attribute) ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .filter((id) => !document.getElementById(id)),
      ),
    );
    return { ids, missing };
  });
}

for (const custom of [false, true])
  test.describe(`actual packed catalog ${custom ? "custom" : "default"}`, () => {
    let app: ReturnType<typeof buildPackagedConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      // This includes independent pack/install, complete-tree ownership checks
      // and both bounded application check/build commands before server startup.
      test.setTimeout(600000);
      app = buildPackagedConsumer(custom);
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
    test.beforeEach(async ({ page }) => {
      await page.goto(hosted.baseURL);
      await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
      await expect(
        page.locator('[data-instance="packed-request"]'),
      ).toHaveAttribute("data-ready", "true");
    });
    test("full catalog hydrates from explicit dependencies and adopted source with live pure CSS", async ({
      page,
    }, info) => {
      await expect(
        page.getByRole("heading", {
          name: "Actual packed complete catalog",
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.getByLabel("Valid text", { exact: true })).toHaveValue(
        "packed-request",
      );
      await expect(
        page.getByRole("progressbar", { name: "Progress", exact: true }),
      ).not.toHaveAttribute("value");
      const primary = page
        .locator('.kit-button--primary[data-packed-revision="safe"]')
        .first();
      expect(
        await primary.evaluate(
          (element) => getComputedStyle(element).backgroundColor,
        ),
      ).toBe("rgb(12, 34, 56)");
      const references = await identity(page);
      expect(new Set(references.ids).size).toBe(references.ids.length);
      expect(references.missing).toEqual([]);
      expect(app.evidence.requested).toHaveLength(22);
      expect(app.evidence.cliRemoved).toBe(true);
      expect(app.evidence.values).toBe(60);
      expect(app.evidence.types).toBe(69);
      writeFileSync(
        info.outputPath("packed-provenance.json"),
        JSON.stringify({ ...app.evidence, references }, null, 2),
      );
    });
    test("local native fields and primitive state remain interactive after safe and refused upgrades", async ({
      page,
    }) => {
      const text = page.getByLabel("Valid text", { exact: true });
      await text.fill("packed edit");
      await expect(text).toHaveValue("packed edit");
      const toggle = page.getByRole("switch", {
        name: "Unchecked switch",
        exact: true,
      });
      await toggle.focus();
      await page.keyboard.press("Space");
      await expect(toggle).toHaveAttribute("aria-checked", "true");
      const check = page.getByRole("checkbox", {
        name: "Unchecked checkbox",
        exact: true,
      });
      await check.focus();
      await page.keyboard.press("Space");
      await expect(check).toHaveAttribute("aria-checked", "true");
      const disclosure = page
        .getByRole("button", { name: "Collapse", exact: true })
        .first();
      await disclosure.click();
      await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    });
    test("packed Dialog and distinct Alert Dialog retain real names focus and native dismissal policies", async ({
      page,
    }) => {
      const trigger = page
        .getByRole("button", { name: "Dialog", exact: true })
        .first();
      await trigger.click();
      const dialog = page.getByRole("dialog", {
        name: "Dialog title",
        exact: true,
      });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAccessibleDescription("Dialog description");
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(trigger).toBeFocused();
      const alertTrigger = page
        .getByRole("button", { name: "Alert dialog", exact: true })
        .first();
      await alertTrigger.click();
      const alert = page.getByRole("alertdialog", {
        name: "Alert title",
        exact: true,
      });
      await expect(alert).toBeVisible();
      await expect(alert).toHaveAccessibleDescription("Alert description");
      await alert.getByRole("button", { name: "Action", exact: true }).click();
      await expect(alert).toBeVisible();
      await alert.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(alert).toBeHidden();
      await expect(alertTrigger).toBeFocused();
    });
    test("packed floating Menu preserves keyboard selection disabled skipping and live relationships", async ({
      page,
    }) => {
      const trigger = page
        .getByRole("button", { name: "Menu", exact: true })
        .first();
      await trigger.focus();
      await page.keyboard.press("Enter");
      const menu = page.getByRole("menu", { name: "Menu", exact: true });
      await expect(menu).toBeVisible();
      await expect(
        menu.getByRole("menuitem", { name: "Choice", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        menu.getByRole("menuitemradio", { name: "Indicator A", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        menu.getByRole("menuitemradio", { name: "B", exact: true }),
      ).toBeFocused();
      const references = await identity(page);
      expect(references.missing).toEqual([]);
      expect(new Set(references.ids).size).toBe(references.ids.length);
      await page.keyboard.press("Enter");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.press("Enter");
      await expect(
        menu.getByRole("menuitemradio", { name: "Indicator B", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(
        menu.getByRole("menuitemradio", { name: "A", exact: true }),
      ).toHaveAttribute("aria-checked", "false");
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
    });
  });
