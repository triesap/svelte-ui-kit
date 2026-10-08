import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { buildMenuConsumer } from "../helpers/generated-consumer.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

// Every expected CSP diagnostic is retained and attributed to the tested policy.
// JavaScript-disabled requests measure server style enforcement before hydration.
for (const custom of [false, true])
  for (const policy of ["allow-attributes", "deny-attributes"] as const)
    test.describe(`installed Menu CSP ${custom ? "custom" : "default"} ${policy}`, () => {
      test.use({ javaScriptEnabled: false });
      let consumer: ReturnType<typeof buildMenuConsumer>;
      let hosted: FixtureServer;
      test.beforeAll(async () => {
        test.setTimeout(240000);
        consumer = buildMenuConsumer(custom, "menu-placement", (root) => {
          const file = path.join(root, "svelte.config.js");
          const source = readFileSync(file, "utf8");
          expect(source.split("adapter: adapter(),").length).toBe(2);
          writeFileSync(
            file,
            source.replace(
              "adapter: adapter(),",
              `adapter: adapter(),\n    csp: { mode: "nonce", directives: { "default-src": ["self"], "script-src": ["self"], "style-src": ["self"], "style-src-attr": ["${policy === "allow-attributes" ? "unsafe-inline" : "none"}"] } },`,
            ),
          );
        });
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
      test("actual CSP response measures native SSR floating style support and violations", async ({
        page,
      }, info) => {
        const errors: string[] = [],
          warnings: string[] = [],
          exceptions: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
          if (message.type() === "warning") warnings.push(message.text());
        });
        page.on("pageerror", (error) => exceptions.push(error.message));
        const response = await page.goto(
          new URL(
            `${consumer.route}?initial=open&portal=inline`,
            hosted.baseURL,
          ).href,
        );
        expect(response?.status()).toBe(200);
        const header = response!.headers()["content-security-policy"]!;
        expect(header).toContain(
          `style-src-attr '${policy === "allow-attributes" ? "unsafe-inline" : "none"}'`,
        );
        expect(header).toMatch(/script-src[^;]*'nonce-/);
        const content = page.locator("#placement-content"),
          outer = content.locator("..");
        await expect(content).toHaveCount(1);
        await expect(page.locator("main")).toHaveAttribute(
          "data-ready",
          "false",
        );
        const measured = await outer.evaluate((node) => ({
          style: node.getAttribute("style"),
          position: getComputedStyle(node).position,
          transform: getComputedStyle(node).transform,
        }));
        expect(measured.style).toContain("position: absolute");
        expect(measured.style).toContain("transform:");
        expect(measured.position).toBe(
          policy === "allow-attributes" ? "absolute" : "static",
        );
        await page.close();
        const file = info.outputPath("csp-evidence.json");
        writeFileSync(
          file,
          JSON.stringify(
            {
              policy,
              header,
              measured,
              errors,
              warnings,
              exceptions,
              artifact: consumer.evidence,
            },
            null,
            2,
          ),
        );
        await info.attach("csp-evidence", {
          path: file,
          contentType: "application/json",
        });
        expect(exceptions).toEqual([]);
        expect(warnings).toEqual([]);
        if (policy === "allow-attributes") expect(errors).toEqual([]);
        else {
          expect(errors.length).toBeGreaterThan(0);
          for (const error of errors)
            expect(error).toMatch(
              /Applying inline style violates.*style-src-attr 'none'/,
            );
        }
      });
      test("hydrated actual CSP application retains native runtime geometry and exact diagnostics", async ({
        browser,
      }, info) => {
        const context = await browser.newContext({ javaScriptEnabled: true });
        const page = await context.newPage();
        const errors: string[] = [],
          exceptions: string[] = [],
          warnings: string[] = [];
        page.on("console", (message) => {
          if (message.type() === "error") errors.push(message.text());
          if (message.type() === "warning") warnings.push(message.text());
        });
        page.on("pageerror", (error) => exceptions.push(error.message));
        try {
          const response = await page.goto(
            new URL(
              `${consumer.route}?initial=open&portal=inline`,
              hosted.baseURL,
            ).href,
          );
          expect(response?.status()).toBe(200);
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          const content = page.locator("#placement-content");
          await expect(content).toBeVisible();
          const measured = await content.evaluate((node) => ({
            inner: node.getAttribute("style"),
            outer: node.parentElement?.getAttribute("style"),
            position: getComputedStyle(node.parentElement!).position,
            background: getComputedStyle(node).backgroundColor,
          }));
          expect(measured.outer).toContain("position: absolute");
          expect(measured.inner).toContain("--bits-dropdown-menu-");
          if (policy === "allow-attributes")
            expect(measured.position).toBe("absolute");
          await page.locator("#first-item").press("Escape");
          await expect(content).toHaveCount(0);
          await page.close();
          const file = info.outputPath("hydrated-csp-evidence.json");
          writeFileSync(
            file,
            JSON.stringify(
              {
                policy,
                header: response!.headers()["content-security-policy"],
                measured,
                errors,
                warnings,
                exceptions,
                artifact: consumer.evidence,
              },
              null,
              2,
            ),
          );
          await info.attach("hydrated-csp-evidence", {
            path: file,
            contentType: "application/json",
          });
          expect(exceptions).toEqual([]);
          expect(warnings).toEqual([]);
          if (policy === "allow-attributes") expect(errors).toEqual([]);
          else {
            expect(errors.length).toBeGreaterThan(0);
            for (const error of errors)
              expect(error).toMatch(
                /Applying inline style violates.*style-src-attr 'none'/,
              );
          }
        } finally {
          await context.close();
        }
      });
    });
