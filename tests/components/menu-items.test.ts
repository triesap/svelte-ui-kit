import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildMenuCandidate } from "../helpers/menu-candidate.js";

test("all eight authored Menu parts compile and render actual native selection and indicator SSR", () => {
  const consumer = buildMenuCandidate("items");
  try {
    const rendered = spawnSync(
      process.execPath,
      [
        path.resolve("tests/helpers/render-built-consumer.mjs"),
        consumer.handler,
        consumer.route,
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
    const response = JSON.parse(rendered.stdout);
    writeFileSync(
      `.artifacts/verification/menu-candidate/items-${process.pid}-${Date.now()}-ssr.json`,
      JSON.stringify({ ...response, artifact: consumer.evidence }, null, 2),
    );
    assert.equal(response.status, 200);
    assert.equal(
      response.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
    const tag = (element: string, id: string) => {
      const actual = response.body.match(
        new RegExp(`<${element}[^>]*id="${id}"[^>]*>`),
      )?.[0];
      assert.ok(actual, id);
      return actual;
    };
    assert.match(tag("div", "ordinary"), /role="menuitem"/);
    assert.match(tag("div", "ordinary"), /class="kit-menu-item caller-item"/);
    assert.match(tag("section", "delegated"), /data-delegated="item"/);
    assert.match(
      tag("div", "group"),
      /class="kit-menu-radio-group caller-group"/,
    );
    assert.match(tag("div", "alpha"), /aria-checked="true"/);
    assert.match(
      tag("div", "alpha"),
      /class="kit-menu-item kit-menu-radio-item caller-radio"/,
    );
    assert.match(tag("section", "beta"), /aria-checked="false"/);
    assert.match(tag("span", "alpha-indicator"), /data-state="checked"/);
    assert.doesNotMatch(tag("span", "alpha-indicator"), /\shidden(?:\s|=|>)/);
    assert.match(tag("span", "beta-indicator"), /\shidden(?:\s|=|>)/);
    assert.match(tag("div", "disabled-radio"), /aria-disabled="true"/);
    assert.match(tag("section", "delegated-group"), /data-delegated="group"/);
    assert.match(tag("div", "delegated-radio"), /aria-checked="false"/);
    assert.deepEqual(consumer.evidence.raw, []);
    assert.equal(consumer.evidence.authored.length, 8);
  } finally {
    consumer.cleanup();
  }
});
