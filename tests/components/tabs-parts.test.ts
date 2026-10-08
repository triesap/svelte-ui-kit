import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildTabsCandidate } from "../helpers/tabs-candidate.js";

test("complete candidate Tabs preserve native selected hidden snippets and raw SSR relationship boundary", () => {
  const consumer = buildTabsCandidate(true);
  try {
    assert.deepEqual(consumer.evidence.authored, [
      "TabsRoot",
      "TabsList",
      "TabsTrigger",
      "TabsContent",
    ]);
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
        `implementation/evidence/logs/tabs-candidate/${process.pid}-${Date.now()}-complete-${value || "empty"}-ssr.json`,
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
      const tag = (id: string) => {
        const found: string | undefined = response.body.match(
          new RegExp(`<\\w+(?=[^>]*id="${id}")[^>]*>`),
        )?.[0];
        assert.ok(found);
        return found;
      };
      for (const item of ["a", "b"]) {
        assert.match(
          tag(`tab-${item}`),
          new RegExp(`aria-selected="${value === item}"`),
        );
        assert.equal(
          /\bhidden(?:\s|>|=)/.test(tag(`panel-${item}`)),
          value !== item,
        );
        assert.match(tag(`panel-${item}`), /class="kit-tabs-panel/);
        assert.match(tag(`tab-${item}`), /class="kit-tabs-trigger/);
        assert.match(tag(`tab-${item}`), /type="button"/);
      }
      assert.match(tag("panel-a"), /caller-panel/);
      assert.match(tag("tab-a"), /caller-trigger retained/);
      assert.match(tag("delegated-tab-a"), /data-delegated="trigger"/);
      assert.match(tag("delegated-panel-a"), /data-delegated="content"/);
      assert.match(response.body, /Panel A state/);
      assert.match(response.body, /Panel B/);
      for (const id of ["tab-a", "raw-tab-a"])
        assert.doesNotMatch(tag(id), /aria-controls=/);
      for (const id of ["panel-a", "raw-panel-a"])
        assert.doesNotMatch(tag(id), /aria-labelledby=/);
    }
  } finally {
    consumer.cleanup();
  }
});
