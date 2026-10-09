import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildRadioCandidate } from "../helpers/radio-candidate.js";

test("actual candidate preserves controlled string state snippets and native radio SSR", () => {
  const consumer = buildRadioCandidate();
  try {
    for (const value of ["a", "b"]) {
      const result = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?value=${value}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const response = JSON.parse(result.stdout);
      writeFileSync(
        `.artifacts/verification/radio-candidate/${process.pid}-${Date.now()}-${value}-ssr.json`,
        JSON.stringify(
          { value, response, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      assert.equal(response.status, 200);
      assert.equal(
        response.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
      for (const item of ["a", "b"]) {
        const tag = response.body.match(
          new RegExp(`<button(?=[^>]*id="choice-${item}")[^>]*>`),
        )?.[0];
        assert.ok(tag);
        assert.match(tag, /role="radio"/);
        assert.match(tag, new RegExp(`aria-checked="${value === item}"`));
      }
      assert.match(response.body, /class="kit-radio-group caller"/);
      assert.match(response.body, /data-default-checked=/);
      assert.match(response.body, /data-delegated="group"/);
      assert.match(response.body, /data-delegated-checked="true"/);
    }
    assert.equal(consumer.evidence.catalogRegistered, true);
  } finally {
    consumer.cleanup();
  }
});
