import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
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
  acquireWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { liveRootIdentity } from "../helpers/transactions.js";
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

function finalRecoveryFixture(
  root: string,
  operation: "create" | "update" | "retire",
) {
  const target = `${ROOTS.stylesDir}/boundary.css`;
  const backup = `${backupsDir(GUARDED_STATE, ID)}/backup-0`;
  write(root, `${ROOTS.stylesDir}/.operator-note`, "keep hidden source");
  if (operation !== "retire") write(root, target, "result bytes");
  if (operation !== "create") write(root, backup, "original bytes");
  write(
    root,
    journalPath(GUARDED_STATE, ID),
    JSON.stringify({
      schemaVersion: 1,
      transactionId: ID,
      rootIdentity: liveRootIdentity(root),
      planDigest: "b".repeat(64),
      phase: "applied",
      lock: null,
      operations: [
        {
          path: target,
          operation,
          preimage:
            operation === "create"
              ? { kind: "absent", digest: null, mode: null }
              : {
                  kind: "file",
                  digest: sha256Hex("original bytes"),
                  mode: 0o644,
                },
          resultDigest: sha256Hex(operation === "retire" ? "" : "result bytes"),
          resultMode: 0o644,
          backupId: operation === "create" ? null : "backup-0",
          stagedId: operation === "retire" ? null : "stage-0",
          applied: true,
        },
      ],
    }),
  );
  const writer = acquireWriterLock(root, GUARDED_STATE, "0404040404040404");
  assert.equal(writer.ok, true, JSON.stringify(writer));
  if (!writer.ok) throw new Error("writer acquisition failed");
  return { target, backup, writer: writer.value };
}

for (const operation of ["create", "update", "retire"] as const) {
  const mutations = [
    "target-bytes",
    "target-mode",
    "target-identity",
    "target-link",
    "ancestor-mode",
    "ancestor-identity",
    "root-mode",
    "writer",
    "journal-identity",
    "foreign-inventory",
    ...(operation === "create"
      ? []
      : ["backup-bytes", "backup-mode", "backup-identity", "backup-link"]),
  ] as const;
  for (const mutation of mutations) {
    test(`${operation} recovery preserves a returning ${mutation} edit after preflight`, () => {
      withRoot((root) => {
        const fixture = finalRecoveryFixture(root, operation);
        let edited: ReturnType<typeof snapshotTree> | undefined;
        try {
          const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS, {
            before: (boundary) => {
              if (
                boundary !==
                (operation === "create"
                  ? "recovery:remove"
                  : "recovery:restore")
              )
                return;
              const target = abs(root, fixture.target);
              const backup = abs(root, fixture.backup);
              if (mutation === "target-bytes")
                write(root, fixture.target, "late user bytes");
              else if (mutation === "target-mode") {
                if (operation === "retire")
                  write(root, fixture.target, "user file");
                chmodSync(target, 0o2644);
              } else if (mutation === "target-identity") {
                if (operation !== "retire")
                  renameSync(target, `${target}.operator-original`);
                writeFileSync(target, "result bytes", { mode: 0o644 });
              } else if (mutation === "target-link") {
                if (operation !== "retire")
                  renameSync(target, `${target}.operator-original`);
                symlinkSync(".operator-note", target);
              } else if (mutation === "ancestor-mode")
                chmodSync(abs(root, ROOTS.stylesDir), 0o700);
              else if (mutation === "ancestor-identity") {
                const directory = abs(root, ROOTS.stylesDir);
                renameSync(directory, `${directory}.operator-original`);
                mkdirSync(directory, { mode: 0o755 });
                write(
                  root,
                  `${ROOTS.stylesDir}/.operator-note`,
                  "keep hidden source",
                );
                if (operation !== "retire")
                  renameSync(
                    path.join(
                      `${directory}.operator-original`,
                      path.basename(target),
                    ),
                    target,
                  );
              } else if (mutation === "root-mode") chmodSync(root, 0o755);
              else if (mutation === "writer") {
                const owner = abs(
                  root,
                  `${writerLockDir(GUARDED_STATE)}/owner.json`,
                );
                const bytes = readFileSync(owner);
                renameSync(owner, `${owner}.operator-original`);
                writeFileSync(owner, bytes, { mode: 0o600 });
              } else if (mutation === "journal-identity") {
                const journal = abs(root, journalPath(GUARDED_STATE, ID));
                const bytes = readFileSync(journal);
                const mode = statSync(journal).mode & 0o7777;
                renameSync(journal, abs(root, ".operator-original-journal"));
                writeFileSync(journal, bytes, { mode });
              } else if (mutation === "foreign-inventory")
                write(
                  root,
                  `${transactionDir(GUARDED_STATE, ID)}/.operator-note`,
                  "late hidden state",
                );
              else if (mutation === "backup-bytes")
                writeFileSync(backup, "late backup edit");
              else if (mutation === "backup-mode") chmodSync(backup, 0o2644);
              else if (mutation === "backup-identity") {
                const bytes = readFileSync(backup);
                renameSync(backup, abs(root, ".operator-original-backup"));
                writeFileSync(backup, bytes, { mode: 0o644 });
              } else if (mutation === "backup-link") {
                renameSync(backup, `${backup}.operator-original`);
                symlinkSync("backup-0.operator-original", backup);
              }
              edited = snapshotTree(root);
            },
          });
          assert.equal(result.status, "refused", JSON.stringify(result));
          assert.ok(edited, JSON.stringify(result));
          assert.deepEqual(snapshotTree(root), edited);
          assert.ok(existsSync(abs(root, journalPath(GUARDED_STATE, ID))));
        } finally {
          assert.equal(
            releaseWriterLock(fixture.writer).ok,
            mutation !== "writer",
          );
        }
      });
    });
  }
}

for (const operation of ["create", "update", "retire"] as const) {
  for (const mutation of [
    "target",
    "canonical",
    "writer",
    "root-mode",
  ] as const) {
    test(`${operation} recovery cleanup preserves a returning ${mutation} edit and terminal evidence`, () => {
      withRoot((root) => {
        const fixture = finalRecoveryFixture(root, operation);
        let edited: ReturnType<typeof snapshotTree> | undefined;
        try {
          const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS, {
            before: (boundary) => {
              if (boundary !== "recovery:cleanup") return;
              if (mutation === "target")
                write(root, fixture.target, "late source edit");
              else if (mutation === "canonical")
                write(root, lockPath(GUARDED_STATE), "late canonical file");
              else if (mutation === "root-mode") chmodSync(root, 0o755);
              else {
                const owner = abs(
                  root,
                  `${writerLockDir(GUARDED_STATE)}/owner.json`,
                );
                const bytes = readFileSync(owner);
                renameSync(owner, `${owner}.operator-original`);
                writeFileSync(owner, bytes, { mode: 0o600 });
              }
              edited = snapshotTree(root);
            },
          });
          assert.equal(result.status, "refused", JSON.stringify(result));
          assert.ok(edited, JSON.stringify(result));
          assert.deepEqual(snapshotTree(root), edited);
          assert.equal(
            JSON.parse(
              readFileSync(abs(root, journalPath(GUARDED_STATE, ID)), "utf8"),
            ).phase,
            "rolled_back",
          );
        } finally {
          assert.equal(
            releaseWriterLock(fixture.writer).ok,
            mutation !== "writer",
          );
        }
      });
    });
  }
  test(`${operation} recovery completes under unchanged held physical evidence`, () => {
    withRoot((root) => {
      const fixture = finalRecoveryFixture(root, operation);
      try {
        const backupIdentity =
          operation === "create" ? null : statSync(abs(root, fixture.backup));
        const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS);
        assert.equal(result.status, "rolled_back", JSON.stringify(result));
        if (operation === "create")
          assert.equal(existsSync(abs(root, fixture.target)), false);
        else {
          assert.equal(
            readFileSync(abs(root, fixture.target), "utf8"),
            "original bytes",
          );
          assert.equal(
            statSync(abs(root, fixture.target)).ino,
            backupIdentity?.ino,
          );
          assert.equal(
            statSync(abs(root, fixture.target)).mode & 0o7777,
            0o644,
          );
        }
        assert.equal(
          existsSync(abs(root, transactionDir(GUARDED_STATE, ID))),
          false,
        );
      } finally {
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
  test(`${operation} recovery reports its completed syscall when the next hook fails`, () => {
    withRoot((root) => {
      const fixture = finalRecoveryFixture(root, operation);
      try {
        const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS, {
          after: (boundary) => {
            if (
              boundary ===
              (operation === "create" ? "recovery:remove" : "recovery:restore")
            )
              throw new Error("after completed syscall");
          },
        });
        assert.equal(result.status, "refused", JSON.stringify(result));
        assert.ok(
          result.issues.some(
            (entry) =>
              entry.code === "RECOVERY_PARTIAL_ROLLBACK" &&
              entry.message.includes(fixture.target),
          ),
        );
        if (operation === "create")
          assert.equal(existsSync(abs(root, fixture.target)), false);
        else {
          assert.equal(
            readFileSync(abs(root, fixture.target), "utf8"),
            "original bytes",
          );
          assert.equal(existsSync(abs(root, fixture.backup)), false);
        }
        assert.equal(
          JSON.parse(
            readFileSync(abs(root, journalPath(GUARDED_STATE, ID)), "utf8"),
          ).phase,
          "applied",
        );
      } finally {
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
}

for (const fault of ["edit-pending", "after-first-restore"] as const) {
  test(`recovery stops the batch at ${fault} and retains truthful pending work`, () => {
    withRoot((root) => {
      const fixture = finalRecoveryFixture(root, "update");
      const second = `${ROOTS.stylesDir}/second.css`;
      write(root, second, "second result");
      write(
        root,
        `${backupsDir(GUARDED_STATE, ID)}/backup-1`,
        "second original",
      );
      const journalAbs = abs(root, journalPath(GUARDED_STATE, ID));
      const journal = JSON.parse(readFileSync(journalAbs, "utf8"));
      journal.operations.push({
        ...journal.operations[0],
        path: second,
        preimage: {
          kind: "file",
          digest: sha256Hex("second original"),
          mode: 0o644,
        },
        resultDigest: sha256Hex("second result"),
        backupId: "backup-1",
        stagedId: "stage-1",
      });
      writeFileSync(journalAbs, JSON.stringify(journal));
      let edited: ReturnType<typeof snapshotTree> | undefined;
      const visited: string[] = [];
      try {
        const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS, {
          before: (boundary, detail) => {
            if (boundary !== "recovery:restore") return;
            visited.push(detail!);
            if (fault === "edit-pending") {
              write(root, fixture.target, "pending target user edit");
              edited = snapshotTree(root);
            }
          },
          after: (boundary) => {
            if (
              boundary === "recovery:restore" &&
              fault === "after-first-restore"
            )
              throw new Error("one completed restore");
          },
        });
        assert.equal(result.status, "refused", JSON.stringify(result));
        assert.deepEqual(visited, [second]);
        assert.equal(
          readFileSync(abs(root, fixture.backup), "utf8"),
          "original bytes",
        );
        assert.equal(
          JSON.parse(readFileSync(journalAbs, "utf8")).phase,
          "applied",
        );
        if (fault === "edit-pending") {
          assert.ok(edited);
          assert.deepEqual(snapshotTree(root), edited);
          assert.equal(
            readFileSync(abs(root, second), "utf8"),
            "second result",
          );
        } else {
          assert.equal(
            readFileSync(abs(root, second), "utf8"),
            "second original",
          );
          assert.equal(
            readFileSync(abs(root, fixture.target), "utf8"),
            "result bytes",
          );
          assert.ok(
            result.issues.some(
              (entry) =>
                entry.code === "RECOVERY_PARTIAL_ROLLBACK" &&
                entry.message.includes(second),
            ),
          );
        }
      } finally {
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
}

test("an empty cleanup tail preserves a replacement transaction directory after its hook returns", () => {
  withRoot((root) => {
    const directory = abs(root, transactionDir(GUARDED_STATE, ID));
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const writer = acquireWriterLock(root, GUARDED_STATE, "0404040404040404");
    assert.equal(writer.ok, true, JSON.stringify(writer));
    if (!writer.ok) throw new Error("writer unavailable");
    let edited: ReturnType<typeof snapshotTree> | undefined;
    try {
      const result = recoverTransaction(root, GUARDED_STATE, ID, ROOTS, {
        before: (boundary) => {
          if (boundary !== "recovery:cleanup-dir") return;
          renameSync(directory, abs(root, ".operator-original-transaction"));
          mkdirSync(directory, { mode: 0o700 });
          edited = snapshotTree(root);
        },
      });
      assert.equal(result.status, "refused", JSON.stringify(result));
      assert.ok(edited, JSON.stringify(result));
      assert.deepEqual(snapshotTree(root), edited);
    } finally {
      assert.equal(releaseWriterLock(writer.value).ok, true);
    }
  });
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
    // The namespace scan is refused as unsafe; the post-release cleanup tail
    // additionally reports the non-directory kind fault rather than reporting a
    // false clean namespace. No row may claim a clean outcome.
    const scanRefusal = recovered.find((entry) =>
      entry.issues.some((issue) => issue.code === "RECOVERY_SCAN_UNSAFE"),
    );
    assert.ok(scanRefusal, JSON.stringify(recovered));
    assert.ok(
      recovered.every((entry) => entry.status === "refused"),
      JSON.stringify(recovered),
    );
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
