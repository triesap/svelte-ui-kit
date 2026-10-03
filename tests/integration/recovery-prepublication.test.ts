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
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import { recoverTransaction } from "../../src/codegen/recovery.js";
import { applyReplacements } from "../../src/codegen/replace.js";
import {
  stageOperations,
  type StageOperation,
} from "../../src/codegen/stage.js";
import {
  faultAt,
  faultAtOccurrence,
} from "../../src/codegen/transaction-hooks.js";
import { backupPath } from "../../src/codegen/replace.js";
import {
  journalPath,
  transactionDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS, liveRootIdentity } from "../helpers/transactions.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "9999999999999999";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-recoverpre-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

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
    mode: 0o644,
  },
];

function journalFor(root: string): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: ID,
    rootIdentity: liveRootIdentity(root),
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
  const css = abs(root, "src/styles/kit.css");
  mkdirSync(path.dirname(css), { recursive: true });
  writeFileSync(css, "old css");
  const staged = stageOperations(root, STATE_DIR, ID, OPERATIONS);
  assert.equal(staged.ok, true);
  if (!staged.ok) throw new Error("staging failed");
  const prepared = prepareJournal(journalFor(root), staged.value.records);
  persistJournal(root, journalPath(STATE_DIR, ID), prepared);
  return { prepared, staged: staged.value };
}

test("restart at each prepublication boundary rolls back to the preimages", () => {
  for (const [label, hooks] of [
    ["backup-move", faultAt("backup:move")],
    ["replace-apply", faultAtOccurrence("replace:apply", 1)],
    ["progress-persist", faultAt("progress:persist")],
  ] as const) {
    withRoot((root) => {
      const { prepared, staged } = prepare(root);
      const applied = applyReplacements(
        root,
        STATE_DIR,
        prepared,
        staged,
        hooks,
      );
      assert.equal(applied.ok, false, label);

      const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
      assert.equal(recovered.status, "rolled_back", label);
      assert.equal(
        readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
        "old css",
      );
      assert.equal(
        existsSync(abs(root, "src/lib/components/ui/button.svelte")),
        false,
      );
      assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, ID))), false);
    });
  }
});

test("user edits after an interruption block destructive restoration", () => {
  withRoot((root) => {
    const { prepared, staged } = prepare(root);
    const applied = applyReplacements(root, STATE_DIR, prepared, staged);
    assert.equal(applied.ok, true);

    writeFileSync(abs(root, "src/styles/kit.css"), "user edit");
    const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_USER_EDIT");
    }
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "user edit",
    );
  });
});

test("missing backups fail closed", () => {
  withRoot((root) => {
    const { prepared, staged } = prepare(root);
    const applied = applyReplacements(root, STATE_DIR, prepared, staged);
    assert.equal(applied.ok, true);
    unlinkSync(backupPath(root, STATE_DIR, ID, "backup-0"));

    const recovered = recoverTransaction(root, STATE_DIR, ID, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_BACKUP_MISSING");
    }
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, ID))), true);
  });
});
