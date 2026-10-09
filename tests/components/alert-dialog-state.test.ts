import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildAlertDialogCandidate } from "../helpers/alert-dialog-candidate.js";

test("actual distinct candidate Root and Trigger compile and render SSR with raw Alert Dialog parts", () => {
  const registryBefore = readFileSync("registry/registry.json");
  const consumer = buildAlertDialogCandidate();
  try {
    for (const initial of ["closed", "open"]) {
      const result = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?initial=${initial}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      const rendered = JSON.parse(result.stdout);
      const logs = ".artifacts/verification/alert-dialog-candidate";
      mkdirSync(logs, { recursive: true });
      writeFileSync(
        `${logs}/root-trigger-${process.pid}-${Date.now()}-${initial}-ssr.json`,
        JSON.stringify(
          { initial, ...rendered, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      assert.equal(rendered.status, 200);
      assert.equal(
        rendered.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
      assert.match(rendered.body, /kit-alert-dialog-trigger caller retained/);
      assert.match(rendered.body, /data-delegated="actual"/);
      assert.match(rendered.body, /aria-haspopup="dialog"/);
      assert.match(
        rendered.body,
        new RegExp(`aria-expanded="${initial === "open"}"`),
      );
      if (initial === "open") {
        assert.match(rendered.body, /role="alertdialog"/);
        assert.match(rendered.body, /Candidate title/);
        assert.match(rendered.body, /Raw primitive content composition/);
      } else assert.doesNotMatch(rendered.body, /role="alertdialog"/);
    }
    assert.equal(consumer.evidence.catalogRegistered, true);
    assert.equal(consumer.evidence.installation, "candidate-copy");
  } finally {
    consumer.cleanup();
  }
  assert.deepEqual(readFileSync("registry/registry.json"), registryBefore);
});
