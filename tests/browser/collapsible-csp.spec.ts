import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import { buildCollapsibleConsumer } from "../helpers/generated-consumer.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

// Collect every diagnostic, including after page closure. Attribute only the
// tested CSP violation; all exceptions and warnings still fail qualification.
for (const custom of [false, true])
  for (const allow of [true, false])
    test.describe(`installed Collapsible CSP ${custom ? "custom" : "default"} ${allow ? "allow" : "deny"} attributes`, () => {
      let consumer: ReturnType<typeof buildCollapsibleConsumer>;
      let hosted: FixtureServer;
      test.beforeAll(async () => {
        test.setTimeout(240000);
        consumer = buildCollapsibleConsumer(custom, (root) => {
          const file = path.join(root, "svelte.config.js");
          const source = readFileSync(file, "utf8");
          expect(source.split("adapter: adapter(),").length).toBe(2);
          writeFileSync(
            file,
            source.replace(
              "adapter: adapter(),",
              `adapter: adapter(),\n csp: { mode: "nonce", directives: { "default-src": ["self"], "script-src": ["self"], "style-src": ["self"], "style-src-attr": ["${allow ? "unsafe-inline" : "none"}"] } },`,
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
      for (const hydrated of [false, true])
        test(`${hydrated ? "hydrated" : "server"} response measures actual measurement styles under the exact policy`, async ({
          browser,
        }, info) => {
          const context = await browser.newContext({
            javaScriptEnabled: hydrated,
          });
          const page = await context.newPage();
          const errors: string[] = [],
            warnings: string[] = [],
            exceptions: string[] = [];
          page.on("console", (message) => {
            if (message.type() === "error") errors.push(message.text());
            if (message.type() === "warning") warnings.push(message.text());
          });
          page.on("pageerror", (error) => exceptions.push(error.message));
          try {
            const response = await page.goto(
              new URL(`${consumer.route}?open=true`, hosted.baseURL).href,
            );
            expect(response?.status()).toBe(200);
            const header = response!.headers()["content-security-policy"]!;
            expect(header).toContain(
              `style-src-attr '${allow ? "unsafe-inline" : "none"}'`,
            );
            expect(header).toMatch(/script-src[^;]*'nonce-/);
            await expect(
              page.locator(`[data-ready="${hydrated}"]`),
            ).toBeVisible();
            const content = page.locator("#disclosure-content");
            await expect(content).toBeVisible();
            await expect(content).toHaveCSS("padding", "8px 0px");
            await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
              "aria-expanded",
              "true",
            );
            const measured = await content.evaluate((node) => ({
              style: node.getAttribute("style"),
              height: getComputedStyle(node).getPropertyValue(
                "--bits-collapsible-content-height",
              ),
              width: getComputedStyle(node).getPropertyValue(
                "--bits-collapsible-content-width",
              ),
              rect: node.getBoundingClientRect().toJSON(),
            }));
            expect(measured.rect.height).toBeGreaterThan(0);
            if (hydrated) {
              await expect(page.locator("#disclosure-trigger")).toHaveAttribute(
                "aria-controls",
                "disclosure-content",
              );
              await page.locator("#disclosure-trigger").press("Space");
              await expect(content).toBeHidden();
              await page.locator("#disclosure-trigger").press("Enter");
              await expect(content).toBeVisible();
            }
            await page.close();
            const file = info.outputPath("collapsible-csp-evidence.json");
            writeFileSync(
              file,
              JSON.stringify(
                {
                  allow,
                  hydrated,
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
            await info.attach("collapsible-csp-evidence", {
              path: file,
              contentType: "application/json",
            });
            expect(exceptions).toEqual([]);
            expect(warnings).toEqual([]);
            if (allow) expect(errors).toEqual([]);
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
