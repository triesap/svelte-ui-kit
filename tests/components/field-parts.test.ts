import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildFieldCandidate } from "../helpers/field-candidate.js";

test("actual Field candidate compiles every source part and SSR associations describe only rendered messages", () => {
  const consumer = buildFieldCandidate();
  try {
    assert.equal(consumer.evidence.authored.length, 12);
    for (const invalid of [false, true])
      for (const value of ["one@example.test", "two@example.test"]) {
        const result = spawnSync(
          process.execPath,
          [
            path.resolve("tests/helpers/render-built-consumer.mjs"),
            consumer.handler,
            `${consumer.route}?invalid=${invalid}&value=${value}`,
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
        const tag = (id: string) => {
          const found = html.match(
            new RegExp(`<\\w+(?=[^>]*id="${id}")[^>]*>`),
          )?.[0];
          assert.ok(found, id);
          return found;
        };
        assert.match(tag("address-control"), /type="email"/);
        assert.match(tag("address-control"), /\brequired(?:\s|>|=)/);
        assert.match(
          tag("address-control"),
          new RegExp(`value="${value.replaceAll(".", "\\.")}"`),
        );
        assert.match(
          tag("address-control"),
          new RegExp(
            `aria-describedby="address-message-help${invalid ? " address-message-error" : ""}"`,
          ),
        );
        assert.equal(
          /aria-invalid="true"/.test(tag("address-control")),
          invalid,
        );
        assert.equal(/id="address-message-error"/.test(html), invalid);
        assert.match(tag("body-control"), /^<textarea/);
        assert.match(tag("body-control"), /rows="4"/);
        assert.match(tag("choice-control"), /^<select/);
        assert.match(
          tag("actual-override"),
          /aria-describedby="manual-message"/,
        );
        assert.doesNotMatch(
          tag("actual-override"),
          /\brequired(?:\s|>|=)|\bdisabled(?:\s|>|=)|aria-invalid|data-invalid/,
        );
        for (const prefix of [
          "text-convenience",
          "area-convenience",
          "select-convenience",
        ]) {
          assert.match(html, new RegExp(`<label[^>]*for="${prefix}-control"`));
          assert.match(
            tag(`${prefix}-control`),
            new RegExp(`aria-describedby="${prefix}-message-message"`),
          );
          assert.ok(tag(`${prefix}-message-message`));
        }
        assert.match(tag("area-convenience-control"), /rows="7"/);
        assert.match(
          tag("select-convenience-control"),
          /kit-select-field-native/,
        );
        assert.match(html, /class="kit-select-icon" aria-hidden="true"/);
        assert.match(html, /class="kit-field-required" aria-hidden="true"/);
        assert.match(html, /Label action/);
        assert.match(html, /kit-select-field-value-row/);
        const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
        assert.equal(new Set(ids).size, ids.length);
        for (const match of html.matchAll(
          /(?:aria-describedby|\bfor)="([^"]+)"/g,
        ))
          for (const id of match[1]!.split(" "))
            assert.ok(ids.includes(id), `phantom native association ${id}`);
        writeFileSync(
          `implementation/evidence/logs/field-candidate/${process.pid}-${Date.now()}-${invalid}-ssr.json`,
          JSON.stringify(
            { invalid, value, response, artifact: consumer.evidence },
            null,
            2,
          ),
        );
      }
  } finally {
    consumer.cleanup();
  }
});
