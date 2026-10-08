import { writeFileSync } from "node:fs";
import { buildFieldFormsConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Field forms ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildFieldFormsConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildFieldFormsConsumer(custom);
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
      const file = info.outputPath("field-candidate.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("field-candidate", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("all native refs labels value bindings event targets and convenience source parts work", async ({
      page,
    }) => {
      await expect(page.locator("#refs")).toHaveText(
        "DIV;DIV;LABEL;INPUT;TEXTAREA;SELECT;SPAN;SPAN;P",
      );
      await expect(page.locator("#convenience-refs")).toHaveText(
        "INPUT;TEXTAREA;SELECT",
      );
      await expect(page.locator("#owned-message-ref")).toHaveText("P");
      const input = page.getByRole("textbox", { name: "Address", exact: true });
      await page.locator('label[for="address-control"]').click();
      await expect(input).toBeFocused();
      await input.fill("edited@example.test");
      await page
        .getByRole("textbox", { name: "Body", exact: true })
        .fill("Edited body");
      await page
        .getByRole("combobox", { name: "Choice", exact: true })
        .selectOption("b");
      await expect(page.locator("#values")).toHaveText(
        "edited@example.test;Edited body;b; input 1; change 1",
      );
      await expect(page.locator("#text-convenience-control")).toHaveValue(
        "Text initial",
      );
      await expect(page.locator("#area-convenience-control")).toHaveValue(
        "Body initial",
      );
      await expect(page.locator("#select-convenience-control")).toHaveValue(
        "a",
      );
      await expect(page.locator(".kit-select-icon").first()).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await page
        .getByRole("button", { name: "Focus input ref", exact: true })
        .click();
      await expect(input).toBeFocused();
    });
    test("dynamic owned messages add and remove actual descriptions with no phantom ARIA target", async ({
      page,
    }) => {
      const input = page.locator("#address-control");
      await expect(input).toHaveAttribute(
        "aria-describedby",
        "address-message-help",
      );
      const helper = await page
        .locator("#address-message-help")
        .elementHandle();
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(input).toHaveAttribute(
        "aria-describedby",
        "address-message-help address-message-error",
      );
      await expect(input).toHaveAttribute("aria-invalid", "true");
      await expect(page.locator("#address-message-error")).toHaveText(
        "Current error",
      );
      expect(await helper!.evaluate((node) => node.isConnected)).toBe(true);
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(input).toHaveAttribute(
        "aria-describedby",
        "address-message-help",
      );
      await expect(input).not.toHaveAttribute("aria-invalid");
      await expect(page.locator("#address-message-error")).toHaveCount(0);
      expect(await helper!.evaluate((node) => node.isConnected)).toBe(true);
      const missing = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("[aria-describedby],label[for]"),
        ).flatMap((node) =>
          (
            node.getAttribute("aria-describedby") ??
            node.getAttribute("for") ??
            ""
          )
            .split(" ")
            .filter((id) => id && !document.getElementById(id)),
        ),
      );
      expect(missing).toEqual([]);
    });
    test("inherited disabled and required states preserve explicit native false overrides", async ({
      page,
    }) => {
      await expect(page.locator("#address-control")).toHaveAttribute(
        "required",
        "",
      );
      await expect(page.locator("#actual-override")).not.toBeDisabled();
      await expect(page.locator("#actual-override")).not.toHaveAttribute(
        "required",
      );
      await expect(page.locator("#actual-override")).not.toHaveAttribute(
        "aria-invalid",
      );
      await page
        .getByRole("button", { name: "Toggle field disabled", exact: true })
        .click();
      await expect(page.locator("#address-control")).toBeDisabled();
      await expect(page.locator("#address")).toHaveAttribute(
        "data-disabled",
        "true",
      );
      await expect(page.locator("#address .kit-field-surface")).toHaveAttribute(
        "data-disabled",
        "true",
      );
      await expect(page.locator("#address-message-help")).toHaveAttribute(
        "data-disabled",
        "true",
      );
      await expect(page.locator("#actual-override")).not.toBeDisabled();
      await page
        .getByRole("button", { name: "Toggle field disabled", exact: true })
        .click();
      await expect(page.locator("#address-control")).not.toBeDisabled();
      await page
        .getByRole("button", {
          name: "Change overridden control ID",
          exact: true,
        })
        .click();
      await expect(page.locator("#actual-override")).toHaveCount(0);
      await expect(page.locator("#override label")).toHaveAttribute(
        "for",
        "changed-override",
      );
      await page.locator("#override label").click();
      await expect(page.locator("#changed-override")).toBeFocused();
    });

    test("native and kit labels target actual controls and each description names only mounted paragraphs", async ({
      page,
    }) => {
      await expect(page.locator("#kit-refs")).toHaveText("BUTTON;BUTTON;DIV");
      for (const [root, control, role] of [
        ["field-checkbox", "field-checkbox-control", "checkbox"],
        ["field-switch", "field-switch-control", "switch"],
        ["field-radio", "field-radio-control", "radio"],
      ]) {
        await page.locator(`#${root} label`).click();
        await expect(page.locator(`#${control}`)).toBeFocused();
        await expect(page.locator(`#${control}`)).toHaveAttribute(
          "role",
          role!,
        );
      }
      await expect(page.locator("#kit-values")).toHaveText("false;false;a");
      await expect(
        page.getByRole("radiogroup", { name: "Plan", exact: true }),
      ).toHaveAttribute("id", "plan-group");
      const relationships = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("[aria-describedby],label[for]"),
        ).map((node) => ({
          tag: node.tagName,
          id: node.id,
          targets: (
            node.getAttribute("aria-describedby") ??
            node.getAttribute("for") ??
            ""
          )
            .split(" ")
            .filter(Boolean)
            .map((id) => ({
              id,
              tag: document.getElementById(id)?.tagName ?? null,
            })),
        })),
      );
      expect(relationships.length).toBeGreaterThan(10);
      for (const record of relationships)
        for (const target of record.targets) expect(target.tag).not.toBeNull();
    });

    test("required native validity and kit hidden fields preserve submission and disabled omission", async ({
      page,
    }) => {
      const input = page.locator("#address-control");
      await input.fill("");
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(input).toBeFocused();
      await expect(page.locator("#form-submits")).toHaveText("0");
      await input.fill("valid@example.test");
      await page.locator("#field-checkbox-control").click();
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(page.locator("#field-checkbox-control")).toBeFocused();
      await expect(page.locator("#form-submits")).toHaveText("0");
      await page.locator("#field-checkbox-control").press("Space");
      await page
        .getByRole("button", { name: "Clear field radio", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(page.locator("#field-radio-control")).toBeFocused();
      await expect(page.locator("#form-submits")).toHaveText("0");
      await page.locator("#field-radio-control").press("Space");
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(page.locator("#form-submits")).toHaveText("1");
      const data = JSON.parse(
        (await page.locator("#submitted").textContent())!,
      );
      expect(data).toEqual([
        ["address", "valid@example.test"],
        ["body", "Initial body"],
        ["choice", "a"],
        ["convenience-text", "Text initial"],
        ["convenience-area", "Body initial"],
        ["convenience-choice", "a"],
        ["agree", "on"],
        ["preference", "on"],
        ["plan", "a"],
      ]);
      for (const name of ["agree", "preference", "plan"])
        await expect(
          page.locator(`#candidate-form input[name="${name}"]`),
        ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Toggle field disabled", exact: true })
        .click();
      for (const id of [
        "address-control",
        "field-checkbox-control",
        "field-switch-control",
        "field-radio-control",
      ])
        await expect(page.locator(`#${id}`)).toBeDisabled();
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(page.locator("#form-submits")).toHaveText("2");
      const disabledData = JSON.parse(
        (await page.locator("#submitted").textContent())!,
      );
      expect(disabledData.map((entry: string[]) => entry[0])).toEqual([
        "body",
        "choice",
        "convenience-text",
        "convenience-area",
        "convenience-choice",
      ]);
    });

    test("native reset restores value bindings exactly like raw elements and honors cancellation with kit controls", async ({
      page,
    }) => {
      const input = page.locator("#address-control"),
        area = page.locator("#body-control"),
        choice = page.locator("#choice-control");
      await input.fill("edited@example.test");
      await area.fill("Edited body");
      await choice.selectOption("b");
      await page
        .getByRole("textbox", { name: "Raw native text", exact: true })
        .fill("edited@example.test");
      await page
        .getByRole("textbox", { name: "Raw native body", exact: true })
        .fill("Edited body");
      await page
        .getByRole("combobox", { name: "Raw native choice", exact: true })
        .selectOption("b");
      await page.locator("#field-checkbox-control").click();
      await page.locator("#field-switch-control").click();
      await page.getByRole("radio", { name: "Beta plan", exact: true }).click();
      await expect(page.locator("#kit-values")).toHaveText("false;false;b");
      await page
        .getByRole("button", { name: "Toggle reset cancellation", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset field form", exact: true })
        .click();
      await expect(input).toHaveValue("edited@example.test");
      await expect(area).toHaveValue("Edited body");
      await expect(choice).toHaveValue("b");
      await expect(page.locator("#kit-values")).toHaveText("false;false;b");
      await page
        .getByRole("button", { name: "Toggle reset cancellation", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset field form", exact: true })
        .click();
      await expect(input).toHaveValue("reset@example.test");
      await expect(area).toHaveValue("Reset body");
      await expect(choice).toHaveValue("a");
      await expect(page.locator("#kit-values")).toHaveText("true;true;a");
      await expect(page.locator("#values")).toHaveText(
        "reset@example.test;Reset body;a; input 1; change 1",
      );
      await expect(page.locator("#raw-values")).toHaveText(
        "reset@example.test;Reset body;a",
      );
      await expect(page.locator("#form-resets")).toHaveText("2");
    });

    test("current native form owner controls reset and submission for fields and coinstalled checkbox switch", async ({
      page,
    }) => {
      const input = page.locator("#address-control");
      await input.fill("owned@example.test");
      await page.locator("#field-checkbox-control").click();
      await page.locator("#field-switch-control").click();
      await page
        .getByRole("button", { name: "Toggle native form owner", exact: true })
        .click();
      for (const name of ["address", "agree", "preference"]) {
        expect(
          await page
            .locator(`input[name="${name}"]`)
            .evaluate((node) => (node as HTMLInputElement).form?.id),
        ).toBe("secondary-form");
      }
      await page
        .getByRole("button", { name: "Reset field form", exact: true })
        .click();
      await expect(input).toHaveValue("owned@example.test");
      await expect(page.locator("#kit-values")).toHaveText("false;false;a");
      await page
        .getByRole("button", { name: "Reset secondary form", exact: true })
        .click();
      await expect(input).toHaveValue("reset@example.test");
      await expect(page.locator("#kit-values")).toHaveText("true;true;a");
      const invalidControls = await page
        .locator("#candidate-form")
        .evaluate((node) =>
          Array.from((node as HTMLFormElement).elements)
            .filter(
              (control) =>
                "willValidate" in control &&
                (control as HTMLInputElement).willValidate &&
                !(control as HTMLInputElement).validity.valid,
            )
            .map((control) => ({
              id: control.id,
              value: (control as HTMLInputElement).value,
              valueMissing: (control as HTMLInputElement).validity.valueMissing,
              typeMismatch: (control as HTMLInputElement).validity.typeMismatch,
            })),
        );
      expect(invalidControls).toEqual([]);
      await page
        .getByRole("button", { name: "Submit field form", exact: true })
        .click();
      await expect(page.locator("#form-submits")).toHaveText("1");
      const data = JSON.parse(
        (await page.locator("#submitted").textContent())!,
      );
      expect(data.map((entry: string[]) => entry[0])).not.toContain("address");
      expect(data.map((entry: string[]) => entry[0])).not.toContain("agree");
      expect(data.map((entry: string[]) => entry[0])).not.toContain(
        "preference",
      );
    });

    test("required and message disappearance clear actual refs and all owned ARIA references before remount", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Toggle field required", exact: true })
        .click();
      await expect(page.locator("#address-control")).not.toHaveAttribute(
        "required",
      );
      await expect(page.locator("#address .kit-field-required")).toHaveCount(0);
      await expect(page.locator("#refs")).toHaveText(
        "DIV;DIV;LABEL;INPUT;TEXTAREA;SELECT;none;SPAN;P",
      );
      await page
        .getByRole("button", { name: "Toggle field helper", exact: true })
        .click();
      await expect(page.locator("#address-control")).not.toHaveAttribute(
        "aria-describedby",
      );
      await expect(page.locator("#address-message-help")).toHaveCount(0);
      await expect(page.locator("#owned-message-ref")).toHaveText("none");
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(page.locator("#address-control")).toHaveAttribute(
        "aria-describedby",
        "address-message-error",
      );
      await page
        .getByRole("button", { name: "Toggle field invalid", exact: true })
        .click();
      await expect(page.locator("#address-control")).not.toHaveAttribute(
        "aria-describedby",
      );
      const detached = await page.locator("#address-control").elementHandle();
      await page
        .getByRole("button", { name: "Toggle form field mount", exact: true })
        .click();
      await expect(page.locator("#address")).toHaveCount(0);
      expect(await detached!.evaluate((node) => node.isConnected)).toBe(false);
      await expect(page.locator("#refs")).toHaveText(
        "none;none;none;none;none;none;none;none;none",
      );
      await expect(page.locator("#kit-refs")).toHaveText("none;none;none");
      await expect(page.locator("#convenience-refs")).toHaveText(
        "none;none;none",
      );
      await page
        .getByRole("button", { name: "Toggle form field mount", exact: true })
        .click();
      await expect(page.locator("#address-control")).not.toHaveAttribute(
        "aria-describedby",
      );
      await expect(page.locator("#kit-refs")).toHaveText("BUTTON;BUTTON;DIV");
      await expect(page.locator("#address label")).toHaveAttribute(
        "for",
        "address-control",
      );
      const missing = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll("[aria-describedby],label[for]"),
        ).flatMap((node) =>
          (
            node.getAttribute("aria-describedby") ??
            node.getAttribute("for") ??
            ""
          )
            .split(" ")
            .filter((id) => id && !document.getElementById(id)),
        ),
      );
      expect(missing).toEqual([]);
    });

    test("twelve concurrent SSR states and initial hydration retain every label message and generated instance ID", async ({
      request,
      page,
    }, info) => {
      const responses = await Promise.all(
        Array.from({ length: 12 }, async (_, index) => {
          const invalid = index % 2 === 1,
            helper = index % 3 !== 0,
            value = `request${index}@example.test`,
            url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("invalid", String(invalid));
          url.searchParams.set("helper", String(helper));
          url.searchParams.set("value", value);
          const response = await request.get(url.href);
          expect(response.ok()).toBe(true);
          const html = await response.text();
          const input = html.match(
            /<input(?=[^>]*id="address-control")[^>]*>/,
          )?.[0];
          expect(input).toContain(`value="${value}"`);
          const descriptions = [
            ...(helper ? ["address-message-help"] : []),
            ...(invalid ? ["address-message-error"] : []),
          ];
          if (descriptions.length)
            expect(input).toContain(
              `aria-describedby="${descriptions.join(" ")}"`,
            );
          else expect(input).not.toContain("aria-describedby");
          expect(html.includes('id="address-message-error"')).toBe(invalid);
          expect(html.includes('id="address-message-help"')).toBe(helper);
          return { invalid, helper, value, html };
        }),
      );
      for (const invalid of [false, true])
        for (const helper of [false, true]) {
          const url = new URL(consumer.route, hosted.baseURL);
          url.searchParams.set("invalid", String(invalid));
          url.searchParams.set("helper", String(helper));
          const response = await request.get(url.href);
          const html = await response.text();
          const before = await page.evaluate((html) => {
            const doc = new DOMParser().parseFromString(html, "text/html");
            return [...doc.querySelectorAll("[data-auto-field]")].map(
              (root) => ({
                index: root.getAttribute("data-auto-field"),
                root: root.id,
                control: root.querySelector("input")!.id,
                message: root.querySelector("p")!.id,
              }),
            );
          }, html);
          await page.goto(url.href);
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          await expect(page.locator("#address-control")).toHaveValue(
            "initial@example.test",
          );
          await expect(page.locator("#form-submits")).toHaveText("0");
          await expect(page.locator("#form-resets")).toHaveText("0");
          await expect(page.locator("#kit-values")).toHaveText("true;true;a");
          for (const item of before) {
            const root = page.locator(`[data-auto-field="${item.index}"]`);
            await expect(root).toHaveAttribute("id", item.root);
            await expect(root.locator("input")).toHaveAttribute(
              "id",
              item.control,
            );
            await expect(root.locator("label")).toHaveAttribute(
              "for",
              item.control,
            );
            await expect(root.locator("input")).toHaveAttribute(
              "aria-describedby",
              item.message,
            );
            await expect(root.locator("p")).toHaveAttribute("id", item.message);
          }
          const ids = await page
            .locator("[id]")
            .evaluateAll((nodes) => nodes.map((node) => node.id));
          expect(new Set(ids).size).toBe(ids.length);
        }
      const file = info.outputPath("concurrent-field-ssr.json");
      writeFileSync(file, JSON.stringify(responses, null, 2));
      await info.attach("concurrent-field-ssr", {
        path: file,
        contentType: "application/json",
      });
    });
  });
