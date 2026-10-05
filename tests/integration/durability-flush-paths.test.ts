import assert from "node:assert/strict";
import fs from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type {
  ApplyPlanInput,
  ApplyTarget,
  ValidatedApplyPlan,
} from "../../src/codegen/apply.js";
import { captureReadset } from "../../src/codegen/authority.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import { persistJournal } from "../../src/codegen/transaction-journal.js";
import {
  journalPath,
  lockPath,
  transientRoot,
} from "../../src/codegen/transaction-types.js";
import {
  recoverTransaction,
  recoverTransactions,
} from "../../src/codegen/recovery.js";
import {
  GUARDED_STATE,
  GUARDED_STYLES,
  abs,
  makeGuardedPlan,
  lockJson,
  write,
} from "../helpers/guarded-plan.js";
import { RECOVERY_ROOTS, liveRootIdentity } from "../helpers/transactions.js";

/**
 * RCLD04-R2-2: causal durability coverage for cross-directory renames.
 *
 * Hook ordering alone does not prove which directories were actually flushed.
 * This test instruments the real `fsync` syscalls and asserts that every
 * cross-directory rename flushes *both* affected parent directories, and that
 * the staged publication lock's parent is flushed during lock staging.
 */

function sealed(plan: unknown): ValidatedApplyPlan {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

interface Flush {
  readonly boundary: string;
  readonly target: string;
}

interface FlushProbe {
  readonly flushes: Flush[];
  setBoundary(value: string): void;
  restore(): void;
}

function recordFlushes(
  failWhen?: (target: string, boundary: string) => boolean,
): FlushProbe {
  let boundary = "setup";
  const fdPaths = new Map<number, string>();
  const flushes: Flush[] = [];
  const originalOpen = fs.openSync.bind(fs);
  const originalClose = fs.closeSync.bind(fs);
  const originalFsync = fs.fsyncSync.bind(fs);
  fs.openSync = ((p: fs.PathLike, ...rest: never[]) => {
    const fd = (originalOpen as (p: fs.PathLike, ...rest: never[]) => number)(
      p,
      ...rest,
    );
    fdPaths.set(fd, String(p));
    return fd;
  }) as typeof fs.openSync;
  fs.closeSync = ((fd: number) => {
    fdPaths.delete(fd);
    return originalClose(fd);
  }) as typeof fs.closeSync;
  fs.fsyncSync = ((fd: number) => {
    const target = fdPaths.get(fd);
    if (target !== undefined) {
      if (failWhen?.(target, boundary)) {
        const error = new Error(
          "injected fsync failure",
        ) as NodeJS.ErrnoException;
        error.code = "EIO";
        throw error;
      }
      flushes.push({ boundary, target });
    }
    return originalFsync(fd);
  }) as typeof fs.fsyncSync;
  syncBuiltinESMExports();
  return {
    flushes,
    setBoundary: (value) => {
      boundary = value;
    },
    restore: () => {
      fs.openSync = originalOpen;
      fs.closeSync = originalClose;
      fs.fsyncSync = originalFsync;
      syncBuiltinESMExports();
    },
  };
}

test("cross-directory renames flush both affected parents and the staged lock parent", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-paths-"));
  const probe = recordFlushes();
  try {
    const outcome = applyPlan(sealed(makeGuardedPlan(root)), {
      before: (value) => probe.setBoundary(`before:${value}`),
      after: (value) => probe.setBoundary(`after:${value}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

    const flushed = (boundary: string, suffix: string): boolean =>
      probe.flushes.some(
        (entry) =>
          entry.boundary === boundary &&
          entry.target.split(path.sep).join("/").endsWith(suffix),
      );

    // Backup move: the backups directory gained the preimage and the target's
    // parent lost it.
    assert.ok(
      flushed("before:durability:backup", "/backups"),
      `backup parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:backup", `/${GUARDED_STYLES}`),
      `backup source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    // Replacement: the staged directory lost the image and the target's parent
    // gained it.
    assert.ok(
      flushed("before:durability:replace", "/staged"),
      `replacement source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:replace", `/${GUARDED_STATE}`) ||
        flushed("before:durability:replace", `/${GUARDED_STYLES}`),
      `replacement destination parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    // Lock staging: the staged lock's parent must be flushed while the staged
    // image is made durable, before the publication intent records it.
    assert.ok(
      flushed("before:durability:lock-stage", "/staged"),
      `staged lock parent not flushed before intent: ${JSON.stringify(probe.flushes)}`,
    );
    // Lock publication: the canonical and staged directories are both flushed.
    assert.ok(
      flushed("before:durability:lock-publish", `/${GUARDED_STATE}`),
      `canonical parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      flushed("before:durability:lock-publish", "/staged"),
      `publication source parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/** A plan whose generated mapping and state directory do not exist yet. */
function absentAncestryPlan(root: string): ApplyPlanInput {
  const uiDir = "app/ui";
  const stylesDir = "app/styles";
  const layoutFile = "app/routes/+layout.svelte";
  const stateDir = `${uiDir}/_kit`;
  const targets: ApplyTarget[] = [
    {
      path: `${uiDir}/button.svelte`,
      operation: "create",
      bytes: new TextEncoder().encode("<button />\n"),
      mode: 0o644,
      preimage: capturePreimage(root, `${uiDir}/button.svelte`),
    },
  ];
  const readset = captureReadset(
    root,
    [...targets.map((target) => target.path), lockPath(stateDir)],
    [],
  );
  if (!readset.ok) throw new Error("readset capture failed");
  return {
    root,
    stateDir,
    uiDir,
    stylesDir,
    layoutFile,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets,
    lock: {
      bytes: lockJson("d".repeat(64)),
      preimage: capturePreimage(root, lockPath(stateDir)),
    },
  };
}

test("newly created ancestry and cleanup/release removals are flushed in their parents", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-owned-"));
  const probe = recordFlushes();
  try {
    const outcome = applyPlan(sealed(absentAncestryPlan(root)), {
      before: (value) => probe.setBoundary(`before:${value}`),
      after: (value) => probe.setBoundary(`after:${value}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));

    const flushed = (boundary: string, suffix: string): boolean =>
      probe.flushes.some(
        (entry) =>
          entry.boundary === boundary &&
          entry.target.split(path.sep).join("/").endsWith(suffix),
      );
    // Each newly created coordination directory flushes its parent.
    assert.ok(
      flushed("before:durability:owned-create", "/app") ||
        flushed("before:durability:owned-create", "app"),
      `owned create parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    // Cleanup removals flush the containing directory, and the final release
    // flushes the transient namespace.
    assert.ok(
      probe.flushes.some(
        (entry) => entry.boundary === "before:durability:cleanup",
      ),
      `cleanup parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
    assert.ok(
      probe.flushes.some(
        (entry) =>
          entry.boundary === "before:durability:release" &&
          entry.target.split(path.sep).join("/").endsWith("/.svelte-ui-kit"),
      ),
      `release parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("an actual fsync failure during cleanup is reported as needs-cleanup", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-eio-"));
  const probe = recordFlushes(
    (_target, boundary) => boundary === "before:durability:cleanup",
  );
  try {
    const outcome = applyPlan(sealed(absentAncestryPlan(root)), {
      before: (value) => probe.setBoundary(`before:${value}`),
      after: (value) => probe.setBoundary(`after:${value}`),
    });
    // The lock published but the owned cleanup flush failed with a real EIO:
    // the outcome must be truthful, not a false success, and evidence remains.
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.ok(
      fs.existsSync(path.join(root, "app/ui/_kit/.svelte-ui-kit/transactions")),
      "transaction evidence must be retained after a cleanup durability failure",
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("a refused batch flushes the parent of each removed owned ancestor", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-remove-"));
  const probe = recordFlushes();
  try {
    const outcome = applyPlan(sealed(absentAncestryPlan(root)), {
      before: (value) => {
        probe.setBoundary(`before:${value}`);
        if (value === "replace:apply") {
          throw new Error("review interruption");
        }
      },
      after: (value) => probe.setBoundary(`after:${value}`),
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      probe.flushes.some(
        (entry) => entry.boundary === "before:durability:owned-remove",
      ),
      `owned removal parent not flushed: ${JSON.stringify(probe.flushes)}`,
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

/**
 * Fail the first real `fsync` whose opened target satisfies `predicate`, then
 * stop failing. Unlike the hook-driven `recordFlushes` probe this drives a
 * genuine syscall fault on a path with no protocol hook (the post-release
 * empty-namespace cleanup), so the propagation is verified causally.
 */
function failFsyncWhile(predicate: (target: string) => boolean): {
  fired(): boolean;
  restore(): void;
} {
  let fired = false;
  const fdPaths = new Map<number, string>();
  const originalOpen = fs.openSync.bind(fs);
  const originalClose = fs.closeSync.bind(fs);
  const originalFsync = fs.fsyncSync.bind(fs);
  fs.openSync = ((p: fs.PathLike, ...rest: never[]) => {
    const fd = (originalOpen as (p: fs.PathLike, ...rest: never[]) => number)(
      p,
      ...rest,
    );
    fdPaths.set(fd, String(p));
    return fd;
  }) as typeof fs.openSync;
  fs.closeSync = ((fd: number) => {
    fdPaths.delete(fd);
    return originalClose(fd);
  }) as typeof fs.closeSync;
  fs.fsyncSync = ((fd: number) => {
    const target = fdPaths.get(fd);
    if (!fired && target !== undefined && predicate(target)) {
      fired = true;
      throw Object.assign(new Error("injected post-release fsync EIO"), {
        code: "EIO",
      });
    }
    return originalFsync(fd);
  }) as typeof fs.fsyncSync;
  syncBuiltinESMExports();
  return {
    fired: () => fired,
    restore: () => {
      fs.openSync = originalOpen;
      fs.closeSync = originalClose;
      fs.fsyncSync = originalFsync;
      syncBuiltinESMExports();
    },
  };
}

/** True when the post-release empty `.svelte-ui-kit` namespace is gone. */
function transientGone(root: string): boolean {
  return !fs.existsSync(abs(root, `${GUARDED_STATE}/.svelte-ui-kit`));
}

test("applyPlan reports committed_needs_cleanup when the post-release flush fails", () => {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "suik-flush-postrelease-"),
  );
  const probe = failFsyncWhile(
    (target) => target === abs(root, GUARDED_STATE) && transientGone(root),
  );
  try {
    const outcome = applyPlan(sealed(makeGuardedPlan(root)));
    assert.equal(probe.fired(), true, "the post-release flush must be reached");
    // The batch committed; a cleanup durability failure must never roll back or
    // falsely report a clean success.
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.ok(
      outcome.issues.some((entry) => entry.code === "COMMITTED_NEEDS_CLEANUP"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      fs.readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

for (const [label, recover] of [
  [
    "recoverTransaction",
    (root: string) =>
      [
        recoverTransaction(
          root,
          GUARDED_STATE,
          "44444444-4444-4444-8444-444444444444",
          RECOVERY_ROOTS,
        ),
      ] as const,
  ],
  [
    "recoverTransactions",
    (root: string) => recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS),
  ],
] as const) {
  test(`${label} exposes a post-release transient flush failure truthfully`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-flush-recover-"));
    const applied = applyPlan(sealed(makeGuardedPlan(root)));
    assert.equal(applied.kind, "applied", JSON.stringify(applied.issues));
    const probe = failFsyncWhile(
      (target) => target === abs(root, GUARDED_STATE) && transientGone(root),
    );
    try {
      const results = recover(root);
      assert.equal(
        probe.fired(),
        true,
        `${label}: the post-release flush must be reached`,
      );
      const refused = results.filter((entry) => entry.status === "refused");
      assert.ok(
        refused.length > 0,
        `${label}: the cleanup failure must not be reported as clean: ${JSON.stringify(results)}`,
      );
      assert.ok(
        refused.some((entry) =>
          entry.issues.some(
            (issue) => issue.code === "RECOVERY_CLEANUP_FAILED",
          ),
        ),
        JSON.stringify(results),
      );
    } finally {
      probe.restore();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

/**
 * Fail the first real `rmdir` of an owned empty namespace directory with EIO,
 * then stop failing. Unlike a hook exception this drives a genuine syscall
 * fault on the post-release cleanup path, whose removal errors were previously
 * swallowed as though the directory were simply absent or non-empty.
 */
function failRmdirWhile(predicate: (target: string) => boolean): {
  fired(): boolean;
  restore(): void;
} {
  let fired = false;
  const original = fs.rmdirSync.bind(fs);
  fs.rmdirSync = ((p: fs.PathLike, ...rest: never[]) => {
    const target = String(p);
    if (!fired && predicate(target)) {
      fired = true;
      throw Object.assign(new Error("injected owned namespace rmdir EIO"), {
        code: "EIO",
      });
    }
    return (original as (p: fs.PathLike, ...rest: never[]) => void)(p, ...rest);
  }) as typeof fs.rmdirSync;
  syncBuiltinESMExports();
  return {
    fired: () => fired,
    restore: () => {
      fs.rmdirSync = original;
      syncBuiltinESMExports();
    },
  };
}

/** The owned transaction namespace removed by the post-release cleanup tail. */
function transactionsNamespace(root: string): string {
  return abs(root, `${GUARDED_STATE}/.svelte-ui-kit/transactions`);
}

/** A journal-only planned transaction is the minimal owned residue. */
function persistPlannedOnly(root: string, transactionId: string): void {
  write(root, `${GUARDED_STATE}/kit.json`, "old config");
  persistJournal(root, journalPath(GUARDED_STATE, transactionId), {
    schemaVersion: 1,
    transactionId,
    rootIdentity: liveRootIdentity(root),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [],
    lock: null,
  });
}

test("applyPlan reports committed_needs_cleanup when the owned namespace removal fails", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-rmdir-apply-"));
  const probe = failRmdirWhile(
    (target) => target === transactionsNamespace(root),
  );
  try {
    const outcome = applyPlan(sealed(makeGuardedPlan(root)));
    assert.equal(probe.fired(), true, "the namespace removal must be reached");
    // The lock published; a real removal I/O fault must never be reported as a
    // clean success or roll the committed batch back.
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.ok(
      outcome.issues.some((entry) => entry.code === "COMMITTED_NEEDS_CLEANUP"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      fs.readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
    assert.ok(
      fs.existsSync(transactionsNamespace(root)),
      "the owned namespace residue must be retained as restart evidence",
    );
  } finally {
    probe.restore();
    fs.rmSync(root, { recursive: true, force: true });
  }
});

for (const [label, recover] of [
  [
    "recoverTransaction",
    (root: string) =>
      [
        recoverTransaction(
          root,
          GUARDED_STATE,
          "44444444-4444-4444-8444-444444444444",
          RECOVERY_ROOTS,
        ),
      ] as const,
  ],
  [
    "recoverTransactions",
    (root: string) => recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS),
  ],
] as const) {
  test(`${label} refuses truthfully when the owned namespace removal fails`, () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-rmdir-recover-"));
    persistPlannedOnly(root, "44444444-4444-4444-8444-444444444444");
    const probe = failRmdirWhile(
      (target) => target === transactionsNamespace(root),
    );
    try {
      const results = recover(root);
      assert.equal(
        probe.fired(),
        true,
        `${label}: the namespace removal must be reached`,
      );
      const refused = results.filter((entry) => entry.status === "refused");
      assert.ok(
        refused.length > 0,
        `${label}: a real removal fault must not be reported as clean: ${JSON.stringify(results)}`,
      );
      assert.ok(
        refused.some((entry) =>
          entry.issues.some(
            (issue) => issue.code === "RECOVERY_CLEANUP_FAILED",
          ),
        ),
        JSON.stringify(results),
      );
      assert.ok(
        fs.existsSync(transactionsNamespace(root)),
        `${label}: the owned namespace residue must be retained`,
      );
    } finally {
      probe.restore();
      fs.rmSync(root, { recursive: true, force: true });
    }
  });
}

test("an unrelated entry in the transient namespace is preserved and not an error", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "suik-rmdir-control-"));
  try {
    makeGuardedPlan(root);
    // A non-empty owned transient namespace is a legitimate ENOTEMPTY outcome,
    // not a cleanup failure: unrelated state survives and the batch is clean.
    const notes = abs(root, `${transientRoot(GUARDED_STATE)}/notes.txt`);
    fs.mkdirSync(path.dirname(notes), { recursive: true });
    fs.writeFileSync(notes, "operator notes");
    const outcome = applyPlan(sealed(makeGuardedPlan(root)));
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.equal(fs.readFileSync(notes, "utf8"), "operator notes");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
