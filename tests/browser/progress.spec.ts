import { writeFileSync } from "node:fs";
import type { TestInfo } from "@playwright/test";
import { buildProgressConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

async function attachArtifact(
  info: TestInfo,
  name: string,
  artifact: { body: Buffer | string; contentType: string },
) {
  const file = info.outputPath(
    name + (artifact.contentType === "image/png" ? ".png" : ".json"),
  );
  writeFileSync(file, artifact.body);
  await info.attach(name, { path: file, contentType: artifact.contentType });
}

for (const custom of [false, true])
  test.describe(`generated Progress ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildProgressConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildProgressConsumer(custom);
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

    test("native progress naming caller attributes events focus and form behavior", async ({
      page,
    }) => {
      const main = page.locator("#main");
      expect(await main.evaluate((node) => node.tagName)).toBe("PROGRESS");
      await expect(main).toHaveClass("kit-progress caller retained");
      await expect(main).toHaveAttribute("title", "Transfer progress");
      await expect(main).toHaveAttribute("data-caller", "preserved");
      await expect(main).toHaveAttribute("data-state", "caller-owned");
      await expect(main).not.toHaveAttribute("role");
      await expect(main).not.toHaveAttribute("aria-valuenow");
      await expect(main).not.toHaveAttribute("aria-live");
      await expect(
        page.getByRole("progressbar", { name: "Upload", exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole("progressbar", { name: "Download", exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole("progressbar", { name: "Preparation", exact: true }),
      ).toHaveCount(1);
      await expect(page.locator("#ref-proof")).toHaveText("PROGRESS");
      await page
        .getByRole("button", { name: "Focus progress", exact: true })
        .click();
      await expect(main).toBeFocused();
      await main.click();
      await main.press("Enter");
      await main.press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 0; resets 0",
      );
      expect(
        await main.evaluate((node) =>
          Array.from(new FormData(node.closest("form")!).entries()),
        ),
      ).toEqual([["native-field", "preserved"]]);
      await page
        .getByRole("button", { name: "Next bounds", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit native form", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset native form", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Clicks 1; keys 2; submits 1; resets 1",
      );
      expect(
        await main.evaluate((node) => (node as HTMLProgressElement).value),
      ).toBe(0);
    });
    test("all numeric bounds zero omission null and nonfinite states match direct native semantics and accessible ranges", async ({
      page,
    }, info) => {
      const main = page.locator("#main");
      const initial = await main.elementHandle();
      const session = await page.context().newCDPSession(page);
      const evidence = [];
      const states = [
        { value: 25, max: 100, position: 0.25 },
        { value: 0, max: 100, position: 0 },
        { value: 75, max: 80, position: 0.9375 },
        { value: 0, max: 100, position: 0 },
        { value: 100, max: 100, position: 1 },
        { value: 1, max: 1, position: 1 },
        { value: 1, max: 1, position: 1 },
        { value: 0.5, max: 0.5, position: 1 },
        { value: 0, max: 100, position: -1 },
        { value: 0, max: 1, position: -1 },
        { value: 0, max: 100, position: 0 },
        { value: 0, max: 100, position: 0 },
      ];
      const read = (id: string) =>
        page.locator(id).evaluate((node) => {
          const p = node as HTMLProgressElement;
          return {
            value: p.value,
            max: p.max,
            position: p.position,
            indeterminate: p.matches(":indeterminate"),
            valueAttr: p.getAttribute("value"),
            maxAttr: p.getAttribute("max"),
          };
        });
      for (let i = 0; i < states.length; i++) {
        const expected = states[i]!;
        const actual = await read("#main"),
          control = await read("#native-control");
        expect(actual).toEqual(control);
        expect(actual).toMatchObject({
          ...expected,
          indeterminate: expected.position === -1,
        });
        expect(
          await initial!.evaluate(
            (node) => node === document.getElementById("main"),
          ),
        ).toBe(true);
        await expect(main).toHaveAccessibleName("Upload");
        const tree = await session.send("Accessibility.getFullAXTree");
        const one = (name: string) => {
          const nodes = tree.nodes.filter(
            (n) =>
              !n.ignored &&
              n.role?.value === "progressbar" &&
              n.name?.value === name,
          );
          expect(nodes).toHaveLength(1);
          const node = nodes[0]!;
          const properties = Object.fromEntries(
            (node.properties ?? [])
              .filter((p) => ["valuemin", "valuemax"].includes(p.name))
              .map((p) => [p.name, p.value.value]),
          );
          return { value: node.value?.value, ...properties };
        };
        const ax = one("Upload");
        expect(ax).toEqual(one("Native control"));
        expect(ax).toMatchObject({ valuemin: 0, valuemax: expected.max });
        if (expected.position === -1) expect(ax.value).toBeUndefined();
        else expect(Number(ax.value)).toBe(expected.value);
        evidence.push({ i, actual, ax });
        if (i === 0 || i === 2 || i === 8)
          await attachArtifact(info, "native-progress-state-" + i, {
            body: await main.screenshot(),
            contentType: "image/png",
          });
        if (i < states.length - 1)
          await page
            .getByRole("button", { name: "Next bounds", exact: true })
            .click();
      }
      await attachArtifact(info, "native-progress-ranges", {
        body: JSON.stringify(evidence, null, 2),
        contentType: "application/json",
      });
      await session.detach();
      for (const initial of [
        { query: "value=-10&max=0", value: 0, max: 1, position: 0 },
        { query: "value=NaN", value: 0, max: 100, position: 0 },
        { query: "value=Infinity", value: 0, max: 100, position: 0 },
      ]) {
        await page.goto(
          new URL(consumer.route + "?" + initial.query, hosted.baseURL).href,
        );
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        expect(await read("#main")).toEqual(await read("#native-control"));
        expect(await read("#main")).toMatchObject({
          value: initial.value,
          max: initial.max,
          position: initial.position,
        });
      }
    });
    test("native attribute parsing differs causally from numeric IDL setters", async ({
      page,
    }) => {
      const actual = await page.evaluate(() => {
        const p = document.createElement("progress");
        p.max = 100;
        p.max = 0;
        const setterMax = p.max;
        p.setAttribute("max", "0");
        const parsedMax = p.max;
        let nonfiniteError = "";
        try {
          p.value = NaN;
        } catch (error) {
          nonfiniteError = (error as Error).name;
        }
        p.setAttribute("value", "NaN");
        const parsedValue = p.value;
        const parsedPosition = p.position;
        p.removeAttribute("value");
        const absentPosition = p.position;
        p.value = 0;
        const zeroPosition = p.position;
        return {
          setterMax,
          parsedMax,
          nonfiniteError,
          parsedValue,
          parsedPosition,
          absentPosition,
          zeroPosition,
        };
      });
      expect(actual).toEqual({
        setterMax: 100,
        parsedMax: 1,
        nonfiniteError: "TypeError",
        parsedValue: 0,
        parsedPosition: 0,
        absentPosition: -1,
        zeroPosition: 0,
      });
    });
    test("native indeterminate accessible name and explicit value text stay independent from fallback numbers", async ({
      page,
    }) => {
      await expect(page.locator("#aria-named")).toHaveAccessibleName(
        "Preparation",
      );
      expect(
        await page.locator("#aria-named").evaluate((node) => ({
          indeterminate: node.matches(":indeterminate"),
          text: node.textContent,
          value: node.getAttribute("value"),
        })),
      ).toEqual({ indeterminate: true, text: "", value: null });
      const session = await page.context().newCDPSession(page);
      const tree = await session.send("Accessibility.getFullAXTree");
      const node = tree.nodes.find(
        (node) =>
          !node.ignored &&
          node.role?.value === "progressbar" &&
          node.name?.value === "Download",
      );
      expect(node).toBeDefined();
      expect(
        Object.fromEntries(
          (node!.properties ?? []).map((p) => [p.name, p.value.value]),
        ),
      ).toMatchObject({
        valuetext: "",
        valuemin: 0,
        valuemax: 100,
      });
      const control = tree.nodes.find(
        (node) =>
          !node.ignored &&
          node.role?.value === "progressbar" &&
          node.name?.value === "Native value text",
      );
      expect(control).toBeDefined();
      const props = (node: NonNullable<typeof control>) =>
        Object.fromEntries(
          (node.properties ?? [])
            .filter((p) =>
              ["valuetext", "valuemin", "valuemax"].includes(p.name),
            )
            .map((p) => [p.name, p.value.value]),
        );
      expect(props(node!)).toEqual(props(control!));
      await expect(page.locator("#styled")).toHaveAttribute(
        "aria-valuetext",
        "One quarter copied",
      );
      await expect(page.locator("#native-value-text")).toHaveAttribute(
        "aria-valuetext",
        "One quarter copied",
      );
      await session.detach();
    });
    test("native hiding until found and conditional teardown preserve actual refs", async ({
      page,
    }) => {
      const old = await page.locator("#main").elementHandle();
      await expect(page.locator("#until-found")).toHaveAttribute(
        "hidden",
        "until-found",
      );
      expect(
        await page
          .locator("#until-found")
          .evaluate((node) => getComputedStyle(node).contentVisibility),
      ).toBe("hidden");
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toBeHidden();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#main")).toBeVisible();
      await page
        .getByRole("button", { name: "Toggle progress", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("none");
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle progress", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText("PROGRESS");
      await expect(page.locator("#main")).toHaveAccessibleName("Upload");
    });
    test("all eight source styles radius paths live themes caller geometry RTL and reduced motion compute", async ({
      page,
    }, info) => {
      const style = (id: string) =>
        page.locator(id).evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            display: c.display,
            width: c.width,
            height: c.height,
            border: c.borderWidth,
            radius: c.borderRadius,
            overflow: c.overflow,
            background: c.backgroundColor,
            accent: c.accentColor,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      expect(await style("#main")).toMatchObject({
        display: "block",
        width: "320px",
        height: "8px",
        border: "0px",
        radius: "999px",
        overflow: "hidden",
        background: "rgb(243, 244, 246)",
        accent: "rgb(17, 24, 39)",
      });
      for (const radius of ["10px", "6px", "18px", "3px", "999px"]) {
        await page
          .getByRole("button", { name: "Next radius", exact: true })
          .click();
        expect((await style("#main")).radius).toBe(radius);
      }
      expect(await style("#styled")).toMatchObject({
        width: "160px",
        height: "12px",
        radius: "2px",
        accent: "rgb(120, 20, 40)",
        background: "rgb(250, 240, 230)",
      });
      const baseline = await style("#main");
      const paint = async (id: string) => {
        const screenshot = await page.locator(id).screenshot();
        return page.evaluate(async (base64) => {
          const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
          const bitmap = await createImageBitmap(
            new Blob([bytes], { type: "image/png" }),
          );
          const canvas = document.createElement("canvas");
          canvas.width = bitmap.width;
          canvas.height = bitmap.height;
          const ctx = canvas.getContext("2d")!;
          ctx.drawImage(bitmap, 0, 0);
          const color = (x: number) =>
            Array.from(
              ctx.getImageData(
                Math.floor(canvas.width * x),
                Math.floor(canvas.height / 2),
                1,
                1,
              ).data,
            );
          const result = { indicator: color(0.125), track: color(0.75) };
          bitmap.close();
          return result;
        }, screenshot.toString("base64"));
      };
      const baselinePaint = await paint("#main");
      expect(baselinePaint).toEqual({
        indicator: [17, 24, 39, 255],
        track: [243, 244, 246, 255],
      });
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      const night = await style("#main");
      expect(night).toMatchObject({
        accent: "rgb(240, 245, 250)",
        background: "rgb(35, 40, 50)",
      });
      const nightPaint = await paint("#main");
      expect(nightPaint).toEqual({
        indicator: [240, 245, 250, 255],
        track: [35, 40, 50, 255],
      });
      const callerPaint = await paint("#styled");
      expect(callerPaint).toEqual({
        indicator: [120, 20, 40, 255],
        track: [250, 240, 230, 255],
      });
      await attachArtifact(info, "painted-progress-color-pairs", {
        body: JSON.stringify(
          { baselinePaint, nightPaint, callerPaint },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await attachArtifact(info, "native-progress-night", {
        body: await page.locator("#theme").screenshot(),
        contentType: "image/png",
      });
      const luminance = (rgb: string) => {
        const c = rgb
          .match(/\d+/g)!
          .map(Number)
          .slice(0, 3)
          .map((c) => {
            const x = c / 255;
            return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
          });
        return c[0]! * 0.2126 + c[1]! * 0.7152 + c[2]! * 0.0722;
      };
      const pairs = [baseline, night, await style("#styled")].map((pair) => {
        const a = luminance(pair.accent),
          b = luminance(pair.background),
          ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
        expect(ratio).toBeGreaterThanOrEqual(3);
        return { accent: pair.accent, background: pair.background, ratio };
      });
      await attachArtifact(info, "source-native-progress-color-pairs", {
        body: JSON.stringify(pairs, null, 2),
        contentType: "application/json",
      });
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await style("#main")).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
      expect(
        await page
          .locator("#main")
          .evaluate((node) => (node as HTMLProgressElement).position),
      ).toBe(0.25);
    });
    test("eight concurrent production SSR responses preserve request local labels values and indeterminate omission", async ({
      request,
      page,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, async (_, i) => {
          const response = await request.get(
            new URL(
              consumer.route + "?label=Request-" + i + "&value=" + i,
              hosted.baseURL,
            ).href,
          );
          expect(response.status()).toBe(200);
          return { i, body: await response.text() };
        }),
      );
      for (const { i, body } of responses) {
        expect(body).toContain('id="task-label">Request-' + i);
        expect(body).toMatch(
          new RegExp(
            '<progress[^>]*id="main"[^>]*value="' + i + '"[^>]*max="100"',
          ),
        );
        expect(body).toContain(i + " / 100");
        expect(body).toContain('id="ref-proof">none');
        expect(body).toContain(
          'id="counts">Clicks 0; keys 0; submits 0; resets 0',
        );
        expect(body.match(/<progress\b/g)).toHaveLength(6);
        expect(body).toMatch(/id="aria-named"[^>]*max="100"/);
        expect(
          body.match(/<progress[^>]*id="aria-named"[^>]*>/)![0],
        ).not.toMatch(/value=/);
        for (let other = 0; other < 8; other++)
          if (other !== i) expect(body).not.toContain("Request-" + other);
      }
      await expect(page.locator("#main")).toHaveAccessibleName("Upload");
      expect(
        await page
          .locator("#main")
          .evaluate((node) => (node as HTMLProgressElement).value),
      ).toBe(25);
    });
  });
