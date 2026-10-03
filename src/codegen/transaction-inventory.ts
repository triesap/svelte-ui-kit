/**
 * Recursive owned-transient inventory proof (RCLD04-R2-4).
 *
 * A reserved directory name or a numeric filename never proves ownership of its
 * contents. The exact owned inventory is derived from the validated journal
 * transaction records: the recorded staged and backup identifiers, plus the
 * single staged publication lock. Before any recovery or cleanup effect this
 * walks the whole transaction directory with non-following metadata and
 * rejects, at every depth, a symlink, an unreadable entry, an unexpected entry,
 * or a recorded entry whose kind is not the required regular file. Unexpected
 * entries — including unrecorded numeric names and directories that merely look
 * like owned ids — are retained and reported, never recursively deleted.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import type { TransactionJournal } from "./transaction-journal.js";
import {
  backupsDir,
  journalTempName,
  progressDir,
  publicationIntentTempName,
  stagedDir,
  transactionDir,
} from "./transaction-types.js";

export interface OwnedInventory {
  readonly topLevelFiles: ReadonlySet<string>;
  readonly topLevelDirs: ReadonlySet<string>;
  readonly staged: ReadonlySet<string>;
  readonly backups: ReadonlySet<string>;
  readonly progress: ReadonlySet<string>;
}

const TOP_LEVEL_FILES = new Set(["journal.json", "publication.json"]);
const TOP_LEVEL_DIRS = new Set(["staged", "backups", "progress"]);

/** The single staged publication image name (never an ordinary staged id). */
export const STAGED_PUBLICATION_NAME = "kit.lock.json";

/**
 * Derive the exact owned inventory from validated transaction records. The only
 * names that may be removed are the ones this attempt itself recorded; a numeric
 * or temporary-looking name is not ownership.
 */
export function ownedInventoryFor(journal: TransactionJournal): OwnedInventory {
  const staged = new Set<string>([STAGED_PUBLICATION_NAME]);
  const backups = new Set<string>();
  for (const operation of journal.operations) {
    if (operation.stagedId !== null) staged.add(operation.stagedId);
    if (operation.backupId !== null) backups.add(operation.backupId);
  }
  return {
    topLevelFiles: TOP_LEVEL_FILES,
    topLevelDirs: TOP_LEVEL_DIRS,
    staged,
    backups,
    progress: new Set<string>(),
  };
}

/** An inventory with no recorded content, for a journal-less cleanup tail. */
export function emptyOwnedInventory(): OwnedInventory {
  return {
    topLevelFiles: TOP_LEVEL_FILES,
    topLevelDirs: TOP_LEVEL_DIRS,
    staged: new Set<string>([STAGED_PUBLICATION_NAME]),
    backups: new Set<string>(),
    progress: new Set<string>(),
  };
}

function inventoryIssue(
  transactionId: string,
  message: string,
  locator?: string,
): ModelIssue {
  return locator === undefined
    ? { code: "RECOVERY_UNEXPECTED_ENTRY", message }
    : { code: "RECOVERY_UNEXPECTED_ENTRY", message, locator };
}

/**
 * Check one owned directory. Every child must be a recorded name of a required
 * kind: a symlink, an unexpected name or a wrong-kind recorded entry is a typed
 * refusal. The directory itself must be a real directory.
 */
function checkDirectory(
  transactionId: string,
  dirAbs: string,
  allowedFiles: ReadonlySet<string>,
  allowedDirs: ReadonlySet<string>,
  allowedTempFiles: ReadonlySet<string>,
): ModelIssue[] {
  const entry = observeEntry(dirAbs);
  if (entry.kind === "absent") return [];
  if (entry.kind === "unreadable") {
    return [
      {
        code: "RECOVERY_INVENTORY_UNREADABLE",
        message: `transaction ${transactionId} inventory is unreadable at ${path.basename(dirAbs)} (${entry.code})`,
      },
    ];
  }
  if (entry.kind !== "directory") {
    return [
      inventoryIssue(
        transactionId,
        `transaction ${transactionId} entry ${path.basename(dirAbs)} is not a real directory (${entry.kind})`,
        path.basename(dirAbs),
      ),
    ];
  }
  let names: string[];
  try {
    names = readdirSync(dirAbs);
  } catch (error) {
    return [
      {
        code: "RECOVERY_INVENTORY_UNREADABLE",
        message: `transaction ${transactionId} inventory is unreadable (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
      },
    ];
  }
  const issues: ModelIssue[] = [];
  for (const name of names) {
    if (allowedTempFiles.has(name)) {
      // Only the exact temporary names this transaction records are owned; a
      // prefix or pattern match is never ownership.
      const tempKind = observeEntry(path.join(dirAbs, name)).kind;
      if (tempKind !== "file" && tempKind !== "absent") {
        issues.push(
          inventoryIssue(
            transactionId,
            `recorded temporary transaction entry ${name} is not a regular file (${tempKind}); refusing owned cleanup`,
            name,
          ),
        );
      }
      continue;
    }
    const child = path.join(dirAbs, name);
    const kind = observeEntry(child).kind;
    if (kind === "symlink") {
      issues.push(
        inventoryIssue(
          transactionId,
          `transaction ${transactionId} contains a symlink at ${name}; refusing owned cleanup`,
          name,
        ),
      );
      continue;
    }
    if (allowedDirs.has(name)) {
      if (kind !== "directory") {
        issues.push(
          inventoryIssue(
            transactionId,
            `recorded transaction directory ${name} is not a real directory (${kind}); refusing owned cleanup`,
            name,
          ),
        );
      }
      continue;
    }
    if (!allowedFiles.has(name)) {
      issues.push(
        inventoryIssue(
          transactionId,
          `transaction ${transactionId} contains an unexpected unrecorded entry (${name}); refusing owned cleanup`,
          name,
        ),
      );
      continue;
    }
    // A recorded file id must itself be a regular file; a directory or other
    // kind under a record name is contradictory and must be retained, not
    // recursed.
    if (kind !== "file") {
      issues.push(
        inventoryIssue(
          transactionId,
          `recorded transaction entry ${name} is not a regular file (${kind}); refusing owned cleanup`,
          name,
        ),
      );
    }
  }
  return issues;
}

/**
 * Prove the transaction directory and every owned subdirectory contain only the
 * exact recorded inventory. Any unexpected entry, symlink, wrong-kind recorded
 * entry or unreadable directory at any depth is a typed refusal.
 */
export function verifyOwnedInventory(
  root: string,
  stateDir: string,
  transactionId: string,
  inventory: OwnedInventory,
): ModelIssue[] {
  const abs = (logical: string): string =>
    path.join(root, ...logical.split("/"));
  const txDir = abs(transactionDir(stateDir, transactionId));
  const allowedTempFiles = new Set<string>([
    journalTempName(transactionId),
    publicationIntentTempName(transactionId),
  ]);
  const issues = checkDirectory(
    transactionId,
    txDir,
    inventory.topLevelFiles,
    inventory.topLevelDirs,
    allowedTempFiles,
  );
  if (issues.length > 0) return issues;
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(stagedDir(stateDir, transactionId)),
      inventory.staged,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(backupsDir(stateDir, transactionId)),
      inventory.backups,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(progressDir(stateDir, transactionId)),
      inventory.progress,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  return issues;
}

/** True when the transaction directory holds any non-temporary owned state. */
export function hasOwnedMutationEvidence(
  root: string,
  stateDir: string,
  transactionId: string,
): boolean {
  const dirAbs = path.join(
    root,
    ...transactionDir(stateDir, transactionId).split("/"),
  );
  let names: string[];
  try {
    names = readdirSync(dirAbs);
  } catch {
    return true;
  }
  return names.some((name) => !/^journal\.json\.tmp-/.test(name));
}

/**
 * True when staged, backup or progress state remains, so a missing journal is
 * possible mutation evidence that must not be discarded. A lone publication
 * intent is handled separately by the publication classifier.
 */
export function hasRollbackEvidence(
  root: string,
  stateDir: string,
  transactionId: string,
): boolean {
  for (const logical of [
    stagedDir(stateDir, transactionId),
    backupsDir(stateDir, transactionId),
    progressDir(stateDir, transactionId),
  ]) {
    if (
      observeEntry(path.join(root, ...logical.split("/"))).kind !== "absent"
    ) {
      return true;
    }
  }
  return false;
}
