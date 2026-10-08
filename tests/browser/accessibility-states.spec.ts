import { writeFileSync } from "node:fs";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildAccessibilityConsumer } from "../helpers/generated-consumer.js";

for (const custom of [false, true])
  test.describe(`accessible catalog ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildAccessibilityConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildAccessibilityConsumer(custom);
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
      expect(page.isClosed()).toBe(false);
      writeFileSync(
        info.outputPath("installed-artifact.json"),
        JSON.stringify(consumer.evidence, null, 2),
      );
    });
    for (const direction of ["ltr", "rtl"])
      test.describe(direction, () => {
        test.beforeEach(async ({ page }) => {
          await page.goto(
            new URL(`${consumer.route}?dir=${direction}`, hosted.baseURL).href,
          );
          await expect(page.locator("main")).toHaveAttribute(
            "data-ready",
            "true",
          );
        });
        test("native accessibility tree and direct labels expose named controls and feedback", async ({
          page,
        }, info) => {
          const cdp = await page.context().newCDPSession(page);
          const tree = await cdp.send("Accessibility.getFullAXTree");
          writeFileSync(
            info.outputPath("native-accessibility-tree.json"),
            JSON.stringify(tree, null, 2),
          );
          const nodes = tree.nodes.filter((node) => !node.ignored);
          const interactive = nodes.filter((node) =>
            [
              "button",
              "checkbox",
              "switch",
              "radio",
              "tab",
              "combobox",
              "textbox",
              "progressbar",
              "image",
              "link",
            ].includes(String(node.role?.value)),
          );
          expect(interactive.length).toBeGreaterThan(20);
          expect(
            interactive.filter(
              (node) => !String(node.name?.value ?? "").trim(),
            ),
          ).toEqual([]);
          for (const [role, name] of [
            ["link", "Reference link"],
            ["link", "Application link"],
            ["checkbox", "Agree"],
            ["switch", "Notifications"],
            ["radiogroup", "Color"],
            ["tablist", "Views"],
            ["progressbar", "Upload"],
            ["image", "Profile"],
          ])
            expect(
              nodes.some(
                (node) =>
                  node.role?.value === role && node.name?.value === name,
              ),
              `${role} ${name}`,
            ).toBe(true);
          await expect(
            page.getByRole("textbox", { name: "Name", exact: true }),
          ).toHaveAttribute("required", "");
          expect(
            nodes.some(
              (node) =>
                node.role?.value === "textbox" &&
                node.name?.value === "Name" &&
                node.properties?.some(
                  (property) =>
                    property.name === "required" &&
                    property.value.value === true,
                ),
            ),
          ).toBe(true);
          await expect(
            page.getByRole("textbox", { name: "Invalid name", exact: true }),
          ).toHaveAttribute("aria-invalid", "true");
          await expect(
            page.getByRole("combobox", { name: "Choice", exact: true }),
          ).toHaveCount(1);
          await expect(
            page.getByRole("progressbar", { name: "Upload" }),
          ).toHaveAttribute("value", "25");
          await expect(
            page.getByRole("button", { name: "Loading", exact: true }),
          ).toHaveAttribute("aria-busy", "true");
          await expect(
            page.getByRole("button", { name: "Loading", exact: true }),
          ).toBeDisabled();
          await expect(
            page.getByRole("status").filter({ hasText: "Loading content" }),
          ).toHaveCount(1);
          await expect(
            page.locator('.kit-spinner[aria-hidden="true"]'),
          ).toHaveCount(2);
          await cdp.detach();
        });
        test("directional keys skip disabled items and move the native switch thumb correctly", async ({
          page,
        }, info) => {
          const forward = direction === "rtl" ? "ArrowLeft" : "ArrowRight";
          await page.locator("#radio-a").press(forward);
          await expect(page.locator("#radio-b")).toBeFocused();
          await expect(page.locator("#radio-b")).toBeChecked();
          await page.locator("#tab-a").press(forward);
          await expect(page.locator("#tab-b")).toBeFocused();
          await expect(page.locator("#tab-b")).toHaveAttribute(
            "aria-selected",
            "true",
          );
          const thumb = page.locator("#notifications .kit-switch-thumb");
          const initial = await thumb.evaluate(
            (node) => node.getBoundingClientRect().x,
          );
          await page.locator("#notifications").press("Space");
          await expect(page.locator("#notifications")).toBeChecked();
          await expect
            .poll(
              async () =>
                ((await thumb.evaluate(
                  (node) => node.getBoundingClientRect().x,
                )) -
                  initial) *
                (direction === "rtl" ? -1 : 1),
            )
            .toBeGreaterThan(13);
          await page.locator("#agree").press("Space");
          await expect(page.locator("#agree")).toBeChecked();
          await page.locator("#menu-trigger").press("ArrowDown");
          await expect(page.locator("#menu-first")).toBeFocused();
          await page.keyboard.press("ArrowDown");
          await expect(page.locator("#menu-last")).toBeFocused();
          await page.keyboard.press("Escape");
          await expect(page.locator("#menu-trigger")).toBeFocused();
          writeFileSync(
            info.outputPath("directional-state.json"),
            JSON.stringify(
              {
                direction,
                thumbBefore: initial,
                thumbAfter: await thumb.evaluate(
                  (node) => node.getBoundingClientRect().x,
                ),
              },
              null,
              2,
            ),
          );
        });
        test("keyboard focus stays visible and named modal focus returns to live triggers", async ({
          page,
        }, info) => {
          await page.locator("#primary").focus();
          await page.keyboard.press("Tab");
          await expect(page.locator("#secondary")).toBeFocused();
          await expect(page.locator("#secondary")).toHaveCSS(
            "outline-style",
            "solid",
          );
          await expect(page.locator("#secondary")).toHaveCSS(
            "outline-width",
            "2px",
          );
          await page.locator("#dialog-trigger").press("Enter");
          const dialog = page.getByRole("dialog", {
            name: "Edit profile dialog",
            exact: true,
          });
          await expect(dialog).toBeVisible();
          const input = page.getByRole("textbox", {
            name: "Dialog name",
            exact: true,
          });
          const close = page.getByRole("button", {
            name: "Close profile",
            exact: true,
          });
          await expect(input).toBeFocused();
          await page.keyboard.press("Tab");
          await expect(close).toBeFocused();
          await page.keyboard.press("Tab");
          await expect(input).toBeFocused();
          await page.keyboard.press("Shift+Tab");
          await expect(close).toBeFocused();
          const cdp = await page.context().newCDPSession(page);
          const tree = await cdp.send("Accessibility.getFullAXTree");
          expect(
            tree.nodes.some(
              (node) =>
                !node.ignored &&
                node.role?.value === "dialog" &&
                node.name?.value === "Edit profile dialog" &&
                node.description?.value === "Update your name",
            ),
          ).toBe(true);
          writeFileSync(
            info.outputPath("modal-accessibility-tree.json"),
            JSON.stringify(tree, null, 2),
          );
          await cdp.detach();
          await page.keyboard.press("Escape");
          await expect(page.locator("#dialog-trigger")).toBeFocused();
          await page.locator("#alert-trigger").press("Enter");
          await expect(
            page.getByRole("alertdialog", {
              name: "Confirm deletion",
              exact: true,
            }),
          ).toBeVisible();
          await page.keyboard.press("Tab");
          expect(
            await page.evaluate(
              () => !!document.activeElement?.closest("#alert-content"),
            ),
          ).toBe(true);
          await page.keyboard.press("Escape");
          await expect(page.locator("#alert-trigger")).toBeFocused();
        });
        test("reduced motion preserves essential state and feedback", async ({
          page,
        }, info) => {
          await page.emulateMedia({ reducedMotion: "reduce" });
          await expect(page.locator(".kit-spinner-mark").first()).toHaveCSS(
            "animation-name",
            "none",
          );
          await expect(page.locator("#notifications")).toHaveCSS(
            "transition-duration",
            "0s",
          );
          await page.locator("#notifications").press("Space");
          await expect(page.locator("#notifications")).toBeChecked();
          await expect(
            page.getByRole("status").filter({ hasText: "Loading content" }),
          ).toBeVisible();
          await expect(
            page.getByRole("progressbar", { name: "Upload" }),
          ).toBeVisible();
          await expect(page.locator(".kit-skeleton")).toBeVisible();
          await page.locator("#collapse").press("Enter");
          await expect(page.locator("#collapse")).toHaveAttribute(
            "aria-expanded",
            "true",
          );
          await expect(page.locator(".kit-collapsible-content")).toBeVisible();
          await page.locator("#dialog-trigger").press("Enter");
          await expect(page.locator("#dialog-content")).toBeVisible();
          await expect(page.locator("#dialog-content")).toHaveCSS(
            "transition-duration",
            "0s",
          );
          await page.keyboard.press("Escape");
          await expect(page.locator("#dialog-trigger")).toBeFocused();
          writeFileSync(
            info.outputPath("reduced-motion.json"),
            JSON.stringify({
              direction,
              reduced: await page.evaluate(
                () => matchMedia("(prefers-reduced-motion: reduce)").matches,
              ),
            }),
          );
        });
        test("rendered text contrast passes and source non-text concerns remain explicit", async ({
          page,
        }, info) => {
          await page
            .getByRole("textbox", { name: "Name", exact: true })
            .fill("Contrast sample");
          await page
            .getByRole("textbox", { name: "Description", exact: true })
            .fill("Contrast sample");
          await page
            .getByRole("textbox", { name: "Invalid name", exact: true })
            .fill("Contrast sample");
          const selectors = [
            "#primary",
            "#secondary",
            "#ghost",
            ".kit-anchor",
            ".kit-card h2",
            ".kit-badge",
            ".kit-alert",
            ".kit-status",
            ".kit-field-label",
            ".kit-field-message",
            ".kit-field-control",
            ".kit-select-field-value",
            ".kit-tabs-trigger:not(:disabled)",
            ".kit-collapsible-trigger",
          ];
          const ratios = await page.evaluate((selectors) => {
            function rgb(value: string) {
              const numbers = value.match(/[\d.]+/g)?.map(Number);
              if (!numbers || numbers.length < 3)
                throw new Error(`Unsupported computed color ${value}`);
              return numbers;
            }
            function luminance(color: number[]) {
              const linear = color.slice(0, 3).map((n) => {
                const s = n / 255;
                return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
              });
              return (
                linear[0]! * 0.2126 + linear[1]! * 0.7152 + linear[2]! * 0.0722
              );
            }
            function ratio(a: string, b: string) {
              const x = luminance(rgb(a)),
                y = luminance(rgb(b));
              return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
            }
            function background(node: Element) {
              let current: Element | null = node;
              while (current) {
                const value = getComputedStyle(current).backgroundColor;
                const parts = rgb(value);
                if ((parts[3] ?? 1) === 1) return value;
                if ((parts[3] ?? 1) !== 0)
                  throw new Error("Unqualified translucent background");
                current = current.parentElement;
              }
              throw new Error("No rendered opaque backdrop");
            }
            const text = selectors.flatMap((selector) =>
              [...document.querySelectorAll(selector)]
                .filter((node) => {
                  let current: Element | null = node;
                  while (current) {
                    const css = getComputedStyle(current);
                    if (
                      css.opacity === "0" ||
                      css.visibility === "hidden" ||
                      css.display === "none"
                    )
                      return false;
                    current = current.parentElement;
                  }
                  return node.getClientRects().length > 0;
                })
                .map((node) => {
                  const css = getComputedStyle(node),
                    backdrop = background(node);
                  return {
                    selector,
                    foreground: css.color,
                    background: backdrop,
                    ratio: ratio(css.color, backdrop),
                  };
                }),
            );
            const radio = document.querySelector("#radio-b")!;
            const control = document.querySelector("#notifications")!;
            const nonText = [
              {
                part: "Radio boundary",
                foreground: getComputedStyle(radio).borderTopColor,
                background: background(radio),
              },
              {
                part: "Unchecked Switch track versus thumb",
                foreground: getComputedStyle(control).backgroundColor,
                background: getComputedStyle(
                  control.querySelector(".kit-switch-thumb")!,
                ).backgroundColor,
              },
            ].map((record) => ({
              ...record,
              ratio: ratio(record.foreground, record.background),
            }));
            return { text, nonText };
          }, selectors);
          writeFileSync(
            info.outputPath("rendered-contrast.json"),
            JSON.stringify(ratios, null, 2),
          );
          expect(ratios.text.length).toBeGreaterThan(selectors.length);
          expect(ratios.text.filter((record) => record.ratio < 4.5)).toEqual(
            [],
          );
          // The original source palette is retained. AC18 requires measured baseline
          // concerns to be recorded rather than an unsupported blanket certificate.
          expect(ratios.nonText).toHaveLength(2);
          expect(ratios.nonText.every((record) => record.ratio < 3)).toBe(true);
        });
      });
  });
