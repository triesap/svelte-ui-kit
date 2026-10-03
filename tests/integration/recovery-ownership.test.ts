import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import {
  recoverTransaction,
  recoverTransactions,
} from "../../src/codegen/recovery.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  backupsDir,
  journalPath,
  lockPath,
  transactionDir,
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  makeGuardedPlan,
  write,
} from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-4: coordinated recovery, owned inventory, typed failures and
 * release propagation.
 */

const ID = "dededededededede";
const ROOTS = {
  uiDir: "src/lib/components/ui",
  stylesDir: "src/styles",
  layoutFile: "src/routes/+layout.svelte",
} as const;

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-recovery-ownership-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function sealed(plan: unknown) {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

function journalWith(operation: Record<string, unknown>): string {
  return JSON.stringify({
    schemaVersion: 1,
    transactionId: ID,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "prepared",
    operations: [operation],
    lock: null,
  });
}

const updateOperation = (mode: number) => ({
  path: `${ROOTS.stylesDir}/kit.css`,
  operation: "update",
  preimage: { kind: "file", digest: sha256Hex("old css"), mode },
  resultDigest: sha256Hex("new css"),
  resultMode: mode,
  backupId: "backup-0",
  stagedId: "stage-0",
  applied: false,
});

test("an unowned nested entry blocks cleanup and is preserved", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    let extra = "";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "cleanup:staged") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        extra = `${backupsDir(GUARDED_STATE, ids[0] as string)}/unrelated.txt`;
        write(root, extra, "preserve me");
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.equal(readFileSync(abs(root, extra), "utf8"), "preserve me");
  });
});

test("a failed writer-lock release is reported and ownership evidence retained", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary === "lock:publish") {
          write(root, `${writerLockDir(GUARDED_STATE)}/unexpected.txt`, "keep");
        }
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "WRITER_LOCK_RELEASE_FAILED",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      existsSync(abs(root, `${writerLockDir(GUARDED_STATE)}/owner.json`)),
      true,
    );
  });
});

test("a final applied-journal failure is a typed recovery-aware refusal", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    // One prepared write, one progress write per operation and one final
    // applied write.
    const finalWrite = plan.targets.length + 2;
    let journalWrites = 0;
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "journal:write" && ++journalWrites === finalWrite) {
          throw new Error("phase applied persistence failed");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "REPLACE_PROGRESS_FAILED"),
      JSON.stringify(outcome.issues),
    );
  });
});

test("a missing journal with backup evidence fails closed and preserves the image", () => {
  withRoot((root) => {
    write(root, `${ROOTS.stylesDir}/kit.css`, "new css");
    write(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`, "old css");
    const recovered = recoverTransaction(root, GUARDED_STATE, ID, ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_AMBIGUOUS_JOURNAL");
    }
    assert.equal(
      readFileSync(
        abs(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`),
        "utf8",
      ),
      "old css",
    );
  });
});

test("a corrupted backup mode is refused rather than restored", () => {
  withRoot((root) => {
    write(root, `${ROOTS.stylesDir}/kit.css`, "new css");
    write(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`, "old css");
    write(
      root,
      journalPath(GUARDED_STATE, ID),
      journalWith(updateOperation(0o644)),
    );
    chmodSync(abs(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`), 0o777);
    const recovered = recoverTransaction(root, GUARDED_STATE, ID, ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_BACKUP_CORRUPT");
    }
  });
});

test("a mode edit on the current image is preserved through refusal", () => {
  withRoot((root) => {
    write(root, `${ROOTS.stylesDir}/kit.css`, "new css");
    write(root, `${backupsDir(GUARDED_STATE, ID)}/backup-0`, "old css");
    write(
      root,
      journalPath(GUARDED_STATE, ID),
      journalWith(updateOperation(0o644)),
    );
    chmodSync(abs(root, `${ROOTS.stylesDir}/kit.css`), 0o700);
    const recovered = recoverTransaction(root, GUARDED_STATE, ID, ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "RECOVERY_USER_EDIT");
    }
    assert.equal(
      statSync(abs(root, `${ROOTS.stylesDir}/kit.css`)).mode & 0o777,
      0o700,
    );
  });
});

test("the canonical lock is rejected as an ordinary recovery operation", () => {
  withRoot((root) => {
    write(root, lockPath(GUARDED_STATE), "{}");
    write(
      root,
      journalPath(GUARDED_STATE, ID),
      journalWith({
        path: lockPath(GUARDED_STATE),
        operation: "update",
        preimage: { kind: "file", digest: sha256Hex("{}"), mode: 0o644 },
        resultDigest: sha256Hex("new"),
        resultMode: 0o644,
        backupId: "backup-0",
        stagedId: "stage-0",
        applied: false,
      }),
    );
    const recovered = recoverTransaction(root, GUARDED_STATE, ID, ROOTS);
    assert.equal(recovered.status, "refused");
    if (recovered.status === "refused") {
      assert.equal(recovered.issues[0].code, "JOURNAL_TARGET_UNAPPROVED");
    }
  });
});

test("an unrecorded numeric backup file blocks cleanup and is retained", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    let extra = "";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "cleanup:staged") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        extra = `${backupsDir(GUARDED_STATE, ids[0] as string)}/backup-999`;
        write(root, extra, "UNOWNED FILE");
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.equal(readFileSync(abs(root, extra), "utf8"), "UNOWNED FILE");
  });
});

test("an unrecorded numeric backup directory blocks cleanup and preserves nested notes", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    let extra = "";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "cleanup:staged") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        extra = `${backupsDir(GUARDED_STATE, ids[0] as string)}/backup-999/notes.txt`;
        write(root, extra, "UNOWNED NESTED NOTES");
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, extra), "utf8"),
      "UNOWNED NESTED NOTES",
    );
  });
});

test("an unreadable transaction scan is a typed refusal, not an empty namespace", () => {
  withRoot((root) => {
    write(root, transactionsDir(GUARDED_STATE), "not a directory");
    const recovered = recoverTransactions(root, GUARDED_STATE, ROOTS);
    assert.equal(recovered.length, 1);
    assert.equal(recovered[0].status, "refused");
    assert.equal(recovered[0].issues[0].code, "RECOVERY_SCAN_UNSAFE");
  });
});

test("an unrecorded temporary-journal-named file blocks cleanup and is retained", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    let extra = "";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "cleanup:staged") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        extra = `${transactionDir(GUARDED_STATE, ids[0] as string)}/journal.json.tmp-user-notes`;
        write(root, extra, "UNOWNED TEMP-NAMED NOTES");
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, extra), "utf8"),
      "UNOWNED TEMP-NAMED NOTES",
    );
    // Only the exact recorded temporary journal name (journal.json.tmp-<id>) is
    // owned; a prefix match would delete this unrelated notes file.
    const recovered = recoverTransactions(root, GUARDED_STATE, ROOTS);
    assert.equal(recovered[0].status, "refused", JSON.stringify(recovered));
    assert.equal(
      readFileSync(abs(root, extra), "utf8"),
      "UNOWNED TEMP-NAMED NOTES",
    );
  });
});
