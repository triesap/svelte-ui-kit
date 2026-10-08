import { readFileSync, writeFileSync } from "node:fs";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildCssConsumer } from "../helpers/generated-consumer.js";
import { cssInventory } from "../helpers/css-inventory.js";
import path from "node:path";
import { parseManagedCss } from "../../src/codegen/css-parse.js";

const rules = cssInventory();
const properties: {
  name: string;
  grammar: string;
  fallback: string;
  scope: string;
}[] = JSON.parse(
  readFileSync("registry/contracts/component-customization-v1.json", "utf8"),
).properties;
function override(grammar: string): string {
  if (grammar.includes("{1,4}")) return "13px 17px / 19px 23px";
  if (grammar === "<color>") return "rgb(123, 45, 67)";
  if (grammar === "<time>") return "7s";
  if (grammar === "<integer>") return "137";
  if (grammar === "<number>") return "0.37";
  if (grammar === "<easing-function>")
    return "cubic-bezier(0.1, 0.2, 0.3, 0.4)";
  if (grammar === "<shadow>") return "rgb(123, 45, 67) 3px 5px 7px 2px";
  if (grammar === "<text-decoration-line>") return "overline";
  return "7px";
}

for (const custom of [false, true])
  test.describe(`CSS contracts ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCssConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCssConsumer(custom);
      const aggregate = readFileSync(
        path.join(
          consumer.root,
          custom ? "assets/styles/kit.css" : "src/styles/kit.css",
        ),
        "utf8",
      );
      const parsed = parseManagedCss(aggregate);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) throw new Error("Invalid aggregate CSS");
      const registry = JSON.parse(
        readFileSync("registry/registry.json", "utf8"),
      );
      const styles: { source: string; blockId: string }[] =
        registry.items.flatMap(
          (item: { manifest: string }) =>
            JSON.parse(readFileSync(`registry/${item.manifest}`, "utf8"))
              .styles,
        );
      expect(parsed.value.blocks.map((block) => block.id).sort()).toEqual(
        styles.map((style) => style.blockId).sort(),
      );
      for (const style of styles) {
        const source = readFileSync(`registry/${style.source}`, "utf8");
        const original = parseManagedCss(source);
        expect(original.ok).toBe(true);
        if (!original.ok) throw new Error(style.source);
        const block = parsed.value.blocks.find(
          (block) => block.id === style.blockId,
        )!;
        const expected = original.value.blocks[0]!;
        expect(
          aggregate.slice(block.contentStart, block.contentEnd),
          style.source,
        ).toBe(source.slice(expected.contentStart, expected.contentEnd));
      }
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
      writeFileSync(
        info.outputPath("installed-artifact.json"),
        JSON.stringify(consumer.evidence, null, 2),
      );
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator("main")).toHaveAttribute("data-ready", "true");
    });

    test("each public customization changes actual installed native DOM computed CSS", async ({
      page,
    }, info) => {
      test.setTimeout(120000);
      await page
        .locator('.kit-menu-content[data-state="open"] .kit-menu-item')
        .first()
        .focus();
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("DOM.enable");
      await cdp.send("CSS.enable");
      const document = await cdp.send("DOM.getDocument");
      const evidence: unknown[] = [];
      for (const property of properties) {
        let proof: unknown;
        const uses = rules.flatMap((rule) =>
          rule.selectors.flatMap((selector) =>
            rule.declarations
              .filter((d) =>
                new RegExp(`var\\(\\s*${property.name}\\s*[,)]`).test(d.value),
              )
              .map((declaration) => ({ selector, declaration })),
          ),
        );
        for (const use of uses) {
          // CDP exercises Chromium's actual CSS pseudo-state matching. It does not
          // forge component state attributes or replace generated component DOM.
          const selector = use.selector
            .replace(/:(hover|focus-visible)/g, "")
            .replace(/::[\w-]+/g, "");
          const count = await page.locator(selector).count();
          for (let index = 0; index < count; index++) {
            const node = page.locator(selector).nth(index);
            await node.evaluate((element) =>
              element.setAttribute("data-css-audit", "target"),
            );
            const { nodeId } = await cdp.send("DOM.querySelector", {
              nodeId: document.root.nodeId,
              selector: '[data-css-audit="target"]',
            });
            await cdp.send("CSS.forcePseudoState", {
              nodeId,
              forcedPseudoClasses: [
                ...use.selector.matchAll(/:(hover|focus-visible)/g),
              ].map((m) => m[1]!),
            });
            const result = await node.evaluate(
              async (element, { name, value, cssProperty }) => {
                const owner = element as HTMLElement;
                const previous = owner.style.getPropertyValue(name);
                const priority = owner.style.getPropertyPriority(name);
                async function settle() {
                  await new Promise<void>((resolve) =>
                    requestAnimationFrame(() =>
                      requestAnimationFrame(() => resolve()),
                    ),
                  );
                  for (const animation of owner.getAnimations())
                    if (animation instanceof CSSTransition) animation.finish();
                }
                await settle();
                const computed = () => {
                  const style = getComputedStyle(owner);
                  // Unequal native border sides have no computed shorthand.
                  return cssProperty === "border"
                    ? ["top", "right", "bottom", "left"]
                        .map((side) => style.getPropertyValue(`border-${side}`))
                        .join(" | ")
                    : style.getPropertyValue(cssProperty);
                };
                const before = computed();
                owner.style.setProperty(name, value);
                await settle();
                const after = computed();
                if (previous) owner.style.setProperty(name, previous, priority);
                else owner.style.removeProperty(name);
                await settle();
                const restored = computed();
                return {
                  before,
                  after,
                  restored,
                  tag: owner.tagName,
                  class: owner.className,
                };
              },
              {
                name: property.name,
                value: property.name.includes("font-weight")
                  ? "733"
                  : override(property.grammar),
                cssProperty: use.declaration.property,
              },
            );
            await cdp.send("CSS.forcePseudoState", {
              nodeId,
              forcedPseudoClasses: [],
            });
            await node.evaluate((element) =>
              element.removeAttribute("data-css-audit"),
            );
            if (result.before !== result.after) {
              expect(result.restored, property.name).toBe(result.before);
              proof = { name: property.name, ...use, ...result };
              break;
            }
          }
          if (proof) break;
        }
        evidence.push(proof ?? { name: property.name, missing: true, uses });
        writeFileSync(
          info.outputPath("computed-customization.json"),
          JSON.stringify(evidence, null, 2),
        );
        expect(proof, `${property.name}: actual computed effect`).toBeTruthy();
      }
      expect(evidence).toHaveLength(278);
      await cdp.detach();
    });

    test("every selector targets installed markup and native state", async ({
      page,
    }, info) => {
      // Focus is delivered to the real open Menu item, so Bits owns highlighted.
      await page
        .locator('.kit-menu-content[data-state="open"] .kit-menu-item')
        .first()
        .focus();
      await expect(
        page.locator(".kit-menu-item[data-highlighted]"),
      ).toHaveCount(1);
      const evidence = await page.evaluate(
        (rules) =>
          rules.flatMap((rule) =>
            rule.selectors.map((selector) => {
              // Pseudo-elements belong to the native progress element. Starting-style
              // is a transient native presence hook; this audit proves its target,
              // while the owning hydration/presence lanes prove lifecycle timing.
              const target = selector
                .replace(/:(hover|focus-visible)/g, "")
                .replace(/::[\w-]+/g, "")
                .replace(/\[data-starting-style\]/g, "");
              return {
                file: rule.file,
                selector,
                target,
                count: document.querySelectorAll(target).length,
              };
            }),
          ),
        rules,
      );
      writeFileSync(
        info.outputPath("selector-dom.json"),
        JSON.stringify(evidence, null, 2),
      );
      await page.keyboard.press("Escape");
      for (const row of evidence)
        row.count = Math.max(row.count, await page.locator(row.target).count());
      writeFileSync(
        info.outputPath("selector-dom.json"),
        JSON.stringify(evidence, null, 2),
      );
      expect(evidence.filter((row) => row.count === 0)).toEqual([]);
    });

    test("broad radius themes preserve circular native geometry", async ({
      page,
    }) => {
      await page.evaluate(() => {
        for (const name of [
          "default",
          "control",
          "surface",
          "overlay",
          "indicator",
        ])
          document.documentElement.style.setProperty(
            `--kit-radius-${name}`,
            "2px",
          );
      });
      for (const [selector, property] of [
        [".kit-avatar", "--kit-avatar-radius"],
        [".kit-radio", "--kit-radio-radius"],
        [".kit-spinner-mark", "--kit-spinner-radius"],
        [".kit-switch-thumb", "--kit-switch-thumb-radius"],
      ]) {
        const node = page.locator(selector!).first();
        expect(
          await node.evaluate((e) => getComputedStyle(e).borderRadius),
          property,
        ).toBe("999px");
        await node.evaluate(
          (e, name) => (e as HTMLElement).style.setProperty(name, "3px 4px"),
          property!,
        );
        expect(
          await node.evaluate((e) => getComputedStyle(e).borderRadius),
          property,
        ).toBe("3px 4px");
      }
      expect(
        await page
          .locator(".kit-button")
          .first()
          .evaluate((e) => getComputedStyle(e).borderRadius),
      ).toBe("2px");
      expect(
        await page
          .locator(".kit-switch-thumb")
          .first()
          .evaluate((e) => {
            const s = getComputedStyle(e);
            return [s.inlineSize, s.blockSize];
          }),
      ).toEqual(["14px", "14px"]);
    });

    test("all radius defaults fallback priorities and geometry-critical overrides use installed elements", async ({
      page,
    }, info) => {
      const evidence: unknown[] = [];
      for (const property of properties.filter(
        (p) => p.name.endsWith("-radius") || p.name.startsWith("--kit-radius-"),
      )) {
        const use = rules
          .flatMap((rule) =>
            rule.selectors.map((selector) => ({
              selector,
              declarations: rule.declarations,
            })),
          )
          .find((use) =>
            use.declarations.some(
              (d) =>
                d.property === "border-radius" &&
                new RegExp(`var\\(\\s*${property.name}\\s*[,)]`).test(
                  d.value,
                ) &&
                (property.name !== "--kit-field-control-radius" ||
                  use.selector === ".kit-field-control") &&
                (property.scope !== "semantic" ||
                  !property.name.endsWith("surface") ||
                  use.selector === ".kit-card"),
            ),
          );
        expect(use, property.name).toBeTruthy();
        const node = page.locator(use!.selector).first();
        const expected = property.fallback.includes("calc(")
          ? "4px"
          : property.fallback.includes("--kit-radius-full")
            ? "999px"
            : property.fallback.includes("--kit-radius-lg")
              ? "8px"
              : property.fallback.includes("--kit-radius-sm")
                ? "4px"
                : "6px";
        const initial = await node.evaluate(
          (e) => getComputedStyle(e).borderRadius,
        );
        expect(initial, property.name).toBe(expected);
        const levels = [
          ...new Set(
            [...property.fallback.matchAll(/var\((--kit-[a-z-]+)/g)].map(
              (m) => m[1]!,
            ),
          ),
        ].filter((name) => !/^--kit-radius-(sm|md|lg|full)$/.test(name));
        let value = 20;
        for (const name of levels.reverse()) {
          await node.evaluate(
            (e, { name, value }) =>
              (e as HTMLElement).style.setProperty(name, `${value}px`),
            { name, value },
          );
          expect(
            await node.evaluate((e) => getComputedStyle(e).borderRadius),
            `${property.name} via ${name}`,
          ).toBe(`${value}px`);
          value += 2;
        }
        await node.evaluate(
          (e, name) =>
            (e as HTMLElement).style.setProperty(
              name,
              "1px 2px 3px 4px / 5px 6px 7px 8px",
            ),
          property.name,
        );
        expect(
          await node.evaluate((e) => {
            const s = getComputedStyle(e);
            return [
              s.borderTopLeftRadius,
              s.borderTopRightRadius,
              s.borderBottomRightRadius,
              s.borderBottomLeftRadius,
            ];
          }),
          property.name,
        ).toEqual(["1px 5px", "2px 6px", "3px 7px", "4px 8px"]);
        await node.evaluate(
          (e, names) => {
            for (const name of names)
              (e as HTMLElement).style.removeProperty(name);
          },
          [property.name, ...levels],
        );
        expect(
          await node.evaluate((e) => getComputedStyle(e).borderRadius),
          property.name,
        ).toBe(initial);
        evidence.push({
          name: property.name,
          selector: use!.selector,
          initial,
          levels,
        });
      }
      expect(evidence).toHaveLength(34);
      writeFileSync(
        info.outputPath("native-radius.json"),
        JSON.stringify(evidence, null, 2),
      );
    });
  });
