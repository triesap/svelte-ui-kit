/**
 * Journaled per-file replacement (S070, repaired for RCLD04-R2-2).
 *
 * Replacements happen in one documented order under the writer lock. An update
 * or retire first moves the existing preimage into an owned backup; a
 * create/update then atomically renames its exact staged image over the target.
 * Progress is persisted after every operation, so an interruption between
 * replacements is a detectable mixed state that recovery can roll back.
 *
 * Two live-boundary rechecks bracket every operation: immediately before a
 * target is moved to its backup the current bytes/mode are re-proven against
 * the planned preimage, and immediately before the staged image is renamed
 * into place its exact bytes/mode are re-proven against the recorded digest.
 * An observable intervening edit or a corrupted staged image therefore refuses
 * rather than being overwritten and silently reported as applied.
 *
 * This step deliberately does not publish the install lock: the lock is the
 * final semantic publication (S071). No native multi-file atomicity is claimed;
 * each single-file rename is the atomic unit.
 */
import { mkdirSync, readFileSync, renameSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { sha256Hex } from "./digest.js";
import { observeTarget } from "./revalidate.js";
import {
  persistJournal,
  type JournalOperationRecord,
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

/** A typed refusal that carries a stable boundary code. */
class ReplaceRefusal extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
  }
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

/** Re-prove the exact staged bytes and mode, or describe the drift. */
function stagedDrift(root: string, record: StagedRecord): string | null {
  const abs = absOf(root, record.stagedPath);
  const entry = observeEntry(abs);
  if (entry.kind === "absent") return "its staged image disappeared";
  if (entry.kind === "unreadable") {
    return `its staged image is unreadable (${entry.code})`;
  }
  if (entry.kind !== "file") {
    return `its staged image is not a regular file (${entry.kind})`;
  }
  let digest: string;
  try {
    digest = sha256Hex(readFileSync(abs));
  } catch (error) {
    return `its staged image is unreadable (${codeOf(error)})`;
  }
  if (digest !== record.digest) return "its staged bytes changed";
  if ((entry.stats.mode & 0o777) !== record.mode) {
    return "its staged mode changed";
  }
  return null;
}

/**
 * Re-prove the current target against the planned preimage at the replacement
 * boundary. A create must still be absent; an update/retire must still carry
 * the exact preimage bytes and mode.
 */
function preimageDrift(
  root: string,
  operation: JournalOperationRecord,
): string | null {
  const current = observeTarget(root, operation.path);
  if (operation.operation === "create") {
    if (current.kind !== "absent") {
      return `the target appeared as ${current.kind} after planning`;
    }
    return null;
  }
  if (current.kind === "absent") return "the target disappeared after planning";
  if (current.kind === "unsafe") {
    return `the target became unsafe (${current.reason})`;
  }
  if (
    operation.preimage.digest === null ||
    current.digest !== operation.preimage.digest
  ) {
    return "the target bytes changed after planning";
  }
  if (
    operation.preimage.mode !== null &&
    current.mode !== operation.preimage.mode
  ) {
    return "the target mode changed after planning";
  }
  return null;
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
          throw new ReplaceRefusal(
            "REPLACE_FAILED",
            `operation ${operation.path} has no backup id`,
          );
        }
        fireHooks(hooks, "before", "backup:move", operation.path);
        const drifted = preimageDrift(root, operation);
        if (drifted !== null) {
          throw new ReplaceRefusal(
            "REPLACE_USER_EDIT",
            `refusing to replace ${operation.path}: ${drifted}`,
          );
        }
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
          throw new ReplaceRefusal(
            "REPLACE_FAILED",
            `operation ${operation.path} has no staged image`,
          );
        }
        fireHooks(hooks, "before", "replace:apply", operation.path);
        const corrupt = stagedDrift(root, record);
        if (corrupt !== null) {
          throw new ReplaceRefusal(
            "REPLACE_STAGE_CORRUPT",
            `refusing to install ${operation.path}: ${corrupt}`,
          );
        }
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
      if (error instanceof ReplaceRefusal) {
        return {
          ok: false,
          journal: current,
          issues: [
            {
              code: error.code,
              message: error.message,
              locator: operation.path,
            },
          ],
        };
      }
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
  try {
    persistJournal(root, journalLogical, current, hooks);
  } catch (error) {
    return {
      ok: false,
      journal: current,
      issues: [
        {
          code: "REPLACE_PROGRESS_FAILED",
          message: `could not persist the applied journal: ${error instanceof Error ? error.message : String(error)}`,
          locator: "journal.json",
        },
      ],
    };
  }
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
