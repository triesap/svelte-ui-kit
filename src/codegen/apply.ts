/**
 * The one guarded apply use case (S077, repaired for RCLD04-R1-1/2/3).
 *
 * Every write command composes its complete, conflict-free plan through this
 * single boundary: transient-ancestry guard, exclusive coordination, recovery,
 * physical-authority and preimage revalidation, same-filesystem staging,
 * journaled replacement, lock-last publication and safe cleanup. A partial or
 * unvalidated typed object confers no write authority. Pure planning stays
 * outside this module; the apply layer consumes plan data and never plans.
 *
 * Ordering is deliberate:
 *
 * 1. The transient namespace ancestry is proven before the first write so a
 *    symlinked coordination directory cannot redirect owned state outside the
 *    project.
 * 2. The exclusive writer lock is acquired *before* recovery, so a contender
 *    can never roll back a live owner's in-flight batch; it refuses busy
 *    instead.
 * 3. Recovery, authority revalidation and replacement all run while the lock is
 *    held, so no cooperative writer can interleave.
 * 4. The physical readset (root/ancestor identities and config/manifest/lock
 *    evidence) is re-proven immediately before staging and again immediately
 *    before live replacement, so a staging-time edit is refused rather than
 *    overwritten.
 * 5. The lock is published last; a durable publication intent is persisted
 *    before the rename so a crash in the publication window is recoverable as a
 *    commit rather than an unsafe rollback.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath, pathsOverlap } from "../project/paths.js";
import {
  captureReadset,
  identityDigest,
  validateReadset,
  verifyTransientAncestry,
  type PhysicalIdentity,
  type PlanAncestor,
  type PlanReadFile,
  type PlanReadset,
} from "./authority.js";
import { sha256Hex } from "./digest.js";
import type { ChangeOperation } from "./plan.js";
import {
  prepareJournal,
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { recoverTransactions } from "./recovery.js";
import { revalidatePreimages, type TargetPreimage } from "./revalidate.js";
import { applyReplacements } from "./replace.js";
import { publishLock } from "./publish-lock.js";
import { cleanupTransaction } from "./transaction-cleanup.js";
import { stageOperations } from "./stage.js";
import { acquireWriterLock, releaseWriterLock } from "./write-lock.js";
import {
  createTransactionIdentity,
  journalPath,
  lockPath,
  transactionDir,
  transactionsDir,
  transientRoot,
  type TransactionOutcomeKind,
} from "./transaction-types.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";

export interface ApplyTarget {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  /** Exact mode to apply; for updates this should preserve the preimage mode. */
  readonly mode: number;
  readonly preimage: TargetPreimage;
}

export interface ApplyPlanInput {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly rootIdentity: string;
  readonly planDigest: string;
  readonly readset: PlanReadset;
  readonly targets: readonly ApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly preimage: TargetPreimage;
  };
}

/** A sealed target: bytes are copied and their result digest is bound. */
export interface ValidatedApplyTarget {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  readonly mode: number;
  readonly preimage: TargetPreimage;
  /** Digest of the sealed result bytes; re-proven before any write. */
  readonly resultDigest: string;
}

const validated = Symbol("ValidatedApplyPlan");

export interface ValidatedApplyPlan {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly rootIdentity: string;
  readonly planDigest: string;
  readonly readset: PlanReadset;
  readonly targets: readonly ValidatedApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly digest: string;
    readonly preimage: TargetPreimage;
  };
  readonly [validated]: true;
}

const OPERATIONS: readonly ChangeOperation[] = ["create", "update", "retire"];
const HEX64 = /^[0-9a-f]{64}$/;
const TRANSIENT_BASENAME = ".svelte-ui-kit";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Validate a complete plan and seal it. Incomplete/partial objects, unknown
 * operations, unsafe or out-of-root/duplicate/reserved targets, a canonical
 * lock posed as an ordinary target, and missing preimages are refused before
 * any coordination is acquired. The returned plan is a defensive copy with
 * copied bytes and a bound result digest, so mutating the caller's object (or
 * its typed arrays) cannot confer the old authority.
 */
export function validateApplyPlan(
  input: Partial<ApplyPlanInput>,
): ModelResult<ValidatedApplyPlan> {
  const problems: ModelIssue[] = [];
  if (!isPlainObject(input)) {
    return fail([issue("PLAN_INCOMPLETE", "plan must be an object", "plan")]);
  }
  const requiredStrings: readonly (keyof ApplyPlanInput)[] = [
    "root",
    "stateDir",
    "uiDir",
    "stylesDir",
    "layoutFile",
    "rootIdentity",
    "planDigest",
  ];
  for (const field of requiredStrings) {
    const value = input[field];
    if (typeof value !== "string" || value.length === 0) {
      problems.push(
        issue("PLAN_INCOMPLETE", `plan.${field} is required`, field),
      );
    }
  }
  if (!HEX64.test(String(input.rootIdentity))) {
    problems.push(
      issue(
        "PLAN_INCOMPLETE",
        "plan.rootIdentity must be a 64-hex digest",
        "rootIdentity",
      ),
    );
  }
  if (!HEX64.test(String(input.planDigest))) {
    problems.push(
      issue(
        "PLAN_INCOMPLETE",
        "plan.planDigest must be a 64-hex digest",
        "planDigest",
      ),
    );
  }
  problems.push(...validateReadset(input.readset));
  if (!Array.isArray(input.targets)) {
    problems.push(
      issue("PLAN_INCOMPLETE", "plan.targets must be an array", "targets"),
    );
  }
  if (
    !isPlainObject(input.lock) ||
    !(input.lock as { bytes?: unknown }).bytes
  ) {
    problems.push(issue("PLAN_INCOMPLETE", "plan.lock is required", "lock"));
  }
  if (problems.length > 0) return fail(problems);

  const plan = input as ApplyPlanInput;
  const canonicalLock = lockPath(plan.stateDir);
  const roots = [plan.uiDir, plan.stylesDir, plan.layoutFile];
  const seen = new Set<string>();
  const sealedTargets: ValidatedApplyTarget[] = [];
  const lockBytesView = plan.lock.bytes;
  if (
    !(lockBytesView instanceof Uint8Array) ||
    lockBytesView.byteLength === 0
  ) {
    problems.push(
      issue("PLAN_LOCK_EMPTY", "plan.lock.bytes must not be empty", "lock"),
    );
  }
  for (const target of plan.targets) {
    if (!isPlainObject(target)) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          "each target must be an object",
          "targets",
        ),
      );
      continue;
    }
    if (!isSafeLogicalRelativePath(target.path)) {
      problems.push(
        issue(
          "PLAN_TARGET_UNSAFE",
          `unsafe target ${target.path}`,
          target.path,
        ),
      );
      continue;
    }
    if (!OPERATIONS.includes(target.operation)) {
      problems.push(
        issue(
          "PLAN_OPERATION_UNKNOWN",
          `target ${target.path} has an unknown operation ${String(target.operation)}`,
          target.path,
        ),
      );
      continue;
    }
    if (!(target.bytes instanceof Uint8Array)) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          `target ${target.path} must carry bytes`,
          target.path,
        ),
      );
      continue;
    }
    if (
      !Number.isInteger(target.mode) ||
      target.mode < 0 ||
      target.mode > 0o777
    ) {
      problems.push(
        issue(
          "PLAN_TARGET_INVALID",
          `target ${target.path} has an invalid mode`,
          target.path,
        ),
      );
      continue;
    }
    if (pathsOverlap(target.path, `${plan.stateDir}/${TRANSIENT_BASENAME}`)) {
      problems.push(
        issue(
          "PLAN_TARGET_RESERVED",
          `target ${target.path} overlaps the reserved transient namespace`,
          target.path,
        ),
      );
      continue;
    }
    if (target.path.toLowerCase() === canonicalLock.toLowerCase()) {
      problems.push(
        issue(
          "PLAN_LOCK_TARGET",
          "the canonical lock is exclusively final publication and cannot be an ordinary target",
          target.path,
        ),
      );
      continue;
    }
    const within =
      target.path === plan.layoutFile ||
      roots.some(
        (root) =>
          target.path === root.replace(/\/+$/, "") ||
          target.path.startsWith(`${root.replace(/\/+$/, "")}/`),
      );
    if (!within) {
      problems.push(
        issue(
          "PLAN_TARGET_UNAPPROVED",
          `target ${target.path} is outside the approved roots`,
          target.path,
        ),
      );
    }
    const folded = target.path.toLowerCase();
    if (seen.has(folded)) {
      problems.push(
        issue(
          "PLAN_TARGET_DUPLICATE",
          `duplicate target ${target.path}`,
          target.path,
        ),
      );
    }
    seen.add(folded);
    if (!isPlainObject(target.preimage)) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `target ${target.path} must carry a preimage`,
          target.path,
        ),
      );
      continue;
    }
    if (target.preimage.path !== target.path) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `preimage path does not match ${target.path}`,
          target.path,
        ),
      );
    }
    if (target.operation === "retire" && target.bytes.byteLength !== 0) {
      problems.push(
        issue(
          "PLAN_RETIRE_BYTES",
          `retire target ${target.path} must carry no bytes`,
          target.path,
        ),
      );
    }
    if (target.operation === "create" && target.preimage.kind !== "absent") {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `create target ${target.path} must have an absent preimage`,
          target.path,
        ),
      );
    }
    if (target.operation !== "create" && target.preimage.kind !== "file") {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `${target.operation} target ${target.path} must have a file preimage`,
          target.path,
        ),
      );
    }
    if (
      target.preimage.kind === "file" &&
      (typeof target.preimage.digest !== "string" ||
        !HEX64.test(target.preimage.digest))
    ) {
      problems.push(
        issue(
          "PLAN_PREIMAGE_MISMATCH",
          `target ${target.path} preimage digest is invalid`,
          target.path,
        ),
      );
    }
    sealedTargets.push(
      Object.freeze({
        path: target.path,
        operation: target.operation,
        bytes: new Uint8Array(target.bytes),
        mode: target.mode,
        preimage: Object.freeze({ ...target.preimage }),
        resultDigest: sha256Hex(target.bytes),
      }),
    );
  }
  if (plan.lock.preimage.path !== canonicalLock) {
    problems.push(
      issue(
        "PLAN_PREIMAGE_MISMATCH",
        "lock preimage path must be the canonical lock",
        "lock",
      ),
    );
  }
  if (problems.length > 0) return fail(problems);

  const sealed: ValidatedApplyPlan = {
    root: plan.root,
    stateDir: plan.stateDir,
    uiDir: plan.uiDir,
    stylesDir: plan.stylesDir,
    layoutFile: plan.layoutFile,
    rootIdentity: plan.rootIdentity,
    planDigest: plan.planDigest,
    readset: Object.freeze({
      root: Object.freeze({ ...plan.readset.root }),
      ancestors: Object.freeze(
        plan.readset.ancestors.map((ancestor) =>
          Object.freeze({ ...ancestor }),
        ),
      ),
      files: Object.freeze(
        plan.readset.files.map((file) => Object.freeze({ ...file })),
      ),
    }),
    targets: Object.freeze(sealedTargets),
    lock: Object.freeze({
      bytes: new Uint8Array(plan.lock.bytes),
      digest: sha256Hex(plan.lock.bytes),
      preimage: Object.freeze({ ...plan.lock.preimage }),
    }),
    [validated]: true,
  };
  return ok(Object.freeze(sealed) as ValidatedApplyPlan);
}

/** Convenience: a readset for a caller that already knows its targets. */
export function readsetFor(
  root: string,
  targetPaths: readonly string[],
  readFiles: readonly string[] = [],
): ModelResult<PlanReadset> {
  return captureReadset(root, targetPaths, readFiles);
}

export interface ApplyOutcome {
  readonly kind: TransactionOutcomeKind;
  readonly transactionId: string | null;
  readonly issues: readonly ModelIssue[];
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

/** True when every sealed target's bytes still match their bound digest. */
function verifySealedTargets(plan: ValidatedApplyPlan): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const target of plan.targets) {
    if (sha256Hex(target.bytes) !== target.resultDigest) {
      issues.push(
        issue(
          "PLAN_AUTHORITY_STALE",
          `sealed bytes for ${target.path} changed after validation`,
          target.path,
        ),
      );
    }
    if (sha256Hex(plan.lock.bytes) !== plan.lock.digest) {
      issues.push(
        issue(
          "PLAN_AUTHORITY_STALE",
          "sealed lock bytes changed after validation",
          lockPath(plan.stateDir),
        ),
      );
    }
  }
  return issues;
}

/**
 * Apply one complete validated plan through the guarded boundary. The writer
 * lock is acquired before recovery and held across every stage; a failed
 * replacement is rolled back so the developer ends in a consistent state, and
 * the writer lock is always released.
 */
export function applyPlan(
  plan: ValidatedApplyPlan,
  hooks?: TransactionHooks,
): ApplyOutcome {
  const sealedIssues = verifySealedTargets(plan);
  if (sealedIssues.length > 0) {
    return { kind: "refused", transactionId: null, issues: sealedIssues };
  }

  // 0. Guard the transient namespace ancestry before the first write.
  const ancestry = verifyTransientAncestry(plan.root, plan.stateDir);
  if (ancestry.length > 0) {
    return { kind: "refused", transactionId: null, issues: ancestry };
  }

  const identity = createTransactionIdentity(
    plan.rootIdentity,
    plan.planDigest,
  );
  const { transactionId } = identity;

  // 1. Acquire exclusive coordination before recovery. A contender never
  //    recovers a live owner's in-flight batch; it fails busy.
  const acquired = acquireWriterLock(plan.root, plan.stateDir, transactionId);
  if (!acquired.ok) {
    return { kind: "refused", transactionId: null, issues: acquired.issues };
  }

  try {
    // 2. Recovery runs under the lock and validates every recovery input
    //    against the approved mapping before any mutation.
    const recovery = recoverTransactions(
      plan.root,
      plan.stateDir,
      {
        uiDir: plan.uiDir,
        stylesDir: plan.stylesDir,
        layoutFile: plan.layoutFile,
      },
      hooks,
    );
    const refusedRecovery = recovery.filter(
      (entry) => entry.status === "refused",
    );
    if (refusedRecovery.length > 0) {
      return {
        kind: "refused",
        transactionId,
        issues: refusedRecovery.flatMap((entry) => entry.issues),
      };
    }

    // 3. Physical authority and preimage revalidation under coordination.
    const revalidated = revalidatePreimages(
      plan.root,
      [...plan.targets.map((target) => target.preimage), plan.lock.preimage],
      {
        root: plan.readset.root,
        ancestors: plan.readset.ancestors,
        files: plan.readset.files,
      },
    );
    if (!revalidated.ok) {
      return { kind: "refused", transactionId, issues: revalidated.issues };
    }

    // 4. Satisfied case: no target changes and the lock already holds the
    //    planned bytes. Nothing to do; no transaction is opened.
    const lockAbs = absOf(plan.root, lockPath(plan.stateDir));
    const lockUnchanged =
      plan.targets.length === 0 &&
      existsSync(lockAbs) &&
      sha256Hex(readFileSync(lockAbs)) === plan.lock.digest;
    if (lockUnchanged) {
      return { kind: "no_change", transactionId: null, issues: [] };
    }

    const journal: TransactionJournal = {
      schemaVersion: 1,
      transactionId,
      rootIdentity: plan.rootIdentity,
      planDigest: plan.planDigest,
      phase: "planned",
      operations: plan.targets.map((target) => ({
        path: target.path,
        operation: target.operation,
        preimage: {
          kind: target.preimage.kind,
          digest: target.preimage.digest,
          mode: target.preimage.mode,
        },
        resultDigest: target.resultDigest,
        resultMode: target.mode,
        backupId: null,
        stagedId: null,
        applied: false,
      })),
      lock: null,
    };

    // 5. Setup: a failure here is typed and cleans only the owned directory.
    try {
      mkdirSync(
        absOf(plan.root, transactionDir(plan.stateDir, transactionId)),
        {
          recursive: true,
          mode: 0o700,
        },
      );
      fireHooks(hooks, "before", "transaction:create", transactionId);
    } catch (error) {
      removeTransaction(plan, transactionId);
      return {
        kind: "refused",
        transactionId,
        issues: [
          issue(
            "APPLY_SETUP_FAILED",
            `could not create the owned transaction directory: ${error instanceof Error ? error.message : String(error)}`,
          ),
        ],
      };
    }

    const staged = stageOperations(
      plan.root,
      plan.stateDir,
      transactionId,
      plan.targets.map((target) => ({
        path: target.path,
        operation: target.operation,
        bytes: target.bytes,
        mode: target.mode,
      })),
      hooks,
    );
    if (!staged.ok) {
      removeTransaction(plan, transactionId);
      return { kind: "refused", transactionId, issues: staged.issues };
    }

    const prepared = prepareJournal(journal, staged.value.records);
    try {
      persistJournal(
        plan.root,
        journalPath(plan.stateDir, transactionId),
        prepared,
        hooks,
      );
    } catch (error) {
      removeTransaction(plan, transactionId);
      return {
        kind: "refused",
        transactionId,
        issues: [
          issue(
            "APPLY_PREPARATION_FAILED",
            `could not persist the prepared journal: ${error instanceof Error ? error.message : String(error)}`,
          ),
        ],
      };
    }

    // 6. Re-prove the physical authority and preimages after staging but before
    //    any live replacement, so an edit made during staging is refused rather
    //    than overwritten.
    const rechecked = revalidatePreimages(
      plan.root,
      [...plan.targets.map((target) => target.preimage), plan.lock.preimage],
      {
        root: plan.readset.root,
        ancestors: plan.readset.ancestors,
        files: plan.readset.files,
      },
    );
    if (!rechecked.ok) {
      removeTransaction(plan, transactionId);
      return { kind: "refused", transactionId, issues: rechecked.issues };
    }

    const replaced = applyReplacements(
      plan.root,
      plan.stateDir,
      prepared,
      staged.value,
      hooks,
    );
    if (!replaced.ok) {
      const recovered = recoverTransactionsUnderLock(
        plan,
        transactionId,
        hooks,
      );
      return {
        kind: "refused",
        transactionId,
        issues: [...replaced.issues, ...recovered],
      };
    }

    const published = publishLock(
      plan.root,
      plan.stateDir,
      replaced.journal,
      plan.lock.bytes,
      plan.lock.preimage.mode ?? 0o644,
      hooks,
    );
    if (!published.ok) {
      if (
        published.journal.phase === "published" ||
        publicationCommitted(plan, published.journal)
      ) {
        return {
          kind: "committed_needs_cleanup",
          transactionId,
          issues: published.issues,
        };
      }
      const recovered = recoverTransactionsUnderLock(
        plan,
        transactionId,
        hooks,
      );
      return {
        kind: "refused",
        transactionId,
        issues: [...published.issues, ...recovered],
      };
    }

    const cleanup = cleanupTransaction(
      plan.root,
      plan.stateDir,
      published.journal,
      hooks,
    );
    if (!cleanup.ok) {
      return {
        kind: "committed_needs_cleanup",
        transactionId,
        issues: cleanup.issues,
      };
    }
    return { kind: "applied", transactionId, issues: [] };
  } finally {
    releaseWriterLock(acquired.value);
    cleanupEmptyTransient(plan);
  }
}

/**
 * True when the canonical lock already holds the planned publication bytes for
 * a journal that reached `applied`. This is the durable publication-intent
 * classification used when the published record could not be persisted.
 */
function publicationCommitted(
  plan: ValidatedApplyPlan,
  journal: TransactionJournal,
): boolean {
  if (journal.phase !== "applied") return false;
  if (journal.lock === null || journal.lock.published) return false;
  try {
    return (
      sha256Hex(readFileSync(absOf(plan.root, lockPath(plan.stateDir)))) ===
      journal.lock.digest
    );
  } catch {
    return false;
  }
}

function recoverTransactionsUnderLock(
  plan: ValidatedApplyPlan,
  transactionId: string,
  hooks?: TransactionHooks,
): ModelIssue[] {
  const recovered = recoverTransactions(
    plan.root,
    plan.stateDir,
    {
      uiDir: plan.uiDir,
      stylesDir: plan.stylesDir,
      layoutFile: plan.layoutFile,
    },
    hooks,
  );
  return recovered.flatMap((entry) => entry.issues);
}

function removeTransaction(
  plan: ValidatedApplyPlan,
  transactionId: string,
): void {
  rmSync(absOf(plan.root, transactionDir(plan.stateDir, transactionId)), {
    recursive: true,
    force: true,
  });
}

/**
 * Best-effort removal of empty owned transient directories after release, so a
 * fresh initialization that only created transient state does not leave hidden
 * residue. Only empty directories are removed; unexpected entries survive.
 */
function cleanupEmptyTransient(plan: ValidatedApplyPlan): void {
  for (const logical of [
    transactionsDir(plan.stateDir),
    transientRoot(plan.stateDir),
  ]) {
    try {
      rmdirSync(absOf(plan.root, logical));
    } catch {
      // Non-empty or already removed; unrelated state is never touched.
    }
  }
}

// Kept for import stability with the sealed-authority readers.
export type { PlanAncestor, PlanReadFile, PhysicalIdentity };
export { identityDigest };
