import { writeFileSync } from "node:fs";
import { buildCardConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true])
  test.describe(`generated Card ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildCardConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildCardConsumer(custom);
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
    test("source native section preserves application structure independent naming and caller attributes", async ({
      page,
    }) => {
      const outer = page.locator("#outer");
      expect(await outer.evaluate((node) => node.tagName)).toBe("SECTION");
      await expect(outer).toHaveClass("kit-card caller retained");
      await expect(outer).toHaveAttribute("title", "Section description");
      await expect(outer).toHaveAttribute("data-caller", "preserved");
      await expect(outer).toHaveAttribute("data-state", "caller-owned");
      await expect(outer).not.toHaveAttribute("role");
      await expect(outer).not.toHaveAttribute("aria-live");
      await expect(page.getByRole("region")).toHaveCount(2);
      await expect(
        page.getByRole("region", { name: "Outer section", exact: true }),
      ).toHaveCount(1);
      await expect(
        page.getByRole("region", { name: "Inner section", exact: true }),
      ).toHaveCount(1);
      await expect(page.locator("#outer > header > h2")).toHaveText(
        "Outer section",
      );
      await expect(page.locator("#outer > #inner > h3")).toHaveText(
        "Inner section",
      );
      await expect(page.locator("#outer > footer")).toHaveText(
        "Application footer",
      );
      await expect(page.locator("#unnamed")).not.toHaveAttribute("aria-label");
      await expect(page.locator("#unnamed")).not.toHaveAttribute("role");
      await expect(page.locator("#ref-proof")).toHaveText(
        "Outer SECTION; inner SECTION",
      );
    });
    test("dynamic content retains application input state and native child behavior", async ({
      page,
    }) => {
      const outer = await page.locator("#outer").elementHandle();
      const inner = await page.locator("#inner").elementHandle();
      const input = page.getByRole("textbox", {
        name: "Native editable field",
      });
      await input.fill("retained");
      await page
        .getByRole("button", { name: "Update content", exact: true })
        .click();
      await expect(page.locator("#content")).toHaveText("Updated content");
      await expect(input).toHaveValue("retained");
      expect(
        await outer!.evaluate(
          (node) => node === document.getElementById("outer"),
        ),
      ).toBe(true);
      expect(
        await inner!.evaluate(
          (node) => node === document.getElementById("inner"),
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Native child action", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Actions 1; clicks 1; keys 0; submits 0; resets 0",
      );
    });
    test("native focus keyboard and caller event cancellation preserve form defaults", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Focus card", exact: true })
        .click();
      await expect(page.locator("#outer")).toBeFocused();
      await page.locator("#outer").press("Enter");
      await page.locator("#outer").press("Space");
      await expect(page.locator("#counts")).toHaveText(
        "Actions 0; clicks 0; keys 2; submits 0; resets 0",
      );
      await page
        .getByRole("textbox", { name: "Native editable field" })
        .fill("answer");
      expect(
        await page
          .locator("#outer form")
          .evaluate((node) =>
            Array.from(new FormData(node as HTMLFormElement).entries()),
          ),
      ).toEqual([["answer", "answer"]]);
      await page
        .getByRole("button", { name: "Toggle cancellation", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit native form", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Actions 0; clicks 1; keys 2; submits 0; resets 0",
      );
      await page
        .getByRole("button", { name: "Toggle cancellation", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Submit native form", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Reset native form", exact: true })
        .click();
      await expect(page.locator("#counts")).toHaveText(
        "Actions 0; clicks 3; keys 2; submits 1; resets 1",
      );
      await expect(
        page.getByRole("textbox", { name: "Native editable field" }),
      ).toHaveValue("initial");
    });
    test("native hiding and teardown clear both actual section refs", async ({
      page,
    }) => {
      const outer = await page.locator("#outer").elementHandle();
      const inner = await page.locator("#inner").elementHandle();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#outer")).toBeHidden();
      await expect(page.locator("#inner")).toBeHidden();
      await page
        .getByRole("button", { name: "Toggle hiding", exact: true })
        .click();
      await expect(page.locator("#outer")).toBeVisible();
      await page
        .getByRole("button", { name: "Toggle cards", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText(
        "Outer none; inner none",
      );
      expect(await outer!.evaluate((node) => node.isConnected)).toBe(false);
      expect(await inner!.evaluate((node) => node.isConnected)).toBe(false);
      await page
        .getByRole("button", { name: "Toggle cards", exact: true })
        .click();
      await expect(page.locator("#ref-proof")).toHaveText(
        "Outer SECTION; inner SECTION",
      );
      await expect(page.getByRole("region")).toHaveCount(2);
    });
    test("all source surface values radius paths and live nested themes stay independently computed", async ({
      page,
    }) => {
      const style = async (id: string) =>
        page.locator(`#${id}`).evaluate((node) => {
          const c = getComputedStyle(node);
          return {
            box: c.boxSizing,
            borderWidth: c.borderTopWidth,
            borderStyle: c.borderTopStyle,
            borderColor: c.borderTopColor,
            radius: c.borderRadius,
            padding: c.padding,
            background: c.backgroundColor,
            color: c.color,
            shadow: c.boxShadow,
            direction: c.direction,
            animation: c.animationName,
            transition: c.transitionDuration,
          };
        });
      expect(await style("outer")).toMatchObject({
        box: "border-box",
        borderWidth: "1px",
        borderStyle: "solid",
        borderColor: "rgb(209, 213, 219)",
        radius: "8px",
        padding: "16px",
        background: "rgb(255, 255, 255)",
        color: "rgb(17, 24, 39)",
        shadow: "rgba(15, 23, 42, 0.08) 0px 1px 2px 0px",
      });
      const inner = await style("inner");
      expect(inner).toMatchObject({
        borderWidth: "2px",
        borderColor: "rgb(80, 90, 100)",
        radius: "4px",
        background: "rgb(230, 240, 250)",
        color: "rgb(20, 30, 40)",
        shadow: "none",
      });
      for (const radius of ["12px", "6px", "10px", "3px", "8px"]) {
        await page
          .getByRole("button", { name: "Next radius", exact: true })
          .click();
        expect((await style("outer")).radius).toBe(radius);
        expect((await style("inner")).radius).toBe("4px");
      }
      await page
        .getByRole("button", { name: "Toggle theme", exact: true })
        .click();
      expect(await style("outer")).toMatchObject({
        borderWidth: "3px",
        borderColor: "rgb(80, 90, 110)",
        background: "rgb(30, 40, 50)",
        color: "rgb(240, 245, 250)",
        shadow: "rgba(10, 20, 30, 0.2) 0px 4px 8px 0px",
      });
      expect(await style("inner")).toEqual(inner);
      await page
        .getByRole("button", { name: "Toggle direction", exact: true })
        .click();
      await page.emulateMedia({ reducedMotion: "reduce" });
      expect(await style("outer")).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
      expect(await style("inner")).toMatchObject({
        direction: "rtl",
        animation: "none",
        transition: "0s",
      });
    });
    test("concurrent real SSR retains distinct application content and section relationships", async ({
      request,
      page,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 8 }, async (_, index) => {
          const response = await request.get(
            new URL(`${consumer.route}?label=Request-${index}`, hosted.baseURL)
              .href,
          );
          expect(response.status()).toBe(200);
          return { index, body: await response.text() };
        }),
      );
      for (const { index, body } of responses) {
        expect(body).toContain(`id="content">Request-${index}`);
        expect(body).toContain('id="ref-proof">Outer none; inner none');
        expect(body).toContain(
          'id="counts">Actions 0; clicks 0; keys 0; submits 0; resets 0',
        );
        expect(body.match(/<section\b/g)).toHaveLength(3);
        expect(body).toContain('aria-labelledby="outer-heading"');
        expect(body).toContain('aria-labelledby="inner-heading"');
        for (let other = 0; other < 8; other++)
          if (other !== index) expect(body).not.toContain(`Request-${other}`);
      }
      await expect(page.locator("#content")).toHaveText("Application content");
      await expect(page.getByRole("region")).toHaveCount(2);
    });
  });
