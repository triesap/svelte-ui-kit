import { writeFileSync } from "node:fs";
import { buildCatalogConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

test("complete basic catalog retains identical native presentation across installation mappings", async ({
  page,
}, info) => {
  test.setTimeout(480000);
  const captures: Buffer[] = [];
  for (const custom of [false, true]) {
    const consumer = buildCatalogConsumer(custom);
    let hosted: FixtureServer | undefined;
    try {
      hosted = await startFixtureServer({ handler: consumer.handler });
      const response = await page.goto(
        new URL(consumer.route, hosted.baseURL).href,
      );
      expect(response?.status()).toBe(200);
      await expect(
        page.getByRole("heading", {
          name: "Complete installed catalog",
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Anchor", exact: true }),
      ).toHaveAttribute("href", "https://example.com");
      await expect(
        page.getByRole("link", { name: "Recipe", exact: true }),
      ).toHaveAttribute("href", "https://example.com/recipe");
      const surfaces = [
        [".kit-avatar", "IMG"],
        [".kit-badge", "SPAN"],
        [".kit-button", "BUTTON"],
        [".kit-card", "SECTION"],
        [".kit-alert", "DIV"],
        [".kit-status", "P"],
        [".kit-progress", "PROGRESS"],
        [".kit-separator", "DIV"],
        [".kit-skeleton", "SPAN"],
        [".kit-spinner", "SPAN"],
      ] as const;
      for (const [selector, tag] of surfaces) {
        await expect(page.locator(selector)).toBeVisible();
        expect(
          await page.locator(selector).evaluate((node) => node.tagName),
        ).toBe(tag);
      }
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all([...document.images].map((image) => image.decode()));
      });
      expect(
        await page
          .locator(".kit-avatar")
          .evaluate((node) => (node as HTMLImageElement).naturalWidth),
      ).toBe(16);
      const name = custom ? "custom" : "default";
      const artifact = info.outputPath(`basic-catalog-${name}.png`);
      captures.push(
        await page.screenshot({
          path: artifact,
          fullPage: true,
          animations: "disabled",
        }),
      );
      await info.attach(`basic-catalog-${name}`, {
        path: artifact,
        contentType: "image/png",
      });
      const evidence = info.outputPath(`installed-catalog-${name}.json`);
      writeFileSync(evidence, JSON.stringify(consumer.evidence, null, 2));
      await info.attach(`installed-catalog-${name}`, {
        path: evidence,
        contentType: "application/json",
      });
    } finally {
      try {
        if (hosted) {
          await hosted.server.stop();
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        consumer.cleanup();
      }
    }
  }
  expect(captures[0]!.equals(captures[1]!)).toBe(true);
});
