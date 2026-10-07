import { writeFileSync } from "node:fs";
import { buildDialogConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`installed Dialog themes ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildDialogConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildDialogConsumer(custom, "dialog-themes");
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
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("body portal inherits document tokens rather than the trigger's nested scope", async ({
      page,
    }) => {
      await page.locator("#body-trigger").click();
      const content = page.locator("body > #body-content");
      await expect(content).toBeVisible();
      await expect(content).toHaveCSS("background-color", "rgb(31, 41, 51)");
      await expect(content).toHaveCSS("color", "rgb(241, 242, 243)");
      await page.locator("#change-global").click();
      await expect(content).toHaveCSS("background-color", "rgb(61, 71, 81)");
      await expect(content).toHaveCSS("color", "rgb(211, 212, 213)");
      expect(
        await content.evaluate((el) =>
          Array.from((el as HTMLElement).style).filter((name) =>
            name.startsWith("--kit-"),
          ),
        ),
      ).toEqual([]);
    });
    test("custom host inherits nested tokens and updates while the actual dialog remains open", async ({
      page,
    }) => {
      await page.locator("#nested-trigger").click();
      const content = page.locator("#nested-host > #nested-content");
      await expect(content).toBeVisible();
      await expect(content).toHaveCSS("background-color", "rgb(91, 101, 111)");
      await expect(content).toHaveCSS("color", "rgb(181, 182, 183)");
      await page.locator("#change-nested").click();
      await expect(content).toHaveCSS("background-color", "rgb(121, 131, 141)");
      await expect(content).toHaveCSS("color", "rgb(151, 152, 153)");
      expect(
        await content.evaluate((el) =>
          Array.from((el as HTMLElement).style).filter((name) =>
            name.startsWith("--kit-"),
          ),
        ),
      ).toEqual([]);
      await expect(content).toHaveAttribute("data-state", "open");
    });
    test("transformed clipping host is an actual adverse composition rather than hidden theme copying", async ({
      page,
    }) => {
      await page.locator("#adverse-trigger").click();
      await expect(
        page.locator("#adverse-host > #adverse-content"),
      ).toHaveCount(1);
      await expect(page.locator("#adverse-host")).toHaveCSS(
        "overflow",
        "hidden",
      );
      await expect
        .poll(() =>
          page.evaluate(() => {
            const host = document.querySelector("#adverse-host")!;
            const content = document.querySelector("#adverse-content")!;
            const h = host.getBoundingClientRect(),
              c = content.getBoundingClientRect();
            return (
              c.width > h.width &&
              c.height > h.height &&
              getComputedStyle(host).transform !== "none"
            );
          }),
        )
        .toBe(true);
      await page.keyboard.press("Escape");
      await expect(page.locator("#adverse-content")).toHaveCount(0);
      await expect(page.locator("#adverse-trigger")).toBeFocused();
    });
  });
