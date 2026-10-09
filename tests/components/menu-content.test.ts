import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildMenuCandidate } from "../helpers/menu-candidate.js";

test("compiled Menu Content preserves floating structures and native portal SSR boundary", () => {
  const consumer = buildMenuCandidate("content");
  try {
    for (const mode of ["inline", "body", "selector", "element"]) {
      const rendered = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?portal=${mode}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      const response = JSON.parse(rendered.stdout);
      writeFileSync(
        `.artifacts/verification/menu-candidate/content-${process.pid}-${Date.now()}-${mode}-ssr.json`,
        JSON.stringify(
          { mode, ...response, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      assert.equal(response.status, 200);
      assert.equal(
        response.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
      const actual = response.body.match(
        /<div[^>]*id="default-content"[^>]*>/,
      )?.[0];
      assert.equal(Boolean(actual), mode === "inline");
      if (actual) {
        assert.match(actual, /role="menu"/);
        assert.match(actual, /class="kit-menu-content caller retained"/);
        assert.match(actual, /data-side="bottom"/);
        assert.match(actual, /data-align="start"/);
        assert.match(response.body, /Default choice/);
      }
      const delegated = response.body.match(
        /<section[^>]*id="delegated-content"[^>]*>/,
      )?.[0];
      assert.ok(delegated);
      assert.match(delegated, /role="menu"/);
      assert.match(delegated, /class="kit-menu-content delegated-caller"/);
      assert.match(delegated, /data-child-open="false"/);
      const outer = response.body.match(
        /<article[^>]*data-outer="actual"[^>]*>/,
      )?.[0];
      assert.ok(outer);
      assert.match(outer, /data-bits-floating-content-wrapper/);
      assert.match(outer, /style="[^"]*position: absolute/);
      assert.match(outer, /dir="rtl"/);
      assert.doesNotMatch(outer, /kit-menu-content/);
    }
  } finally {
    consumer.cleanup();
  }
});
