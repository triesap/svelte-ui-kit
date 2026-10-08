import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildTabsCandidate } from "../helpers/tabs-candidate.js";

test("actual candidate Root List preserve request selection mounted panels and native snippets", () => {
  const consumer = buildTabsCandidate();
  try {
    assert.deepEqual(consumer.evidence.authored, ["TabsRoot", "TabsList"]);
    for (const value of ["a", "b", ""]) {
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
        `implementation/evidence/logs/tabs-candidate/${process.pid}-${Date.now()}-${value || "empty"}-ssr.json`,
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
        const trigger = response.body.match(
          new RegExp(`<button(?=[^>]*id="tab-${item}")[^>]*>`),
        )?.[0];
        const panel = response.body.match(
          new RegExp(`<div(?=[^>]*id="panel-${item}")[^>]*>`),
        )?.[0];
        assert.ok(trigger);
        assert.ok(panel);
        assert.match(trigger, /role="tab"/);
        assert.match(trigger, new RegExp(`aria-selected="${value === item}"`));
        assert.match(panel, /role="tabpanel"/);
        assert.equal(/\bhidden(?:\s|>|=)/.test(panel), value !== item);
      }
      assert.match(response.body, /class="kit-tabs caller retained"/);
      assert.match(response.body, /class="kit-tabs-list caller-list"/);
      assert.match(
        response.body,
        /role="tablist" aria-orientation="horizontal"/,
      );
      assert.match(response.body, /<section[^>]*data-delegated="root"/);
      assert.match(response.body, /<nav[^>]*data-delegated="list"/);
      assert.match(response.body, /Panel A state/);
      assert.match(response.body, /Panel B/);
    }
  } finally {
    consumer.cleanup();
  }
});
