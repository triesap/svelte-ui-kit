/**
 * Transaction recovery (S073–S075, repaired for RCLD04-R1-3/R1-4).
 *
 * Recovery is fail-closed and preflighted. Before any restoration or cleanup it
 * validates the *whole* journal: the recorded targets against the caller's
 * approved mapping, every ancestor chain, the phase/progress consistency, the
 * exact current/staged/backup images, and the transaction directory inventory.
 * A corrupt, forged, incomplete or ambiguous record is refused without
 * restoring earlier entries; there is deliberately no force/recover command.
 *
 * Root, mapping and inventory authority never come from the journal's parsed
 * JSON shape alone. The approved mapping is supplied by the caller (the guarded
 * apply boundary, or the resolved effective configuration for a standalone
 * recovery), and only proven owned inventory is ever removed. Post-interruption
 * user edits and unexpected entries are preserved.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { sha256Hex } from "./digest.js";
import {
  parseJournal,
  validateJournalTargets,
  type JournalOperationRecord,
  type TransactionJournal,
} from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  backupsDir,
  lockPath,
  transactionDir,
  transactionsDir,
} from "./transaction-types.js";

export type RecoveryStatus =
  "no_change" | "rolled_back" | "cleaned" | "committed" | "refused";

export interface RecoveryResult {
  readonly status: RecoveryStatus;
  readonly transactionId: string | null;
  readonly issues: readonly ModelIssue[];
}

/** The approved mapping required to authorize recovery of a journal. */
export interface RecoveryRoots {
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

function refuse(
  transactionId: string,
  issues: readonly ModelIssue[],
): RecoveryResult {
  return { status: "refused", transactionId, issues };
}

function issue(code: string, message: string, locator?: string): ModelIssue {
  return locator === undefined ? { code, message } : { code, message, locator };
}

/** List owned transaction directories, sorted, without following symlinks. */
export function scanTransactions(root: string, stateDir: string): string[] {
  const dir = absOf(root, transactionsDir(stateDir));
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries
    .filter((name) => /^[0-9a-f][0-9a-f-]{15,63}$/.test(name))
    .sort();
}

function readJournal(
  root: string,
  stateDir: string,
  transactionId: string,
): TransactionJournal | ModelIssue[] {
  const file = absOf(
    root,
    `${transactionDir(stateDir, transactionId)}/journal.json`,
  );
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    return [
      issue(
        "RECOVERY_JOURNAL_UNREADABLE",
        `transaction ${transactionId} has no readable journal (${codeOf(error)})`,
      ),
    ];
  }
  const parsed = parseJournal(text);
  if (!parsed.ok) return [...parsed.issues];
  if (parsed.value.transactionId !== transactionId) {
    return [
      issue(
        "RECOVERY_IDENTITY_MISMATCH",
        `journal identity ${parsed.value.transactionId} does not match its directory ${transactionId}`,
      ),
    ];
  }
  return parsed.value;
}

const OWNED_ENTRIES = new Set([
  "journal.json",
  "staged",
  "backups",
  "progress",
]);

/**
 * Prove the transaction directory contains only owned entries. An unexpected
 * entry blocks cleanup; it is retained and reported rather than recursively
 * deleted.
 */
function inventoryIssues(
  root: string,
  stateDir: string,
  transactionId: string,
): ModelIssue[] {
  const dir = absOf(root, transactionDir(stateDir, transactionId));
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    return [
      issue(
        "RECOVERY_INVENTORY_UNREADABLE",
        `transaction ${transactionId} inventory is unreadable (${codeOf(error)})`,
      ),
    ];
  }
  const unexpected = entries.filter(
    (name) => !OWNED_ENTRIES.has(name) && !/^journal\.json\.tmp-/.test(name),
  );
  if (unexpected.length > 0) {
    return [
      issue(
        "RECOVERY_UNEXPECTED_ENTRY",
        `transaction ${transactionId} contains unexpected entries (${unexpected.sort().join(", ")}); refusing cleanup`,
      ),
    ];
  }
  return [];
}

/** Non-following ancestry check for a logical target. */
function unsafeAncestry(root: string, logicalPath: string): string | null {
  const segments = logicalPath.split("/");
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index] as string);
    const entry = observeEntry(current);
    if (entry.kind === "absent") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is absent`;
    }
    if (entry.kind === "unreadable") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is unreadable (${entry.code})`;
    }
    if (entry.kind !== "directory") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is not a real directory (${entry.kind})`;
    }
  }
  return null;
}

type CurrentImage =
  | { readonly kind: "absent" }
  | { readonly kind: "file"; readonly digest: string }
  | { readonly kind: "unsafe"; readonly reason: string };

function currentImage(root: string, logicalPath: string): CurrentImage {
  const abs = absOf(root, logicalPath);
  const entry = observeEntry(abs);
  if (entry.kind === "absent") return { kind: "absent" };
  if (entry.kind === "unreadable") {
    return { kind: "unsafe", reason: `unreadable (${entry.code})` };
  }
  if (entry.kind !== "file") {
    return { kind: "unsafe", reason: `not a regular file (${entry.kind})` };
  }
  try {
    return { kind: "file", digest: sha256Hex(readFileSync(abs)) };
  } catch (error) {
    return { kind: "unsafe", reason: `unreadable (${codeOf(error)})` };
  }
}

function backupPathAbs(
  root: string,
  stateDir: string,
  transactionId: string,
  backupId: string,
): string {
  return absOf(root, `${backupsDir(stateDir, transactionId)}/${backupId}`);
}

/**
 * Preflight one operation for rollback and report whether it can be restored.
 * No filesystem mutation happens here; the caller only proceeds when every
 * operation is provably restorable.
 */
function preflightRollback(
  root: string,
  stateDir: string,
  transactionId: string,
  operation: JournalOperationRecord,
): ModelIssue[] {
  const ancestry = unsafeAncestry(root, operation.path);
  if (ancestry !== null) {
    return [
      issue(
        "RECOVERY_UNSAFE_ANCESTRY",
        `refusing to touch ${operation.path}: ${ancestry}`,
        operation.path,
      ),
    ];
  }
  const current = currentImage(root, operation.path);
  if (current.kind === "unsafe") {
    return [
      issue(
        "RECOVERY_UNSAFE_TARGET",
        `refusing to touch ${operation.path}: ${current.reason}`,
        operation.path,
      ),
    ];
  }

  const appliedResult =
    current.kind === "file" && current.digest === operation.resultDigest;
  const atPreimage =
    operation.preimage.kind === "file" &&
    operation.preimage.digest !== null &&
    current.kind === "file" &&
    current.digest === operation.preimage.digest;

  if (operation.operation === "create") {
    if (current.kind === "absent") return [];
    if (!appliedResult) {
      return [
        issue(
          "RECOVERY_USER_EDIT",
          `refusing to remove created ${operation.path}: its bytes are neither the planned result nor absent`,
          operation.path,
        ),
      ];
    }
    return [];
  }

  if (atPreimage) return [];

  if (current.kind === "file" && !appliedResult) {
    return [
      issue(
        "RECOVERY_USER_EDIT",
        `refusing to restore ${operation.path}: it has been edited since the interrupted batch`,
        operation.path,
      ),
    ];
  }

  // The target is absent or holds exactly the applied result: a verified owned
  // backup must exist and must match the recorded preimage.
  if (operation.backupId === null) {
    return [
      issue(
        "RECOVERY_BACKUP_MISSING",
        `refusing to restore ${operation.path}: no owned backup is recorded`,
        operation.path,
      ),
    ];
  }
  const backup = backupPathAbs(
    root,
    stateDir,
    transactionId,
    operation.backupId,
  );
  const entry = observeEntry(backup);
  if (entry.kind === "absent") {
    return [
      issue(
        "RECOVERY_BACKUP_MISSING",
        `refusing to restore ${operation.path}: its owned backup is missing`,
        operation.path,
      ),
    ];
  }
  if (entry.kind !== "file") {
    return [
      issue(
        "RECOVERY_BACKUP_CORRUPT",
        `refusing to restore ${operation.path}: its owned backup is not a regular file`,
        operation.path,
      ),
    ];
  }
  let digest: string;
  try {
    digest = sha256Hex(readFileSync(backup));
  } catch (error) {
    return [
      issue(
        "RECOVERY_BACKUP_CORRUPT",
        `refusing to restore ${operation.path}: its owned backup is unreadable (${codeOf(error)})`,
        operation.path,
      ),
    ];
  }
  if (
    operation.preimage.digest === null ||
    digest !== operation.preimage.digest
  ) {
    return [
      issue(
        "RECOVERY_BACKUP_CORRUPT",
        `refusing to restore ${operation.path}: its owned backup does not match the recorded preimage`,
        operation.path,
      ),
    ];
  }
  return [];
}

/** Restore one operation after a successful preflight. */
function rollbackOperation(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  operation: JournalOperationRecord,
  hooks?: TransactionHooks,
): void {
  const current = currentImage(root, operation.path);
  if (operation.operation === "create") {
    if (current.kind === "file" && current.digest === operation.resultDigest) {
      rmSync(absOf(root, operation.path), { force: true });
    }
    return;
  }
  const atPreimage =
    operation.preimage.digest !== null &&
    current.kind === "file" &&
    current.digest === operation.preimage.digest;
  if (atPreimage) return;
  if (operation.backupId === null) return;
  const backup = backupPathAbs(
    root,
    stateDir,
    journal.transactionId,
    operation.backupId,
  );
  fireHooks(hooks, "before", "recovery:restore", operation.path);
  renameSync(backup, absOf(root, operation.path));
}

function removeOwnedEntries(
  root: string,
  stateDir: string,
  transactionId: string,
): void {
  const dir = absOf(root, transactionDir(stateDir, transactionId));
  for (const name of readdirSync(dir)) {
    if (name === "journal.json" || /^journal\.json\.tmp-/.test(name)) continue;
    const abs = path.join(dir, name);
    if (OWNED_ENTRIES.has(name)) {
      rmSync(abs, { recursive: true, force: true });
    }
  }
  rmSync(path.join(dir, "journal.json"), { force: true });
  for (const name of readdirSync(dir)) {
    if (/^journal\.json\.tmp-/.test(name)) {
      rmSync(path.join(dir, name), { force: true });
    }
  }
  rmdirSync(dir);
}

/** Recover one transaction directory against the approved mapping. */
export function recoverTransaction(
  root: string,
  stateDir: string,
  transactionId: string,
  roots: RecoveryRoots,
  hooks?: TransactionHooks,
): RecoveryResult {
  // A directory whose journal and owned state were already removed is the tail
  // of a completed cleanup; finish removing the empty directory rather than
  // refusing forever. Any remaining entry is treated as evidence and refused.
  const dirAbs = absOf(root, transactionDir(stateDir, transactionId));
  let dirEntries: string[];
  try {
    dirEntries = readdirSync(dirAbs);
  } catch {
    dirEntries = [];
  }
  if (dirEntries.length === 0) {
    try {
      rmdirSync(dirAbs);
    } catch {
      // Already gone; nothing to finish.
    }
    return { status: "cleaned", transactionId, issues: [] };
  }

  const read = readJournal(root, stateDir, transactionId);
  if (Array.isArray(read)) {
    // A crash before the prepared journal was durably renamed leaves only owned
    // transient state (a temp journal and/or staged files) and no recorded
    // live mutation. No live replacement begins before the journal is durable,
    // so this is safe to clean; a *present but unreadable* journal is evidence
    // and is refused by the branch below.
    const journalAbs = absOf(
      root,
      `${transactionDir(stateDir, transactionId)}/journal.json`,
    );
    if (!existsSync(journalAbs)) {
      const inventory = inventoryIssues(root, stateDir, transactionId);
      if (inventory.length > 0) return refuse(transactionId, inventory);
      removeOwnedEntries(root, stateDir, transactionId);
      return { status: "cleaned", transactionId, issues: [] };
    }
    return refuse(transactionId, read);
  }
  const journal = read;

  const mapping = { ...roots, stateDir };
  const targetValidation = validateJournalTargets(journal, mapping);
  if (!targetValidation.ok) {
    return refuse(transactionId, targetValidation.issues);
  }
  const inventory = inventoryIssues(root, stateDir, transactionId);
  if (inventory.length > 0) return refuse(transactionId, inventory);

  if (journal.phase === "planned") {
    removeOwnedEntries(root, stateDir, transactionId);
    return { status: "cleaned", transactionId, issues: [] };
  }

  if (journal.phase === "published" || journal.phase === "cleaned") {
    return recoverPublished(root, stateDir, transactionId, journal, hooks);
  }

  // applied with a durable publication intent: the lock rename may or may not
  // have happened. Classify against the canonical lock before rolling back.
  if (journal.phase === "applied" && journal.lock !== null) {
    const canonical = absOf(root, lockPath(stateDir));
    let digest: string | null;
    try {
      digest = sha256Hex(readFileSync(canonical));
    } catch {
      digest = null;
    }
    if (digest !== null && digest === journal.lock.digest) {
      return recoverPublished(root, stateDir, transactionId, journal, hooks);
    }
    if (digest !== null && !journal.lock.published) {
      // The intended publication definitely did not happen: safe to roll back.
    }
  }

  // prepared / applied without committed publication: roll back after a full
  // preflight of every operation.
  const issues: ModelIssue[] = [];
  for (const operation of journal.operations) {
    issues.push(...preflightRollback(root, stateDir, transactionId, operation));
  }
  if (issues.length > 0) return refuse(transactionId, issues);
  for (const operation of [...journal.operations].reverse()) {
    rollbackOperation(root, stateDir, journal, operation, hooks);
  }
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  const cleanupIssues = inventoryIssues(root, stateDir, transactionId);
  if (cleanupIssues.length > 0) return refuse(transactionId, cleanupIssues);
  removeOwnedEntries(root, stateDir, transactionId);
  fireHooks(hooks, "after", "recovery:cleanup", transactionId);
  return { status: "rolled_back", transactionId, issues: [] };
}

/**
 * Finish a published transaction: prove the canonical lock still matches the
 * recorded publication, then remove only proven owned state.
 */
function recoverPublished(
  root: string,
  stateDir: string,
  transactionId: string,
  journal: TransactionJournal,
  hooks?: TransactionHooks,
): RecoveryResult {
  if (journal.lock === null) {
    return refuse(transactionId, [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "recovery reached a published state without a lock publication record",
        lockPath(stateDir),
      ),
    ]);
  }
  if (!existsSync(absOf(root, lockPath(stateDir)))) {
    return refuse(transactionId, [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the canonical lock recorded as published is missing",
        lockPath(stateDir),
      ),
    ]);
  }
  const digest = readFileSafe(root, lockPath(stateDir));
  if (digest === null || digest !== journal.lock.digest) {
    return refuse(transactionId, [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the canonical lock no longer matches the recorded publication",
        lockPath(stateDir),
      ),
    ]);
  }
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  removeOwnedEntries(root, stateDir, transactionId);
  fireHooks(hooks, "after", "recovery:cleanup", transactionId);
  return { status: "committed", transactionId, issues: [] };
}

function readFileSafe(root: string, logical: string): string | null {
  try {
    return sha256Hex(readFileSync(absOf(root, logical)));
  } catch {
    return null;
  }
}

/** Recover every transaction directory under the state namespace. */
export function recoverTransactions(
  root: string,
  stateDir: string,
  roots: RecoveryRoots,
  hooks?: TransactionHooks,
): readonly RecoveryResult[] {
  return scanTransactions(root, stateDir).map((transactionId) =>
    recoverTransaction(root, stateDir, transactionId, roots, hooks),
  );
}

export interface JournalInspection {
  readonly transactionId: string;
  readonly ok: boolean;
  readonly issues: readonly ModelIssue[];
}

/**
 * Read-only inspection of every transaction journal. Used to block a new
 * mutation when recovery cannot prove a safe transition; it never mutates.
 */
export function inspectTransactions(
  root: string,
  stateDir: string,
  roots: RecoveryRoots,
): readonly JournalInspection[] {
  return scanTransactions(root, stateDir).map((transactionId) => {
    const read = readJournal(root, stateDir, transactionId);
    if (Array.isArray(read)) {
      return { transactionId, ok: false, issues: read };
    }
    const mapping = { ...roots, stateDir };
    const validation = validateJournalTargets(read, mapping);
    return validation.ok
      ? { transactionId, ok: true, issues: [] }
      : { transactionId, ok: false, issues: validation.issues };
  });
}
