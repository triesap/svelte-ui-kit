/**
 * Journaled per-file replacement (S070).
 *
 * Replacements happen in one documented order under the writer lock. An update
 * or retire first moves the existing preimage into an owned backup; a
 * create/update then atomically renames its exact staged image over the target.
 * Progress is persisted after every operation, so an interruption between
 * replacements is a detectable mixed state that recovery can roll back.
 *
 * This step deliberately does not publish the install lock: the lock is the
 * final semantic publication (S071). No native multi-file atomicity is claimed;
 * each single-file rename is the atomic unit.
 */
import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import {
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  backupsDir,
  journalPath,
  type TransactionPhase,
} from "./transaction-types.js";
import type { StagedBatch, StagedRecord } from "./stage.js";

export interface ReplacementResult {
  readonly ok: boolean;
  readonly journal: TransactionJournal;
  readonly issues: readonly ModelIssue[];
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

function stagedFor(
  staged: StagedBatch,
  target: string,
): StagedRecord | undefined {
  return staged.records.find((record) => record.path === target);
}

/**
 * Apply every planned operation in order, persisting progress after each. A
 * failure returns the partial journal (with the already-applied operations
 * marked) so the caller can recover to a consistent state.
 */
export function applyReplacements(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  staged: StagedBatch,
  hooks?: TransactionHooks,
): ReplacementResult {
  const backupsLogical = backupsDir(stateDir, journal.transactionId);
  const backupsAbs = absOf(root, backupsLogical);
  const journalLogical = journalPath(stateDir, journal.transactionId);
  let current = journal;

  try {
    mkdirSync(backupsAbs, { recursive: true, mode: 0o700 });
  } catch (error) {
    return {
      ok: false,
      journal: current,
      issues: [
        {
          code: "REPLACE_UNAVAILABLE",
          message: `could not create the owned backup directory: ${codeOf(error)}`,
        },
      ],
    };
  }

  for (const [index, operation] of current.operations.entries()) {
    if (operation.applied) continue;
    const targetAbs = absOf(root, operation.path);
    try {
      if (
        operation.operation === "update" ||
        operation.operation === "retire"
      ) {
        if (operation.backupId === null) {
          throw new Error(`operation ${operation.path} has no backup id`);
        }
        fireHooks(hooks, "before", "backup:move", operation.path);
        mkdirSync(path.dirname(targetAbs), { recursive: true });
        renameSync(targetAbs, path.join(backupsAbs, operation.backupId));
        fireHooks(hooks, "after", "backup:move", operation.path);
      }
      if (
        operation.operation === "create" ||
        operation.operation === "update"
      ) {
        const record = stagedFor(staged, operation.path);
        if (!record) {
          throw new Error(`operation ${operation.path} has no staged image`);
        }
        fireHooks(hooks, "before", "replace:apply", operation.path);
        mkdirSync(path.dirname(targetAbs), { recursive: true });
        renameSync(absOf(root, record.stagedPath), targetAbs);
        fireHooks(hooks, "after", "replace:apply", operation.path);
      }
      current = {
        ...current,
        operations: current.operations.map((candidate, candidateIndex) =>
          candidateIndex === index
            ? { ...candidate, applied: true }
            : candidate,
        ),
      };
      fireHooks(hooks, "before", "progress:persist", operation.path);
      persistJournal(root, journalLogical, current, hooks);
      fireHooks(hooks, "after", "progress:persist", operation.path);
    } catch (error) {
      return {
        ok: false,
        journal: current,
        issues: [
          {
            code: "REPLACE_FAILED",
            message: `replacement of ${operation.path} failed: ${error instanceof Error ? error.message : String(error)}`,
            locator: operation.path,
          },
        ],
      };
    }
  }

  const applied: TransactionPhase = "applied";
  current = { ...current, phase: applied };
  persistJournal(root, journalLogical, current, hooks);
  return { ok: true, journal: current, issues: [] };
}

/** Absolute path of one owned backup. */
export function backupPath(
  root: string,
  stateDir: string,
  transactionId: string,
  backupId: string,
): string {
  return absOf(root, `${backupsDir(stateDir, transactionId)}/${backupId}`);
}
