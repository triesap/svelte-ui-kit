import assert from "node:assert/strict";
import {
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
import { applyReplacements } from "../../src/codegen/replace.js";
import { publishLock } from "../../src/codegen/publish-lock.js";
import { stageOperations } from "../../src/codegen/stage.js";
import { journalPath, lockPath } from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "6666666666666666";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-lockpub-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function lockValue(configHash: string): Record<string, unknown> {
  return {
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
  };
}

const lockBytes = (configHash: string): Uint8Array =>
  new TextEncoder().encode(
    `${JSON.stringify(lockValue(configHash), null, 2)}\n`,
  );

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

function applyToLockedState(root: string): TransactionJournal {
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
  const replaced = applyReplacements(root, STATE_DIR, prepared, staged.value);
  assert.equal(replaced.ok, true);
  return replaced.journal;
}

test("the install lock is published last as the semantic commit point", () => {
  withRoot((root) => {
    const applied = applyToLockedState(root);
    // After replacements, the lock is still the previous one.
    const before = JSON.parse(
      readFileSync(abs(root, lockPath(STATE_DIR)), "utf8"),
    );
    assert.equal(before.configHash, "c".repeat(64));

    const published = publishLock(
      root,
      STATE_DIR,
      applied,
      lockBytes("d".repeat(64)),
    );
    assert.equal(published.ok, true);
    if (!published.ok) return;
    assert.equal(published.journal.phase, "published");
    assert.equal(published.journal.lock?.published, true);
    assert.equal(published.journal.lock?.unchanged, false);
    const after = JSON.parse(
      readFileSync(abs(root, lockPath(STATE_DIR)), "utf8"),
    );
    assert.equal(after.configHash, "d".repeat(64));
  });
});

test("an invalid planned lock never replaces existing state", () => {
  withRoot((root) => {
    const applied = applyToLockedState(root);
    const published = publishLock(
      root,
      STATE_DIR,
      applied,
      new TextEncoder().encode("{not json"),
    );
    assert.equal(published.ok, false);
    if (!published.ok) assert.equal(published.issues[0].code, "LOCK_INVALID");
    const after = JSON.parse(
      readFileSync(abs(root, lockPath(STATE_DIR)), "utf8"),
    );
    assert.equal(after.configHash, "c".repeat(64));
    assert.equal(published.journal.phase, "applied");
  });
});

test("a same-byte lock replacement is distinguishable by transaction identity", () => {
  withRoot((root) => {
    const applied = applyToLockedState(root);
    const current = lockBytes("c".repeat(64));
    const published = publishLock(root, STATE_DIR, applied, current);
    assert.equal(published.ok, true);
    if (!published.ok) return;
    assert.equal(published.journal.phase, "published");
    assert.equal(published.journal.lock?.unchanged, true);
    assert.equal(published.journal.lock?.digest, sha256Hex(current));
    assert.match(published.journal.transactionId, /^[0-9a-f][0-9a-f-]{15,63}$/);
  });
});
