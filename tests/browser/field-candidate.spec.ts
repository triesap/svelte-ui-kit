import { writeFileSync } from "node:fs";
import { buildFieldCandidate } from "../helpers/field-candidate.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
let consumer: ReturnType<typeof buildFieldCandidate>;
let hosted: FixtureServer;
test.beforeAll(async () => {
  test.setTimeout(240000);
  consumer = buildFieldCandidate();
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
  await expect(page.locator("#select-convenience-control")).toHaveValue("a");
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
  const helper = await page.locator("#address-message-help").elementHandle();
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
      (node.getAttribute("aria-describedby") ?? node.getAttribute("for") ?? "")
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
    .getByRole("button", { name: "Change overridden control ID", exact: true })
    .click();
  await expect(page.locator("#actual-override")).toHaveCount(0);
  await expect(page.locator("#override label")).toHaveAttribute(
    "for",
    "changed-override",
  );
  await page.locator("#override label").click();
  await expect(page.locator("#changed-override")).toBeFocused();
});
