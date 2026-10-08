import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildFieldFormsConsumer } from "../helpers/generated-consumer.js";

for (const custom of [false, true])
  test(`actual ${custom ? "custom" : "default"} installed native and kit Field SSR relationships are complete in every initial message state`, () => {
    const consumer = buildFieldFormsConsumer(custom);
    try {
      assert.deepEqual(consumer.evidence.coinstalled, [
        "checkbox",
        "switch",
        "radio",
      ]);
      for (const invalid of [false, true])
        for (const helper of [false, true])
          for (const value of ["one@example.test", "two@example.test"]) {
            const result = spawnSync(
              process.execPath,
              [
                path.resolve("tests/helpers/render-built-consumer.mjs"),
                consumer.handler,
                `/${consumer.route}?invalid=${invalid}&helper=${helper}&value=${value}`,
              ],
              { encoding: "utf8", timeout: 30000 },
            );
            assert.equal(result.status, 0, result.stdout + result.stderr);
            const response = JSON.parse(result.stdout);
            assert.equal(response.status, 200);
            assert.equal(
              response.handlerSha256,
              consumer.evidence.files["build/handler.js"],
            );
            const html: string = response.body;
            const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
            assert.equal(new Set(ids).size, ids.length);
            for (const match of html.matchAll(
              /(?:aria-describedby|aria-labelledby|\bfor)="([^"]+)"/g,
            ))
              for (const id of match[1]!.split(" "))
                assert.ok(
                  ids.includes(id),
                  `phantom initial association ${id}`,
                );
            const control = html.match(
              /<input(?=[^>]*id="address-control")[^>]*>/,
            )?.[0];
            assert.ok(control);
            assert.match(
              control,
              new RegExp(`value="${value.replaceAll(".", "\\.")}"`),
            );
            const descriptions = [
              ...(helper ? ["address-message-help"] : []),
              ...(invalid ? ["address-message-error"] : []),
            ];
            if (descriptions.length)
              assert.match(
                control,
                new RegExp(`aria-describedby="${descriptions.join(" ")}"`),
              );
            else assert.doesNotMatch(control, /aria-describedby/);
            assert.equal(html.includes('id="address-message-help"'), helper);
            assert.equal(html.includes('id="address-message-error"'), invalid);
            for (const [name, id] of [
              ["agree", "field-checkbox-control"],
              ["preference", "field-switch-control"],
            ]) {
              assert.match(
                html,
                new RegExp(
                  `<button(?=[^>]*id="${id}")[^>]*aria-checked="true"`,
                ),
              );
              assert.equal(
                [
                  ...html.matchAll(
                    new RegExp(`<input(?=[^>]*name="${name}")[^>]*>`, "g"),
                  ),
                ].length,
                1,
              );
            }
            assert.match(
              html,
              /<button(?=[^>]*id="field-radio-control")[^>]*aria-checked="true"/,
            );
            assert.match(html, /<input(?=[^>]*name="plan")[^>]*value="a"/);
            const directory = "implementation/evidence/logs/field-ssr";
            mkdirSync(directory, { recursive: true });
            writeFileSync(
              `${directory}/${custom ? "custom" : "default"}-${process.pid}-${Date.now()}.json`,
              JSON.stringify(
                {
                  invalid,
                  helper,
                  value,
                  response,
                  artifact: consumer.evidence,
                },
                null,
                2,
              ),
            );
          }
    } finally {
      consumer.cleanup();
    }
  });
