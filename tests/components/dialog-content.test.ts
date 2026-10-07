import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";

test("actual Content candidate forwards native policy, refs and both render paths in compiled SSR", () => {
  const consumer = buildDialogCandidate("content");
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
    const defaultTag = response.body.match(
      /<div[^>]*id="default-content"[^>]*>/,
    )?.[0];
    assert.ok(defaultTag);
    assert.match(defaultTag, /class="kit-dialog-content caller retained"/);
    assert.match(response.body, /Default content title/);
    const delegatedTag = response.body.match(
      /<section[^>]*id="delegated-content"[^>]*>/,
    )?.[0];
    assert.ok(delegatedTag);
    assert.match(delegatedTag, /class="kit-dialog-content delegated-caller"/);
    assert.match(response.body, /data-child-open="false"/);
    assert.match(response.body, /data-state="closed"/);
    assert.match(response.body, /role="dialog"/);
    assert.equal(
      response.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
  } finally {
    consumer.cleanup();
  }
});
