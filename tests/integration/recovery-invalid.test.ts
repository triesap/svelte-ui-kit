import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { recoveryDiagnostic } from "../../src/cli/protocol.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  prepareJournal,
  persistJournal,
  serializeJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import {
  inspectTransactions,
  recoverTransaction,
} from "../../src/codegen/recovery.js";
import { applyReplacements } from "../../src/codegen/replace.js";
import { stageOperations } from "../../src/codegen/stage.js";
import {
  journalPath,
  transactionDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS } from "../helpers/transactions.js";

const STATE_DIR = "src/lib/components/ui/_kit";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-recoverinv-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function writeJournal(root: string, id: string, text: string): void {
  const file = abs(root, journalPath(STATE_DIR, id));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, text);
}

function baseJournal(id: string): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: id,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [],
    lock: null,
  };
}

test("a corrupt journal does not mutate and is retained", () => {
  withRoot((root) => {
    const id = "bbbbbbbbbbbbbbbb";
    const live = abs(root, "src/styles/kit.css");
    mkdirSync(path.dirname(live), { recursive: true });
    writeFileSync(live, "old css");
    writeJournal(root, id, "{not json");

    const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    assert.equal(readFileSync(live, "utf8"), "old css");
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, id))), true);

    const inspections = inspectTransactions(root, STATE_DIR, RECOVERY_ROOTS);
    assert.equal(inspections.length, 1);
    assert.equal(inspections[0].ok, false);
  });
});

test("a forged or unknown journal state is refused", () => {
  withRoot((root) => {
    const id = "cccccccccccccccc";
    writeJournal(
      root,
      id,
      JSON.stringify({ ...baseJournal(id), phase: "invented" }),
    );
    const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.ok(recovered.issues.length > 0);
    }
  });
});

test("a journal identity that disagrees with its directory is refused", () => {
  withRoot((root) => {
    const id = "dddddddddddddddd";
    const other = "eeeeeeeeeeeeeeee";
    writeJournal(root, id, serializeJournal(baseJournal(other)));
    const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_IDENTITY_MISMATCH");
    }
  });
});

test("a journal whose root identity does not match the live root is refused without cleanup", () => {
  withRoot((root) => {
    const id = "abababababababab";
    writeJournal(root, id, serializeJournal(baseJournal(id)));
    const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_ROOT_MISMATCH");
    }
    // The journal evidence is retained rather than cleaned for a foreign root.
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, id))), true);
  });
});

test("age and PID alone cannot authorize destructive cleanup", () => {
  withRoot((root) => {
    const id = "ffffffffffffffff";
    const css = abs(root, "src/styles/kit.css");
    mkdirSync(path.dirname(css), { recursive: true });
    writeFileSync(css, "old css");
    const staged = stageOperations(root, STATE_DIR, id, [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("new css"),
        mode: 0o644,
      },
    ]);
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    const journal: TransactionJournal = {
      schemaVersion: 1,
      transactionId: id,
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
    const prepared = prepareJournal(journal, staged.value.records);
    persistJournal(root, journalPath(STATE_DIR, id), prepared);
    applyReplacements(root, STATE_DIR, prepared, staged.value);
    writeFileSync(css, "user edit after crash");

    // Make the journal look old; recovery must still refuse.
    const journalFile = abs(root, journalPath(STATE_DIR, id));
    const old = new Date(Date.now() - 86_400_000);
    utimesSync(journalFile, old, old);

    const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_USER_EDIT");
      const diagnostic = recoveryDiagnostic(recovered.issues[0]);
      assert.equal(diagnostic.level, "error");
      assert.match(diagnostic.guidance ?? "", /manually/);
    }
    assert.equal(readFileSync(css, "utf8"), "user edit after crash");
  });
});
