import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import { buildCatalogHydrationConsumer } from "../helpers/generated-consumer.js";
import { sha256Hex } from "../../src/codegen/digest.js";

const ids = (body: string) =>
  [...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
const floatingIds = (body: string) =>
  [
    ...body.matchAll(/<div\b[^>]*data-bits-floating-content-wrapper[^>]*>/g),
  ].map((m) => m[0].match(/\sid="([^"]+)"/)![1]!);
for (const custom of [false, true])
  test(`full installed catalog concurrent and repeated SSR ${custom ? "custom" : "default"}`, () => {
    const consumer = buildCatalogHydrationConsumer(custom);
    try {
      const cases = ["", "dialog", "alert", "menu"].flatMap((kind) =>
        ["inline", "body", "custom"].map((portal, i) => ({
          kind,
          portal,
          on: i % 2,
          extra: i % 2,
        })),
      );
      const routes = cases.map(
        (row, i) =>
          `/${consumer.route}?request=isolated-${i}&on=${row.on}&extra=${row.extra}&open=${row.kind}&portal=${row.portal}`,
      );
      routes.push(`/${consumer.route}/native`);
      const result = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer-sequence.mjs",
          consumer.handler,
          ...routes,
        ],
        { encoding: "utf8", timeout: 90000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      const responses = JSON.parse(result.stdout) as {
        handlerSha256: string;
        concurrent: { status: number; body: string }[];
        repeated: { status: number; body: string }[];
      };
      assert.equal(
        responses.handlerSha256,
        sha256Hex(readFileSync(consumer.handler)),
      );
      for (const lane of [responses.concurrent, responses.repeated]) {
        assert.equal(lane.length, cases.length + 1);
        assert.equal(lane.at(-1)!.status, 200);
        assert.match(lane.at(-1)!.body, /Native item/);
        assert.equal(floatingIds(lane.at(-1)!.body).length, 1);
        lane.slice(0, cases.length).forEach(({ status, body }, i) => {
          const row = cases[i]!;
          assert.equal(status, 200);
          assert.match(body, new RegExp(`data-request="isolated-${i}"`));
          assert.match(body, new RegExp(`value="isolated-${i}"`));
          assert.match(body, new RegExp(`isolated-${i} area`));
          assert.doesNotMatch(
            body,
            new RegExp(`isolated-${(i + 1) % cases.length}(?:"| area)`),
          );
          assert.equal(
            (body.match(/data-instance=/g) ?? []).length,
            1 + row.extra,
          );
          const all = ids(body);
          assert.equal(
            new Set(all).size,
            all.length,
            "each rendered document has unique native and recipe IDs",
          );
          for (const label of body.matchAll(/<label\b[^>]*\sfor="([^"]+)"/g))
            assert.ok(
              all.includes(label[1]!),
              "every recipe label resolves in SSR",
            );
          for (const relationship of body.matchAll(
            /\saria-describedby="([^"]+)"/g,
          ))
            for (const id of relationship[1]!.split(" "))
              assert.ok(
                all.includes(id),
                "every emitted description reference resolves",
              );
          for (const family of [
            "anchor",
            "alert",
            "avatar",
            "badge",
            "button",
            "card",
            "checkbox",
            "collapsible",
            "dialog",
            "alert-dialog",
            "field",
            "menu",
            "progress",
            "radio",
            "separator",
            "skeleton",
            "spinner",
            "status",
            "switch",
            "tabs",
          ])
            assert.match(
              body,
              new RegExp(`kit-${family}(?:[ \\"-])`),
              `SSR renders ${family}; tokens and both link exports are represented`,
            );
          assert.match(body, /Router link/);
          const switchTag = body.match(
            /<button\b[^>]*aria-label="Switch"[^>]*>/,
          )![0];
          assert.match(
            switchTag,
            new RegExp(`data-state="${row.on ? "checked" : "unchecked"}"`),
          );
          const checkboxTag = body.match(
            /<button\b[^>]*aria-label="Checked"[^>]*>/,
          )![0];
          assert.match(checkboxTag, new RegExp(`aria-checked="${!!row.on}"`));
          const progressTag = body.match(
            /<progress\b[^>]*aria-label="Progress"[^>]*>/,
          )![0];
          if (row.on) assert.match(progressTag, /value="25"/);
          else assert.doesNotMatch(progressTag, /\svalue=/);
          assert.match(
            body,
            /data-ready="false"/,
            "actual server output precedes onMount",
          );
          if (row.kind && row.portal === "inline")
            assert.match(
              body,
              new RegExp(
                `role="${row.kind === "alert" ? "alertdialog" : row.kind === "dialog" ? "dialog" : "menu"}"`,
              ),
            );
          else
            assert.doesNotMatch(
              body,
              /role="(?:dialog|alertdialog|menu)"/,
              "native closed or client portal content is absent on server",
            );
        });
      }
      assert.notDeepEqual(
        floatingIds(responses.concurrent.at(-1)!.body),
        floatingIds(responses.repeated.at(-1)!.body),
        "direct pinned native floating wrapper also uses its nonsemantic process counter",
      );
      responses.concurrent.forEach((response, i) =>
        assert.deepEqual(
          ids(response.body).filter(
            (id) => !floatingIds(response.body).includes(id),
          ),
          ids(responses.repeated[i]!.body).filter(
            (id) => !floatingIds(responses.repeated[i]!.body).includes(id),
          ),
          "all semantic native and recipe IDs reset; measured native floating wrapper boundary is recorded separately",
        ),
      );
      mkdirSync("implementation/evidence/logs/catalog-ssr", {
        recursive: true,
      });
      writeFileSync(
        `implementation/evidence/logs/catalog-ssr/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify(
          { evidence: consumer.evidence, cases, responses },
          null,
          2,
        ),
      );
    } finally {
      consumer.cleanup();
    }
  });
