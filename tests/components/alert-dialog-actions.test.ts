import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildAlertDialogCandidate } from "../helpers/alert-dialog-candidate.js";

test("actual nine-part Alert Dialog candidate compiles native labeling decision refs and delegated SSR", () => {
  const consumer = buildAlertDialogCandidate("actions");
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
      `implementation/evidence/logs/alert-dialog-candidate/actions-${process.pid}-${Date.now()}-ssr.json`,
      JSON.stringify({ ...response, artifact: consumer.evidence }, null, 2),
    );
    assert.equal(response.status, 200);
    for (const [id, tag, pattern] of [
      ["candidate-title", "div", /role="heading"[^>]*aria-level="2"/],
      [
        "candidate-description",
        "div",
        /kit-alert-dialog-description caller-description/,
      ],
      ["candidate-action", "button", /type="button"/],
      ["candidate-cancel", "button", /type="button"/],
      ["submit-action", "button", /type="submit"/],
      ["reset-action", "button", /type="reset"/],
      ["delegated-title", "h3", /aria-level="3"/],
      [
        "delegated-description",
        "p",
        /kit-alert-dialog-description delegated-description/,
      ],
      [
        "delegated-action",
        "button",
        /kit-alert-dialog-action delegated-action/,
      ],
      [
        "delegated-cancel",
        "button",
        /kit-alert-dialog-cancel delegated-cancel/,
      ],
    ] as const) {
      const actual = response.body.match(
        new RegExp(`<${tag}[^>]*id="${id}"[^>]*>`),
      )?.[0];
      assert.ok(actual, id);
      assert.match(actual, pattern);
    }
    assert.equal(
      response.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
    assert.deepEqual(consumer.evidence.raw, []);
    assert.equal(consumer.evidence.authored.length, 9);
  } finally {
    consumer.cleanup();
  }
});
