import { readFileSync, writeFileSync } from "node:fs";
import { buildAnchorConsumer } from "../helpers/generated-consumer.js";
import { createIssueCollector, test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Anchor ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildAnchorConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildAnchorConsumer(custom);
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
    test("actual native attrs, ref, children and cancellation preserve link keyboard semantics", async ({
      page,
    }) => {
      const link = page.locator("#cancel");
      await expect(link).toHaveClass("kit-anchor caller retained");
      await expect(link).toHaveAttribute("data-caller", "preserved");
      await expect(link).toHaveAttribute("title", "Native link title");
      await expect(link).not.toHaveAttribute("role", "button");
      await expect(page.locator("#ref-proof")).toHaveText("A");
      await page
        .getByRole("button", { name: "Focus bound link", exact: true })
        .click();
      await expect(link).toBeFocused();
      const original = page.url();
      await link.click();
      await link.press("Enter");
      await link.press("Space");
      await page.locator("#native").click();
      await page.locator("#native").press("Enter");
      await page.locator("#native").press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Kit 2; native 2; submits 0; resets 0",
      );
      expect(page.url()).toBe(original);
      await link.focus();
      await page.keyboard.press("Tab");
      await expect(page.locator("#native")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(link).toBeFocused();
      await expect(page.locator("#child")).toHaveCount(1);
    });
    test("Enter navigates actual internal href with query and fragment", async ({
      page,
    }) => {
      await page.locator("#navigate").press("Enter");
      await expect(page).toHaveURL(/\?arrival=internal#destination$/);
      await expect(page.locator("#arrival")).toHaveText("internal");
      await expect(page.locator("#destination")).toBeVisible();
      await expect(page.locator("#counts")).toHaveText(
        "Kit 0; native 0; submits 0; resets 0",
      );
    });
    test("current target and explicit rel update without replacing native nodes", async ({
      page,
    }) => {
      const link = page.locator("#dynamic");
      const node = await link.elementHandle();
      expect(await link.getAttribute("target")).toBeNull();
      expect(await link.getAttribute("rel")).toBeNull();
      await page
        .getByRole("button", { name: "Toggle target", exact: true })
        .click();
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      const popupPromise = page.waitForEvent("popup");
      await link.click();
      const popup = await popupPromise;
      const issues = createIssueCollector(popup);
      await popup.waitForLoadState();
      expect(new URL(popup.url()).searchParams.get("arrival")).toBe("popup");
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
      await popup.close();
      expect(issues).toEqual([]);
      await page
        .getByRole("button", { name: "Cycle rel", exact: true })
        .click();
      await expect(link).toHaveAttribute("rel", "opener");
      await page
        .getByRole("button", { name: "Cycle rel", exact: true })
        .click();
      await expect(link).toHaveAttribute("rel", "");
      await page
        .getByRole("button", { name: "Cycle rel", exact: true })
        .click();
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
      await page
        .getByRole("button", { name: "Toggle target", exact: true })
        .click();
      expect(await link.getAttribute("rel")).toBeNull();
      expect(
        await node!.evaluate(
          (element) => element === document.querySelector("#dynamic"),
        ),
      ).toBe(true);
    });
    test("external targets stay native and preserve exact caller URL", async ({
      page,
      context,
    }) => {
      await context.route("https://external.invalid/**", (route) =>
        route.fulfill({
          status: 200,
          contentType: "text/html",
          body: "<!doctype html><html><head><title>External</title></head><body><h1>External native destination</h1></body></html>",
        }),
      );
      const initial = page.url();
      await expect(page.locator("#external")).toHaveAttribute(
        "href",
        "https://external.invalid/anchor?arrival=external",
      );
      const pending = page.waitForEvent("popup");
      await page.locator("#external").click();
      const popup = await pending;
      const issues = createIssueCollector(popup);
      await expect(
        popup.getByRole("heading", { name: "External native destination" }),
      ).toBeVisible();
      expect(popup.url()).toBe(
        "https://external.invalid/anchor?arrival=external",
      );
      expect(await popup.evaluate(() => window.opener === null)).toBe(true);
      expect(page.url()).toBe(initial);
      await popup.close();
      expect(issues).toEqual([]);
    });
    test("named browsing contexts preserve native naming and reuse", async ({
      page,
      context,
    }) => {
      const initial = context.pages().length;
      const pending = page.waitForEvent("popup");
      await page.locator("#named").click();
      const popup = await pending;
      const issues = createIssueCollector(popup);
      await popup.waitForLoadState();
      expect(await popup.evaluate(() => window.name)).toBe("report-context");
      expect(new URL(popup.url()).searchParams.get("arrival")).toBe("named");
      await page.locator("#named").click();
      await expect(popup.locator('[data-ready="true"]')).toBeVisible();
      expect(context.pages().length).toBe(initial + 1);
      await popup.close();
      expect(issues).toEqual([]);
    });
    test("actual download preserves native filename and response bytes", async ({
      page,
    }) => {
      const initial = page.url();
      const pending = page.waitForEvent("download");
      await page.locator("#download").click();
      const download = await pending;
      expect(download.suggestedFilename()).toBe("report.txt");
      const file = await download.path();
      expect(file).not.toBeNull();
      expect(readFileSync(file!, "utf8")).toBe("Native Anchor download\n");
      expect(page.url()).toBe(initial);
    });
    test("native aria-disabled is an attribute without an invented navigation guard", async ({
      page,
    }) => {
      await expect(page.locator("#aria-disabled")).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      await page.locator("#aria-disabled").click({ force: true });
      await expect(page).toHaveURL(/\?arrival=aria-disabled$/);
      await expect(page.locator("#arrival")).toHaveText("aria-disabled");
    });
    test("conditional teardown clears ref and remount restores current native content", async ({
      page,
    }) => {
      const previous = await page.locator("#cancel").elementHandle();
      await page
        .getByRole("button", { name: "Toggle link", exact: true })
        .click();
      await expect(page.locator("#cancel")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await previous!.evaluate((element) => element.isConnected)).toBe(
        false,
      );
      await page
        .getByRole("button", { name: "Toggle link", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("A");
      await expect(page.locator("#child")).toHaveCount(1);
      await page
        .getByRole("button", { name: "Focus bound link", exact: true })
        .click();
      await expect(page.locator("#cancel")).toBeFocused();
      await page.locator("#cancel").press("Enter");
      await expect(page.locator("#counts")).toHaveText(
        "Kit 1; native 0; submits 0; resets 0",
      );
    });
    test("all source visual hooks remain inherited in theme focus RTL and reduced motion", async ({
      page,
    }) => {
      const link = page.locator("#cancel");
      const style = () =>
        link.evaluate((node) => {
          const css = getComputedStyle(node);
          return {
            color: css.color,
            line: css.textDecorationLine,
            decorationColor: css.textDecorationColor,
            thickness: css.textDecorationThickness,
            offset: css.textUnderlineOffset,
            outlineWidth: css.outlineWidth,
            outlineColor: css.outlineColor,
            outlineOffset: css.outlineOffset,
            direction: css.direction,
            animation: css.animationName,
            transition: css.transitionDuration,
          };
        });
      await page.mouse.move(0, 0);
      expect((await style()).color).toBe("rgb(20, 80, 160)");
      expect((await style()).line).toBe("underline");
      await link.hover();
      expect((await style()).color).toBe("rgb(10, 50, 120)");
      await page.keyboard.press("Tab");
      await link.focus();
      expect(await style()).toMatchObject({
        outlineWidth: "2px",
        outlineColor: "rgb(80, 30, 170)",
        outlineOffset: "2px",
      });
      await page
        .getByRole("button", { name: "Toggle customization", exact: true })
        .click();
      await page.mouse.move(0, 0);
      expect(await style()).toMatchObject({
        color: "rgb(170, 30, 60)",
        line: "overline",
        decorationColor: "rgb(30, 120, 70)",
        thickness: "3px",
        offset: "5px",
      });
      await page.keyboard.press("Tab");
      await link.focus();
      expect(await style()).toMatchObject({
        outlineWidth: "4px",
        outlineColor: "rgb(30, 100, 80)",
        outlineOffset: "6px",
      });
      await link.hover();
      expect((await style()).color).toBe("rgb(120, 10, 40)");
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      expect((await style()).direction).toBe("rtl");
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await style()).toMatchObject({
        animation: "none",
        transition: "0s",
      });
    });
    test("concurrent real SSR responses isolate query and initial native state", async ({
      request,
      page,
    }) => {
      const replies = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const response = await request.get(
            new URL(
              `${consumer.route}?arrival=request-${index}`,
              hosted.baseURL,
            ).href,
          );
          expect(response.status()).toBe(200);
          return { index, body: await response.text() };
        }),
      );
      for (const { index, body } of replies) {
        expect(body).toContain(`id="arrival">request-${index}`);
        expect(body).toContain(
          'id="counts">Kit 0; native 0; submits 0; resets 0',
        );
        expect(body).toMatch(/<a[^>]+id="cancel"/);
        expect(body).toContain('rel="noopener noreferrer"');
      }
      await expect(page.locator("#arrival")).toHaveText("none");
      await expect(page.locator("#counts")).toHaveText(
        "Kit 0; native 0; submits 0; resets 0",
      );
    });
  });
