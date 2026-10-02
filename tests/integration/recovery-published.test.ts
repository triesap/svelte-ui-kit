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
  prepareJournal,
  persistJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import { publishLock } from "../../src/codegen/publish-lock.js";
import { recoverTransaction } from "../../src/codegen/recovery.js";
import { applyReplacements } from "../../src/codegen/replace.js";
import { stageOperations } from "../../src/codegen/stage.js";
import {
  journalPath,
  lockPath,
  transactionDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS } from "../helpers/transactions.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "aaaaaaaaaaaaaaaa";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-recoverpub-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function lockBytes(configHash: string): Uint8Array {
  return new TextEncoder().encode(
    `${JSON.stringify(
      {
        schemaVersion: 1,
        toolVersion: "0.1.0",
        registryVersion: "0.1.0",
        registryHash: "a".repeat(64),
        configHash,
        requested: [],
        items: [],
        files: [],
        cssBlocks: [],
        integrations: [],
      },
      null,
      2,
    )}\n`,
  );
}

function journalFor(): TransactionJournal {
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
        preimage: { kind: "file", digest: sha256Hex("old css"), mode: 0o644 },
        resultDigest: sha256Hex("new css"),
        resultMode: 0o644,
        backupId: null,
        stagedId: null,
        applied: false,
      },
    ],
    lock: null,
  };
}

function publish(root: string, lockConfigHash: string): TransactionJournal {
  const css = abs(root, "src/styles/kit.css");
  mkdirSync(path.dirname(css), { recursive: true });
  writeFileSync(css, "old css");
  const lock = abs(root, lockPath(STATE_DIR));
  mkdirSync(path.dirname(lock), { recursive: true });
  writeFileSync(lock, lockBytes("c".repeat(64)));

  const staged = stageOperations(root, STATE_DIR, ID, [
    {
      path: "src/styles/kit.css",
      operation: "update",
      bytes: new TextEncoder().encode("new css"),
      mode: 0o644,
    },
  ]);
  assert.equal(staged.ok, true);
  if (!staged.ok) throw new Error("staging failed");
  const prepared = prepareJournal(journalFor(), staged.value.records);
  persistJournal(root, journalPath(STATE_DIR, ID), prepared);
  const applied = applyReplacements(root, STATE_DIR, prepared, staged.value);
  assert.equal(applied.ok, true);
  const result = publishLock(
    root,
    STATE_DIR,
    applied.journal,
    lockBytes(lockConfigHash),
  );
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("publish failed");
  return result.journal;
}

test("a crash immediately after lock publication preserves committed source", () => {
  withRoot((root) => {
    publish(root, "d".repeat(64));
    const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
    assert.equal(recovered.status, "committed");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "new css",
    );
    assert.equal(
      JSON.parse(readFileSync(abs(root, lockPath(STATE_DIR)), "utf8"))
        .configHash,
      "d".repeat(64),
    );
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, ID))), false);
  });
});

test("a same-byte lock publication is still classified as committed", () => {
  withRoot((root) => {
    const journal = publish(root, "c".repeat(64));
    assert.equal(journal.lock?.unchanged, true);
    const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
    assert.equal(recovered.status, "committed");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "new css",
    );
  });
});

test("postcommit user modifications survive recovery cleanup", () => {
  withRoot((root) => {
    publish(root, "d".repeat(64));
    writeFileSync(abs(root, "src/styles/kit.css"), "user post-commit edit");
    const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
    assert.equal(recovered.status, "committed");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "user post-commit edit",
    );
  });
});
