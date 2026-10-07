import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";

test("actual Portal/Overlay candidate compiles and imports during production SSR without browser globals", () => {
  const consumer = buildDialogCandidate("portal-overlay");
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
    assert.match(response.body, /id="inline-overlay"/);
    assert.match(response.body, /kit-dialog-overlay inline-caller/);
    assert.match(response.body, /Inline candidate/);
    assert.doesNotMatch(
      response.body,
      /id="body-overlay"|id="selector-overlay"|id="element-overlay"/,
    );
    assert.equal(
      response.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
  } finally {
    consumer.cleanup();
  }
});
