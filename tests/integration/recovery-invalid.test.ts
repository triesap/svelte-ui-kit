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
  observeFileIdentity,
  writePublicationIntent,
} from "../../src/codegen/publication-intent.js";
import {
  prepareJournal,
  persistJournal,
  serializeJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import {
  inspectTransactions,
  inspectUnchangedState,
  recoverTransaction,
} from "../../src/codegen/recovery.js";
import { applyPreparedReplacements as applyReplacements } from "../helpers/replacement.js";
import { stageOperations } from "../../src/codegen/stage.js";
import {
  journalPath,
  backupsDir,
  stagedDir,
  publicationIntentPath,
  transactionDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS, liveRootIdentity } from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

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

test("incomplete preimages and forged ownership identifiers retain the entire tree", () => {
  for (const patch of [
    { preimage: { kind: "file", digest: null, mode: 0o644 } },
    { preimage: { kind: "file", digest: sha256Hex("old css"), mode: null } },
    { stagedId: ["stage-0"] },
    { stagedId: "kit.lock.json" },
  ]) {
    withRoot((root) => {
      const id = "bbbbbbbbcccccccc";
      const live = abs(root, "src/styles/kit.css");
      mkdirSync(path.dirname(live), { recursive: true });
      writeFileSync(live, "old css");
      writeJournal(
        root,
        id,
        JSON.stringify({
          ...baseJournal(id),
          rootIdentity: liveRootIdentity(root),
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
              backupId: "backup-0",
              stagedId: "stage-0",
              applied: false,
              ...patch,
            },
          ],
        }),
      );
      const before = snapshotTree(root);
      const inspections = inspectTransactions(root, STATE_DIR, RECOVERY_ROOTS);
      assert.equal(inspections[0]?.ok, false);
      assert.equal(inspections[0]?.issues[0]?.code, "JOURNAL_INVALID");
      assert.deepEqual(snapshotTree(root), before);
      const recovered = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
      assert.equal(recovered.status, "refused");
      assert.equal(recovered.issues[0]?.code, "JOURNAL_INVALID");
      assert.deepEqual(snapshotTree(root), before);
    });
  }
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

for (const evidence of [
  "clean",
  "backup",
  "installed",
  "edited",
  "staged-lock",
] as const) {
  test(`planned recovery positively qualifies ${evidence} physical evidence`, () => {
    withRoot((root) => {
      const id = "abacabadabacabad";
      const live = abs(root, "src/styles/kit.css");
      mkdirSync(path.dirname(live), { recursive: true });
      writeFileSync(
        live,
        evidence === "installed"
          ? "new css"
          : evidence === "edited"
            ? "operator edit"
            : "old css",
      );
      const journal: TransactionJournal = {
        ...baseJournal(id),
        rootIdentity: liveRootIdentity(root),
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
            backupId: "backup-0",
            stagedId: "stage-0",
            applied: false,
          },
        ],
        // Reserved intent fields alone do not prove publication or forbid planned cleanup.
        lock: {
          path: `${STATE_DIR}/kit.lock.json`,
          digest: sha256Hex("lock"),
          published: false,
          unchanged: false,
        },
      };
      writeJournal(root, id, serializeJournal(journal));
      const stage = abs(root, `${stagedDir(STATE_DIR, id)}/stage-0`);
      mkdirSync(path.dirname(stage), { recursive: true });
      writeFileSync(stage, "new css");
      if (evidence === "backup") {
        const backup = abs(root, `${backupsDir(STATE_DIR, id)}/backup-0`);
        mkdirSync(path.dirname(backup), { recursive: true });
        writeFileSync(backup, "old css");
      }
      if (evidence === "staged-lock")
        writeFileSync(path.join(path.dirname(stage), "kit.lock.json"), "lock");
      const before = snapshotTree(root);
      const inspection = inspectTransactions(
        root,
        STATE_DIR,
        RECOVERY_ROOTS,
      )[0];
      assert.equal(
        inspection?.ok,
        evidence === "clean",
        JSON.stringify(inspection),
      );
      const unchanged = inspectUnchangedState(root, STATE_DIR, RECOVERY_ROOTS);
      assert.equal(
        unchanged[0]?.code,
        evidence === "clean"
          ? "RECOVERY_PENDING"
          : evidence === "backup"
            ? "RECOVERY_PHASE_CONTRADICTION"
            : evidence === "staged-lock"
              ? "RECOVERY_AMBIGUOUS_PUBLICATION"
              : "RECOVERY_USER_EDIT",
      );
      assert.deepEqual(snapshotTree(root), before);
      const result = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
      assert.equal(
        result.status,
        evidence === "clean" ? "cleaned" : "refused",
        JSON.stringify(result),
      );
      if (evidence === "clean") {
        assert.equal(readFileSync(live, "utf8"), "old css");
        assert.equal(
          existsSync(abs(root, transactionDir(STATE_DIR, id))),
          false,
        );
      } else {
        assert.deepEqual(snapshotTree(root), before);
      }
    });
  });
}

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

for (const image of ["stage", "backup"] as const) {
  test(`prepared recovery retains edited ${image} even when the live preimage needs no restoration`, () => {
    withRoot((root) => {
      const id = "acacacacacacacac";
      const live = abs(root, "src/styles/kit.css");
      mkdirSync(path.dirname(live), { recursive: true });
      writeFileSync(live, "old css");
      const operation = {
        path: "src/styles/kit.css",
        operation: "update" as const,
        preimage: {
          kind: "file" as const,
          digest: sha256Hex("old css"),
          mode: 0o644,
        },
        resultDigest: sha256Hex("new css"),
        resultMode: 0o644,
        backupId: "backup-0",
        stagedId: "stage-0",
        applied: false,
      };
      writeJournal(
        root,
        id,
        serializeJournal({
          ...baseJournal(id),
          rootIdentity: liveRootIdentity(root),
          phase: "prepared",
          operations: [operation],
        }),
      );
      const retained = abs(
        root,
        image === "stage"
          ? `${stagedDir(STATE_DIR, id)}/stage-0`
          : `${backupsDir(STATE_DIR, id)}/backup-0`,
      );
      mkdirSync(path.dirname(retained), { recursive: true });
      writeFileSync(retained, "operator evidence edit");
      const before = snapshotTree(root);
      assert.equal(
        inspectTransactions(root, STATE_DIR, RECOVERY_ROOTS)[0]?.ok,
        false,
      );
      const result = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
      assert.equal(result.status, "refused", JSON.stringify(result));
      assert.equal(result.issues[0]?.code, "RECOVERY_BACKUP_CORRUPT");
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

test("applied progress cannot discard a surviving staged operation image", () => {
  withRoot((root) => {
    const id = "adadadadadadadad";
    const live = abs(root, "src/styles/kit.css");
    mkdirSync(path.dirname(live), { recursive: true });
    writeFileSync(live, "old css");
    writeJournal(
      root,
      id,
      serializeJournal({
        ...baseJournal(id),
        rootIdentity: liveRootIdentity(root),
        phase: "applied",
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
            backupId: "backup-0",
            stagedId: "stage-0",
            applied: true,
          },
        ],
      }),
    );
    const stage = abs(root, `${stagedDir(STATE_DIR, id)}/stage-0`);
    mkdirSync(path.dirname(stage), { recursive: true });
    writeFileSync(stage, "new css");
    const before = snapshotTree(root);
    const result = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.equal(result.issues[0]?.code, "RECOVERY_PHASE_CONTRADICTION");
    assert.deepEqual(snapshotTree(root), before);
  });
});

test("a historical planned lock intent with positive prepublication witness remains recoverable", () => {
  withRoot((root) => {
    const id = "aeaeaeaeaeaeaeae";
    const journal: TransactionJournal = {
      ...baseJournal(id),
      rootIdentity: liveRootIdentity(root),
      lock: {
        path: `${STATE_DIR}/kit.lock.json`,
        digest: sha256Hex("lock"),
        published: false,
        unchanged: false,
      },
    };
    writeJournal(root, id, serializeJournal(journal));
    const staged = abs(root, `${stagedDir(STATE_DIR, id)}/kit.lock.json`);
    mkdirSync(path.dirname(staged), { recursive: true });
    writeFileSync(staged, "lock", { mode: 0o644 });
    writePublicationIntent(root, publicationIntentPath(STATE_DIR, id), {
      schemaVersion: 1,
      transactionId: id,
      rootIdentity: journal.rootIdentity,
      planDigest: journal.planDigest,
      digest: journal.lock!.digest,
      mode: 0o644,
      preimage: null,
      staged: observeFileIdentity(staged),
    });
    assert.equal(
      inspectTransactions(root, STATE_DIR, RECOVERY_ROOTS)[0]?.ok,
      true,
    );
    const result = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
    assert.equal(result.status, "cleaned", JSON.stringify(result));
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, id))), false);
    assert.equal(existsSync(abs(root, `${STATE_DIR}/kit.lock.json`)), false);
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
