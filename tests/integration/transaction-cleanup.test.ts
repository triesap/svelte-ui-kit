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

import {
  ensureIgnoreEntry,
  cleanupTransaction,
} from "../../src/codegen/transaction-cleanup.js";
import type { TransactionJournal } from "../../src/codegen/transaction-journal.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import {
  backupsDir,
  journalPath,
  progressDir,
  stagedDir,
  transactionDir,
  transientRoot,
} from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "7777777777777777";
const OTHER_ID = "8888888888888888";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-cleanup-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function publishedJournal(id = ID): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: id,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "published",
    operations: [],
    lock: {
      path: `${STATE_DIR}/kit.lock.json`,
      digest: "c".repeat(64),
      published: true,
      unchanged: false,
    },
  };
}

function populate(root: string, id: string): void {
  for (const logical of [
    `${stagedDir(STATE_DIR, id)}/stage-0`,
    `${backupsDir(STATE_DIR, id)}/backup-0`,
    `${progressDir(STATE_DIR, id)}/progress-0`,
  ]) {
    const target = abs(root, logical);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, "ephemeral");
  }
  const journal = abs(root, journalPath(STATE_DIR, id));
  mkdirSync(path.dirname(journal), { recursive: true });
  writeFileSync(journal, "journal");
}

test("a completed batch cleans its own files only", () => {
  withRoot((root) => {
    populate(root, ID);
    populate(root, OTHER_ID);
    const unrelated = abs(root, `${transientRoot(STATE_DIR)}/unrelated.tmp`);
    writeFileSync(unrelated, "keep");

    const result = cleanupTransaction(root, STATE_DIR, publishedJournal());
    assert.equal(result.ok, true);
    assert.equal(result.needsCleanup, false);
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, ID))), false);
    assert.equal(
      existsSync(abs(root, transactionDir(STATE_DIR, OTHER_ID))),
      true,
    );
    assert.equal(existsSync(unrelated), true);
  });
});

test("a cleanup failure reports committed-but-needs-cleanup and retains evidence", () => {
  withRoot((root) => {
    populate(root, ID);
    const result = cleanupTransaction(
      root,
      STATE_DIR,
      publishedJournal(),
      faultAt("cleanup:staged"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.needsCleanup, true);
    assert.equal(result.issues[0].code, "COMMITTED_NEEDS_CLEANUP");
    assert.equal(existsSync(abs(root, journalPath(STATE_DIR, ID))), true);
  });
});

test("ignore integration preserves existing rules and is idempotent", () => {
  withRoot((root) => {
    const gitignore = path.join(root, ".gitignore");
    writeFileSync(gitignore, "node_modules/\n# keep this rule\n");
    const first = ensureIgnoreEntry(root, STATE_DIR);
    assert.equal(first.changed, true);
    const content = readFileSync(gitignore, "utf8");
    assert.match(content, /node_modules\//);
    assert.match(content, /# keep this rule/);
    assert.match(content, /src\/lib\/components\/ui\/_kit\/\.svelte-ui-kit\//);
    const second = ensureIgnoreEntry(root, STATE_DIR);
    assert.equal(second.changed, false);
    assert.equal(readFileSync(gitignore, "utf8"), content);
  });
});

test("cleanup does not remove unrelated ignore or temporary state", () => {
  withRoot((root) => {
    const gitignore = path.join(root, ".gitignore");
    writeFileSync(gitignore, "dist/\n");
    populate(root, ID);
    const result = cleanupTransaction(root, STATE_DIR, publishedJournal());
    assert.equal(result.ok, true);
    assert.equal(readFileSync(gitignore, "utf8"), "dist/\n");
  });
});
