import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sha256Hex } from "../../src/codegen/digest.js";
import {
  cleanupStaged,
  stageOperations,
  verifyStaged,
  type StageOperation,
} from "../../src/codegen/stage.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { stagedDir } from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "3333333333333333";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-stage-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function liveWrite(root: string, logical: string, text: string): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

test("staged bytes and digests match the plan", () => {
  withRoot((root) => {
    const operations: StageOperation[] = [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("new css"),
        mode: 0o644,
      },
      {
        path: "src/lib/components/ui/button.svelte",
        operation: "create",
        bytes: new TextEncoder().encode("<button />"),
        mode: 0o600,
      },
      {
        path: "src/lib/components/ui/old.svelte",
        operation: "retire",
        bytes: new Uint8Array(0),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(root, STATE_DIR, ID, operations);
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    assert.equal(staged.value.records.length, 2);
    for (const record of staged.value.records) {
      const text = readFileSync(abs(root, record.stagedPath), "utf8");
      assert.equal(sha256Hex(text), record.digest);
    }
    assert.equal(verifyStaged(root, staged.value.records).ok, true);
  });
});

test("a staging write failure leaves live files unchanged", () => {
  withRoot((root) => {
    liveWrite(root, "src/styles/kit.css", "original css");
    const operations: StageOperation[] = [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("replacement css"),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(
      root,
      STATE_DIR,
      ID,
      operations,
      faultAt("stage:write"),
    );
    assert.equal(staged.ok, false);
    if (!staged.ok) assert.equal(staged.issues[0].code, "STAGE_FAILED");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "original css",
    );
  });
});

test("cleanup removes only the owned staged directory", () => {
  withRoot((root) => {
    const transient = abs(root, `${STATE_DIR}/.svelte-ui-kit`);
    const unrelated = path.join(transient, "unrelated.tmp");
    mkdirSync(transient, { recursive: true });
    writeFileSync(unrelated, "keep me");
    const stagedAbs = abs(root, stagedDir(STATE_DIR, ID));
    mkdirSync(stagedAbs, { recursive: true });
    writeFileSync(path.join(stagedAbs, "stage-0"), "staged");

    cleanupStaged(stagedAbs);
    assert.equal(existsSync(stagedAbs), false);
    assert.equal(existsSync(unrelated), true);
  });
});

test("staging does not create live target directories", () => {
  withRoot((root) => {
    const operations: StageOperation[] = [
      {
        path: "src/lib/components/ui/deep/new.svelte",
        operation: "create",
        bytes: new TextEncoder().encode("<new />"),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(root, STATE_DIR, ID, operations);
    assert.equal(staged.ok, true);
    assert.equal(
      existsSync(abs(root, "src/lib/components/ui/deep")),
      false,
      "staging must not create live parent directories",
    );
  });
});
