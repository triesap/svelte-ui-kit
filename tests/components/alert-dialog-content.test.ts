import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { buildAlertDialogCandidate } from "../helpers/alert-dialog-candidate.js";

test("actual Content candidate forwards native policy, refs and both render paths in compiled SSR", () => {
  const consumer = buildAlertDialogCandidate("content");
  try {
    for (const mode of ["inline", "body", "selector", "element"]) {
      const rendered = spawnSync(
        process.execPath,
        [
          path.resolve("tests/helpers/render-built-consumer.mjs"),
          consumer.handler,
          `${consumer.route}?portal=${mode}`,
        ],
        { encoding: "utf8", timeout: 30000 },
      );
      assert.equal(rendered.status, 0, rendered.stdout + rendered.stderr);
      const response = JSON.parse(rendered.stdout);
      const logs = ".artifacts/verification/alert-dialog-candidate";
      mkdirSync(logs, { recursive: true });
      writeFileSync(
        `${logs}/content-${process.pid}-${Date.now()}-${mode}-ssr.json`,
        JSON.stringify(
          { mode, ...response, artifact: consumer.evidence },
          null,
          2,
        ),
      );
      assert.equal(response.status, 200);
      if (mode !== "inline") {
        assert.doesNotMatch(response.body, /id="default-content"/);
        assert.doesNotMatch(response.body, /Actual default children/);
        assert.match(
          response.body,
          /id="delegated-content"[^>]*role="alertdialog"/,
        );
        assert.equal(
          response.handlerSha256,
          consumer.evidence.files["build/handler.js"],
        );
        continue;
      }
      const defaultTag = response.body.match(
        /<div[^>]*id="default-content"[^>]*>/,
      )?.[0];
      assert.ok(defaultTag);
      assert.match(
        defaultTag,
        /class="kit-alert-dialog-content caller retained"/,
      );
      assert.match(response.body, /Default content title/);
      const delegatedTag = response.body.match(
        /<section[^>]*id="delegated-content"[^>]*>/,
      )?.[0];
      assert.ok(delegatedTag);
      assert.match(
        delegatedTag,
        /class="kit-alert-dialog-content delegated-caller"/,
      );
      assert.match(response.body, /data-child-open="false"/);
      assert.match(response.body, /data-state="closed"/);
      assert.match(response.body, /role="alertdialog"/);
      assert.equal(
        response.handlerSha256,
        consumer.evidence.files["build/handler.js"],
      );
    }
  } finally {
    consumer.cleanup();
  }
});
