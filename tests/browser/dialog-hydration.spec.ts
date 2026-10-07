import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { buildDialogConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

type ObserverState = { active: number; started: number; disconnected: number };
function observeDescriptionLifetimes() {
  const state: ObserverState = { active: 0, started: 0, disconnected: 0 };
  Object.defineProperty(window, "__dialogObserverState", { value: state });
  const Native = window.MutationObserver;
  window.MutationObserver = class extends Native {
    owned = false;
    override observe(target: Node, options?: MutationObserverInit) {
      super.observe(target, options);
      if (
        !this.owned &&
        target === document.documentElement &&
        options?.childList &&
        options?.attributeFilter?.join(",") === "aria-describedby,id"
      ) {
        this.owned = true;
        state.active++;
        state.started++;
      }
    }
    override disconnect() {
      if (this.owned) {
        this.owned = false;
        state.active--;
        state.disconnected++;
      }
      super.disconnect();
    }
  };
}
const observers = () =>
  (window as typeof window & { __dialogObserverState: ObserverState })
    .__dialogObserverState;

for (const custom of [false, true])
  test.describe(`installed Dialog hydration ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildDialogConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildDialogConsumer(custom, "dialog-hydration");
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
      await page.addInitScript(observeDescriptionLifetimes);
      const file = info.outputPath("generated-consumer.json");
      writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
      await info.attach("generated-consumer", {
        path: file,
        contentType: "application/json",
      });
    });
    for (const portal of ["body", "inline", "custom"])
      for (const initial of ["open", "closed"])
        test(`actual ${initial} SSR hydrates with ${portal} portal and distinct instances`, async ({
          page,
        }) => {
          await page.goto(
            new URL(
              `${consumer.route}?initial=${initial}&portal=${portal}`,
              hosted.baseURL,
            ).href,
          );
          await expect(page.locator('[data-ready="true"]')).toBeVisible();
          const first = page.locator(
            '[data-dialog-content][data-instance="first"]',
          );
          const second = page.locator(
            '[data-dialog-content][data-instance="second"]',
          );
          if (initial === "closed") {
            await expect(first).toHaveCount(0);
            await page
              .locator('[data-dialog-trigger][data-instance="first"]')
              .click();
          }
          await expect(first).toBeVisible();
          await expect(first).toHaveAccessibleName(
            "First request-local dialog",
          );
          await expect(first).toHaveAccessibleDescription(
            "First request-local description",
          );
          if (portal === "body")
            expect(
              await first.evaluate((el) => el.parentElement === document.body),
            ).toBe(true);
          if (portal === "custom")
            expect(await first.evaluate((el) => el.parentElement?.id)).toBe(
              "hydration-host",
            );
          await page.locator("#open-second").click();
          await expect(second).toBeVisible();
          const relationships = await page.evaluate(() =>
            Array.from(document.querySelectorAll("[data-dialog-content]")).map(
              (el) => ({
                id: el.id,
                title: el.getAttribute("aria-labelledby"),
                description: el.getAttribute("aria-describedby"),
              }),
            ),
          );
          expect(
            new Set(
              relationships.flatMap((r) => [r.id, r.title, r.description]),
            ).size,
          ).toBe(6);
          await expect(second).toHaveAccessibleName(
            "Second request-local dialog",
          );
          await expect(second).toHaveAccessibleDescription(
            "Second request-local description",
          );
          await page
            .locator('[data-dialog-close][data-instance="second"]')
            .click();
          await expect(second).toHaveCount(0);
          await expect(first).toBeVisible();
          await page
            .locator('[data-dialog-close][data-instance="first"]')
            .click();
          await expect(first).toHaveCount(0);
          await expect
            .poll(() => page.evaluate(observers))
            .toEqual(expect.objectContaining({ active: 0 }));
        });
    test("optional description, ref replacement and root teardown release every owned observer", async ({
      page,
    }) => {
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      for (let turn = 0; turn < 3; turn++) {
        await page
          .locator('[data-dialog-trigger][data-instance="first"]')
          .click();
        const first = page.locator(
          '[data-dialog-content][data-instance="first"]',
        );
        await expect(first).toBeVisible();
        await expect
          .poll(() => page.evaluate(observers))
          .toEqual(expect.objectContaining({ active: 1 }));
        await page.locator("#toggle-description").click();
        await expect(first).not.toHaveAttribute("aria-describedby");
        await page.locator("#toggle-description").click();
        await expect(first).toHaveAccessibleDescription(
          "First request-local description",
        );
        const old = await first.getAttribute("id");
        await page.locator("#replace-content").click();
        await expect(first).not.toHaveAttribute("id", old!);
        await expect(first).toHaveAccessibleDescription(
          "First request-local description",
        );
        await expect
          .poll(() => page.evaluate(observers))
          .toEqual(expect.objectContaining({ active: 1 }));
        await page.locator("#destroy-first").click();
        await expect(first).toHaveCount(0);
        await expect
          .poll(() => page.evaluate(observers))
          .toEqual(expect.objectContaining({ active: 0 }));
        await page.locator("#mount-first").click();
      }
      const state = await page.evaluate(observers);
      expect(state.started).toBeGreaterThanOrEqual(6);
      expect(state.disconnected).toBe(state.started);
    });
  });

test("actual owned negative artifact fails the same observer-teardown assertion", async ({
  page,
}, info) => {
  test.setTimeout(240000);
  const consumer = buildDialogConsumer(false, "dialog-hydration", true);
  let hosted: FixtureServer | undefined;
  try {
    hosted = await startFixtureServer({ handler: consumer.handler });
    const file = info.outputPath("negative-artifact.json");
    writeFileSync(file, JSON.stringify(consumer.evidence, null, 2));
    await info.attach("negative-artifact", {
      path: file,
      contentType: "application/json",
    });
    await page.addInitScript(observeDescriptionLifetimes);
    await page.goto(new URL(consumer.route, hosted.baseURL).href);
    await expect(page.locator('[data-ready="true"]')).toBeVisible();
    await page.locator('[data-dialog-trigger][data-instance="first"]').click();
    await expect
      .poll(() => page.evaluate(observers))
      .toEqual(expect.objectContaining({ active: 1 }));
    await page.locator("#destroy-first").click();
    await expect(
      page.locator('[data-dialog-content][data-instance="first"]'),
    ).toHaveCount(0);
    await assert.rejects(async () => {
      await expect
        .poll(() => page.evaluate(observers), { timeout: 1000 })
        .toEqual(expect.objectContaining({ active: 0 }));
    }, /toEqual|active/);
    expect((await page.evaluate(observers)).active).toBe(1);
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
});
