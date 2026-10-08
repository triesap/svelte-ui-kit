import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildMenuCandidate } from "../helpers/menu-candidate.js";

test("actual Root Trigger candidate compiles and preserves native closed and open SSR state", () => {
  const consumer = buildMenuCandidate();
  try {
    for (const initial of ["closed", "open"]) {
      const rendered = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?initial=${initial}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      const response = JSON.parse(rendered.stdout);
      writeFileSync(
        `implementation/evidence/logs/menu-candidate/root-trigger-${process.pid}-${Date.now()}-${initial}-ssr.json`,
        JSON.stringify(
          { initial, ...response, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      assert.equal(response.status, 200);
      const actual = response.body.match(/<button[^>]*id="trigger"[^>]*>/)?.[0];
      const native = response.body.match(
        /<button[^>]*id="native-trigger"[^>]*>/,
      )?.[0];
      assert.ok(actual);
      assert.ok(native);
      const state = new RegExp(`aria-expanded="${initial === "open"}"`);
      assert.match(actual, state);
      assert.match(native, state);
      assert.match(actual, /class="kit-menu-trigger caller retained"/);
      assert.match(actual, /aria-haspopup="menu"/);
      assert.match(actual, /type="button"/);
      assert.match(response.body, /data-delegated="actual"/);
      const present = (id: string) =>
        new RegExp(`<div(?=[^>]*id="${id}")(?=[^>]*role="menu")[^>]*>`).test(
          response.body,
        );
      assert.equal(present("content"), initial === "open");
      assert.equal(present("native-content"), initial === "open");
      assert.equal(
        response.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
    }
    assert.equal(consumer.evidence.installation, "candidate-copy");
    assert.equal(consumer.evidence.catalogRegistered, false);
  } finally {
    consumer.cleanup();
  }
});
