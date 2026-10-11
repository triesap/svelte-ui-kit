/**
 * Journaled per-file replacement (S070, repaired for RCLD04-R2-2).
 *
 * Replacements happen in one documented order under the writer lock. An update
 * or retire first moves the existing preimage into an owned backup; a
 * create/update then atomically renames its exact staged image over the target.
 * Progress is persisted after every operation, so an interruption between
 * replacements is a detectable mixed state that recovery can roll back.
 *
 * Final checks follow returning hooks: backup requires the original physical
 * preimage; installation requires target absence and the exact staged creation
 * receipt. Both require held writer ownership and unchanged safe ancestry.
 * An observable intervening edit or a corrupted staged image therefore refuses
 * rather than being overwritten and silently reported as applied.
 *
 * This step deliberately does not publish the install lock: the lock is the
 * final semantic publication (S071). No native multi-file atomicity is claimed;
 * each single-file rename is the atomic unit.
 */
import { readFileSync, renameSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory } from "./durability.js";
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
  stagedDir,
  type TransactionPhase,
} from "./transaction-types.js";
import type { StagedBatch, StagedRecord } from "./stage.js";
import {
  backupOwnedPreimage,
  createOwnedDirectory,
  forgetRenamedCreation,
  verifyOwnedCreations,
  type OwnedCreation,
} from "./transaction-inventory.js";
import {
  verifyMutationAuthority,
  verifyMutationTarget,
  type MutationAuthority,
} from "./mutation-authority.js";

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
function stagedDrift(
  root: string,
  record: StagedRecord,
  staged: StagedBatch,
  operation: JournalOperationRecord,
): string | null {
  if (
    record.digest !== operation.resultDigest ||
    record.mode !== operation.resultMode ||
    record.stagedId !== operation.stagedId
  )
    return "its staged record contradicts the approved operation";
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
  if ((entry.stats.mode & 0o7777) !== record.mode) {
    return "its staged mode changed";
  }
  const receipt = staged.ownership.find(
    (candidate) => candidate.kind === "file" && candidate.path === abs,
  );
  if (receipt === undefined || verifyOwnedCreations([receipt]).length > 0)
    return "its held physical creation receipt no longer matches";
  return null;
}

function refuseProof(issues: readonly ModelIssue[]): void {
  if (issues.length > 0)
    throw new ReplaceRefusal(
      issues[0].code,
      issues.map((entry) => entry.message).join("; "),
    );
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
  hooks: TransactionHooks | undefined,
  ownership: OwnedCreation[] | undefined,
  authority: MutationAuthority,
): ReplacementResult {
  const backupsLogical = backupsDir(stateDir, journal.transactionId);
  const backupsAbs = absOf(root, backupsLogical);
  const stagedAbs = absOf(root, stagedDir(stateDir, journal.transactionId));
  const journalLogical = journalPath(stateDir, journal.transactionId);
  let current = journal;
  const receipts = ownership ?? [];
  const finalProof = () =>
    verifyMutationAuthority(authority, root, stateDir, receipts, [
      ...current.operations.map((entry) => entry.path),
      ...staged.records.map((entry) => entry.stagedPath),
      backupsLogical,
    ]);
  const markApplied = (index: number): void => {
    current = {
      ...current,
      operations: current.operations.map((entry, candidate) =>
        candidate === index ? { ...entry, applied: true } : entry,
      ),
    };
  };

  try {
    refuseProof(finalProof());
    if (
      current.operations.some((entry) => !authority.preimages.has(entry.path))
    )
      throw new ReplaceRefusal(
        "MUTATION_AUTHORITY_INVALID",
        "every replacement requires its original held preimage",
      );
    createOwnedDirectory(backupsAbs, receipts);
  } catch (error) {
    if (error instanceof ReplaceRefusal)
      return {
        ok: false,
        journal: current,
        issues: [{ code: error.code, message: error.message }],
      };
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
        refuseProof(finalProof());
        const original = verifyMutationTarget(authority, operation.path);
        if (original.length > 0)
          throw new ReplaceRefusal(
            "REPLACE_USER_EDIT",
            original.map((entry) => entry.message).join("; "),
          );
        const record = stagedFor(staged, operation.path);
        if (
          operation.operation === "update" &&
          (record === undefined ||
            stagedDrift(root, record, staged, operation) !== null)
        ) {
          throw new ReplaceRefusal(
            "REPLACE_STAGE_CORRUPT",
            `refusing to back up ${operation.path}: its original staged image changed`,
          );
        }
        backupOwnedPreimage(
          targetAbs,
          path.join(backupsAbs, operation.backupId),
          operation.preimage.digest!,
          operation.preimage.mode!,
          receipts,
        );
        if (operation.operation === "retire") markApplied(index);
        fireHooks(hooks, "before", "durability:backup", operation.path);
        refuseProof(finalProof());
        // A cross-directory rename affects both parents: the backup directory
        // gained an entry and the target's directory lost one. Flush both so a
        // crash cannot resurrect the live file or lose the owned backup.
        flushDirectory(backupsAbs);
        flushDirectory(path.dirname(targetAbs));
        fireHooks(hooks, "after", "durability:backup", operation.path);
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
        const corrupt = stagedDrift(root, record, staged, operation);
        if (corrupt !== null) {
          throw new ReplaceRefusal(
            "REPLACE_STAGE_CORRUPT",
            `refusing to install ${operation.path}: ${corrupt}`,
          );
        }
        refuseProof(finalProof());
        const appeared = verifyMutationTarget(authority, operation.path, true);
        if (appeared.length > 0)
          throw new ReplaceRefusal(
            "REPLACE_USER_EDIT",
            `refusing to install ${operation.path}: the destination appeared after approval or backup`,
          );
        renameSync(absOf(root, record.stagedPath), targetAbs);
        markApplied(index);
        if (ownership !== undefined)
          forgetRenamedCreation(absOf(root, record.stagedPath), ownership);
        fireHooks(hooks, "before", "durability:replace", operation.path);
        refuseProof(finalProof());
        // The staged image left its directory and entered the target's
        // directory; flush both parents of the cross-directory rename.
        flushDirectory(path.dirname(targetAbs));
        flushDirectory(stagedAbs);
        fireHooks(hooks, "after", "durability:replace", operation.path);
        fireHooks(hooks, "after", "replace:apply", operation.path);
      }

      markApplied(index);
      fireHooks(hooks, "before", "progress:persist", operation.path);
      refuseProof(finalProof());
      persistJournal(root, journalLogical, current, hooks, ownership);
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
    persistJournal(root, journalLogical, current, hooks, ownership);
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
