import assert from "node:assert/strict";
import {
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import {
  stagedDir,
  lockPath,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  GUARDED_STYLES,
  makeGuardedPlan,
  lockJson,
  write,
} from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { applyReplacements } from "../../src/codegen/replace.js";
import { holdMutationAuthority } from "../../src/codegen/mutation-authority.js";
import { stageOperations } from "../../src/codegen/stage.js";
import {
  prepareJournal,
  persistJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import {
  backupsDir,
  journalPath,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  acquireWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { liveRootIdentity } from "../helpers/transactions.js";

/**
 * RCLD04-R2-2: live/staged physical authority at replacement boundaries.
 *
 * A corrupted staged image and an observable intervening user edit are both
 * refused before publication, and the current application bytes are preserved.
 */

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-replace-guard-"));
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

for (const logical of [`${GUARDED_STYLES}/kit.css`, lockPath(GUARDED_STATE)]) {
  test(`an equal-byte physical replacement of ${logical} invalidates the original plan`, () => {
    withRoot((root) => {
      write(root, lockPath(GUARDED_STATE), lockJson("c".repeat(64)));
      const plan = sealed(makeGuardedPlan(root));
      const target = abs(root, logical);
      const bytes = readFileSync(target);
      renameSync(target, `${target}.original`);
      writeFileSync(target, bytes, { mode: 0o644 });
      const before = snapshotTree(root);
      const result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some((entry) => entry.code === "STALE_PLAN"),
        JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

for (const logical of ["", GUARDED_STYLES]) {
  test(`a post-planning mode edit of ${logical || "the root"} preserves the edited tree`, () => {
    withRoot((root) => {
      const plan = sealed(makeGuardedPlan(root));
      chmodSync(logical === "" ? root : abs(root, logical), 0o750);
      const before = snapshotTree(root);
      const result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some((entry) => entry.code.startsWith("AUTHORITY_")),
        JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

test("removed or substituted original physical preimage evidence cannot seal a plan", () => {
  withRoot((root) => {
    const original = makeGuardedPlan(root);
    const index = original.targets.findIndex(
      (entry) => entry.preimage.kind === "file",
    );
    assert.ok(index >= 0);
    const target = original.targets[index];
    assert.ok(target.preimage.identity);
    const before = snapshotTree(root);
    for (const identity of [
      undefined,
      null,
      { device: -1, inode: 1 },
      {
        ...target.preimage.identity,
        inode: target.preimage.identity!.inode + 1,
      },
    ]) {
      const result = validateApplyPlan({
        ...original,
        targets: original.targets.map((entry, candidate) =>
          candidate === index
            ? {
                ...entry,
                preimage: { ...entry.preimage, identity },
              }
            : entry,
        ),
      });
      assert.equal(result.ok, false, JSON.stringify(result));
      assert.deepEqual(snapshotTree(root), before);
    }
  });
});

function boundaryFixture(
  root: string,
  operation: "create" | "update" | "retire",
) {
  const target = `${GUARDED_STYLES}/boundary.css`;
  write(root, `${GUARDED_STYLES}/.operator-note`, "keep hidden content");
  write(root, `${GUARDED_STATE}/.operator-note`, "keep state content");
  if (operation !== "create") write(root, target, "original bytes");
  const id = "0404040404040404";
  const writer = acquireWriterLock(root, GUARDED_STATE, id);
  assert.equal(writer.ok, true, JSON.stringify(writer));
  if (!writer.ok) throw new Error("writer acquisition failed");
  const bytes = new TextEncoder().encode(
    operation === "retire" ? "" : "replacement bytes",
  );
  const staged = stageOperations(root, GUARDED_STATE, id, [
    { path: target, operation, bytes, mode: 0o644 },
  ]);
  assert.equal(staged.ok, true, JSON.stringify(staged));
  if (!staged.ok) throw new Error("staging failed");
  const journal: TransactionJournal = {
    schemaVersion: 1,
    transactionId: id,
    rootIdentity: liveRootIdentity(root),
    planDigest: "b".repeat(64),
    phase: "planned",
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
        resultDigest: sha256Hex(bytes),
        resultMode: 0o644,
        backupId: null,
        stagedId: null,
        applied: false,
      },
    ],
  };
  const prepared = prepareJournal(journal, staged.value.records);
  persistJournal(root, journalPath(GUARDED_STATE, id), prepared);
  const authority = holdMutationAuthority(root, [
    target,
    `${staged.value.stagedDirectory}/entry`,
    `${backupsDir(GUARDED_STATE, id)}/entry`,
  ]);
  return {
    target,
    staged: staged.value,
    journal: prepared,
    authority,
    writer: writer.value,
  };
}

for (const operation of ["create", "update", "retire"] as const) {
  for (const mutation of [
    "target",
    "ancestor-mode",
    "ancestor-identity",
    "writer",
  ] as const) {
    test(`${operation} preserves a returning ${mutation} edit at its final mutation boundary`, () => {
      withRoot((root) => {
        const fixture = boundaryFixture(root, operation);
        let edited: ReturnType<typeof snapshotTree> | undefined;
        try {
          const result = applyReplacements(
            root,
            GUARDED_STATE,
            fixture.journal,
            fixture.staged,
            {
              before: (boundary) => {
                if (
                  boundary !==
                  (operation === "create" ? "replace:apply" : "backup:move")
                )
                  return;
                if (mutation === "target") {
                  const target = abs(root, fixture.target);
                  if (operation !== "create")
                    renameSync(target, `${target}.operator-original`);
                  write(
                    root,
                    fixture.target,
                    operation === "create"
                      ? "late user file"
                      : "original bytes",
                  );
                } else if (mutation === "ancestor-mode") {
                  chmodSync(abs(root, GUARDED_STYLES), 0o700);
                } else if (mutation === "ancestor-identity") {
                  const directory = abs(root, GUARDED_STYLES);
                  renameSync(directory, `${directory}.operator-original`);
                  mkdirSync(directory, { mode: 0o755 });
                  write(
                    root,
                    `${GUARDED_STYLES}/.operator-note`,
                    "keep hidden content",
                  );
                  if (operation !== "create")
                    write(root, fixture.target, "original bytes");
                } else {
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
            },
            undefined,
            fixture.authority,
          );
          assert.equal(result.ok, false, JSON.stringify(result));
          assert.ok(edited);
          assert.deepEqual(snapshotTree(root), edited);
          assert.equal(result.journal.operations[0].applied, false);
          const code =
            mutation === "target"
              ? "REPLACE_USER_EDIT"
              : mutation === "writer"
                ? "WRITER_LOCK_CONTRADICTED"
                : "AUTHORITY_ANCESTOR_REPLACED";
          assert.ok(
            result.issues.some((entry) => entry.code === code),
            JSON.stringify(result),
          );
        } finally {
          const released = releaseWriterLock(fixture.writer);
          assert.equal(
            released.ok,
            mutation !== "writer",
            JSON.stringify(released),
          );
        }
      });
    });
  }
}

for (const mutation of [
  "destination",
  "stage-identity",
  "stage-mode",
  "stage-parent",
] as const) {
  test(`update preserves a returning ${mutation} edit after its preimage was backed up`, () => {
    withRoot((root) => {
      const fixture = boundaryFixture(root, "update");
      let edited: ReturnType<typeof snapshotTree> | undefined;
      try {
        const result = applyReplacements(
          root,
          GUARDED_STATE,
          fixture.journal,
          fixture.staged,
          {
            before: (boundary) => {
              if (boundary !== "replace:apply") return;
              const stagedFile = abs(
                root,
                fixture.staged.records[0].stagedPath,
              );
              if (mutation === "destination")
                write(root, fixture.target, "user file after backup");
              else if (mutation === "stage-identity") {
                const bytes = readFileSync(stagedFile);
                renameSync(stagedFile, `${stagedFile}.operator-original`);
                writeFileSync(stagedFile, bytes, { mode: 0o644 });
              } else if (mutation === "stage-mode")
                chmodSync(stagedFile, 0o2644);
              else {
                const directory = abs(root, fixture.staged.stagedDirectory);
                renameSync(directory, `${directory}.operator-original`);
                mkdirSync(directory, { mode: 0o700 });
                renameSync(
                  path.join(
                    `${directory}.operator-original`,
                    path.basename(stagedFile),
                  ),
                  stagedFile,
                );
              }
              edited = snapshotTree(root);
            },
          },
          undefined,
          fixture.authority,
        );
        assert.equal(result.ok, false, JSON.stringify(result));
        assert.ok(edited);
        assert.deepEqual(snapshotTree(root), edited);
        assert.equal(result.journal.operations[0].applied, false);
        assert.equal(
          readFileSync(
            abs(
              root,
              `${backupsDir(GUARDED_STATE, fixture.journal.transactionId)}/backup-0`,
            ),
            "utf8",
          ),
          "original bytes",
        );
        const code =
          mutation === "destination"
            ? "REPLACE_USER_EDIT"
            : mutation === "stage-parent"
              ? "AUTHORITY_ANCESTOR_REPLACED"
              : "REPLACE_STAGE_CORRUPT";
        assert.ok(
          result.issues.some((entry) => entry.code === code),
          JSON.stringify(result),
        );
      } finally {
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
}

for (const operation of ["create", "update", "retire"] as const) {
  test(`${operation} reports its completed syscall even if the next hook throws`, () => {
    withRoot((root) => {
      const fixture = boundaryFixture(root, operation);
      try {
        const result = applyReplacements(
          root,
          GUARDED_STATE,
          fixture.journal,
          fixture.staged,
          {
            after: (boundary) => {
              if (
                boundary ===
                (operation === "retire" ? "backup:move" : "replace:apply")
              )
                throw new Error("fault after completed syscall");
            },
          },
          undefined,
          fixture.authority,
        );
        assert.equal(result.ok, false);
        assert.equal(result.journal.operations[0].applied, true);
        if (operation === "retire") {
          assert.throws(() => readFileSync(abs(root, fixture.target)), {
            code: "ENOENT",
          });
          assert.equal(
            readFileSync(
              abs(
                root,
                `${backupsDir(GUARDED_STATE, fixture.journal.transactionId)}/backup-0`,
              ),
              "utf8",
            ),
            "original bytes",
          );
        } else {
          assert.equal(
            readFileSync(abs(root, fixture.target), "utf8"),
            "replacement bytes",
          );
          assert.throws(
            () => readFileSync(abs(root, fixture.staged.records[0].stagedPath)),
            { code: "ENOENT" },
          );
        }
        const durable = JSON.parse(
          readFileSync(
            abs(
              root,
              journalPath(GUARDED_STATE, fixture.journal.transactionId),
            ),
            "utf8",
          ),
        );
        assert.equal(durable.operations[0].applied, false);
      } finally {
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
}

test("a copied mutation authority cannot create even a backup directory", () => {
  withRoot((root) => {
    const fixture = boundaryFixture(root, "update");
    try {
      const before = snapshotTree(root);
      const result = applyReplacements(
        root,
        GUARDED_STATE,
        fixture.journal,
        fixture.staged,
        undefined,
        undefined,
        { ...fixture.authority },
      );
      assert.equal(result.ok, false);
      assert.equal(result.issues[0].code, "MUTATION_AUTHORITY_INVALID");
      assert.deepEqual(snapshotTree(root), before);
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

test("replacement without its actual held writer has zero effects", () => {
  withRoot((root) => {
    const fixture = boundaryFixture(root, "update");
    assert.equal(releaseWriterLock(fixture.writer).ok, true);
    const before = snapshotTree(root);
    const result = applyReplacements(
      root,
      GUARDED_STATE,
      fixture.journal,
      fixture.staged,
      undefined,
      undefined,
      fixture.authority,
    );
    assert.equal(result.ok, false);
    assert.equal(result.issues[0].code, "WRITER_LOCK_NOT_HELD");
    assert.deepEqual(snapshotTree(root), before);
  });
});

test("incomplete held ancestry cannot authorize backup directory creation", () => {
  withRoot((root) => {
    const fixture = boundaryFixture(root, "update");
    try {
      const incomplete = holdMutationAuthority(root, [fixture.target]);
      const before = snapshotTree(root);
      const result = applyReplacements(
        root,
        GUARDED_STATE,
        fixture.journal,
        fixture.staged,
        undefined,
        undefined,
        incomplete,
      );
      assert.equal(result.ok, false);
      assert.equal(result.issues[0].code, "MUTATION_AUTHORITY_INVALID");
      assert.deepEqual(snapshotTree(root), before);
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

test("a corrupted staged image is refused at replacement, not installed", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "replace:apply") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        const staged = abs(root, stagedDir(GUARDED_STATE, ids[0] as string));
        for (const name of readdirSync(staged)) {
          writeFileSync(path.join(staged, name), "CORRUPTED STAGED IMAGE");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "REPLACE_STAGE_CORRUPT"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});

test("an edit at the backup boundary is refused and preserved", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const edited = "user edit after recheck";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "backup:move") {
          write(root, `${GUARDED_STYLES}/kit.css`, edited);
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "REPLACE_USER_EDIT"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      edited,
    );
  });
});
