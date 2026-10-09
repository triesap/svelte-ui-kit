import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildCollapsibleCandidate } from "../helpers/collapsible-candidate.js";
test("actual candidate Collapsible preserves open closed mounted snippets and raw SSR identity policy", () => {
  const consumer = buildCollapsibleCandidate();
  try {
    assert.deepEqual(consumer.evidence.authored, [
      "CollapsibleRoot",
      "CollapsibleTrigger",
      "CollapsibleContent",
    ]);
    for (const open of [false, true]) {
      const result = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?open=${open}`,
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
      writeFileSync(
        `.artifacts/verification/collapsible-candidate/${process.pid}-${Date.now()}-${open}-ssr.json`,
        JSON.stringify(
          { open, response, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      const tag = (id: string) => {
        const found: string | undefined = response.body.match(
          new RegExp(`<\\w+(?=[^>]*id="${id}")[^>]*>`),
        )?.[0];
        assert.ok(found);
        return found;
      };
      assert.match(
        tag("disclosure-trigger"),
        new RegExp(`aria-expanded="${open}"`),
      );
      assert.match(tag("disclosure-trigger"), /type="button"/);
      assert.match(
        tag("disclosure"),
        new RegExp(`data-state="${open ? "open" : "closed"}"`),
      );
      assert.equal(/\bhidden(?:\s|>|=)/.test(tag("disclosure-content")), !open);
      assert.match(
        tag("disclosure"),
        /class="kit-collapsible caller retained"/,
      );
      assert.match(
        tag("disclosure-trigger"),
        /class="kit-collapsible-trigger caller-trigger"/,
      );
      assert.match(
        tag("disclosure-content"),
        /class="kit-collapsible-content caller-content"/,
      );
      assert.match(tag("delegated-root"), /data-delegated="root"/);
      assert.match(tag("delegated-trigger"), /data-delegated="trigger"/);
      assert.match(tag("delegated-content"), /data-delegated-open="true"/);
      assert.match(response.body, /Disclosure state/);
      assert.match(response.body, /Details body/);
      assert.equal(
        /aria-controls=/.test(tag("disclosure-trigger")),
        /aria-controls=/.test(tag("raw-trigger")),
      );
      assert.equal(/\bhidden(?:\s|>|=)/.test(tag("raw-content")), !open);
    }
  } finally {
    consumer.cleanup();
  }
});
