import { writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { buildFieldOwnershipConsumer } from "../helpers/generated-consumer.js";
import { test, expect } from "./browser-issues.js";
import { startFixtureServer, type FixtureServer } from "./fixture-server.js";

for (const custom of [false, true]) {
  test.describe(`Field message ownership ${custom ? "custom" : "default"}`, () => {
    let consumer: ReturnType<typeof buildFieldOwnershipConsumer>;
    let hosted: FixtureServer;
    const messageId = `owned-message-${encodeURIComponent("helper / café")}`;
    test.beforeAll(async () => {
      test.setTimeout(240000);
      consumer = buildFieldOwnershipConsumer(custom);
      try {
        hosted = await startFixtureServer({ handler: consumer.handler });
      } catch (error) {
        consumer.cleanup();
        throw error;
      }
    });
    test.afterAll(async () => {
      let closed = !hosted;
      try {
        if (hosted) {
          await hosted.server.stop();
          closed = true;
          expect(hosted.server.failure()).toBeNull();
        }
      } finally {
        if (closed) consumer?.cleanup();
      }
    });
    test.beforeEach(async ({ page }) => {
      await page.goto(new URL(consumer.route, hosted.baseURL).href);
      await expect(page.locator('[data-ready="true"]')).toBeVisible();
    });
    test("same-key replacement transfers refs without replacing the paragraph", async ({
      page,
    }, info) => {
      const original = await page
        .locator("#owned .kit-field-message")
        .first()
        .elementHandle();
      expect(original).not.toBeNull();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: messageId,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Replace descriptor", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: null,
          replacement: messageId,
          other: "owned-message-other%25key",
        }),
      );
      const observed = JSON.parse(await page.locator("#refs").innerText());
      const artifact = info.outputPath("descriptor-transfer.json");
      writeFileSync(
        artifact,
        JSON.stringify(
          {
            observed,
            observation: "after the native ownership assertion settled",
            expected: { first: null, replacement: messageId },
            inputs: consumer.evidence,
          },
          null,
          2,
        ),
      );
      await info.attach("descriptor-transfer", {
        path: artifact,
        contentType: "application/json",
      });
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: null,
          replacement: messageId,
          other: "owned-message-other%25key",
        }),
      );
      expect(
        await original!.evaluate(
          (node, id) => node === document.getElementById(id),
          messageId,
        ),
      ).toBe(true);
      await expect(
        page.locator("#owned .kit-field-message").first(),
      ).toHaveText("Replacement helper");
      await page
        .getByRole("button", { name: "Remove ref property", exact: true })
        .click();
      await expect(page.locator("#optional-ref")).toHaveAttribute(
        "data-has-ref",
        "false",
      );
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: null,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Toggle root", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({ first: null, replacement: null, other: null }),
      );
    });
    test("replacement and remount retain only the new paragraph ownership", async ({
      page,
    }) => {
      const old = await page
        .locator("#owned .kit-field-message")
        .first()
        .elementHandle();
      await page
        .getByRole("button", { name: "Replace root instance", exact: true })
        .click();
      expect(await old!.evaluate((node) => node.isConnected)).toBe(false);
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: messageId,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Toggle root", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({ first: null, replacement: null, other: null }),
      );
      await page
        .getByRole("button", { name: "Toggle root", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: messageId,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
    });
    test("in-place ref deletion and re-addition preserve the same paragraph", async ({
      page,
    }, info) => {
      const paragraph = await page
        .locator("#owned .kit-field-message")
        .first()
        .elementHandle();
      await page
        .getByRole("button", { name: "Delete first ref property", exact: true })
        .click();
      await expect(page.locator("#ref-probe")).not.toHaveText("");
      const probe = JSON.parse(await page.locator("#ref-probe").innerText());
      const artifact = info.outputPath("ref-presence-probe.json");
      writeFileSync(
        artifact,
        JSON.stringify({ probe, inputs: consumer.evidence }, null, 2),
      );
      await info.attach("ref-presence-probe", {
        path: artifact,
        contentType: "application/json",
      });
      expect(probe.immediate).toEqual({ ownsRef: false, ref: null });
      expect(probe.settled).toEqual({ ownsRef: false, ref: null });
      await expect(page.locator("#first-ref-presence")).toHaveAttribute(
        "data-has-ref",
        "false",
      );
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: null,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Add first ref property", exact: true })
        .click();
      await expect(page.locator("#first-ref-presence")).toHaveAttribute(
        "data-has-ref",
        "true",
      );
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: messageId,
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      expect(
        await paragraph!.evaluate(
          (node, id) => node === document.getElementById(id),
          messageId,
        ),
      ).toBe(true);
      await page
        .getByRole("button", { name: "Reassign first ref", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: "parking",
          replacement: null,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Toggle root", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({ first: "parking", replacement: null, other: null }),
      );
    });
    for (const transition of ["unmount", "replace"]) {
      test(`same-update caller reassignment survives ${transition}`, async ({
        page,
      }) => {
        await page
          .getByRole("button", {
            name: `Reassign and ${transition} together`,
            exact: true,
          })
          .click();
        await expect(page.locator("#refs")).toHaveText(
          JSON.stringify({
            first: "parking",
            replacement: transition === "replace" ? messageId : null,
            other:
              transition === "replace" ? "owned-message-other%25key" : null,
          }),
        );
      });
    }
    test("old ref cleanup preserves caller reassignment during replacement and unmount", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Reassign first ref", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Replace descriptor", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: "parking",
          replacement: messageId,
          other: "owned-message-other%25key",
        }),
      );
      await page
        .getByRole("button", { name: "Reassign replacement ref", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Toggle root", exact: true })
        .click();
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({
          first: "parking",
          replacement: "parking",
          other: null,
        }),
      );
    });
    test("reordering retains DOM identity and only real encoded description targets", async ({
      page,
    }) => {
      const handles = await page
        .locator("#owned .kit-field-message")
        .elementHandles();
      await page
        .getByRole("button", { name: "Reorder messages", exact: true })
        .click();
      await expect(
        page.getByRole("textbox", { name: "Owned messages", exact: true }),
      ).toHaveAttribute(
        "aria-describedby",
        `owned-message-other%25key ${messageId}`,
      );
      for (const handle of handles)
        expect(
          await handle.evaluate(
            (node) => node === document.getElementById(node.id),
          ),
        ).toBe(true);
      await expect(page.locator("#owned .kit-field-message")).toHaveText([
        "Other helper",
        "First helper",
      ]);
      await page
        .getByRole("button", { name: "Clear messages", exact: true })
        .click();
      await expect(page.locator("#owned .kit-field-message")).toHaveCount(0);
      await expect(page.locator("#owned-control")).not.toHaveAttribute(
        "aria-describedby",
      );
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({ first: null, replacement: null, other: null }),
      );
    });
    test("native snippets preserve provided empty slots and recipe base relationships", async ({
      page,
    }) => {
      await expect(
        page.getByRole("button", { name: "First action", exact: true }),
      ).toHaveCount(2);
      await expect(page.locator("#select-recipe .kit-select-icon")).toHaveCount(
        0,
      );
      await expect(page.locator("#recipe .kit-field-message")).toHaveCount(0);
      await page
        .getByRole("button", { name: "Change recipe slots", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "First action", exact: true }),
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Second action", exact: true }),
      ).toHaveCount(2);
      await expect(page.locator("#changed-recipe-control")).toHaveAttribute(
        "aria-describedby",
        "changed-recipe-message-message",
      );
      await expect(
        page.locator('label[for="changed-recipe-control"]'),
      ).toHaveText("Recipe text");
      await expect(page.locator("#changed-recipe-message-message")).toHaveText(
        "",
      );
      await expect(page.locator("#select-recipe .kit-select-icon")).toHaveCount(
        1,
      );
      await expect(
        page.locator("#select-recipe .kit-select-icon"),
      ).toHaveAttribute("aria-hidden", "true");
      await page
        .getByRole("button", { name: "Change recipe slots", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Second action", exact: true }),
      ).toHaveCount(0);
      await expect(page.locator("#select-recipe .kit-select-icon")).toHaveText(
        "Visible icon",
      );
      await expect(page.locator("#changed-recipe-message-message")).toHaveText(
        "Present message",
      );
      await expect(
        page.locator("#changed-recipe-area-control"),
      ).toHaveAttribute(
        "aria-describedby",
        "changed-recipe-area-message-message",
      );
      await expect(
        page.locator("#changed-recipe-area-message-message"),
      ).toHaveText("Present message");
      await page
        .getByRole("button", { name: "Change recipe slots", exact: true })
        .click();
      await expect(page.locator("#select-recipe .kit-select-icon")).toHaveCount(
        0,
      );
      await expect(
        page.locator(
          "#changed-recipe .kit-field-message, #changed-recipe-area .kit-field-message",
        ),
      ).toHaveCount(0);
      await expect(page.locator("#changed-recipe-control")).not.toHaveAttribute(
        "aria-describedby",
      );
      await expect(
        page.locator("#changed-recipe .kit-field-label-row"),
      ).toHaveText("Recipe text");
      await expect(
        page.locator("#changed-recipe-area .kit-field-label-row"),
      ).toHaveText("Recipe body");
      await page
        .getByRole("button", { name: "Change recipe slots", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "First action", exact: true }),
      ).toHaveCount(2);
      await expect(
        page.getByRole("textbox", { name: "Manual relationship", exact: true }),
      ).toHaveAttribute("aria-describedby", "manual-description");
    });
    test("unrelated production errors remain strict server failures", async () => {
      const result = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `/${consumer.route}?unexpected=1`,
        ],
        { encoding: "utf8", timeout: 30000, killSignal: "SIGKILL" },
      );
      expect(result.error).toBeUndefined();
      expect(result.signal).toBeNull();
      expect(result.status).not.toBe(0);
      expect(result.stderr).toContain(
        "Unexpected Field ownership qualification failure.",
      );
    });
    test("development compilation preserves descriptor ownership without native warnings", async ({
      page,
    }, info) => {
      const dev = await startFixtureServer({
        handler: consumer.handler,
        launcher: path.resolve("tests/helpers/field-dev-server.mjs"),
      });
      const warnings: string[] = [];
      page.on("console", (message) => {
        if (message.type() === "warning") warnings.push(message.text());
      });
      try {
        await page.goto(new URL(consumer.route, dev.baseURL).href);
        await expect(page.locator('[data-ready="true"]')).toBeVisible();
        await page
          .getByRole("button", { name: "Replace descriptor", exact: true })
          .click();
        await expect(page.locator("#refs")).toHaveText(
          JSON.stringify({
            first: null,
            replacement: messageId,
            other: "owned-message-other%25key",
          }),
        );
        await page
          .getByRole("button", {
            name: "Reassign replacement ref",
            exact: true,
          })
          .click();
        await page
          .getByRole("button", { name: "Toggle root", exact: true })
          .click();
        await expect(page.locator("#refs")).toHaveText(
          JSON.stringify({ first: null, replacement: "parking", other: null }),
        );
        await page.goto("about:blank");
      } finally {
        await dev.server.stop();
        expect(dev.server.failure()).toBeNull();
        const artifact = info.outputPath("development-diagnostics.json");
        writeFileSync(
          artifact,
          JSON.stringify({ warnings, inputs: consumer.evidence }, null, 2),
        );
        await info.attach("development-diagnostics", {
          path: artifact,
          contentType: "application/json",
        });
        expect(warnings).toEqual([]);
      }
    });
    test("duplicate keys refuse actual production SSR before ambiguous relationships", async ({
      request,
    }, info) => {
      const response = await request.get(
        new URL(`${consumer.route}?duplicate=1`, hosted.baseURL).href,
        { headers: { accept: "application/json" } },
      );
      const body = await response.text();
      const artifact = info.outputPath("duplicate-ssr.json");
      writeFileSync(
        artifact,
        JSON.stringify(
          { status: response.status(), body, inputs: consumer.evidence },
          null,
          2,
        ),
      );
      await info.attach("duplicate-ssr", {
        path: artifact,
        contentType: "application/json",
      });
      expect(response.status()).toBe(500);
      expect(body).toContain("FieldRoot message keys must be unique.");
      expect(body).not.toContain(messageId);
    });
    test("duplicate client descriptors refuse within a native boundary and clear owned refs", async ({
      page,
    }) => {
      await page
        .getByRole("button", { name: "Duplicate keys", exact: true })
        .click();
      await expect(page.locator("#refusal")).toHaveText(
        "FieldRoot message keys must be unique.",
      );
      await expect(page.locator("#owned")).toHaveCount(0);
      await expect(page.locator("#refs")).toHaveText(
        JSON.stringify({ first: null, replacement: null, other: null }),
      );
    });
    test("concurrent SSR and hydration keep request-local automatic relationships", async ({
      page,
      request,
    }) => {
      const responses = await Promise.all(
        Array.from({ length: 4 }, () =>
          request.get(new URL(consumer.route, hosted.baseURL).href),
        ),
      );
      const identities: string[][] = [];
      for (const response of responses) {
        expect(response.status()).toBe(200);
        const html = await response.text();
        const ssrRefs = await page.evaluate(
          (source) =>
            new DOMParser()
              .parseFromString(source, "text/html")
              .getElementById("refs")?.textContent,
          html,
        );
        expect(JSON.parse(ssrRefs!)).toEqual({
          first: null,
          replacement: null,
          other: null,
        });
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(
          (match) => match[1]!,
        );
        expect(new Set(ids).size).toBe(ids.length);
        for (const match of html.matchAll(
          /(?:aria-describedby|\bfor)="([^"]+)"/g,
        ))
          for (const id of match[1]!.split(" ")) expect(ids).toContain(id);
        identities.push(ids);
      }
      for (const ids of identities) expect(ids).toEqual(identities[0]);
      const hydrated = await page
        .locator("[data-auto] input")
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            if (!(node instanceof HTMLInputElement))
              throw new Error("Actual native control required");
            return {
              id: node.id,
              description: node.getAttribute("aria-describedby"),
              label: node.labels?.[0]?.htmlFor,
            };
          }),
        );
      expect(hydrated).toHaveLength(2);
      expect(hydrated[0]!.id).not.toBe(hydrated[1]!.id);
      for (const node of hydrated) {
        expect(identities[0]).toContain(node.id);
        expect(node.label).toBe(node.id);
        expect(identities[0]).toContain(node.description);
      }
    });
  });
}
