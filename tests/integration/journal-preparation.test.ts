import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sha256Hex } from "../../src/codegen/digest.js";
import {
  prepareJournal,
  persistJournal,
  parseJournal,
  verifyPreparedJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import { stageOperations } from "../../src/codegen/stage.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { journalPath, stagedDir } from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "4444444444444444";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-prep-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function freshJournal(): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: ID,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [
      {
        path: "src/styles/kit.css",
        operation: "update",
        preimage: {
          kind: "file",
          digest: sha256Hex("old css"),
          mode: 0o644,
        },
        resultDigest: sha256Hex("new css"),
        resultMode: 0o644,
        backupId: null,
        stagedId: null,
        applied: false,
      },
      {
        path: "src/lib/components/ui/old.svelte",
        operation: "retire",
        preimage: {
          kind: "file",
          digest: sha256Hex("old"),
          mode: 0o644,
        },
        resultDigest: sha256Hex(new Uint8Array(0)),
        resultMode: 0o644,
        backupId: null,
        stagedId: null,
        applied: false,
      },
    ],
    lock: null,
  };
}

function stage(root: string) {
  const result = stageOperations(
    root,
    STATE_DIR,
    ID,
    [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("new css"),
        mode: 0o644,
      },
    ],
    undefined,
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("staging failed");
  return result.value;
}

test("failure before prepared publication leaves no live changes", () => {
  withRoot((root) => {
    const live = abs(root, "src/styles/kit.css");
    mkdirSync(path.dirname(live), { recursive: true });
    writeFileSync(live, "old css");

    const staged = stage(root);
    const prepared = prepareJournal(freshJournal(), staged.records);
    assert.throws(
      () =>
        persistJournal(
          root,
          journalPath(STATE_DIR, ID),
          prepared,
          faultAt("journal:write"),
        ),
      /injected fault/,
    );
    assert.equal(readFileSync(live, "utf8"), "old css");
    assert.equal(existsSync(abs(root, journalPath(STATE_DIR, ID))), false);
  });
});

test("restart after preparation identifies exact owned staging", () => {
  withRoot((root) => {
    const staged = stage(root);
    const prepared = prepareJournal(freshJournal(), staged.records);
    persistJournal(root, journalPath(STATE_DIR, ID), prepared);

    const text = readFileSync(abs(root, journalPath(STATE_DIR, ID)), "utf8");
    const parsed = parseJournal(text);
    assert.equal(parsed.ok, true);
    if (!parsed.ok) return;
    assert.equal(parsed.value.phase, "prepared");
    assert.equal(verifyPreparedJournal(parsed.value).ok, true);
    const css = parsed.value.operations.find(
      (operation) => operation.path === "src/styles/kit.css",
    );
    assert.equal(css?.stagedId, "stage-0");
    assert.equal(css?.backupId, "backup-0");
    assert.equal(existsSync(abs(root, `${stagedDirectory()}/stage-0`)), true);
  });
});

function stagedDirectory(): string {
  return stagedDir(STATE_DIR, ID);
}

test("a missing staged image or backup id refuses unsafe recovery", () => {
  withRoot((root) => {
    const staged = stage(root);
    const prepared = prepareJournal(freshJournal(), staged.records);
    assert.equal(verifyPreparedJournal(prepared).ok, true);

    const incomplete: TransactionJournal = {
      ...prepared,
      operations: prepared.operations.map((operation) =>
        operation.operation === "update"
          ? { ...operation, backupId: null }
          : operation,
      ),
    };
    const incompleteResult = verifyPreparedJournal(incomplete);
    assert.equal(incompleteResult.ok, false);
    if (!incompleteResult.ok) {
      assert.match(
        incompleteResult.issues.map((entry) => entry.message).join("; "),
        /no backup identifier/,
      );
    }

    unlinkSync(abs(root, `${stagedDirectory()}/stage-0`));
    assert.equal(existsSync(abs(root, `${stagedDirectory()}/stage-0`)), false);
  });
});
