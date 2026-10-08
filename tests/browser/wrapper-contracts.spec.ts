import { writeFileSync } from "node:fs";
import { buildWrapperConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import type { Page } from "@playwright/test";

const refNames = [
  "Alert",
  "AlertDialogTrigger",
  "AlertDialogOverlay",
  "AlertDialogContent",
  "AlertDialogTitle",
  "AlertDialogDescription",
  "AlertDialogAction",
  "AlertDialogCancel",
  "Anchor",
  "Avatar",
  "Badge",
  "Button",
  "Card",
  "Checkbox",
  "CollapsibleRoot",
  "CollapsibleTrigger",
  "CollapsibleContent",
  "DialogTrigger",
  "DialogOverlay",
  "DialogContent",
  "DialogTitle",
  "DialogDescription",
  "DialogClose",
  "FieldRoot",
  "FieldSurface",
  "FieldLabel",
  "FieldMessage",
  "FieldRequired",
  "TextInput",
  "TextArea",
  "NativeSelect",
  "SelectIcon",
  "TextField",
  "TextAreaField",
  "SelectField",
  "MenuTrigger",
  "MenuContent",
  "MenuItem",
  "MenuRadioGroup",
  "MenuRadioItem",
  "MenuItemIndicator",
  "Progress",
  "RadioGroup",
  "RadioItem",
  "RouterLink",
  "Separator",
  "Skeleton",
  "Status",
  "Switch",
  "TabsRoot",
  "TabsList",
  "TabsTrigger",
  "TabsContent",
];
const boundState = [
  "Checkbox.checked",
  "Checkbox.indeterminate",
  "CollapsibleRoot.open",
  "DialogRoot.open",
  "AlertDialogRoot.open",
  "MenuRoot.open",
  "MenuRadioGroup.value",
  "RadioGroup.value",
  "Switch.checked",
  "TabsRoot.value",
  ...[
    "TextInput",
    "TextArea",
    "NativeSelect",
    "TextField",
    "TextAreaField",
    "SelectField",
  ].map((name) => `${name}.value`),
];
async function json(page: Page, id: string) {
  return JSON.parse(await page.locator(`#${id}`).innerText());
}
async function overlays(page: Page) {
  await page
    .getByRole("button", { name: "Shared Dialog", exact: true })
    .click();
  await expect(page.locator('[data-ref="DialogContent"]')).toBeVisible();
  await page
    .getByRole("button", { name: "Close shared Dialog", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Shared Alert Dialog", exact: true })
    .click();
  await expect(page.locator('[data-ref="AlertDialogContent"]')).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel shared Alert", exact: true })
    .click();
  await page.getByRole("button", { name: "Shared Menu", exact: true }).click();
  await expect(page.locator("[data-delegated-content]")).toBeVisible();
  await expect(page.locator("[data-floating-wrapper]")).toHaveAttribute(
    "data-bits-floating-content-wrapper",
    "",
  );
  const wrapper = page.locator("[data-floating-wrapper]");
  const content = page.locator("[data-delegated-content]");
  const actualWrapperPosition = await wrapper.evaluate(
    (node) => getComputedStyle(node).position,
  );
  expect(await wrapper.getAttribute("style")).toContain(
    "--bits-floating-anchor-width",
  );
  expect(await content.getAttribute("role")).toBe("menu");
  await page
    .getByRole("menuitemradio", { name: "Radio choice A", exact: false })
    .click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Native shared Menu", exact: true })
    .click();
  await expect(page.locator("[data-native-delegated-content]")).toBeVisible();
  const nativeWrapperPosition = await page
    .locator("[data-native-floating-wrapper]")
    .evaluate((node) => getComputedStyle(node).position);
  expect(actualWrapperPosition).toBe(nativeWrapperPosition);
  expect(["fixed", "absolute"]).toContain(nativeWrapperPosition);
  await page.keyboard.press("Escape");
}
for (const custom of [false, true])
  test.describe(`shared wrappers ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildWrapperConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildWrapperConsumer(custom);
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
    test.afterEach(async ({ page }, info) => {
      expect(page.isClosed()).toBe(false);
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
    });
    for (const bindings of ["ordinary", "functions"]) {
      test(`${bindings} all advertised state and ref bindings survive real child updates and delegated floating snippets`, async ({
        page,
      }) => {
        await page.goto(
          new URL(`${consumer.route}?bindings=${bindings}`, hosted.baseURL)
            .href,
        );
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        await expect(
          page.getByText("Badge child", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Card child", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Message child", { exact: true }),
        ).toBeVisible();
        await page.locator("#parent-values").click();
        await expect(
          page.getByRole("switch", { name: "Shared Switch" }),
        ).toHaveAttribute("aria-checked", "true");
        await expect(
          page.getByRole("radio", { name: "Radio B", exact: true }),
        ).toHaveAttribute("aria-checked", "true");
        await expect(page.getByRole("tab", { name: "Tab B" })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await expect(
          page.getByRole("button", { name: "Shared Collapsible", exact: true }),
        ).toHaveAttribute("aria-expanded", "true");
        for (const name of ["TextInput", "TextField"])
          await expect(
            page.getByRole("textbox", { name: `Shared ${name}`, exact: true }),
          ).toHaveValue("parent-input");
        for (const name of ["TextArea", "TextAreaField"])
          await expect(
            page.getByRole("textbox", { name: `Shared ${name}`, exact: true }),
          ).toHaveValue("parent-area");
        for (const name of ["NativeSelect", "SelectField"])
          await expect(
            page.getByRole("combobox", { name: `Shared ${name}`, exact: true }),
          ).toHaveValue("b");
        await page.getByRole("switch", { name: "Shared Switch" }).click();
        await page.getByRole("checkbox", { name: "Shared Checkbox" }).click();
        await page.getByRole("checkbox", { name: "Shared Checkbox" }).click();
        await page.getByRole("radio", { name: "Radio A", exact: true }).click();
        await page.getByRole("tab", { name: "Tab A" }).click();
        await page
          .getByRole("button", { name: "Shared Collapsible", exact: true })
          .click();
        for (const name of [
          "TextInput",
          "TextField",
          "TextArea",
          "TextAreaField",
        ])
          await page
            .getByRole("textbox", { name: `Shared ${name}`, exact: true })
            .fill(`child-${name}`);
        for (const name of ["NativeSelect", "SelectField"])
          await page
            .getByRole("combobox", { name: `Shared ${name}`, exact: true })
            .selectOption("a");
        await overlays(page);
        const values = await json(page, "values");
        expect(values.Switch).toBe(false);
        expect(values.RadioGroup).toBe("a");
        expect(values.TabsRoot).toBe("a");
        expect(values.CollapsibleRoot).toBe(false);
        expect(values.MenuRadioGroup).toBe("a");
        for (const name of [
          "TextInput",
          "TextField",
          "TextArea",
          "TextAreaField",
        ])
          expect(values[name]).toBe(`child-${name}`);
        expect(values.DialogRoot).toBe(false);
        expect(values.AlertDialogRoot).toBe(false);
        expect(values.MenuRoot).toBe(false);
        const observed = await json(page, "observed");
        expect(Object.keys(observed).sort()).toEqual([...refNames].sort());
        if (bindings === "functions") {
          const setters = await json(page, "setters");
          for (const key of [
            ...refNames.map((name) => `${name}.ref`),
            ...boundState,
          ])
            expect(setters[key], key).toBeGreaterThan(0);
        }
        await page.locator("#toggle-mounted").click();
        expect(
          Object.values(await json(page, "refs")).every(
            (value) => value === null,
          ),
        ).toBe(true);
        await page.locator("#toggle-mounted").click();
        await expect(
          page.getByRole("switch", { name: "Shared Switch" }),
        ).toBeVisible();
      });
      test(`${bindings} caller cancellation preserves pinned event ordering and retained controlled state`, async ({
        page,
      }) => {
        await page.goto(
          new URL(`${consumer.route}?bindings=${bindings}`, hosted.baseURL)
            .href,
        );
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "true",
        );
        await page.locator("#toggle-cancel").click();
        await page.getByRole("switch", { name: "Shared Switch" }).click();
        expect((await json(page, "values")).Switch).toBe(false);
        expect((await json(page, "events")).clicks).toBe(1);
        await page.locator("#toggle-cancel").click();
        await page.getByRole("switch", { name: "Shared Switch" }).click();
        expect((await json(page, "values")).Switch).toBe(true);
        expect((await json(page, "events")).clicks).toBe(2);
        await page
          .getByRole("button", { name: "Shared Menu", exact: true })
          .click();
        await page
          .getByRole("menuitem", { name: "Shared choice", exact: true })
          .click();
        expect((await json(page, "events")).selections).toBe(1);
        expect((await json(page, "values")).MenuRoot).toBe(true);
        await page.keyboard.press("Escape");
      });
    }
  });
