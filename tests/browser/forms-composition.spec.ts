import { writeFileSync } from "node:fs";
import { buildFormsCompositionConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import type { Page } from "@playwright/test";
async function state(page: Page) {
  return JSON.parse(await page.locator("#state").innerText());
}
async function formData(page: Page) {
  return page
    .locator("#combined-form")
    .evaluate((form) => Array.from(new FormData(form as HTMLFormElement)));
}
const original = [
  ["title", "initial"],
  ["accepted", "yes"],
  ["mode", "a"],
  ["enabled", "on"],
  ["outside", "yes"],
];
for (const custom of [false, true])
  test.describe(`combined forms ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildFormsCompositionConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildFormsCompositionConsumer(custom);
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
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
    });
    test("combined native submission retains exact values submitter and one associated input per control", async ({
      page,
    }) => {
      expect(await formData(page)).toEqual(original);
      for (const name of ["title", "accepted", "mode", "enabled", "outside"]) {
        const input = page.locator(`input[name="${name}"]`);
        await expect(input).toHaveCount(1);
        expect(
          await input.evaluate((node) => (node as HTMLInputElement).form?.id),
        ).toBe("combined-form");
      }
      const input = page.getByRole("textbox", { name: "Title", exact: true });
      const id = await input.getAttribute("id");
      await expect(
        page.locator("label").filter({ hasText: /^Title$/ }),
      ).toHaveAttribute("for", id!);
      const described = await input.getAttribute("aria-describedby");
      await expect(page.locator(`p[id="${described}"]`)).toHaveText(
        "Title hint",
      );
      await page.locator("#plain").click();
      await page.locator("#plain").press("Enter");
      expect((await state(page)).clicks).toBe(2);
      expect((await state(page)).submits).toBe(0);
      await page.locator("#save").click();
      expect((await state(page)).submits).toBe(1);
      expect(JSON.parse(await page.locator("#submitted").innerText())).toEqual([
        ...original.slice(0, 4),
        ["action", "save"],
        original[4],
      ]);
    });
    test("native reset restores all initial values and preserves current checkbox indeterminate state", async ({
      page,
    }) => {
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .fill("edited");
      await page.getByRole("checkbox", { name: "Accept terms" }).click();
      await page.getByRole("radio", { name: "Mode B", exact: true }).click();
      await page.getByRole("switch", { name: "Enable notifications" }).click();
      await page.getByRole("checkbox", { name: "External consent" }).click();
      await page.locator("#toggle-indeterminate").click();
      expect((await state(page)).mode).toBe("b");
      expect((await state(page)).indeterminate).toBe(true);
      await page.locator("#reset-combined").click();
      await expect
        .poll(async () => {
          const current = await state(page);
          return [
            current.title,
            current.accepted,
            current.mode,
            current.enabled,
            current.outside,
            current.indeterminate,
          ];
        })
        .toEqual(["initial", true, "a", true, true, true]);
      expect(await formData(page)).toEqual(original);
      expect((await state(page)).resets).toBe(1);
      expect(
        await page
          .locator('input[name="accepted"]')
          .evaluate((node) => (node as HTMLInputElement).indeterminate),
      ).toBe(true);
    });
    test("application invoked cancelled reset keeps actual native and controlled values aligned", async ({
      page,
    }, info) => {
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .fill("retained");
      await page.getByRole("radio", { name: "Mode B", exact: true }).click();
      await page.getByRole("switch", { name: "Enable notifications" }).click();
      await page.getByRole("checkbox", { name: "Accept terms" }).click();
      await page.getByRole("checkbox", { name: "External consent" }).click();
      await page.locator("#toggle-cancel-reset").click();
      await page
        .getByRole("textbox", { name: "Raw native title", exact: true })
        .fill("retained");
      await page.locator("#native-programmatic-reset").click();
      const before = await formData(page);
      await page.locator("#programmatic-reset").click();
      await page.evaluate(
        () =>
          new Promise<void>((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
          ),
      );
      const diagnostic = {
        state: await state(page),
        resetEvent: JSON.parse(await page.locator("#reset-event").innerText()),
        kitValue: await page
          .getByRole("textbox", { name: "Title", exact: true })
          .inputValue(),
        nativeValue: await page
          .getByRole("textbox", { name: "Raw native title", exact: true })
          .inputValue(),
        before,
        after: await formData(page),
      };
      const diagnosticFile = info.outputPath("reset-diagnostic.json");
      writeFileSync(diagnosticFile, JSON.stringify(diagnostic, null, 2));
      await info.attach("reset-diagnostic", {
        path: diagnosticFile,
        contentType: "application/json",
      });
      await expect(
        page.getByRole("textbox", { name: "Title", exact: true }),
      ).toHaveValue("retained");
      expect(await formData(page)).toEqual(before);
      expect((await state(page)).mode).toBe("b");
      expect((await state(page)).enabled).toBe(false);
      expect((await state(page)).accepted).toBe(false);
      expect((await state(page)).outside).toBe(false);
      expect((await state(page)).resets).toBe(1);
    });
    test("trusted reset cancellation matches the pinned raw Svelte value binding boundary", async ({
      page,
    }, info) => {
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .fill("retained");
      await page
        .getByRole("textbox", { name: "Raw native title", exact: true })
        .fill("retained");
      await page.getByRole("radio", { name: "Mode B", exact: true }).click();
      await page.getByRole("switch", { name: "Enable notifications" }).click();
      await page.getByRole("checkbox", { name: "Accept terms" }).click();
      await page.getByRole("checkbox", { name: "External consent" }).click();
      await page.locator("#toggle-cancel-reset").click();
      await page.locator("#native-reset").click();
      await page.locator("#reset-combined").click();
      await expect(
        page.getByRole("textbox", { name: "Raw native title", exact: true }),
      ).toHaveValue("initial");
      await expect(
        page.getByRole("textbox", { name: "Title", exact: true }),
      ).toHaveValue("initial");
      const event = JSON.parse(await page.locator("#reset-event").innerText());
      expect(event).toEqual({ cancelable: true, prevented: true });
      const current = await state(page);
      expect(current.mode).toBe("b");
      expect(current.enabled).toBe(false);
      expect(current.accepted).toBe(false);
      expect(current.outside).toBe(false);
      expect(current.resets).toBe(1);
      const file = info.outputPath("trusted-reset-boundary.json");
      writeFileSync(
        file,
        JSON.stringify(
          {
            event,
            current,
            formData: await formData(page),
            nativeValue: await page
              .getByRole("textbox", { name: "Raw native title", exact: true })
              .inputValue(),
          },
          null,
          2,
        ),
      );
      await info.attach("trusted-reset-boundary", {
        path: file,
        contentType: "application/json",
      });
    });
    test("combined required validity blocks native submit and disabled controls omit values", async ({
      page,
    }) => {
      await page.locator("#toggle-required").click();
      for (const invalid of ["title", "accepted", "mode", "enabled"]) {
        if (invalid === "title")
          await page
            .getByRole("textbox", { name: "Title", exact: true })
            .fill("");
        else if (invalid === "accepted")
          await page.getByRole("checkbox", { name: "Accept terms" }).click();
        else if (invalid === "mode") await page.locator("#clear-mode").click();
        else
          await page
            .getByRole("switch", { name: "Enable notifications" })
            .click();
        expect(
          await page
            .locator(`input[name="${invalid}"]`)
            .evaluate((node) => (node as HTMLInputElement).checkValidity()),
        ).toBe(false);
        await page.locator("#save").click();
        expect((await state(page)).submits).toBe(0);
        await page.locator("#reset-combined").click();
        await expect.poll(async () => await formData(page)).toEqual(original);
      }
      await page.locator("#toggle-disabled").click();
      for (const name of ["title", "accepted", "mode", "enabled", "outside"])
        await expect(page.locator(`input[name="${name}"]`)).toBeDisabled();
      expect(await formData(page)).toEqual([]);
      expect(
        await page
          .locator("#combined-form")
          .evaluate((node) => (node as HTMLFormElement).checkValidity()),
      ).toBe(true);
      await page.locator("#save").click();
      expect((await state(page)).submits).toBe(1);
      expect(JSON.parse(await page.locator("#submitted").innerText())).toEqual([
        ["action", "save"],
      ]);
    });
    test("loading and disabled submit buttons cannot activate by pointer or keyboard", async ({
      page,
    }) => {
      await page.locator("#toggle-loading").click();
      await expect(page.locator("#save")).toBeDisabled();
      await expect(page.locator("#save")).toHaveAccessibleName(
        "Saving combined",
      );
      await expect(page.locator("#save")).toHaveAttribute("aria-busy", "true");
      await expect(page.locator("#save .kit-spinner")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .press("Enter");
      expect((await state(page)).submits).toBe(0);
      await page.locator("#toggle-loading").click();
      await page.locator("#toggle-button-disabled").click();
      await expect(page.locator("#save")).toBeDisabled();
      await page
        .getByRole("textbox", { name: "Title", exact: true })
        .press("Enter");
      expect((await state(page)).submits).toBe(0);
      await page.locator("#toggle-button-disabled").click();
      await page.locator("#save").press("Enter");
      expect((await state(page)).submits).toBe(1);
    });
  });
