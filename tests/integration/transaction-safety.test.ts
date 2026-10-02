import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ValidatedApplyPlan,
} from "../../src/codegen/apply.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  recoverTransaction,
  recoverTransactions,
} from "../../src/codegen/recovery.js";
import {
  persistJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import { faultAfter } from "../../src/codegen/transaction-hooks.js";
import {
  backupsDir,
  journalPath,
  lockPath,
  transactionDir,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS } from "../helpers/transactions.js";
import {
  runGuardedWorker,
  spawnGuardedWorker,
  waitForExit,
  waitForHeld,
} from "../helpers/guarded-process.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  abs,
  GUARDED_LAYOUT,
  GUARDED_STATE,
  GUARDED_STYLES,
  GUARDED_UI,
  makeGuardedPlan,
} from "../helpers/guarded-plan.js";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-safety-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function sealed(plan: unknown): ValidatedApplyPlan {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

function lockValue(configHash: string): Uint8Array {
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

const ID = "abababababababab";

function writeJournal(root: string, journal: TransactionJournal): void {
  persistJournal(root, journalPath(GUARDED_STATE, ID), journal);
}

test("a contender never recovers a live owner; the first writer applies", () => {
  withRoot((root) => {
    const second = sealed(makeGuardedPlan(root));
    const third = sealed(makeGuardedPlan(root));
    let contenderOutcome: ReturnType<typeof applyPlan> | null = null;
    const applied = applyPlan(second, {
      after: (boundary) => {
        if (boundary === "replace:apply" && contenderOutcome === null) {
          contenderOutcome = applyPlan(third);
        }
      },
    });
    assert.equal(applied.kind, "applied");
    assert.ok(contenderOutcome !== null);
    const contender = contenderOutcome as ReturnType<typeof applyPlan>;
    assert.equal(contender.kind, "refused");
    assert.equal(contender.issues[0].code, "WRITER_BUSY");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
  });
});

test("an edit made during staging is refused, never overwritten", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary === "stage:verify") {
          writeFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "user edit");
        }
      },
    });
    assert.equal(outcome.kind, "refused");
    assert.match(
      outcome.issues.map((issue) => issue.code).join(","),
      /STALE_PLAN|AUTHORITY/,
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "user edit",
    );
  });
});

test("a crash after lock publication preserves committed source", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, faultAfter("lock:publish", "gap"));
    assert.equal(outcome.kind, "committed_needs_cleanup");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "committed");
  });
});

test("a transaction-creation fault is typed and leaves no orphan", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "transaction:create") throw new Error("setup fault");
      },
    });
    assert.equal(outcome.kind, "refused");
    assert.equal(outcome.issues[0].code, "APPLY_SETUP_FAILED");
    assert.equal(existsSync(abs(root, transactionsDir(GUARDED_STATE))), false);
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});

test("the existing canonical lock mode is preserved", () => {
  withRoot((root) => {
    const lock = abs(root, lockPath(GUARDED_STATE));
    mkdirSync(path.dirname(lock), { recursive: true });
    writeFileSync(lock, lockValue("c".repeat(64)));
    chmodSync(lock, 0o640);
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan);
    assert.equal(outcome.kind, "applied");
    assert.equal(statSync(lock).mode & 0o777, 0o640);
  });
});

test("recovery refuses a forged journal target outside the approved roots", () => {
  withRoot((root) => {
    writeFileSync(abs(root, "notes.txt"), "keep me");
    const journal: TransactionJournal = {
      schemaVersion: 1,
      transactionId: ID,
      rootIdentity: "a".repeat(64),
      planDigest: "b".repeat(64),
      phase: "prepared",
      operations: [
        {
          path: "notes.txt",
          operation: "create",
          preimage: { kind: "absent", digest: null, mode: null },
          resultDigest: sha256Hex("keep me"),
          resultMode: 0o644,
          backupId: null,
          stagedId: "stage-0",
          applied: true,
        },
      ],
      lock: null,
    };
    writeJournal(root, journal);
    const recovered = recoverTransaction(
      root,
      GUARDED_STATE,
      ID,
      RECOVERY_ROOTS,
    );
    assert.equal(recovered.status, "refused");
    assert.equal(recovered.issues[0].code, "JOURNAL_TARGET_UNAPPROVED");
    assert.equal(readFileSync(abs(root, "notes.txt"), "utf8"), "keep me");
  });
});

test("recovery refuses a corrupted backup instead of restoring it", () => {
  withRoot((root) => {
    const css = abs(root, `${GUARDED_STYLES}/kit.css`);
    mkdirSync(path.dirname(css), { recursive: true });
    writeFileSync(css, "new css");
    const journal: TransactionJournal = {
      schemaVersion: 1,
      transactionId: ID,
      rootIdentity: "a".repeat(64),
      planDigest: "b".repeat(64),
      phase: "applied",
      operations: [
        {
          path: `${GUARDED_STYLES}/kit.css`,
          operation: "update",
          preimage: { kind: "file", digest: sha256Hex("old css"), mode: 0o644 },
          resultDigest: sha256Hex("new css"),
          resultMode: 0o644,
          backupId: "backup-0",
          stagedId: "stage-0",
          applied: true,
        },
      ],
      lock: null,
    };
    writeJournal(root, journal);
    const backup = abs(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`);
    mkdirSync(path.dirname(backup), { recursive: true });
    writeFileSync(backup, "CORRUPTED BACKUP");
    const recovered = recoverTransaction(
      root,
      GUARDED_STATE,
      ID,
      RECOVERY_ROOTS,
    );
    assert.equal(recovered.status, "refused");
    assert.equal(recovered.issues[0].code, "RECOVERY_BACKUP_CORRUPT");
    assert.equal(readFileSync(css, "utf8"), "new css");
  });
});

test("recovery refuses a symlinked ancestor and preserves outside files", () => {
  withRoot((root) => {
    const outside = mkdtempSync(path.join(os.tmpdir(), "suik-safety-out-"));
    try {
      writeFileSync(path.join(outside, "kit.css"), "new css");
      mkdirSync(abs(root, "src"), { recursive: true });
      symlinkSync(outside, abs(root, GUARDED_STYLES), "dir");
      const journal: TransactionJournal = {
        schemaVersion: 1,
        transactionId: ID,
        rootIdentity: "a".repeat(64),
        planDigest: "b".repeat(64),
        phase: "applied",
        operations: [
          {
            path: `${GUARDED_STYLES}/kit.css`,
            operation: "create",
            preimage: { kind: "absent", digest: null, mode: null },
            resultDigest: sha256Hex("new css"),
            resultMode: 0o644,
            backupId: null,
            stagedId: "stage-0",
            applied: true,
          },
        ],
        lock: null,
      };
      writeJournal(root, journal);
      const recovered = recoverTransaction(
        root,
        GUARDED_STATE,
        ID,
        RECOVERY_ROOTS,
      );
      assert.equal(recovered.status, "refused");
      assert.equal(recovered.issues[0].code, "RECOVERY_UNSAFE_ANCESTRY");
      assert.equal(
        readFileSync(path.join(outside, "kit.css"), "utf8"),
        "new css",
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});

test("published recovery retains an unexpected entry and refuses cleanup", () => {
  withRoot((root) => {
    mkdirSync(abs(root, GUARDED_STATE), { recursive: true });
    const lock = abs(root, lockPath(GUARDED_STATE));
    writeFileSync(lock, lockValue("d".repeat(64)));
    const journal: TransactionJournal = {
      schemaVersion: 1,
      transactionId: ID,
      rootIdentity: "a".repeat(64),
      planDigest: "b".repeat(64),
      phase: "published",
      operations: [],
      lock: {
        path: lockPath(GUARDED_STATE),
        digest: sha256Hex(lockValue("d".repeat(64))),
        published: true,
        unchanged: false,
      },
    };
    writeJournal(root, journal);
    const extra = abs(
      root,
      `${transactionDir(GUARDED_STATE, ID)}/unrelated.txt`,
    );
    writeFileSync(extra, "preserve me");
    const recovered = recoverTransaction(
      root,
      GUARDED_STATE,
      ID,
      RECOVERY_ROOTS,
    );
    assert.equal(recovered.status, "refused");
    assert.equal(recovered.issues[0].code, "RECOVERY_UNEXPECTED_ENTRY");
    assert.equal(readFileSync(extra, "utf8"), "preserve me");
  });
});

function guardedOptions(root: string) {
  return {
    root,
    uiDir: GUARDED_UI,
    stylesDir: GUARDED_STYLES,
    layoutFile: GUARDED_LAYOUT,
    stateDir: GUARDED_STATE,
    boundary: "",
  };
}

test("real SIGKILL before replacement rolls the batch back", () => {
  withRoot((root) => {
    const killed = runGuardedWorker({
      ...guardedOptions(root),
      boundary: "replace:apply",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "rolled_back");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});

test("real SIGKILL after lock publication is classified as committed", () => {
  withRoot((root) => {
    const killed = runGuardedWorker({
      ...guardedOptions(root),
      boundary: "lock:publish",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "committed");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css",
    );
  });
});

test("real SIGKILL during cleanup leaves a committed batch", () => {
  withRoot((root) => {
    const killed = runGuardedWorker({
      ...guardedOptions(root),
      boundary: "cleanup:journal",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.ok(
      recovered[0].status === "committed" || recovered[0].status === "cleaned",
      recovered[0].status,
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css",
    );
  });
});

test("real SIGKILL at preparation, backup and progress boundaries recovers or refuses safely", () => {
  for (const boundary of [
    "journal:write",
    "backup:move",
    "progress:persist",
  ] as const) {
    withRoot((root) => {
      const killed = runGuardedWorker({
        ...guardedOptions(root),
        boundary,
      });
      assert.equal(killed.signal, "SIGKILL", `${boundary}: ${killed.stderr}`);
      const recovered = recoverTransactions(
        root,
        GUARDED_STATE,
        RECOVERY_ROOTS,
      );
      assert.ok(
        recovered[0].status === "rolled_back" ||
          recovered[0].status === "cleaned" ||
          recovered[0].status === "refused",
        `${boundary}: ${recovered[0].status}`,
      );
      // No live replacement survives an uncommitted crash.
      assert.equal(
        readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
        "old css",
        boundary,
      );
    });
  }
});

test("two composed writers: a real holder is never recovered by a contender", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-contend-"));
  try {
    const contender = sealed(makeGuardedPlan(root));
    const holder = spawnGuardedWorker({
      ...guardedOptions(root),
      boundary: "replace:apply",
      mode: "hold",
      holdMs: 1500,
    });
    await waitForHeld(holder);
    const outcome = applyPlan(contender);
    assert.equal(outcome.kind, "refused");
    assert.equal(outcome.issues[0].code, "WRITER_BUSY");
    await waitForExit(holder);
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css",
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("the supported filesystem constraint is verified and complete trees compare", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const before = snapshotTree(root);
    const outcome = applyPlan(plan);
    assert.equal(outcome.kind, "applied");
    const after = snapshotTree(root);
    assert.notDeepEqual(after, before);
    // The staging directory and replacement targets must share one filesystem:
    // the guarded boundary stages and renames within the same device.
    assert.equal(
      statSync(abs(root, GUARDED_STATE)).dev,
      statSync(abs(root, GUARDED_STYLES)).dev,
    );
    assert.ok(
      process.platform === "darwin" || process.platform === "linux",
      `unqualified platform ${process.platform}`,
    );
    // The published lock round-trips durably after the batch.
    const lock = JSON.parse(
      readFileSync(abs(root, lockPath(GUARDED_STATE)), "utf8"),
    );
    assert.equal(lock.configHash, "d".repeat(64));
  });
});

test("a stale plan leaves the complete tree byte-identical", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    writeFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "user changed css");
    const before = snapshotTree(root);
    const outcome = applyPlan(plan);
    assert.equal(outcome.kind, "refused");
    assert.deepEqual(snapshotTree(root), before);
  });
});
