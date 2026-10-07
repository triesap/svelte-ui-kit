import { writeFileSync } from "node:fs";
import { buildCoreConsumer } from "../helpers/generated-consumer.js";
import { copyCorePackage, evolveCore } from "../helpers/core-workflow.js";
import { installPackedCore } from "../helpers/packed-core.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const packed of [false, true])
  for (const custom of [false, true])
    test.describe(`complete ${packed ? "packed installed" : "built"} core ${custom ? "custom" : "default"}`, () => {
      let consumer: ReturnType<typeof buildCoreConsumer>;
      let pkg: ReturnType<typeof copyCorePackage>;
      let installed: ReturnType<typeof installPackedCore> | undefined;
      let hosted: FixtureServer;
      test.beforeAll(async () => {
        test.setTimeout(300000);
        if (packed) installed = installPackedCore();
        pkg = copyCorePackage(installed?.packageRoot);
        try {
          consumer = buildCoreConsumer(
            custom,
            installed?.packageRoot ?? pkg.root,
            (root, config) => evolveCore(pkg.root, root, config),
          );
          hosted = await startFixtureServer({ handler: consumer.handler });
        } catch (error) {
          consumer?.cleanup();
          pkg.cleanup();
          installed?.cleanup();
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
          pkg?.cleanup();
          installed?.cleanup();
        }
      });
      test.beforeEach(async ({ page }, info) => {
        const file = info.outputPath("core-artifact.json");
        writeFileSync(
          file,
          JSON.stringify(
            {
              consumer: consumer.evidence,
              package: installed?.evidence ?? null,
            },
            null,
            2,
          ),
        );
        await info.attach("core-artifact", {
          path: file,
          contentType: "application/json",
        });
        await page.goto(new URL(consumer.route, hosted.baseURL).href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
      });
      test("actual customized upgraded core preserves native actions loading switch reset and modal focus", async ({
        page,
      }) => {
        await expect(
          page.getByRole("status").filter({ hasText: "Core ready" }),
        ).toBeVisible();
        await page.locator("#action").press("Enter");
        await expect(page.locator("#actions")).toHaveText("1");
        await page.locator("#loading").click();
        await expect(page.locator("#action")).toBeDisabled();
        await expect(page.locator("#action")).toHaveAttribute(
          "aria-busy",
          "true",
        );
        await expect(page.locator("#action")).toHaveAccessibleName(
          "Saving core",
        );
        await expect(page.locator("#action .kit-spinner")).toHaveAttribute(
          "aria-hidden",
          "true",
        );
        await page.locator("#loading").click();
        await expect(page.locator("#action")).toBeEnabled();
        await page.locator("#core-switch").press("Space");
        await expect(page.locator("#checked")).toHaveText("true");
        expect(
          await page
            .locator("#core-form")
            .evaluate((form) =>
              Array.from(new FormData(form as HTMLFormElement).entries()),
            ),
        ).toEqual([["enabled", "yes"]]);
        await page.locator("#reset").click();
        await expect(page.locator("#checked")).toHaveText("false");
        await page.locator("#core-trigger").click();
        const dialog = page.getByRole("dialog", {
          name: "Complete core dialog",
        });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAccessibleDescription(
          "Installed source, tokens and primitives together",
        );
        await page.locator("#dialog-action").press("Space");
        await expect(page.locator("#actions")).toHaveText("2");
        await expect(page.locator("#core-close")).toHaveClass(
          /application-close/,
        );
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(page.locator("#core-trigger")).toBeFocused();
        expect(
          await page
            .locator("main")
            .evaluate((el) =>
              getComputedStyle(el)
                .getPropertyValue("--kit-radius-default")
                .trim(),
            ),
        ).toBe("7px");
      });
    });
