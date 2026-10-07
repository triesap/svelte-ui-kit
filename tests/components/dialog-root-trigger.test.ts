import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";

test("actual candidate Root/Trigger compile and SSR with remaining raw Bits parts", () => {
  const consumer = buildDialogCandidate();
  try {
    const result = spawnSync(
      process.execPath,
      [
        path.resolve("tests/helpers/render-built-consumer.mjs"),
        consumer.handler,
        "/dialog-candidate",
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(result.status, 0, result.stdout + result.stderr);
    const rendered = JSON.parse(result.stdout);
    assert.equal(rendered.status, 200);
    assert.match(rendered.body, /kit-dialog-trigger caller retained/);
    assert.match(rendered.body, /data-delegated="actual"/);
    assert.match(rendered.body, /aria-haspopup="dialog"/);
    assert.match(rendered.body, /aria-expanded="false"/);
    assert.equal(
      rendered.handlerSha256,
      consumer.evidence.files["build/handler.js"],
    );
  } finally {
    consumer.cleanup();
  }
});

test("Root/Trigger qualification leaves the existing registry unadvertised", () => {
  const root = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  assert.ok(root.items.every((item: { id: string }) => item.id !== "dialog"));
});
