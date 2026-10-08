import { writeFileSync } from "node:fs";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import { buildModalForceMountConsumer } from "../helpers/generated-consumer.js";

for (const custom of [false, true])
  test.describe(`native forceMount parity ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildModalForceMountConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildModalForceMountConsumer(custom);
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
    for (const kind of ["dialog", "alert"])
      for (const policy of ["default", "scroll-off", "delegated"])
        test(`closed ${kind} forceMount ${policy} preserves native pointer policy and teardown`, async ({
          page,
        }, info) => {
          writeFileSync(
            info.outputPath("installed-artifact.json"),
            JSON.stringify(consumer.evidence, null, 2),
          );
          const samples: unknown[] = [];
          for (const native of [true, false]) {
            await page.goto(
              `${hosted.baseURL}${consumer.route}?native=${+native}&kind=${kind}&policy=${policy}`,
            );
            await expect(page.locator("main")).toHaveAttribute(
              "data-ready",
              "true",
            );
            await expect(page.locator("[data-probe-part]")).toHaveCount(1);
            const locked = policy === "default";
            if (locked)
              await expect(page.locator("body")).toHaveCSS(
                "pointer-events",
                "none",
              );
            else
              await expect(page.locator("body")).not.toHaveCSS(
                "pointer-events",
                "none",
              );
            const before = await page.locator("body").evaluate((e) => ({
              inlinePointer: e.style.pointerEvents,
              computedPointer: getComputedStyle(e).pointerEvents,
              inlineOverflow: e.style.overflow,
            }));
            const box = await page.locator("#outside").boundingBox();
            expect(box).not.toBeNull();
            await page.mouse.click(
              box!.x + box!.width / 2,
              box!.y + box!.height / 2,
            );
            await expect(page.locator("#activated")).toHaveText(
              locked ? "0" : "1",
            );
            await page.keyboard.press("F8");
            await expect(page.locator("main")).toHaveAttribute(
              "data-mounted",
              "false",
            );
            await expect(page.locator("[data-probe-part]")).toHaveCount(0);
            await expect(page.locator("body")).not.toHaveCSS(
              "pointer-events",
              "none",
            );
            await expect
              .poll(() =>
                page.locator("body").evaluate((e) => e.style.overflow),
              )
              .toBe("");
            await page.locator("#outside").click();
            await expect(page.locator("#activated")).toHaveText(
              locked ? "1" : "2",
            );
            const after = await page.locator("body").evaluate((e) => ({
              inlinePointer: e.style.pointerEvents,
              computedPointer: getComputedStyle(e).pointerEvents,
              inlineOverflow: e.style.overflow,
            }));
            samples.push({ native, kind, policy, before, after });
          }
          const [native, generated] = samples as {
            before: unknown;
            after: unknown;
          }[];
          expect(generated!.before).toEqual(native!.before);
          expect(generated!.after).toEqual(native!.after);
          writeFileSync(
            info.outputPath("native-parity.json"),
            JSON.stringify(samples, null, 2),
          );
        });
  });
