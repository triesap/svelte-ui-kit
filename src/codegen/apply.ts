/**
 * The one guarded apply use case (S077).
 *
 * Every write command composes its complete, conflict-free plan through this
 * single boundary: recovery check, exclusive coordination, preimage
 * revalidation, same-filesystem staging, journaled replacement, lock-last
 * publication and safe cleanup. A partial or unvalidated typed object confers
 * no write authority. Pure planning stays outside this module; the apply layer
 * consumes plan data and never plans.
 */
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import { sha256Hex } from "./digest.js";
import type { ChangeOperation } from "./plan.js";
import {
  prepareJournal,
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { recoverTransaction, recoverTransactions } from "./recovery.js";
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
  readonly targets: readonly ApplyTarget[];
  readonly lock: {
    readonly bytes: Uint8Array;
    readonly preimage: TargetPreimage;
  };
}

declare const validated: unique symbol;
export type ValidatedApplyPlan = ApplyPlanInput & {
  readonly [validated]: true;
};

/**
 * Validate a complete plan. Incomplete/partial objects, unsafe or
 * out-of-root/duplicate targets, and missing preimages are refused before any
 * coordination is acquired.
 */
export function validateApplyPlan(
  input: Partial<ApplyPlanInput>,
): ModelResult<ValidatedApplyPlan> {
  const problems: ModelIssue[] = [];
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
  if (!Array.isArray(input.targets)) {
    problems.push(
      issue("PLAN_INCOMPLETE", "plan.targets must be an array", "targets"),
    );
  }
  if (!input.lock || typeof input.lock !== "object") {
    problems.push(issue("PLAN_INCOMPLETE", "plan.lock is required", "lock"));
  }
  if (problems.length > 0) return fail(problems);

  const plan = input as ApplyPlanInput;
  const roots = [plan.uiDir, plan.stylesDir, plan.layoutFile];
  const seen = new Set<string>();
  for (const target of plan.targets) {
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
  }
  if (plan.lock.bytes.byteLength === 0) {
    problems.push(
      issue("PLAN_LOCK_EMPTY", "plan.lock.bytes must not be empty", "lock"),
    );
  }
  if (plan.lock.preimage.path !== lockPath(plan.stateDir)) {
    problems.push(
      issue(
        "PLAN_PREIMAGE_MISMATCH",
        "lock preimage path must be the canonical lock",
        "lock",
      ),
    );
  }
  if (problems.length > 0) return fail(problems);
  return ok(plan as ValidatedApplyPlan);
}

export interface ApplyOutcome {
  readonly kind: TransactionOutcomeKind;
  readonly transactionId: string | null;
  readonly issues: readonly ModelIssue[];
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

/**
 * Apply one complete validated plan through the guarded boundary. Recovery is
 * checked first; a failed replacement is rolled back so the developer ends in a
 * consistent state, and the writer lock is always released.
 */
export function applyPlan(
  plan: ValidatedApplyPlan,
  hooks?: TransactionHooks,
): ApplyOutcome {
  // 1. Recovery check: finish safe cleanup, roll back uncommitted batches and
  //    refuse while any prior transaction is ambiguous.
  const recovery = recoverTransactions(plan.root, plan.stateDir, hooks);
  const refusedRecovery = recovery.filter(
    (entry) => entry.status === "refused",
  );
  if (refusedRecovery.length > 0) {
    return {
      kind: "refused",
      transactionId: null,
      issues: refusedRecovery.flatMap((entry) => entry.issues),
    };
  }

  // 2. Satisfied case: no target changes and the lock already holds the planned
  //    bytes. Nothing to do; no transaction is opened.
  const lockAbs = absOf(plan.root, lockPath(plan.stateDir));
  const lockUnchanged =
    plan.targets.length === 0 &&
    existsSync(lockAbs) &&
    sha256Hex(readFileSync(lockAbs)) === sha256Hex(plan.lock.bytes);
  if (lockUnchanged) {
    return { kind: "no_change", transactionId: null, issues: [] };
  }

  const identity = createTransactionIdentity(
    plan.rootIdentity,
    plan.planDigest,
  );
  const { transactionId } = identity;
  const acquired = acquireWriterLock(plan.root, plan.stateDir, transactionId);
  if (!acquired.ok) {
    return { kind: "refused", transactionId: null, issues: acquired.issues };
  }

  try {
    // 3. Revalidate every target and the lock preimage under coordination.
    const revalidated = revalidatePreimages(plan.root, [
      ...plan.targets.map((target) => target.preimage),
      plan.lock.preimage,
    ]);
    if (!revalidated.ok) {
      return { kind: "refused", transactionId, issues: revalidated.issues };
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
        resultDigest: sha256Hex(target.bytes),
        resultMode: target.mode,
        backupId: null,
        stagedId: null,
        applied: false,
      })),
      lock: null,
    };

    mkdirSync(absOf(plan.root, transactionDir(plan.stateDir, transactionId)), {
      recursive: true,
      mode: 0o700,
    });
    fireHooks(hooks, "before", "transaction:create", transactionId);

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
          {
            code: "APPLY_PREPARATION_FAILED",
            message: `could not persist the prepared journal: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }

    const replaced = applyReplacements(
      plan.root,
      plan.stateDir,
      prepared,
      staged.value,
      hooks,
    );
    if (!replaced.ok) {
      const recovered = recoverTransaction(
        plan.root,
        plan.stateDir,
        transactionId,
      );
      return {
        kind: "refused",
        transactionId,
        issues: [...replaced.issues, ...recovered.issues],
      };
    }

    const published = publishLock(
      plan.root,
      plan.stateDir,
      replaced.journal,
      plan.lock.bytes,
      hooks,
    );
    if (!published.ok) {
      if (published.journal.phase === "published") {
        return {
          kind: "committed_needs_cleanup",
          transactionId,
          issues: published.issues,
        };
      }
      const recovered = recoverTransaction(
        plan.root,
        plan.stateDir,
        transactionId,
      );
      return {
        kind: "refused",
        transactionId,
        issues: [...published.issues, ...recovered.issues],
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
  }
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
