import { writeFileSync } from "node:fs";
import { buildDialogConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`installed Dialog tree-local descriptions ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildDialogConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildDialogConsumer(custom, "dialog-shadow");
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
    test("native Element portal keeps real shadow descriptions and removes only absent IDs", async ({
      page,
    }, info) => {
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
      await page.addInitScript(() => {
        const state = { active: 0, started: 0 };
        Object.defineProperty(window, "__shadowDescriptions", { value: state });
        const Native = window.MutationObserver;
        window.MutationObserver = class extends Native {
          owned = false;
          override observe(target: Node, options?: MutationObserverInit) {
            super.observe(target, options);
            if (
              !this.owned &&
              target instanceof ShadowRoot &&
              options?.attributeFilter?.join(",") === "aria-describedby,id"
            ) {
              this.owned = true;
              state.active++;
              state.started++;
            }
          }
          override disconnect() {
            if (this.owned) {
              this.owned = false;
              state.active--;
            }
            super.disconnect();
          }
        };
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      for (const prefix of ["native", "wrapper"]) {
        await page.locator(`#${prefix}-trigger`).click();
        const host = page.locator(`#${prefix}-host`);
        const content = host.locator("[data-dialog-content]");
        const description = host.locator("[data-dialog-description]");
        await expect(content).toBeVisible();
        await expect
          .poll(async () => content.getAttribute("aria-describedby"))
          .toBe(await description.getAttribute("id"));
        expect(
          await description.evaluate(
            (node) => node.getRootNode() instanceof ShadowRoot,
          ),
        ).toBe(true);
        if (prefix === "wrapper") {
          const id = await description.getAttribute("id");
          await description.evaluate((node) => {
            node.id = "renamed-shadow-description";
          });
          await expect(content).not.toHaveAttribute("aria-describedby");
          await description.evaluate((node, original) => {
            node.id = original!;
          }, id);
          await expect(content).toHaveAttribute("aria-describedby", id!);
          const removed = await description.elementHandle();
          expect(removed).not.toBeNull();
          await removed!.evaluate((node) => node.remove());
          await expect(description).toHaveCount(0);
          await expect(content).not.toHaveAttribute("aria-describedby");
          await content.evaluate(
            (node, child) => node.appendChild(child),
            removed!,
          );
          await removed!.dispose();
          await expect(description).toHaveCount(1);
          await expect
            .poll(async () => content.getAttribute("aria-describedby"))
            .toBe(await description.getAttribute("id"));
        }
        await host
          .getByRole("button", { name: `Close ${prefix}`, exact: true })
          .click();
        await expect(content).toHaveCount(0);
      }
      expect(
        await page.evaluate(
          () =>
            (
              window as typeof window & {
                __shadowDescriptions: { active: number; started: number };
              }
            ).__shadowDescriptions,
        ),
      ).toEqual({ active: 0, started: 1 });
    });
  });
