import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";

test("actual complete candidate labeling and close parts compile and SSR native default/delegated markup", () => {
  const consumer = buildDialogCandidate("labeling");
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
    assert.equal(response.status, 200);
    for (const [id, tag, expected] of [
      ["candidate-title", "div", /role="heading"[^>]*aria-level="2"/],
      [
        "candidate-description",
        "div",
        /kit-dialog-description caller-description/,
      ],
      ["candidate-close", "button", /type="button"/],
      ["delegated-title", "h3", /kit-dialog-title delegated-title/],
      [
        "delegated-description",
        "p",
        /kit-dialog-description delegated-description/,
      ],
      ["delegated-close", "button", /kit-dialog-close delegated-close/],
    ] as const) {
      const actual = response.body.match(
        new RegExp(`<${tag}[^>]*id="${id}"[^>]*>`),
      )?.[0];
      assert.ok(actual, id);
      assert.match(actual, expected);
    }
    assert.equal(
      response.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
  } finally {
    consumer.cleanup();
  }
});
