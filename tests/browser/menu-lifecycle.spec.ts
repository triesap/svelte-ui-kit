import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

function trackResizeObservers() {
  const Native = window.ResizeObserver;
  const instances = new Set<Set<Element>>();
  Object.defineProperty(window, "__menuResizeTargets", {
    value: () =>
      [...instances]
        .flatMap((targets) => [...targets])
        .filter(
          (node) =>
            node.id === "placement-trigger" ||
            node.id === "placement-content" ||
            node.hasAttribute("data-bits-floating-content-wrapper"),
        ),
  });
  window.ResizeObserver = class extends Native {
    targets = new Set<Element>();
    override observe(node: Element, options?: ResizeObserverOptions) {
      super.observe(node, options);
      this.targets.add(node);
      instances.add(this.targets);
    }
    override unobserve(node: Element) {
      super.unobserve(node);
      this.targets.delete(node);
    }
    override disconnect() {
      super.disconnect();
      this.targets.clear();
      instances.delete(this.targets);
    }
  };
}
function targets() {
  return (window as typeof window & { __menuResizeTargets: () => Element[] })
    .__menuResizeTargets()
    .map((node) => ({ id: node.id, connected: node.isConnected }));
}
for (const custom of [false, true])
  for (const negative of [false, true])
    test.describe(`installed Menu lifecycle ${custom ? "custom" : "default"} ${negative ? "owned-negative" : "native"}`, () => {
      let consumer: ReturnType<typeof buildMenuConsumer>;
      let hosted: FixtureServer;
      test.beforeAll(async () => {
        test.setTimeout(240000);
        consumer = buildMenuConsumer(
          custom,
          "menu-placement",
          negative
            ? (root, config) => {
                const file = path.join(
                  root,
                  config.uiDir,
                  "menu/content.svelte",
                );
                const source = readFileSync(file, "utf8");
                expect(source.split("</script>").length).toBe(2);
                writeFileSync(
                  file,
                  source.replace(
                    "</script>",
                    `// Owned causal negative: a real observer without lifecycle cleanup.\n  $effect(() => { if (ref) {const observer = new ResizeObserver(() => {}); observer.observe(ref);} });\n</script>`,
                  ),
                );
              }
            : undefined,
        );
        if (negative)
          consumer.evidence.ownedMutation =
            "menu-resize-observer-cleanup-removed";
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
      test("actual ref replacement and root teardown release observed DOM with causal retained-node control", async ({
        page,
      }, info) => {
        await page.addInitScript(trackResizeObservers);
        const file = info.outputPath("installed-artifact.json");
        writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
        await info.attach("installed-artifact", {
          path: file,
          contentType: "application/json",
        });
        await page.goto(
          new URL(`${consumer.route}?initial=open`, hosted.baseURL).href,
        );
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await expect.poll(() => page.evaluate(targets)).not.toEqual([]);
        const first = await page.evaluate(targets);
        expect(first.every((node) => node.connected)).toBe(true);
        await page.locator("#replace").click();
        await expect(page.locator("#placement-content")).toBeVisible();
        if (negative)
          await expect
            .poll(
              async () =>
                (await page.evaluate(targets)).filter((node) => !node.connected)
                  .length,
            )
            .toBeGreaterThan(0);
        else
          await expect
            .poll(
              async () =>
                (await page.evaluate(targets)).filter((node) => !node.connected)
                  .length,
            )
            .toBe(0);
        await page.locator("#destroy").click();
        await expect(page.locator("#placement-content")).toHaveCount(0);
        if (negative)
          await expect
            .poll(
              async () =>
                (await page.evaluate(targets)).filter((node) => !node.connected)
                  .length,
            )
            .toBeGreaterThan(1);
        else await expect.poll(() => page.evaluate(targets)).toEqual([]);
        const observed = info.outputPath("observer-lifetimes.json");
        writeFileSync(
          observed,
          JSON.stringify(
            {
              negative,
              initial: first,
              afterTeardown: await page.evaluate(targets),
            },
            null,
            2,
          ),
        );
        await info.attach("observer-lifetimes", {
          path: observed,
          contentType: "application/json",
        });
      });
    });
