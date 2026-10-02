/**
 * Recursive owned-transient inventory proof (RCLD04-R2-4).
 *
 * A reserved directory name never proves ownership of its contents. Before any
 * recovery or cleanup effect this walks the whole transaction directory with
 * non-following metadata and rejects, at every depth, a symlink, an unreadable
 * entry, or an entry that is not part of the exact owned layout. Unexpected
 * entries are retained and reported, never recursively deleted.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import {
  backupsDir,
  progressDir,
  stagedDir,
  transactionDir,
} from "./transaction-types.js";

const TOP_LEVEL = new Set([
  "journal.json",
  "publication.json",
  "staged",
  "backups",
  "progress",
]);

function inventoryIssue(
  transactionId: string,
  message: string,
  locator?: string,
): ModelIssue {
  return locator === undefined
    ? { code: "RECOVERY_UNEXPECTED_ENTRY", message }
    : { code: "RECOVERY_UNEXPECTED_ENTRY", message, locator };
}

function checkEntries(
  transactionId: string,
  dirAbs: string,
  allowed: (name: string) => boolean,
  allowTempJournal: boolean,
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
    if (allowTempJournal && /^journal\.json\.tmp-/.test(name)) continue;
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
    if (!allowed(name)) {
      issues.push(
        inventoryIssue(
          transactionId,
          `transaction ${transactionId} contains an unexpected entry (${name}); refusing owned cleanup`,
          name,
        ),
      );
    }
  }
  return issues;
}

/**
 * Prove the transaction directory and every owned subdirectory contain only the
 * exact owned layout. Any unexpected entry, symlink or unreadable directory at
 * any depth is a typed refusal.
 */
export function verifyOwnedInventory(
  root: string,
  stateDir: string,
  transactionId: string,
): ModelIssue[] {
  const abs = (logical: string): string =>
    path.join(root, ...logical.split("/"));
  const txDir = abs(transactionDir(stateDir, transactionId));
  const issues = checkEntries(
    transactionId,
    txDir,
    (name) => TOP_LEVEL.has(name),
    true,
  );
  if (issues.length > 0) return issues;
  issues.push(
    ...checkEntries(
      transactionId,
      abs(stagedDir(stateDir, transactionId)),
      (name) => /^stage-\d+$/.test(name) || name === "kit.lock.json",
      false,
    ),
  );
  issues.push(
    ...checkEntries(
      transactionId,
      abs(backupsDir(stateDir, transactionId)),
      (name) => /^backup-\d+$/.test(name),
      false,
    ),
  );
  issues.push(
    ...checkEntries(
      transactionId,
      abs(progressDir(stateDir, transactionId)),
      (name) => /^progress-\d+$/.test(name),
      false,
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
