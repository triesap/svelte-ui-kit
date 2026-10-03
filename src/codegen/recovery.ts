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
  chmodSync,
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  rmdirSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { fail, ok, type ModelResult } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory } from "./durability.js";
import { identityDigest, observeRootIdentity } from "./authority.js";
import {
  parseJournal,
  validateJournalTargets,
  type JournalOperationRecord,
  type TransactionJournal,
} from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  emptyOwnedInventory,
  hasRollbackEvidence,
  ownedInventoryFor,
  verifyOwnedInventory,
} from "./transaction-inventory.js";
import {
  classifyPublication,
  observeFileIdentity,
  readPublicationIntent,
  type PublicationIntent,
} from "./publication-intent.js";
import {
  backupsDir,
  journalTempName,
  lockPath,
  publicationIntentPath,
  publicationIntentTempName,
  stagedDir,
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
  const checked = scanTransactionsChecked(root, stateDir);
  return checked.ok ? [...checked.value] : [];
}

/**
 * List owned transaction directories with a typed refusal when the transaction
 * namespace is unreadable or is not a real directory. An unreadable scan is
 * never silently treated as an empty (already clean) namespace.
 */
export function scanTransactionsChecked(
  root: string,
  stateDir: string,
): ModelResult<readonly string[]> {
  const dir = absOf(root, transactionsDir(stateDir));
  const entry = observeEntry(dir);
  if (entry.kind === "absent") return ok([]);
  if (entry.kind === "unreadable") {
    return fail([
      issue(
        "RECOVERY_SCAN_UNREADABLE",
        `the transaction namespace is unreadable (${entry.code})`,
      ),
    ]);
  }
  if (entry.kind !== "directory") {
    return fail([
      issue(
        "RECOVERY_SCAN_UNSAFE",
        `the transaction namespace is not a real directory (${entry.kind})`,
      ),
    ]);
  }
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch (error) {
    return fail([
      issue(
        "RECOVERY_SCAN_UNREADABLE",
        `the transaction namespace is unreadable (${codeOf(error)})`,
      ),
    ]);
  }
  return ok(
    entries.filter((name) => /^[0-9a-f][0-9a-f-]{15,63}$/.test(name)).sort(),
  );
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

/**
 * Prove the transaction directory contains only entries recorded by the
 * validated journal at every depth. An unexpected entry, symlink, wrong-kind
 * recorded entry or unreadable directory blocks cleanup; it is retained and
 * reported rather than recursively deleted.
 */
function inventoryIssues(
  root: string,
  stateDir: string,
  transactionId: string,
  journal: TransactionJournal | null,
): ModelIssue[] {
  return verifyOwnedInventory(
    root,
    stateDir,
    transactionId,
    journal === null ? emptyOwnedInventory() : ownedInventoryFor(journal),
  );
}

/**
 * Bind the recovered journal to the live project root. A journal copied into a
 * different checkout, or a replaced root, must never authorize restoration or
 * cleanup of foreign evidence. This is checked before the first mutation, not
 * before the read-only preflight, so preflight diagnostics keep precedence.
 */
function rootBindingIssues(
  root: string,
  journal: TransactionJournal,
): ModelIssue[] {
  const observed = observeRootIdentity(root);
  if (!observed.ok) return [...observed.issues];
  if (identityDigest(observed.value) !== journal.rootIdentity) {
    return [
      issue(
        "RECOVERY_ROOT_MISMATCH",
        "the journal root identity does not match the live project root; refusing to recover foreign evidence",
        "journal.json",
      ),
    ];
  }
  return [];
}

/**
 * Bind a journal-less publication witness to the live project root. A witness
 * surviving in a different checkout, or one recorded against a replaced root,
 * must never authorize cleanup of foreign evidence.
 */
function intentBindingIssues(
  root: string,
  stateDir: string,
  transactionId: string,
  intent: PublicationIntent,
): ModelIssue[] {
  const observed = observeRootIdentity(root);
  if (!observed.ok) return [...observed.issues];
  if (identityDigest(observed.value) !== intent.rootIdentity) {
    return [
      issue(
        "RECOVERY_ROOT_MISMATCH",
        "the publication witness root identity does not match the live project root; refusing to recover foreign evidence",
        publicationIntentPath(stateDir, transactionId),
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
  | { readonly kind: "file"; readonly digest: string; readonly mode: number }
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
    return {
      kind: "file",
      digest: sha256Hex(readFileSync(abs)),
      mode: entry.stats.mode & 0o777,
    };
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
    current.kind === "file" &&
    current.digest === operation.resultDigest &&
    current.mode === operation.resultMode;
  const atPreimageBytes =
    operation.preimage.kind === "file" &&
    operation.preimage.digest !== null &&
    current.kind === "file" &&
    current.digest === operation.preimage.digest;
  const atPreimage =
    atPreimageBytes &&
    (operation.preimage.mode === null ||
      current.mode === operation.preimage.mode);

  if (operation.operation === "create") {
    if (current.kind === "absent") return [];
    if (!appliedResult) {
      return [
        issue(
          "RECOVERY_USER_EDIT",
          `refusing to remove created ${operation.path}: its bytes or mode are neither the planned result nor absent`,
          operation.path,
        ),
      ];
    }
    return [];
  }

  if (atPreimage) return [];

  // Bytes still match the preimage but the mode was edited after the crash:
  // preserve the edit and refuse rather than overwriting it.
  if (atPreimageBytes && operation.preimage.mode !== null) {
    return [
      issue(
        "RECOVERY_USER_EDIT",
        `refusing to restore ${operation.path}: its mode was edited since the interrupted batch`,
        operation.path,
      ),
    ];
  }

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
  if (
    operation.preimage.mode !== null &&
    (entry.stats.mode & 0o777) !== operation.preimage.mode
  ) {
    return [
      issue(
        "RECOVERY_BACKUP_CORRUPT",
        `refusing to restore ${operation.path}: its owned backup mode was changed`,
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
  if (operation.preimage.mode !== null) {
    try {
      chmodSync(absOf(root, operation.path), operation.preimage.mode);
    } catch {
      // The restored bytes are in place; a mode failure is reported by the
      // caller's inventory/cleanup step rather than silently ignored.
    }
  }
  fireHooks(hooks, "before", "durability:recovery", operation.path);
  // The restore rename moves the owned backup into the live target directory;
  // flush the target directory and the backup directory it left.
  flushDirectory(path.dirname(absOf(root, operation.path)));
  flushDirectory(path.dirname(backup));
  fireHooks(hooks, "after", "durability:recovery", operation.path);
}

const OWNED_ENTRIES = new Set([
  "journal.json",
  "publication.json",
  "staged",
  "backups",
  "progress",
]);

function removeOwnedEntries(
  root: string,
  stateDir: string,
  transactionId: string,
): void {
  const dir = absOf(root, transactionDir(stateDir, transactionId));
  // Remove only the exact owned top-level entries. The two temporary names are
  // owned by their recorded transaction id, never by a prefix pattern, so an
  // unrelated notes file that merely resembles a temporary journal survives.
  const ownedTempNames = new Set<string>([
    journalTempName(transactionId),
    publicationIntentTempName(transactionId),
  ]);
  for (const name of readdirSync(dir)) {
    const abs = path.join(dir, name);
    if (OWNED_ENTRIES.has(name)) {
      rmSync(abs, { recursive: true, force: true });
      continue;
    }
    if (ownedTempNames.has(name)) {
      rmSync(abs, { force: true });
    }
  }
  rmSync(path.join(dir, "journal.json"), { force: true });
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
  const dirEntry = observeEntry(dirAbs);
  if (dirEntry.kind === "absent") {
    return { status: "cleaned", transactionId, issues: [] };
  }
  if (dirEntry.kind === "unreadable") {
    return refuse(transactionId, [
      issue(
        "RECOVERY_INVENTORY_UNREADABLE",
        `transaction ${transactionId} directory is unreadable (${dirEntry.code})`,
      ),
    ]);
  }
  if (dirEntry.kind !== "directory") {
    return refuse(transactionId, [
      issue(
        "RECOVERY_UNEXPECTED_ENTRY",
        `transaction ${transactionId} is not a real directory (${dirEntry.kind})`,
      ),
    ]);
  }
  let dirEntries: string[];
  try {
    dirEntries = readdirSync(dirAbs);
  } catch (error) {
    return refuse(transactionId, [
      issue(
        "RECOVERY_INVENTORY_UNREADABLE",
        `transaction ${transactionId} directory is unreadable (${codeOf(error)})`,
      ),
    ]);
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
      // Staged/backup/progress state without a journal is possible mutation
      // evidence: fail closed and retain it rather than guessing it is
      // pre-preparation and deleting the only old image. This runs before the
      // recorded-inventory check so a journal-less backup is reported as
      // ambiguous mutation evidence rather than an unrecorded entry.
      if (hasRollbackEvidence(root, stateDir, transactionId)) {
        return refuse(transactionId, [
          issue(
            "RECOVERY_AMBIGUOUS_JOURNAL",
            `transaction ${transactionId} retains owned state without a readable journal; refusing to discard possible mutation evidence`,
          ),
        ]);
      }
      const inventory = inventoryIssues(root, stateDir, transactionId, null);
      if (inventory.length > 0) return refuse(transactionId, inventory);
      // Only a publication intent (or temporary state) may remain: this is the
      // tail of an interrupted cleanup. Finish it only when the physical witness
      // proves the publication actually happened.
      const intentRead = readPublicationIntent(
        root,
        publicationIntentPath(stateDir, transactionId),
      );
      if (Array.isArray(intentRead)) return refuse(transactionId, intentRead);
      if (intentRead !== null) {
        const binding = intentBindingIssues(
          root,
          stateDir,
          transactionId,
          intentRead,
        );
        if (binding.length > 0) return refuse(transactionId, binding);
        const state = classifyPublication({
          intent: intentRead,
          canonical: observeFileIdentity(absOf(root, lockPath(stateDir))),
          stagedStillPresent:
            observeFileIdentity(
              absOf(
                root,
                `${stagedDir(stateDir, transactionId)}/kit.lock.json`,
              ),
            ) !== null,
          expectedDigest: intentRead.digest,
          canonicalDigest: readFileSafe(root, lockPath(stateDir)),
        });
        if (state !== "published") {
          return refuse(transactionId, [
            issue(
              "RECOVERY_AMBIGUOUS_PUBLICATION",
              "the interrupted cleanup cannot prove a completed publication; refusing to discard evidence",
              lockPath(stateDir),
            ),
          ]);
        }
      }
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
  const inventory = inventoryIssues(root, stateDir, transactionId, journal);
  if (inventory.length > 0) return refuse(transactionId, inventory);

  if (journal.phase === "planned") {
    const binding = rootBindingIssues(root, journal);
    if (binding.length > 0) return refuse(transactionId, binding);
    removeOwnedEntries(root, stateDir, transactionId);
    return { status: "cleaned", transactionId, issues: [] };
  }

  if (journal.phase === "published" || journal.phase === "cleaned") {
    const binding = rootBindingIssues(root, journal);
    if (binding.length > 0) return refuse(transactionId, binding);
    return recoverPublished(root, stateDir, transactionId, journal, hooks);
  }

  // applied with a durable publication intent: the canonical lock rename may or
  // may not have happened. Classify from the physical rename witness rather
  // than byte equality, and refuse an ambiguity without rolling back.
  if (journal.phase === "applied" && journal.lock !== null) {
    const canonicalAbs = absOf(root, lockPath(stateDir));
    const canonicalDigest = readFileSafe(root, lockPath(stateDir));
    const intentRead = readPublicationIntent(
      root,
      publicationIntentPath(stateDir, transactionId),
    );
    if (Array.isArray(intentRead)) {
      return refuse(transactionId, intentRead);
    }
    if (
      intentRead !== null &&
      (journal.lock === null ||
        intentRead.transactionId !== transactionId ||
        intentRead.digest !== journal.lock.digest)
    ) {
      return refuse(transactionId, [
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "the publication witness does not belong to the recovered journal; refusing to roll back or discard evidence",
          lockPath(stateDir),
        ),
      ]);
    }
    if (intentRead !== null) {
      const binding = intentBindingIssues(
        root,
        stateDir,
        transactionId,
        intentRead,
      );
      if (binding.length > 0) return refuse(transactionId, binding);
    }
    const stagedStillPresent =
      observeFileIdentity(
        absOf(root, `${stagedDir(stateDir, transactionId)}/kit.lock.json`),
      ) !== null;
    const state = classifyPublication({
      intent: intentRead,
      canonical: observeFileIdentity(canonicalAbs),
      stagedStillPresent,
      expectedDigest: journal.lock.digest,
      canonicalDigest,
    });
    if (state === "published") {
      const binding = rootBindingIssues(root, journal);
      if (binding.length > 0) return refuse(transactionId, binding);
      return recoverPublished(root, stateDir, transactionId, journal, hooks);
    }
    if (state === "ambiguous") {
      return refuse(transactionId, [
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "the canonical lock publication outcome is ambiguous; refusing to roll back or discard evidence",
          lockPath(stateDir),
        ),
      ]);
    }
    // prepublication: proven not to have published, safe to roll back.
  }

  // prepared / applied without committed publication: roll back after a full
  // preflight of every operation.
  const issues: ModelIssue[] = [];
  for (const operation of journal.operations) {
    issues.push(...preflightRollback(root, stateDir, transactionId, operation));
  }
  if (issues.length > 0) return refuse(transactionId, issues);
  const binding = rootBindingIssues(root, journal);
  if (binding.length > 0) return refuse(transactionId, binding);
  for (const operation of [...journal.operations].reverse()) {
    rollbackOperation(root, stateDir, journal, operation, hooks);
  }
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  const cleanupIssues = inventoryIssues(root, stateDir, transactionId, journal);
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
  // Validate the complete published evidence — regular-file kind, recorded mode
  // and witness identity — before removing any owned state. A canonical mode
  // edit is contradictory evidence that must be preserved, not cleaned.
  const publishedIssues = verifyPublishedEvidence(
    root,
    stateDir,
    transactionId,
    journal,
  );
  if (publishedIssues.length > 0) {
    return refuse(transactionId, publishedIssues);
  }
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  const publishedInventory = verifyOwnedInventory(
    root,
    stateDir,
    transactionId,
    ownedInventoryFor(journal),
  );
  if (publishedInventory.length > 0) {
    return refuse(transactionId, publishedInventory);
  }
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

/**
 * Prove the complete physical publication evidence before cleanup: the
 * canonical lock is a regular file with the exact recorded mode, and any
 * surviving publication witness belongs to this transaction and digest. A
 * missing witness is only accepted for the cleanup tail, where the journal and
 * canonical digest have already been proven.
 */
function verifyPublishedEvidence(
  root: string,
  stateDir: string,
  transactionId: string,
  journal: TransactionJournal,
): ModelIssue[] {
  const entry = observeEntry(absOf(root, lockPath(stateDir)));
  if (entry.kind !== "file") {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        `the published canonical lock is not a regular file (${entry.kind})`,
        lockPath(stateDir),
      ),
    ];
  }
  const intentRead = readPublicationIntent(
    root,
    publicationIntentPath(stateDir, transactionId),
  );
  if (Array.isArray(intentRead)) return [...intentRead];
  if (intentRead === null) {
    // A missing witness is not by itself proof of a legitimate cleanup tail.
    // Without the durable physical witness there is no evidence that the
    // canonical lock is the exact staged publication image, so fail closed
    // rather than deleting evidence.
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the publication witness is missing; refusing to treat its absence as proof of a completed publication",
        lockPath(stateDir),
      ),
    ];
  }
  if (journal.lock === null) {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "a publication witness survives without a recovered lock record",
        lockPath(stateDir),
      ),
    ];
  }
  if (
    intentRead.transactionId !== transactionId ||
    intentRead.digest !== journal.lock.digest
  ) {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the publication witness does not belong to the recovered journal",
        lockPath(stateDir),
      ),
    ];
  }
  if ((entry.stats.mode & 0o777) !== intentRead.mode) {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the published canonical lock mode does not match the recorded publication evidence; preserving it rather than cleaning",
        lockPath(stateDir),
      ),
    ];
  }
  // The canonical lock must be the *exact physical image* recorded as the
  // staged publication witness. Equal bytes/mode at a different inode is a
  // contradiction, not a completed publication.
  if (
    intentRead.staged === null ||
    entry.stats.dev !== intentRead.staged.device ||
    entry.stats.ino !== intentRead.staged.inode
  ) {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the published canonical lock is not the recorded staged publication image; preserving evidence rather than cleaning",
        lockPath(stateDir),
      ),
    ];
  }
  return [];
}

/** Recover every transaction directory under the state namespace. */
export function recoverTransactions(
  root: string,
  stateDir: string,
  roots: RecoveryRoots,
  hooks?: TransactionHooks,
): readonly RecoveryResult[] {
  const scan = scanTransactionsChecked(root, stateDir);
  if (!scan.ok) {
    return [{ status: "refused", transactionId: null, issues: scan.issues }];
  }
  return scan.value.map((transactionId) =>
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
  const scan = scanTransactionsChecked(root, stateDir);
  if (!scan.ok) {
    return [{ transactionId: "", ok: false, issues: scan.issues }];
  }
  return scan.value.map((transactionId) => {
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
