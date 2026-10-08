import { writeFileSync } from "node:fs";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
for (const custom of [false, true])
  test.describe(`installed Menu placement ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildMenuConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildMenuConsumer(custom, "menu-placement");
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
      const file = info.outputPath("installed-artifact.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("installed-artifact", {
        path: file,
        contentType: "application/json",
      });
    });
    for (const portal of ["body", "inline", "custom"])
      for (const initial of ["open", "closed"])
        test(`${initial} SSR hydrates ${portal} native portal with isolated instances`, async ({
          page,
        }) => {
          await page.goto(
            new URL(
              `${consumer.route}?portal=${portal}&initial=${initial}`,
              hosted.baseURL,
            ).href,
          );
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          const first = page.locator("#placement-content");
          await expect(page.locator("#placement-trigger")).toHaveAttribute(
            "aria-expanded",
            String(initial === "open"),
          );
          await expect(page.locator("#second-trigger")).toHaveAttribute(
            "aria-expanded",
            "false",
          );
          if (initial === "closed")
            await page.locator("#placement-trigger").click();
          await expect(first).toBeVisible();
          await expect(first).toHaveAccessibleName("Floating choices");
          await expect(page.locator("#ref-state")).toContainText("DIV");
          const host = await first.evaluate(
            (node) =>
              node.parentElement?.parentElement?.id ||
              node.parentElement?.parentElement?.tagName,
          );
          expect(host).toBe(
            portal === "body"
              ? "BODY"
              : portal === "custom"
                ? "portal-host"
                : "DIV",
          );
          await page.locator("#second-trigger").press("Enter");
          await expect(page.locator("#second-content")).toBeVisible();
          const ids = await page
            .locator("[id]")
            .evaluateAll((nodes) => nodes.map((node) => node.id));
          expect(new Set(ids).size).toBe(ids.length);
        });
    test("native placement follows scrolling and viewport collision flips near the corner", async ({
      page,
    }) => {
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await page.locator("#placement-trigger").click();
      const content = page.locator("#placement-content"),
        trigger = page.locator("#placement-trigger");
      const gap = async () => {
        const a = await trigger.boundingBox(),
          b = await content.boundingBox();
        return a && b ? Math.abs(b.y - a.y - a.height - 4) : Infinity;
      };
      await expect.poll(gap).toBeLessThan(1);
      const before = (await trigger.boundingBox())!.y;
      await page
        .locator("#scroll-host")
        .evaluate((node) => (node.scrollTop = 30));
      await expect
        .poll(async () => (await trigger.boundingBox())!.y)
        .toBeLessThan(before - 20);
      await expect.poll(gap).toBeLessThan(1);
      await page.locator("#corner").click();
      await expect(content).toHaveAttribute("data-side", "top");
      await page.setViewportSize({ width: 420, height: 360 });
      await expect
        .poll(async () => {
          const box = await content.boundingBox();
          return box
            ? Math.max(
                8 - box.x,
                8 - box.y,
                box.x + box.width - 412,
                box.y + box.height - 352,
              )
            : Infinity;
        })
        .toBeLessThan(1);
    });
    test("body and custom portals inherit correct live global and nested theme scopes", async ({
      page,
    }) => {
      for (const portal of ["body", "custom"]) {
        await page.goto(
          new URL(
            `${consumer.route}?portal=${portal}&initial=open`,
            hosted.baseURL,
          ).href,
        );
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        const content = page.locator("#placement-content");
        await expect(content).toBeVisible();
        const color = () =>
          content.evaluate((node) => getComputedStyle(node).backgroundColor);
        await expect
          .poll(color)
          .toBe(portal === "body" ? "rgb(21, 34, 55)" : "rgb(10, 50, 90)");
        await page
          .locator(portal === "body" ? "#global-theme" : "#nested-theme")
          .click();
        await expect
          .poll(color)
          .toBe(portal === "body" ? "rgb(55, 34, 21)" : "rgb(90, 50, 10)");
        expect(
          await content.evaluate((node) => node.getAttribute("style") || ""),
        ).not.toContain("--kit-");
      }
    });
    test("transformed clipping custom host exposes actual adverse composition", async ({
      page,
    }) => {
      await page.goto(
        new URL(`${consumer.route}?portal=adverse&initial=open`, hosted.baseURL)
          .href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      const content = page.locator("#placement-content");
      await expect(content).toHaveCount(1);
      const result = await content.evaluate((node) => {
        const clip = document.getElementById("scope")!;
        const box = node.getBoundingClientRect(),
          host = clip.getBoundingClientRect();
        return {
          parent: node.parentElement?.parentElement?.id,
          overflow: getComputedStyle(clip).overflow,
          transform: getComputedStyle(clip).transform,
          clipped:
            box.bottom > host.bottom ||
            box.right > host.right ||
            box.top < host.top,
        };
      });
      expect(result.parent).toBe("portal-host");
      expect(result.overflow).toBe("hidden");
      expect(result.transform).not.toBe("none");
      expect(result.clipped).toBe(true);
    });
    test("dynamic items ref replacement and root destruction preserve native navigation and identity", async ({
      page,
    }) => {
      await page.goto(
        new URL(`${consumer.route}?initial=open`, hosted.baseURL).href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await page.locator("#dynamic-item").click();
      await expect(page.locator("#ref-state")).toContainText("selected 1");
      await page.locator("#dynamic").click();
      await expect(page.locator("#dynamic-item")).toHaveCount(0);
      await page.locator("#first-item").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("#last-item")).toBeFocused();
      await page.locator("#dynamic").click();
      await page.locator("#first-item").focus();
      await page.keyboard.press("ArrowDown");
      await expect(page.locator("#dynamic-item")).toBeFocused();
      const old = await page.locator("#placement-content").elementHandle();
      await page.locator("#replace").click();
      await expect(page.locator("#placement-content")).toBeVisible();
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await old!.dispose();
      await expect(page.locator("#ref-state")).toContainText("DIV");
      await page.locator("#destroy").click();
      await expect(page.locator("#placement-content")).toHaveCount(0);
      await expect(page.locator("#ref-state")).toContainText("none");
      await page.locator("#destroy").click();
      await expect(page.locator("#placement-content")).toBeVisible();
    });
  });
