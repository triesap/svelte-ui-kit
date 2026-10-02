import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
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
import { applyReplacements, backupPath } from "../../src/codegen/replace.js";
import {
  stageOperations,
  type StageOperation,
} from "../../src/codegen/stage.js";
import {
  faultAfter,
  faultAtOccurrence,
} from "../../src/codegen/transaction-hooks.js";
import { journalPath } from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "5555555555555555";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-replace-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function liveWrite(
  root: string,
  logical: string,
  text: string,
  mode = 0o644,
): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text, { mode });
}

const OPERATIONS: StageOperation[] = [
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
      {
        path: "src/lib/components/ui/button.svelte",
        operation: "create",
        preimage: { kind: "absent", digest: null, mode: null },
        resultDigest: sha256Hex("<button />"),
        resultMode: 0o600,
        backupId: null,
        stagedId: null,
        applied: false,
      },
      {
        path: "src/lib/components/ui/old.svelte",
        operation: "retire",
        preimage: { kind: "file", digest: sha256Hex("old"), mode: 0o644 },
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

function prepare(root: string) {
  liveWrite(root, "src/styles/kit.css", "old css");
  liveWrite(root, "src/lib/components/ui/old.svelte", "old");
  liveWrite(root, "src/lib/components/ui/keep.svelte", "keep me");
  const staged = stageOperations(root, STATE_DIR, ID, OPERATIONS);
  assert.equal(staged.ok, true);
  if (!staged.ok) throw new Error("staging failed");
  const prepared = prepareJournal(journalFor(), staged.value.records);
  persistJournal(root, journalPath(STATE_DIR, ID), prepared);
  return { staged: staged.value, prepared };
}

test("a successful batch changes exactly the planned files", () => {
  withRoot((root) => {
    const { staged, prepared } = prepare(root);
    const result = applyReplacements(root, STATE_DIR, prepared, staged);
    assert.equal(result.ok, true);
    assert.equal(result.journal.phase, "applied");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "new css",
    );
    assert.equal(
      readFileSync(abs(root, "src/lib/components/ui/button.svelte"), "utf8"),
      "<button />",
    );
    assert.equal(
      statSync(abs(root, "src/lib/components/ui/button.svelte")).mode & 0o777,
      0o600,
    );
    assert.equal(
      existsSync(abs(root, "src/lib/components/ui/old.svelte")),
      false,
    );
    assert.equal(
      readFileSync(abs(root, "src/lib/components/ui/keep.svelte"), "utf8"),
      "keep me",
    );
    // Backups retain the preimages for recovery.
    assert.equal(
      readFileSync(backupPath(root, STATE_DIR, ID, "backup-0"), "utf8"),
      "old css",
    );
    assert.equal(
      readFileSync(backupPath(root, STATE_DIR, ID, "backup-2"), "utf8"),
      "old",
    );
  });
});

test("a failure at each replacement boundary is represented correctly", () => {
  withRoot((root) => {
    const { staged, prepared } = prepare(root);
    const result = applyReplacements(
      root,
      STATE_DIR,
      prepared,
      staged,
      faultAtOccurrence("replace:apply", 2),
    );
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.issues[0].code, "REPLACE_FAILED");
    // The first update applied; the failing create did not.
    assert.equal(result.journal.operations[0].applied, true);
    assert.equal(result.journal.operations[1].applied, false);
    assert.equal(result.journal.operations[2].applied, false);
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "new css",
    );
    assert.equal(
      existsSync(abs(root, "src/lib/components/ui/button.svelte")),
      false,
    );
    assert.equal(
      readFileSync(abs(root, "src/lib/components/ui/old.svelte"), "utf8"),
      "old",
    );
  });
});

test("a backup-move fault leaves the moved preimage recoverable", () => {
  withRoot((root) => {
    const { staged, prepared } = prepare(root);
    const result = applyReplacements(
      root,
      STATE_DIR,
      prepared,
      staged,
      faultAfter("backup:move"),
    );
    assert.equal(result.ok, false);
    // The first update's preimage was moved aside, so its target is absent and
    // its backup exists; nothing beyond it was touched.
    assert.equal(result.journal.operations[0].applied, false);
    assert.equal(existsSync(abs(root, "src/styles/kit.css")), false);
    assert.equal(
      readFileSync(backupPath(root, STATE_DIR, ID, "backup-0"), "utf8"),
      "old css",
    );
    assert.equal(
      readFileSync(abs(root, "src/lib/components/ui/old.svelte"), "utf8"),
      "old",
    );
  });
});
