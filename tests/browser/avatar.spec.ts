import { writeFileSync } from "node:fs";
import type { Route } from "@playwright/test";
import { buildAvatarConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

const svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="24"><rect width="32" height="24" fill="blue"/></svg>';
const fulfill = (route: Route) =>
  route.fulfill({ status: 200, contentType: "image/svg+xml", body: svg });

for (const custom of [false, true])
  test.describe(`generated Avatar ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildAvatarConsumer>;
    let hosted: FixtureServer;
    let held: Route[];
    const release = async () => {
      const routes = held.splice(0);
      await Promise.all(routes.map(fulfill));
    };
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildAvatarConsumer(custom);
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
    test.beforeEach(async ({ page, context }, info) => {
      held = [];
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
      await context.route("**/avatar/*.svg*", async (route) => {
        const path = new URL(route.request().url()).pathname;
        if (path.endsWith("/slow.svg")) {
          held.push(route);
          return;
        }
        if (path.endsWith("/failure.svg")) {
          await route.fulfill({
            status: 200,
            contentType: "image/svg+xml",
            body: "not an image",
          });
          return;
        }
        await fulfill(route);
      });
      await page.goto(new URL(consumer.route, hosted.baseURL).href, {
        waitUntil: "domcontentloaded",
      });
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      await expect(page.locator("#independent").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
      await expect(page.locator("#decorative").locator("..")).toHaveAttribute(
        "data-state",
        "error",
      );
    });
    test.afterEach(async () => {
      await release();
    });

    test("loading fallback succeeds with one native name and exact event ordering", async ({
      page,
    }) => {
      const image = page.locator("#main");
      const frame = image.locator("..");
      await expect(frame).toHaveAttribute("data-state", "loading");
      await expect(page.locator("#main-fallback")).toBeVisible();
      await expect(
        page.getByRole("img", { name: "Ada portrait", exact: true }),
      ).toHaveCount(1);
      expect(
        await page
          .getByRole("img", { name: "Ada portrait", exact: true })
          .evaluate((node) => node.tagName),
      ).toBe("DIV");
      await expect(image).toHaveClass("kit-avatar caller retained");
      await expect(image).toHaveAttribute("data-caller", "preserved");
      await expect(image).toHaveAttribute("data-state", "caller-owned");
      await expect(image).toHaveAttribute("title", "Native image title");
      await expect(image).toHaveAttribute("loading", "lazy");
      await expect(image).toHaveAttribute("decoding", "async");
      await expect(image).toHaveAttribute("crossorigin", "anonymous");
      await expect(image).toHaveAttribute("referrerpolicy", "no-referrer");
      await expect(page.locator("#ref-proof")).toHaveText("IMG");
      await expect.poll(() => held.length).toBe(1);
      await release();
      await expect(frame).toHaveAttribute("data-state", "loaded");
      await expect(image).toBeVisible();
      await expect(page.locator("#main-fallback")).toBeHidden();
      await expect(
        page.getByRole("img", { name: "Ada portrait", exact: true }),
      ).toHaveCount(1);
      expect(
        await page
          .getByRole("img", { name: "Ada portrait", exact: true })
          .evaluate((node) => node.tagName),
      ).toBe("IMG");
      await expect(page.locator("#counts")).toHaveText("Loads 1; errors 0");
      await expect(page.locator("#events")).toHaveText("capture-load,load");
      expect(
        await image.evaluate((node) => (node as HTMLImageElement).naturalWidth),
      ).toBe(32);
    });
    test("error and recovery retain alternate text and independent instance state", async ({
      page,
    }) => {
      const frame = page.locator("#main").locator("..");
      await page
        .getByRole("button", { name: "Failed source", exact: true })
        .click();
      await expect(frame).toHaveAttribute("data-state", "error");
      await expect(page.locator("#main-fallback")).toBeVisible();
      await expect(
        page.getByRole("img", { name: "Ada portrait", exact: true }),
      ).toHaveCount(1);
      await expect(page.locator("#counts")).toHaveText("Loads 0; errors 1");
      await expect(page.locator("#events")).toHaveText("capture-error,error");
      await expect(page.locator("#independent").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
      await expect(
        page.getByRole("img", { name: "Bea portrait", exact: true }),
      ).toHaveCount(1);
      await page
        .getByRole("button", { name: "Successful source", exact: true })
        .click();
      await expect(frame).toHaveAttribute("data-state", "loaded");
      await expect(page.locator("#counts")).toHaveText("Loads 1; errors 1");
      await expect(page.locator("#events")).toHaveText(
        "capture-error,error,capture-load,load",
      );
    });
    test("decorative fallback and caller hiding avoid redundant native naming", async ({
      page,
    }) => {
      await expect(page.locator("#decorative")).toHaveAttribute("alt", "");
      await expect(page.locator("#decorative").locator("..")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(
        page.locator("#decorative").locator(".."),
      ).not.toHaveAttribute("role", "img");
      await expect(page.locator("#native").locator("..")).toHaveAttribute(
        "data-state",
        "error",
      );
      await expect(
        page.getByRole("img", {
          name: "Native failure alternate text",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.locator("#native").locator("..").locator(".kit-avatar-fallback"),
      ).toHaveCount(0);
      await expect(page.locator("#hidden").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
      await expect(page.locator("#hidden")).toBeHidden();
      await expect(
        page.getByRole("img", { name: "Ignored portrait", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("#aria-hidden")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      await expect(page.locator("#until-found")).toHaveAttribute(
        "hidden",
        "until-found",
      );
      expect(
        await page
          .locator("#until-found")
          .evaluate((node) => getComputedStyle(node).contentVisibility),
      ).toBe("hidden");
    });
    test("replacement requests reject stale completion and repeated sources reset correctly", async ({
      page,
    }) => {
      const frame = page.locator("#main").locator("..");
      const previous = await page.locator("#main").elementHandle();
      await expect.poll(() => held.length).toBe(1);
      await page
        .getByRole("button", { name: "Successful source", exact: true })
        .click();
      await expect(frame).toHaveAttribute("data-state", "loaded");
      expect(await previous!.evaluate((node) => node.isConnected)).toBe(false);
      await release();
      await previous!.evaluate((node) => node.dispatchEvent(new Event("load")));
      await previous!.evaluate((node) =>
        node.dispatchEvent(new Event("error")),
      );
      await expect(frame).toHaveAttribute("data-state", "loaded");
      await expect(page.locator("#counts")).toHaveText("Loads 1; errors 0");
      await page
        .getByRole("button", { name: "Slow source", exact: true })
        .click();
      await expect(frame).toHaveAttribute("data-state", "loaded");
      await expect(page.locator("#counts")).toHaveText("Loads 2; errors 0");
      await page
        .getByRole("button", { name: "Fresh slow source", exact: true })
        .click();
      await expect(frame).toHaveAttribute("data-state", "loading");
      await expect(page.locator("#main-fallback")).toBeVisible();
      await expect.poll(() => held.length).toBe(1);
      await release();
      await expect(frame).toHaveAttribute("data-state", "loaded");
      await expect(page.locator("#counts")).toHaveText("Loads 3; errors 0");
    });
    test("native responsive source selection replaces the image without a kit preloader", async ({
      page,
    }) => {
      const old = await page.locator("#main").elementHandle();
      await page
        .getByRole("button", { name: "Toggle responsive source", exact: true })
        .click();
      await expect(page.locator("#main").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
      await expect(page.locator("#main")).toHaveAttribute(
        "srcset",
        "/avatar/responsive.svg 1x",
      );
      await expect(page.locator("#main")).toHaveAttribute("sizes", "64px");
      expect(
        await page
          .locator("#main")
          .evaluate((node) => (node as HTMLImageElement).currentSrc),
      ).toContain("/avatar/responsive.svg");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await expect(page.locator("#counts")).toHaveText("Loads 1; errors 0");
    });
    test("empty source and teardown retain fallback safety and reset the image ref", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Empty source", exact: true })
        .click();
      await expect(page.locator("#main").locator("..")).toHaveAttribute(
        "data-state",
        "error",
      );
      await expect(page.locator("#main-fallback")).toBeVisible();
      const previous = await page.locator("#main").elementHandle();
      await page
        .getByRole("button", { name: "Toggle avatar", exact: true })
        .click();
      await expect(page.locator("#main")).toHaveCount(0);
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await previous!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Successful source", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Toggle avatar", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("IMG");
      await expect(page.locator("#main").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
      await expect(
        page.getByRole("img", { name: "Ada portrait", exact: true }),
      ).toHaveCount(1);
    });
    test("source dimensions radius and target fallback hooks inherit through theme RTL and reduced motion", async ({
      page,
    }) => {
      const image = page.locator("#main");
      const frame = image.locator("..");
      const fallback = frame.locator(".kit-avatar-fallback");
      const imageStyle = () =>
        image.evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            width: c.width,
            height: c.height,
            radius: c.borderRadius,
            fit: c.objectFit,
            box: c.boxSizing,
            display: c.display,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      const fallbackStyle = () =>
        fallback.evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            background: c.backgroundColor,
            color: c.color,
            width: c.width,
            height: c.height,
          };
        });
      expect(await imageStyle()).toMatchObject({
        width: "40px",
        height: "40px",
        radius: "999px",
        fit: "cover",
        box: "border-box",
        display: "block",
      });
      expect(await fallbackStyle()).toEqual({
        background: "rgb(220, 225, 230)",
        color: "rgb(60, 70, 80)",
        width: "40px",
        height: "40px",
      });
      await page
        .getByRole("button", { name: "Toggle customization", exact: true })
        .click();
      expect((await imageStyle()).radius).toBe("8px");
      expect(await fallbackStyle()).toEqual({
        background: "rgb(180, 200, 220)",
        color: "rgb(30, 60, 90)",
        width: "40px",
        height: "40px",
      });
      expect(
        await frame.evaluate((node) => getComputedStyle(node).borderRadius),
      ).toBe("8px");
      await page
        .getByRole("button", { name: "Toggle dimensions", exact: true })
        .click();
      expect(await imageStyle()).toMatchObject({
        width: "64px",
        height: "48px",
      });
      expect(await fallbackStyle()).toMatchObject({
        width: "64px",
        height: "48px",
      });
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await imageStyle()).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
    });
    test("already-complete SSR images hydrate without duplicate load callbacks or node replacement", async ({
      page,
    }) => {
      let unblock!: () => void;
      const gate = new Promise<void>((resolve) => {
        unblock = resolve;
      });
      await page.route("**/_app/immutable/**/*.js", async (route) => {
        await gate;
        await route.continue();
      });
      const destination = new URL(`${consumer.route}?cached=1`, hosted.baseURL);
      await page.goto(destination.href, { waitUntil: "commit" });
      try {
        const image = page.locator("#main");
        await expect
          .poll(() =>
            image.evaluate(
              (node) =>
                (node as HTMLImageElement).complete &&
                (node as HTMLImageElement).naturalWidth > 0,
            ),
          )
          .toBe(true);
        await expect(page.locator('[data-ready="false"]')).toBeVisible();
        await expect(image.locator("..")).toHaveAttribute(
          "data-state",
          "loading",
        );
        const initial = await image.elementHandle();
        expect(
          await image.evaluate(
            (node) => (node as HTMLImageElement & { __e?: Event }).__e?.type,
          ),
        ).toBe("load");
        unblock();
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await expect(image.locator("..")).toHaveAttribute(
          "data-state",
          "loaded",
        );
        expect(
          await initial!.evaluate(
            (node) => node === document.getElementById("main"),
          ),
        ).toBe(true);
        await expect(page.locator("#counts")).toHaveText("Loads 1; errors 0");
        await expect(page.locator("#events")).toHaveText("capture-load,load");
        await expect(
          page.getByRole("img", { name: "Ada portrait", exact: true }),
        ).toHaveCount(1);
      } finally {
        unblock();
        await page.unroute("**/_app/immutable/**/*.js");
      }
    });
    test("concurrent real SSR responses retain request-local initial loading and distinct source attrs", async ({
      request,
      page,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const url = new URL(consumer.route, hosted.baseURL);
          if (index % 2) url.searchParams.set("cached", "1");
          const response = await request.get(url.href);
          expect(response.status()).toBe(200);
          return { index, body: await response.text() };
        }),
      );
      for (const { index, body } of responses) {
        expect(body.match(/data-state="loading"/g)).toHaveLength(7);
        expect(body).not.toContain('data-state="loaded"');
        expect(body).not.toContain('data-state="error"');
        expect(body).toContain('id="counts">Loads 0; errors 0');
        expect(body).toContain(
          index % 2
            ? 'src="../avatar/success.svg"'
            : 'src="../avatar/slow.svg"',
        );
        expect(body).toContain('aria-label="Ada portrait"');
      }
      await expect(page.locator("#main").locator("..")).toHaveAttribute(
        "data-state",
        "loading",
      );
      await expect(page.locator("#independent").locator("..")).toHaveAttribute(
        "data-state",
        "loaded",
      );
    });
  });
