import { writeFileSync } from "node:fs";
import { buildIdentityConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";
import type { Page } from "@playwright/test";

async function unique(page: Page) {
  const ids = await page
    .locator("[id]")
    .evaluateAll((nodes) => nodes.map((node) => node.id));
  expect(new Set(ids).size).toBe(ids.length);
}
async function fields(page: Page) {
  for (const key of [
    "automatic",
    "explicit",
    ...((await page.locator('[data-field="conditional"]').count())
      ? ["conditional"]
      : []),
  ]) {
    const root = page.locator(`[data-field="${key}"]`);
    const input = root.locator("input");
    const id = await input.getAttribute("id");
    await expect(root.locator("label")).toHaveAttribute("for", id!);
    const described = await input.getAttribute("aria-describedby");
    expect(described).toBe(
      `${await root.getAttribute("id")}-message-hint%20%2F%20unique`,
    );
    await expect(root.locator("p")).toHaveAttribute("id", described!);
    await root.locator("label").click();
    await expect(input).toBeFocused();
  }
  await expect(page.locator('[data-control="explicit"]')).toHaveAttribute(
    "id",
    "caller-control",
  );
}
for (const custom of [false, true])
  test.describe(`installed identity ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildIdentityConsumer>;
    let hosted: FixtureServer;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildIdentityConsumer(custom);
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
      await page.goto(
        new URL(`${consumer.route}?request=browser`, hosted.baseURL).href,
      );
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("server identities survive hydration with unique live field labels and messages", async ({
      page,
      request,
    }) => {
      const response = await request.get(
        new URL(`${consumer.route}?request=browser`, hosted.baseURL).href,
      );
      expect(response.status()).toBe(200);
      const html = await response.text();
      const serverIds = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
      expect(new Set(serverIds).size).toBe(serverIds.length);
      for (const id of serverIds)
        expect(
          await page
            .locator("[id]")
            .evaluateAll(
              (nodes, id) => nodes.some((node) => node.id === id),
              id,
            ),
        ).toBe(true);
      await unique(page);
      await fields(page);
      for (const key of ["input", "area", "select"])
        expect(
          await page.locator(`[data-standalone="${key}"]`).getAttribute("id"),
        ).toBeTruthy();
    });
    test("primitive tab and collapsible relationships target their own parts and preserve caller IDs", async ({
      page,
    }) => {
      for (const key of ["automatic", "explicit"]) {
        const scope = page.locator(`[data-instance="${key}"]`);
        for (const name of ["A", "B"]) {
          const tab = scope.getByRole("tab", {
            name: `Tab ${name} ${key}`,
            exact: true,
          });
          await tab.click();
          const panel = scope.getByRole("tabpanel");
          await expect(panel).toHaveAttribute(
            "id",
            (await tab.getAttribute("aria-controls"))!,
          );
          await expect(panel).toHaveAttribute(
            "aria-labelledby",
            (await tab.getAttribute("id"))!,
          );
          await expect(panel).toHaveText(`Panel ${name} ${key}`);
        }
        const trigger = scope.getByRole("button", {
          name: `Collapse ${key}`,
          exact: true,
        });
        const content = scope.locator("[data-collapsible-content]");
        await expect(content).toHaveAttribute(
          "id",
          (await trigger.getAttribute("aria-controls"))!,
        );
        await expect(content).toHaveText(`Collapsed content ${key}`);
      }
      for (const [label, id] of [
        ["Switch explicit", "caller-switch"],
        ["Checkbox explicit", "caller-checkbox"],
        ["Radio A explicit", "caller-radio"],
      ])
        await expect(page.getByLabel(label!, { exact: true })).toHaveAttribute(
          "id",
          id!,
        );
      await unique(page);
    });
    test("multiple dialogs alerts and menus resolve live local references with caller overrides", async ({
      page,
    }) => {
      for (const kind of ["dialog", "alert", "menu"]) {
        for (const key of ["automatic", "explicit"]) {
          const title = kind[0]!.toUpperCase() + kind.slice(1);
          const trigger = page
            .locator(`[data-instance="${key}"]`)
            .getByRole("button", { name: `${title} ${key}`, exact: true });
          await trigger.click();
          const content = page.locator(`[data-overlay="${kind}-${key}"]`);
          await expect(content).toBeVisible();
          await expect(trigger).toHaveAttribute(
            "aria-controls",
            (await content.getAttribute("id"))!,
          );
          if (key === "explicit")
            await expect(content).toHaveAttribute(
              "id",
              `caller-${kind}-content`,
            );
          if (kind !== "menu") {
            for (const [attr, part] of [
              ["aria-labelledby", "title"],
              ["aria-describedby", "description"],
            ]) {
              await expect.poll(() => content.getAttribute(attr!)).toBeTruthy();
              const id = (await content.getAttribute(attr!))!;
              const relation = content.locator(`[id="${id}"]`);
              await expect(relation).toHaveText(
                `${part![0]!.toUpperCase() + part!.slice(1)} ${kind} ${key} browser`,
              );
              if (key === "explicit") expect(id).toBe(`caller-${kind}-${part}`);
            }
            await content
              .getByRole("button", {
                name:
                  kind === "alert"
                    ? `Cancel alert ${key}`
                    : `Close dialog ${key}`,
                exact: true,
              })
              .click();
          } else await page.keyboard.press("Escape");
          await expect(content).toHaveCount(0);
          await expect(trigger).toBeFocused();
          await unique(page);
        }
      }
    });
    test("conditional instances allocate unique IDs while retained fields keep associations", async ({
      page,
    }) => {
      const retained = await page
        .locator('[data-field="automatic"]')
        .getAttribute("id");
      let previous: string | null = null;
      for (let i = 0; i < 3; i++) {
        await page.locator("#toggle-extra").click();
        await expect(page.locator('[data-field="conditional"]')).toBeVisible();
        const current = await page
          .locator('[data-field="conditional"]')
          .getAttribute("id");
        expect(current).toBeTruthy();
        if (previous) expect(current).not.toBe(previous);
        previous = current;
        await unique(page);
        await fields(page);
        await expect(page.locator('[data-field="automatic"]')).toHaveAttribute(
          "id",
          retained!,
        );
        await page.locator("#toggle-extra").click();
        await expect(page.locator("[data-extra-instance]")).toHaveCount(0);
        await unique(page);
      }
    });
    test("initial conditional and open SSR trees hydrate stable dialog title and description identities", async ({
      page,
      request,
    }) => {
      const url = new URL(
        `${consumer.route}?request=initial&extra=1&open=1`,
        hosted.baseURL,
      ).href;
      const response = await request.get(url);
      expect(response.status()).toBe(200);
      const html = await response.text();
      await page.goto(url);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
      for (const id of [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!))
        expect(
          await page
            .locator("[id]")
            .evaluateAll(
              (nodes, id) => nodes.some((node) => node.id === id),
              id,
            ),
        ).toBe(true);
      for (const key of ["automatic", "explicit"]) {
        const content = page.locator(`[data-overlay="dialog-${key}"]`);
        await expect(content).toBeVisible();
        for (const [attr, part] of [
          ["aria-labelledby", "title"],
          ["aria-describedby", "description"],
        ]) {
          await expect.poll(() => content.getAttribute(attr!)).toBeTruthy();
          await expect(
            content.locator(`[id="${await content.getAttribute(attr!)}"]`),
          ).toHaveText(
            `${part![0]!.toUpperCase() + part!.slice(1)} dialog ${key} initial`,
          );
        }
      }
      await unique(page);
    });
  });
