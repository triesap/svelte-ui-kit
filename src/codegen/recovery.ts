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
import { randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  lstatSync,
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
import { flushDirectory, isEmptyRemovalAbsence } from "./durability.js";
import {
  captureAncestors,
  identityDigest,
  observeRootIdentity,
} from "./authority.js";
import { removeOwnedAncestors } from "./owned-ancestry.js";
import {
  parseJournal,
  persistJournal,
  validateJournalTargets,
  type JournalCreatedDir,
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
  journalPath,
  lockPath,
  publicationIntentPath,
  publicationIntentTempName,
  stagedDir,
  transactionDir,
  transactionsDir,
  transientRoot,
  isTransactionId,
  writerLockDir,
} from "./transaction-types.js";
import {
  acquireWriterLock,
  holdsWriterLock,
  releaseWriterLock,
  verifyHeldWriterLock,
  readWriterLock,
} from "./write-lock.js";

export type RecoveryStatus =
  "no_change" | "rolled_back" | "cleaned" | "committed" | "refused";

export interface RecoveryResult {
  readonly status: RecoveryStatus;
  readonly transactionId: string | null;
  readonly issues: readonly ModelIssue[];
}

// Cleanup authority is issued only after journal, mapping and physical proof.
const RECOVERED_DIRECTORIES = new WeakMap<
  RecoveryResult,
  readonly JournalCreatedDir[]
>();
export function recoveredCreatedDirectories(
  result: RecoveryResult,
): readonly JournalCreatedDir[] {
  return RECOVERED_DIRECTORIES.get(result) ?? [];
}
function completedRollback(
  journal: TransactionJournal,
  status: "rolled_back" | "cleaned",
  issues: readonly ModelIssue[] = [],
): RecoveryResult {
  const result: RecoveryResult = {
    status,
    transactionId: journal.transactionId,
    issues,
  };
  RECOVERED_DIRECTORIES.set(result, journal.createdDirs ?? []);
  return result;
}
function nonCoordinationDirectories(
  journal: TransactionJournal,
  stateDir: string,
): readonly JournalCreatedDir[] {
  // Coordination ancestry remains occupied until the exclusive writer releases.
  return (journal.createdDirs ?? []).filter(
    (entry) => !isWithinRoot(stateDir, entry.path),
  );
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
  const logical = journalPath(stateDir, transactionId);
  const ancestors = captureAncestors(root, logical);
  if (!ancestors.ok)
    return [
      issue(
        "RECOVERY_UNSAFE_ANCESTRY",
        "The journal ancestry is not safe to inspect.",
        "journal.json",
      ),
    ];
  const observed = observeEntry(absOf(root, logical));
  if (
    observed.kind !== "file" &&
    observed.kind !== "absent" &&
    observed.kind !== "unreadable"
  )
    return [
      issue(
        "RECOVERY_UNSAFE_TARGET",
        "The retained journal is not a regular file; preserve it.",
        "journal.json",
      ),
    ];
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

/** True when `candidate` is `root` or a path below it (ASCII-case folded). */
function isWithinRoot(candidate: string, root: string): boolean {
  const foldedCandidate = candidate.toLowerCase();
  const foldedRoot = root.replace(/\/+$/, "").toLowerCase();
  return (
    foldedCandidate === foldedRoot ||
    foldedCandidate.startsWith(`${foldedRoot}/`)
  );
}

/**
 * Validate every recorded created-directory claim before any restore/removal.
 * Ownership is never "an empty directory with a matching device/inode": a
 * created directory must be an approved generated ancestor of at least one
 * journal operation (or the canonical lock), live within the approved mapping,
 * and have a safe real-directory ancestor chain. An arbitrary unrelated
 * directory claim is refused and preserved rather than deleted.
 */
function createdDirIssues(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  roots: RecoveryRoots,
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const targets = [
    ...journal.operations.map((operation) => operation.path),
    lockPath(stateDir),
  ];
  for (const created of journal.createdDirs ?? []) {
    const logical = created.path;
    const withinApprovedRoots =
      isWithinRoot(logical, roots.uiDir) ||
      isWithinRoot(logical, roots.stylesDir) ||
      // An ancestor of an independently rooted UI/styles/layout destination is
      // legitimate generated ancestry this attempt created (for example
      // `assets` above a custom `assets/styles` root), so it is approved in
      // either containment direction before the planner-ancestor check below.
      isWithinRoot(roots.uiDir, logical) ||
      isWithinRoot(roots.stylesDir, logical) ||
      logical === roots.layoutFile ||
      // A generated ancestor of the approved layout file is legitimate (for
      // example `src/routes` for `src/routes/+layout.svelte`).
      isWithinRoot(roots.layoutFile, logical) ||
      isWithinRoot(logical, stateDir);
    if (!withinApprovedRoots) {
      issues.push(
        issue(
          "RECOVERY_CREATED_DIR_UNAPPROVED",
          `journal created directory ${logical} is outside the approved generated roots; refusing to remove unrelated state`,
          logical,
        ),
      );
      continue;
    }
    const isAncestor = targets.some((target) =>
      target.toLowerCase().startsWith(`${logical.toLowerCase()}/`),
    );
    if (!isAncestor) {
      issues.push(
        issue(
          "RECOVERY_CREATED_DIR_UNAPPROVED",
          `journal created directory ${logical} is not an approved ancestor of any planned operation; refusing to remove unrelated state`,
          logical,
        ),
      );
      continue;
    }
    const ancestry = unsafeAncestry(
      root,
      `${logical}/__owned__`,
      journal.phase === "rolled_back"
        ? new Set((journal.createdDirs ?? []).map((entry) => entry.path))
        : undefined,
    );
    if (ancestry !== null) {
      issues.push(
        issue(
          "RECOVERY_UNSAFE_ANCESTRY",
          `refusing to remove created directory ${logical}: ${ancestry}`,
          logical,
        ),
      );
      continue;
    }
    // Preflight the physical identity before ANY restore/removal. Only the
    // exact empty directory this attempt recorded may be removed; a path that
    // now holds a different inode/device (or is absent/unreadable) is a
    // contradiction that must be preserved, not deleted or reported clean.
    let stats;
    try {
      stats = lstatSync(absOf(root, logical));
    } catch (error) {
      if (codeOf(error) === "ENOENT") continue;
      issues.push(
        issue(
          "RECOVERY_CREATED_DIR_IDENTITY",
          `refusing to remove created directory ${logical}: it could not be observed (${codeOf(error)})`,
          logical,
        ),
      );
      continue;
    }
    if (
      stats.isSymbolicLink() ||
      !stats.isDirectory() ||
      stats.dev !== created.device ||
      stats.ino !== created.inode
    ) {
      issues.push(
        issue(
          "RECOVERY_CREATED_DIR_IDENTITY",
          `refusing to remove created directory ${logical}: its physical identity contradicts the recorded creation evidence`,
          logical,
        ),
      );
    }
  }
  return issues;
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
function unsafeAncestry(
  root: string,
  logicalPath: string,
  removedOwned?: ReadonlySet<string>,
): string | null {
  const segments = logicalPath.split("/");
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index] as string);
    const entry = observeEntry(current);
    if (entry.kind === "absent") {
      if (removedOwned?.has(segments.slice(0, index + 1).join("/")))
        return null;
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

/** Terminal cleanup has no restoration authority: prove every original image. */
function terminalRollbackIssues(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
): ModelIssue[] {
  const problems = rootBindingIssues(root, journal);
  const removedOwned = new Set(
    (journal.createdDirs ?? []).map((entry) => entry.path),
  );
  for (const operation of journal.operations) {
    const ancestry = unsafeAncestry(root, operation.path, removedOwned);
    if (ancestry !== null) {
      problems.push(
        issue("RECOVERY_UNSAFE_ANCESTRY", ancestry, operation.path),
      );
      continue;
    }
    const current = currentImage(root, operation.path);
    const original = operation.preimage;
    if (
      !(original.kind === "absent" && current.kind === "absent") &&
      !(
        original.kind === "file" &&
        current.kind === "file" &&
        current.digest === original.digest &&
        current.mode === original.mode
      )
    ) {
      problems.push(
        issue(
          "RECOVERY_USER_EDIT",
          `terminal rollback cannot prove the original image of ${operation.path}; preserving the edited state`,
          operation.path,
        ),
      );
    }
    const retained = [
      ...(operation.stagedId === null
        ? []
        : [
            {
              path: `${stagedDir(stateDir, journal.transactionId)}/${operation.stagedId}`,
              digest: operation.resultDigest,
              mode: operation.resultMode,
            },
          ]),
      ...(operation.backupId === null
        ? []
        : [
            {
              path: `${backupsDir(stateDir, journal.transactionId)}/${operation.backupId}`,
              digest: original.digest,
              mode: original.mode,
            },
          ]),
    ];
    for (const record of retained) {
      const image = currentImage(root, record.path);
      if (
        image.kind !== "absent" &&
        !(
          image.kind === "file" &&
          image.digest === record.digest &&
          image.mode === record.mode
        )
      ) {
        problems.push(
          issue(
            "RECOVERY_BACKUP_CORRUPT",
            `terminal rollback evidence ${record.path} was changed; preserving it`,
            record.path,
          ),
        );
      }
    }
  }
  const witness = readPublicationIntent(
    root,
    publicationIntentPath(stateDir, journal.transactionId),
  );
  if (Array.isArray(witness)) return [...problems, ...witness];
  if (journal.lock?.published === true) {
    problems.push(
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "a terminal rollback cannot claim a published canonical lock",
      ),
    );
  }
  if (witness === null && journal.lock !== null) {
    problems.push(
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the terminal publication record has no witness; preserving evidence",
      ),
    );
  }
  if (witness !== null) {
    if (
      journal.lock === null ||
      witness.transactionId !== journal.transactionId ||
      witness.digest !== journal.lock.digest
    ) {
      problems.push(
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "the terminal publication witness contradicts the journal; preserving evidence",
        ),
      );
    }
    const stagedPath = `${stagedDir(stateDir, journal.transactionId)}/kit.lock.json`;
    const staged = currentImage(root, stagedPath);
    const stagedIdentity = observeFileIdentity(absOf(root, stagedPath));
    if (
      staged.kind !== "absent" &&
      !(
        staged.kind === "file" &&
        staged.digest === witness.digest &&
        staged.mode === witness.mode &&
        stagedIdentity !== null &&
        witness.staged !== null &&
        stagedIdentity.device === witness.staged.device &&
        stagedIdentity.inode === witness.staged.inode
      )
    ) {
      problems.push(
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "the retained staged publication image contradicts its physical witness; preserving evidence",
          stagedPath,
        ),
      );
    }
    problems.push(
      ...intentBindingIssues(root, stateDir, journal.transactionId, witness),
    );
    const canonical = observeEntry(absOf(root, lockPath(stateDir)));
    const identity = observeFileIdentity(absOf(root, lockPath(stateDir)));
    if (
      witness.planDigest !== journal.planDigest ||
      witness.rootIdentity !== journal.rootIdentity ||
      (!(witness.preimage === null && canonical.kind === "absent") &&
        !(
          witness.preimage !== null &&
          identity !== null &&
          witness.preimage.device === identity.device &&
          witness.preimage.inode === identity.inode
        ))
    ) {
      problems.push(
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "terminal rollback cannot prove the physical prepublication canonical image; preserving evidence",
        ),
      );
    }
  }
  return problems;
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
): ModelIssue[] {
  const current = currentImage(root, operation.path);
  if (operation.operation === "create") {
    if (current.kind === "file" && current.digest === operation.resultDigest) {
      try {
        rmSync(absOf(root, operation.path), { force: true });
      } catch (error) {
        return [
          issue(
            "RECOVERY_RESTORE_FAILED",
            `could not roll back created ${operation.path} (${codeOf(error)})`,
            operation.path,
          ),
        ];
      }
    }
    return [];
  }
  const atPreimage =
    operation.preimage.digest !== null &&
    current.kind === "file" &&
    current.digest === operation.preimage.digest;
  if (atPreimage) return [];
  if (operation.backupId === null) return [];
  const backup = backupPathAbs(
    root,
    stateDir,
    journal.transactionId,
    operation.backupId,
  );
  try {
    fireHooks(hooks, "before", "recovery:restore", operation.path);
    renameSync(backup, absOf(root, operation.path));
  } catch (error) {
    // An actual rename failure is a typed truthful partial outcome, never a
    // raw exception escaping exported recovery. The journal remains for a
    // later coordinated retry.
    return [
      issue(
        "RECOVERY_RESTORE_FAILED",
        `could not restore ${operation.path} (${codeOf(error)})`,
        operation.path,
      ),
    ];
  }
  if (operation.preimage.mode !== null) {
    try {
      chmodSync(absOf(root, operation.path), operation.preimage.mode);
    } catch {
      // The restored bytes are in place; a mode failure is reported by the
      // caller's inventory/cleanup step rather than silently ignored.
    }
  }
  try {
    fireHooks(hooks, "before", "durability:recovery", operation.path);
    // The restore rename moves the owned backup into the live target directory;
    // flush the target directory and the backup directory it left.
    flushDirectory(path.dirname(absOf(root, operation.path)));
    flushDirectory(path.dirname(backup));
    fireHooks(hooks, "after", "durability:recovery", operation.path);
  } catch (error) {
    return [
      issue(
        "RECOVERY_RESTORE_FAILED",
        `restore of ${operation.path} could not be flushed durably (${codeOf(error)})`,
        operation.path,
      ),
    ];
  }
  return [];
}

const OWNED_ENTRIES = new Set([
  "journal.json",
  "publication.json",
  "staged",
  "backups",
  "progress",
]);

/**
 * The authoritative owned proof entries. Their removals are made durable only
 * after the ephemeral owned removals are already durable, so a failed
 * prerequisite never destroys the journal/witness a coordinated retry needs.
 */
const OWNED_PROOF_ENTRIES = new Set(["journal.json", "publication.json"]);

function removeOwnedEntries(
  root: string,
  stateDir: string,
  transactionId: string,
  hooks?: TransactionHooks,
): ModelIssue[] {
  const dir = absOf(root, transactionDir(stateDir, transactionId));
  let names: string[];
  try {
    names = readdirSync(dir);
  } catch (error) {
    if (codeOf(error) === "ENOENT") return [];
    return [
      issue(
        "RECOVERY_CLEANUP_FAILED",
        `transaction ${transactionId} directory could not be listed for cleanup (${codeOf(error)})`,
      ),
    ];
  }
  // Remove only the exact owned top-level entries. The two temporary names are
  // owned by their recorded transaction id, never by a prefix pattern, so an
  // unrelated notes file that merely resembles a temporary journal survives.
  const ownedTempNames = new Set<string>([
    journalTempName(transactionId),
    publicationIntentTempName(transactionId),
  ]);
  const ephemeralOwned = names.filter(
    (name) => OWNED_ENTRIES.has(name) && !OWNED_PROOF_ENTRIES.has(name),
  );
  const tempEntries = names.filter((name) => ownedTempNames.has(name));
  const proofEntries = names.filter((name) => OWNED_PROOF_ENTRIES.has(name));

  const removeGroup = (
    group: readonly string[],
    recursive: boolean,
  ): ModelIssue[] => {
    for (const name of group) {
      try {
        rmSync(path.join(dir, name), { recursive, force: true });
      } catch (error) {
        if (codeOf(error) === "ENOENT") continue;
        return [
          issue(
            "RECOVERY_CLEANUP_FAILED",
            `owned transaction entry ${name} could not be removed (${codeOf(error)})`,
            name,
          ),
        ];
      }
    }
    return [];
  };
  const flushDir = (label: string): ModelIssue[] => {
    try {
      flushDirectory(dir);
      return [];
    } catch (error) {
      if (codeOf(error) === "ENOENT") return [];
      return [
        issue(
          "RECOVERY_CLEANUP_FAILED",
          `owned transaction ${transactionId} ${label} could not be flushed durably (${codeOf(error)})`,
        ),
      ];
    }
  };

  // Remove the ephemeral owned entries first and make those removals durable
  // before touching the authoritative journal/witness. A failed prerequisite
  // stops destructive progress with the proof retained for a coordinated
  // retry, rather than deleting the evidence while reporting a refusal.
  const ephemeralIssues = removeGroup(ephemeralOwned, true);
  if (ephemeralIssues.length > 0) return ephemeralIssues;
  const tempIssues = removeGroup(tempEntries, false);
  if (tempIssues.length > 0) return tempIssues;
  const ephemeralFlush = flushDir("directory removals");
  if (ephemeralFlush.length > 0) return ephemeralFlush;

  const proofIssues = removeGroup(proofEntries, false);
  if (proofIssues.length > 0) return proofIssues;
  const proofFlush = flushDir("journal/witness removals");
  if (proofFlush.length > 0) return proofFlush;

  try {
    fireHooks(hooks, "before", "recovery:cleanup-dir", transactionId);
    rmdirSync(dir);
  } catch (error) {
    if (codeOf(error) !== "ENOENT") {
      return [
        issue(
          "RECOVERY_CLEANUP_FAILED",
          `transaction ${transactionId} directory could not be removed (${codeOf(error)})`,
        ),
      ];
    }
  }
  // Flush the transaction namespace so a crash cannot resurrect the removed
  // transaction directory after recovery already proved it safe to remove.
  try {
    flushDirectory(path.dirname(dir));
  } catch (error) {
    if (codeOf(error) !== "ENOENT") {
      return [
        issue(
          "RECOVERY_CLEANUP_FAILED",
          `the transaction namespace removal of ${transactionId} could not be flushed durably (${codeOf(error)})`,
        ),
      ];
    }
  }
  return [];
}

/**
 * Removal of empty owned transient directories after a release. A failed
 * parent flush stops further destructive progress and is returned as a typed
 * issue rather than silently swallowed, so recovery never reports a false
 * clean success when its namespace removal was not durable.
 */
function cleanupReleasedTransient(
  root: string,
  stateDir: string,
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const [logical, parent] of [
    [transactionsDir(stateDir), transientRoot(stateDir)],
    [transientRoot(stateDir), stateDir],
  ] as const) {
    try {
      rmdirSync(absOf(root, logical));
    } catch (error) {
      const code = codeOf(error);
      // A real I/O, permission or kind fault while removing an empty owned
      // directory is not a clean absence or a non-empty guard: report it as a
      // typed issue and stop destructive progress. Swallowing it would report
      // a false clean recovery while leaving owned residue behind.
      if (isEmptyRemovalAbsence(code)) continue;
      issues.push(
        issue(
          "RECOVERY_CLEANUP_FAILED",
          `owned transient directory ${logical} could not be removed (${code})`,
          logical,
        ),
      );
      return issues;
    }
    // Durable removal of the now-empty owned transient directory in its parent.
    try {
      flushDirectory(absOf(root, parent));
    } catch (error) {
      issues.push(
        issue(
          "RECOVERY_CLEANUP_FAILED",
          `owned transient directory ${logical} was removed but its parent could not be flushed durably (${codeOf(error)})`,
          logical,
        ),
      );
      return issues;
    }
  }
  return issues;
}

/**
 * Recover one transaction with proven exclusive coordination. When this
 * process already holds the writer lock (the guarded apply path) recovery runs
 * directly; otherwise it acquires the lock, recovers, releases and finishes.
 * A live foreign owner is refused busy and its evidence retained.
 */
export function recoverTransaction(
  root: string,
  stateDir: string,
  transactionId: string,
  roots: RecoveryRoots,
  hooks?: TransactionHooks,
): RecoveryResult {
  if (holdsWriterLock(root, stateDir)) {
    const contradiction = verifyHeldWriterLock(root, stateDir);
    if (contradiction.length > 0) return refuse(transactionId, contradiction);
    return recoverTransactionUnderLock(
      root,
      stateDir,
      transactionId,
      roots,
      hooks,
    );
  }
  const acquired = acquireWriterLock(root, stateDir, randomUUID(), hooks);
  if (!acquired.ok) {
    return refuse(transactionId, acquired.issues);
  }
  const ownedCreated = acquired.value.createdDirectories;
  let result: RecoveryResult | undefined;
  let releaseIssues: readonly ModelIssue[] = [];
  let transientIssues: readonly ModelIssue[];
  try {
    result = recoverTransactionUnderLock(
      root,
      stateDir,
      transactionId,
      roots,
      hooks,
    );
  } finally {
    const outcome = releaseWriterLock(acquired.value, hooks);
    if (!outcome.ok) releaseIssues = outcome.issues;
    transientIssues = cleanupReleasedTransient(root, stateDir);
  }
  // Remove only the empty state-directory ancestry this recovery created after
  // the transient namespace is gone, so a standalone recovery leaves no owned
  // residue. A directory that is no longer empty is preserved and reported.
  const ancestryIssues = removeOwnedAncestors(
    root,
    [
      ...ownedCreated,
      ...(result === undefined ? [] : recoveredCreatedDirectories(result)),
    ],
    hooks,
  );
  const coordinationIssues = [
    ...releaseIssues,
    ...transientIssues,
    ...ancestryIssues,
  ];
  if (result === undefined) return refuse(transactionId, coordinationIssues);
  if (coordinationIssues.length === 0) return result;
  // The transaction state was recovered, but its namespace removal was not
  // durable (or coordination was not released): never report a false clean
  // success. The recovered outcome stays truthful through the issue list.
  return {
    status: "refused",
    transactionId,
    issues: [...result.issues, ...coordinationIssues],
  };
}

/** Recover one transaction directory against the approved mapping. */
function recoverTransactionUnderLock(
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
      flushDirectory(path.dirname(dirAbs));
    } catch (error) {
      if (codeOf(error) !== "ENOENT") {
        return refuse(transactionId, [
          issue(
            "RECOVERY_CLEANUP_FAILED",
            `empty transaction ${transactionId} directory could not be durably removed (${codeOf(error)})`,
          ),
        ]);
      }
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
          stagedIdentity: observeFileIdentity(
            absOf(root, `${stagedDir(stateDir, transactionId)}/kit.lock.json`),
          ),
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
      const cleanup = removeOwnedEntries(root, stateDir, transactionId, hooks);
      if (cleanup.length > 0) return refuse(transactionId, cleanup);
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
  if (journal.phase === "rolled_back") {
    const terminal = terminalRollbackIssues(root, stateDir, journal);
    if (terminal.length > 0) return refuse(transactionId, terminal);
  }
  const createdDirs = createdDirIssues(root, stateDir, journal, roots);
  if (createdDirs.length > 0) return refuse(transactionId, createdDirs);

  if (journal.phase === "rolled_back") {
    const ancestry = removeOwnedAncestors(
      root,
      nonCoordinationDirectories(journal, stateDir),
      hooks,
    );
    if (ancestry.length > 0) return refuse(transactionId, ancestry);
    fireHooks(hooks, "before", "recovery:cleanup", transactionId);
    const cleanup = removeOwnedEntries(root, stateDir, transactionId, hooks);
    if (cleanup.length > 0) return refuse(transactionId, cleanup);
    fireHooks(hooks, "after", "recovery:cleanup", transactionId);
    return completedRollback(journal, "rolled_back");
  }

  if (journal.phase === "planned") {
    const binding = rootBindingIssues(root, journal);
    if (binding.length > 0) return refuse(transactionId, binding);
    // A planned transaction wrote no live bytes; its owned empty ancestry is
    // removed only when every identity/removal/flush issue is proven. A
    // contradiction or durability fault is refused with the journal preserved
    // rather than discarding proof while reporting clean.
    const ancestryIssues = removeOwnedAncestors(
      root,
      nonCoordinationDirectories(journal, stateDir),
      hooks,
    );
    if (ancestryIssues.length > 0) {
      return refuse(transactionId, ancestryIssues);
    }
    const cleanup = removeOwnedEntries(root, stateDir, transactionId, hooks);
    if (cleanup.length > 0) return refuse(transactionId, cleanup);
    return completedRollback(journal, "cleaned");
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
    if (
      intentRead !== null &&
      (intentRead.planDigest !== journal.planDigest ||
        intentRead.rootIdentity !== journal.rootIdentity)
    ) {
      return refuse(transactionId, [
        issue(
          "RECOVERY_AMBIGUOUS_PUBLICATION",
          "the publication witness plan or root identity contradicts the recovered journal; refusing to roll back or discard evidence",
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
    const stagedIdentity = observeFileIdentity(
      absOf(root, `${stagedDir(stateDir, transactionId)}/kit.lock.json`),
    );
    const state = classifyPublication({
      intent: intentRead,
      canonical: observeFileIdentity(canonicalAbs),
      stagedIdentity,
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
  const restoreIssues: ModelIssue[] = [];
  for (const operation of [...journal.operations].reverse()) {
    restoreIssues.push(
      ...rollbackOperation(root, stateDir, journal, operation, hooks),
    );
  }
  if (restoreIssues.length > 0) {
    // A restore/durability failure is a truthful partial outcome: the journal
    // and any un-restored owned evidence are retained for a later coordinated
    // retry rather than being deleted as if the rollback completed.
    return refuse(transactionId, restoreIssues);
  }
  // Record completion durably BEFORE removing any created ancestor. A later
  // cleanup retry may observe those owned directories absent but can never
  // regain authority to restore/write semantic files from a terminal record.
  try {
    persistJournal(
      root,
      journalPath(stateDir, transactionId),
      { ...journal, phase: "rolled_back" },
      hooks,
    );
  } catch (error) {
    return refuse(transactionId, [
      issue(
        "RECOVERY_CLEANUP_FAILED",
        `could not persist completed rollback (${codeOf(error)}); retaining journal and ancestry`,
      ),
    ]);
  }
  // Remove only the recorded owned empty ancestry directories this attempt
  // created; a directory that is no longer empty is preserved and reported.
  const ancestryIssues = removeOwnedAncestors(
    root,
    nonCoordinationDirectories(journal, stateDir),
    hooks,
  );
  if (ancestryIssues.length > 0) return refuse(transactionId, ancestryIssues);
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  const cleanupIssues = inventoryIssues(root, stateDir, transactionId, journal);
  if (cleanupIssues.length > 0) return refuse(transactionId, cleanupIssues);
  const removalIssues = removeOwnedEntries(
    root,
    stateDir,
    transactionId,
    hooks,
  );
  if (removalIssues.length > 0) {
    return refuse(transactionId, [...ancestryIssues, ...removalIssues]);
  }
  fireHooks(hooks, "after", "recovery:cleanup", transactionId);
  return completedRollback(journal, "rolled_back", ancestryIssues);
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
  const removalIssues = removeOwnedEntries(
    root,
    stateDir,
    transactionId,
    hooks,
  );
  if (removalIssues.length > 0) return refuse(transactionId, removalIssues);
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
  // Bind the witness to the complete journal identity. A witness whose plan
  // digest or root identity contradicts the recovered journal is inconsistent
  // evidence: it must be preserved and refused, never cleaned as if the
  // publication were proven.
  if (
    intentRead.planDigest !== journal.planDigest ||
    intentRead.rootIdentity !== journal.rootIdentity
  ) {
    return [
      issue(
        "RECOVERY_AMBIGUOUS_PUBLICATION",
        "the publication witness plan or root identity contradicts the recovered journal; preserving contradictory evidence rather than cleaning",
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
  if (holdsWriterLock(root, stateDir)) {
    const contradiction = verifyHeldWriterLock(root, stateDir);
    if (contradiction.length > 0) {
      return [
        { status: "refused", transactionId: null, issues: contradiction },
      ];
    }
    return recoverScannedTransactions(root, stateDir, roots, hooks);
  }
  const acquired = acquireWriterLock(root, stateDir, randomUUID(), hooks);
  if (!acquired.ok) {
    return [
      { status: "refused", transactionId: null, issues: acquired.issues },
    ];
  }
  const ownedCreated = acquired.value.createdDirectories;
  let results: readonly RecoveryResult[] | undefined;
  let releaseIssues: readonly ModelIssue[] = [];
  let transientIssues: readonly ModelIssue[];
  try {
    results = recoverScannedTransactions(root, stateDir, roots, hooks);
  } finally {
    const outcome = releaseWriterLock(acquired.value, hooks);
    if (!outcome.ok) releaseIssues = outcome.issues;
    transientIssues = cleanupReleasedTransient(root, stateDir);
  }
  const ancestryIssues = removeOwnedAncestors(
    root,
    [...ownedCreated, ...(results ?? []).flatMap(recoveredCreatedDirectories)],
    hooks,
  );
  const coordinationIssues = [
    ...releaseIssues,
    ...transientIssues,
    ...ancestryIssues,
  ];
  if (results === undefined) {
    return [
      { status: "refused", transactionId: null, issues: coordinationIssues },
    ];
  }
  if (coordinationIssues.length === 0) return results;
  // A recovered transaction whose coordination or namespace removal was not
  // durable must be exposed in the aggregate, not hidden behind clean rows.
  return [
    ...results,
    { status: "refused", transactionId: null, issues: coordinationIssues },
  ];
}

function recoverScannedTransactions(
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
    recoverTransactionUnderLock(root, stateDir, transactionId, roots, hooks),
  );
}

export interface JournalInspection {
  readonly transactionId: string;
  readonly ok: boolean;
  readonly issues: readonly ModelIssue[];
}

/**
 * An unchanged plan grants no recovery authority. Observe the independently
 * resolved mapping without acquiring a writer, removing evidence or following
 * links. Physical safety wins over coordination; coordination wins over journal
 * diagnosis; all journals are checked before reporting merely pending state.
 */
export function inspectUnchangedState(
  root: string,
  stateDir: string,
  roots: RecoveryRoots,
): readonly ModelIssue[] {
  const namespace = transientRoot(stateDir);
  const unreadable = (logical: string) =>
    issue(
      isWithinRoot(logical, writerLockDir(stateDir))
        ? "WRITER_LOCK_UNAVAILABLE"
        : "RECOVERY_INVENTORY_UNREADABLE",
      "Retained state cannot be inspected; preserve it before retrying.",
      namespace,
    );
  const unsafe = (locator: string) =>
    issue(
      "RECOVERY_UNSAFE_TARGET",
      "Retained state or an approved target is not a safe regular entry; preserve it before retrying.",
      locator,
    );
  const safeTarget = (
    logical: string,
    kind: "file" | "directory",
  ): ModelIssue[] => {
    const ancestors = captureAncestors(root, logical);
    if (!ancestors.ok) return [unsafe(namespace)];
    const observed = observeEntry(absOf(root, logical));
    if (observed.kind === "absent" || observed.kind === kind) return [];
    if (observed.kind === "unreadable") return [unreadable(logical)];
    return [unsafe(namespace)];
  };
  const rootIdentity = observeRootIdentity(root);
  if (!rootIdentity.ok) return rootIdentity.issues;
  const physical: ModelIssue[] = [
    ...safeTarget(roots.uiDir, "directory"),
    ...safeTarget(roots.stylesDir, "directory"),
    ...safeTarget(stateDir, "directory"),
    ...safeTarget(roots.layoutFile, "file"),
    ...safeTarget(lockPath(stateDir), "file"),
  ];
  if (physical.length > 0) return physical;
  // Walk metadata first, never read a FIFO, symlink or other special entry.
  // Unknown regular inventory is diagnosed later, after coordination.
  const walk = (logical: string): void => {
    const entry = observeEntry(absOf(root, logical));
    if (entry.kind === "absent") return;
    if (entry.kind === "unreadable") {
      physical.push(unreadable(logical));
    } else if (entry.kind === "directory") {
      try {
        for (const name of readdirSync(absOf(root, logical)).sort())
          walk(`${logical}/${name}`);
      } catch {
        physical.push(unreadable(logical));
      }
    } else if (entry.kind !== "file") physical.push(unsafe(namespace));
  };
  walk(namespace);
  // Expected directory/file kinds also matter when the wrong entry is regular.
  for (const logical of [
    namespace,
    writerLockDir(stateDir),
    transactionsDir(stateDir),
  ])
    physical.push(...safeTarget(logical, "directory"));
  physical.push(...safeTarget(`${writerLockDir(stateDir)}/owner.json`, "file"));
  if (physical.length > 0) return physical;
  let names: string[];
  let namespaceNames: string[];
  try {
    names =
      observeEntry(absOf(root, transactionsDir(stateDir))).kind === "absent"
        ? []
        : readdirSync(absOf(root, transactionsDir(stateDir))).sort();
    namespaceNames =
      observeEntry(absOf(root, namespace)).kind === "absent"
        ? []
        : readdirSync(absOf(root, namespace));
  } catch {
    return [
      issue(
        "RECOVERY_SCAN_UNREADABLE",
        "Retained transaction state cannot be listed.",
        namespace,
      ),
    ];
  }
  const journals = new Map<string, TransactionJournal | ModelIssue[]>();
  for (const id of names.filter(isTransactionId)) {
    const dir = transactionDir(stateDir, id);
    physical.push(...safeTarget(dir, "directory"));
    for (const sub of ["staged", "backups", "progress"])
      physical.push(...safeTarget(`${dir}/${sub}`, "directory"));
    for (const file of [
      "journal.json",
      "publication.json",
      journalTempName(id),
      publicationIntentTempName(id),
    ])
      physical.push(...safeTarget(`${dir}/${file}`, "file"));
    if (physical.length > 0) continue;
    if (observeEntry(absOf(root, journalPath(stateDir, id))).kind === "absent")
      continue;
    const read = readJournal(root, stateDir, id);
    journals.set(id, read);
    if (Array.isArray(read)) continue;
    const mapping = validateJournalTargets(read, { ...roots, stateDir });
    // A journal cannot select physical inspection targets outside the mapping.
    if (!mapping.ok) continue;
    for (const operation of read.operations)
      physical.push(...safeTarget(operation.path, "file"));
    for (const created of read.createdDirs ?? []) {
      const approved = [
        roots.uiDir,
        roots.stylesDir,
        roots.layoutFile,
        stateDir,
      ].some(
        (logical) =>
          isWithinRoot(created.path, logical) ||
          isWithinRoot(logical, created.path),
      );
      if (!approved) continue;
      const ancestry = captureAncestors(root, `${created.path}/__owned__`);
      if (!ancestry.ok) physical.push(unsafe(namespace));
    }
  }
  if (physical.length > 0) return physical;
  const writer = readWriterLock(root, stateDir);
  if (writer.kind !== "absent") {
    let exact = false;
    try {
      exact = readdirSync(absOf(root, writerLockDir(stateDir))).every(
        (name) => name === "owner.json",
      );
    } catch {
      /* Ambiguous ownership stays unavailable. */
    }
    return [
      issue(
        writer.kind === "held" && exact
          ? "WRITER_BUSY"
          : "WRITER_LOCK_UNAVAILABLE",
        "Retained writer coordination prevents unchanged-command success; preserve its evidence.",
        writerLockDir(stateDir),
      ),
    ];
  }
  const problems: ModelIssue[] = [];
  // Never echo arbitrary journal values or unexpected filesystem names: all
  // diagnostic locators are rooted in the independently approved namespace.
  const retain = (entries: readonly ModelIssue[], locator: string): void => {
    problems.push(
      ...entries.map((entry) =>
        issue(
          entry.code,
          "Retained transaction evidence could not be qualified; preserve it and follow the recovery guidance.",
          locator,
        ),
      ),
    );
  };
  if (
    namespaceNames.some(
      (name) => name !== "writer.lock" && name !== "transactions",
    ) ||
    names.some((name) => !isTransactionId(name))
  )
    problems.push(
      issue(
        "RECOVERY_UNEXPECTED_ENTRY",
        "The reserved namespace contains unrecorded inventory; preserve it.",
        namespace,
      ),
    );
  for (const id of names.filter(isTransactionId)) {
    const locator = namespace;
    const read = journals.get(id);
    if (Array.isArray(read)) {
      retain(read, locator);
      continue;
    }
    if (read === undefined) {
      if (hasRollbackEvidence(root, stateDir, id)) {
        problems.push(
          issue(
            "RECOVERY_AMBIGUOUS_JOURNAL",
            "Possible mutation evidence remains without a journal; preserve it.",
            locator,
          ),
        );
        continue;
      }
      retain(inventoryIssues(root, stateDir, id, null), locator);
      const intent = readPublicationIntent(
        root,
        publicationIntentPath(stateDir, id),
      );
      if (Array.isArray(intent)) {
        retain(intent, locator);
        continue;
      }
      if (intent !== null) {
        retain(intentBindingIssues(root, stateDir, id, intent), locator);
        if (
          intent.transactionId !== id ||
          classifyPublication({
            intent,
            canonical: observeFileIdentity(absOf(root, lockPath(stateDir))),
            stagedIdentity: observeFileIdentity(
              absOf(root, `${stagedDir(stateDir, id)}/kit.lock.json`),
            ),
            expectedDigest: intent.digest,
            canonicalDigest: readFileSafe(root, lockPath(stateDir)),
          }) !== "published"
        )
          problems.push(
            issue(
              "RECOVERY_AMBIGUOUS_PUBLICATION",
              "The retained witness cannot prove publication; preserve it.",
              locator,
            ),
          );
      }
      continue;
    }
    const mapping = validateJournalTargets(read, { ...roots, stateDir });
    if (!mapping.ok) {
      retain(mapping.issues, locator);
      continue;
    }
    retain(rootBindingIssues(root, read), locator);
    retain(inventoryIssues(root, stateDir, id, read), locator);
    retain(createdDirIssues(root, stateDir, read, roots), locator);
    if (read.phase === "rolled_back") {
      retain(terminalRollbackIssues(root, stateDir, read), locator);
      continue;
    }
    const intent = readPublicationIntent(
      root,
      publicationIntentPath(stateDir, id),
    );
    if (Array.isArray(intent)) {
      retain(intent, locator);
      continue;
    }
    let published = read.phase === "published" || read.phase === "cleaned";
    if (intent !== null) {
      retain(intentBindingIssues(root, stateDir, id, intent), locator);
      if (
        intent.transactionId !== id ||
        intent.planDigest !== read.planDigest ||
        intent.rootIdentity !== read.rootIdentity ||
        read.lock === null ||
        intent.digest !== read.lock.digest
      ) {
        problems.push(
          issue(
            "RECOVERY_AMBIGUOUS_PUBLICATION",
            "The publication witness contradicts its journal; preserve both.",
            locator,
          ),
        );
        continue;
      }
      const classification = classifyPublication({
        intent,
        canonical: observeFileIdentity(absOf(root, lockPath(stateDir))),
        stagedIdentity: observeFileIdentity(
          absOf(root, `${stagedDir(stateDir, id)}/kit.lock.json`),
        ),
        expectedDigest: intent.digest,
        canonicalDigest: readFileSafe(root, lockPath(stateDir)),
      });
      if (classification === "ambiguous") {
        problems.push(
          issue(
            "RECOVERY_AMBIGUOUS_PUBLICATION",
            "The publication outcome cannot be proven; preserve its evidence.",
            locator,
          ),
        );
        continue;
      }
      published ||= classification === "published";
    }
    if (published) {
      if (
        read.lock === null ||
        readFileSafe(root, lockPath(stateDir)) !== read.lock.digest
      )
        problems.push(
          issue(
            "RECOVERY_AMBIGUOUS_PUBLICATION",
            "The canonical lock contradicts the retained publication; preserve it.",
            locator,
          ),
        );
      retain(verifyPublishedEvidence(root, stateDir, id, read), locator);
    } else if (read.phase !== "planned") {
      for (const operation of read.operations)
        retain(preflightRollback(root, stateDir, id, operation), locator);
    }
  }
  return problems.length > 0
    ? problems
    : names.length > 0
      ? [
          issue(
            "RECOVERY_PENDING",
            "Retained transactions require recovery disposition before unchanged-command success.",
            transactionsDir(stateDir),
          ),
        ]
      : [];
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
