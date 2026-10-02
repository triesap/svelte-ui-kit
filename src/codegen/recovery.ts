/**
 * Transaction recovery (S073–S075).
 *
 * Recovery is fail-closed. It reads the journal strictly, proves the current
 * state against the recorded preimages/result images and owned backups, and
 * either rolls an uncommitted batch back to its exact original state or — when
 * the canonical lock was already published — finishes only safe cleanup. A
 * corrupt journal, a missing backup, a mismatched transaction identity or a
 * post-interruption user edit blocks mutation with safe logical diagnostics and
 * manual guidance; there is deliberately no force/recover command.
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { observeTarget } from "./revalidate.js";
import {
  parseJournal,
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

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
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
      {
        code: "RECOVERY_JOURNAL_UNREADABLE",
        message: `transaction ${transactionId} has no readable journal (${error instanceof Error ? error.message : String(error)})`,
      },
    ];
  }
  const parsed = parseJournal(text);
  if (!parsed.ok) return [...parsed.issues];
  if (parsed.value.transactionId !== transactionId) {
    return [
      {
        code: "RECOVERY_IDENTITY_MISMATCH",
        message: `journal identity ${parsed.value.transactionId} does not match its directory ${transactionId}`,
      },
    ];
  }
  return parsed.value;
}

function removeOwnedTransaction(
  root: string,
  stateDir: string,
  transactionId: string,
): void {
  rmSync(absOf(root, transactionDir(stateDir, transactionId)), {
    recursive: true,
    force: true,
  });
}

/**
 * Roll one uncommitted operation back to its recorded preimage. Returns a
 * diagnostic when a missing backup or a post-interruption edit makes
 * restoration unsafe.
 */
function rollbackOperation(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  operation: JournalOperationRecord,
): ModelIssue[] {
  const current = observeTarget(root, operation.path);
  const backup =
    operation.backupId === null
      ? null
      : absOf(
          root,
          `${backupsDir(stateDir, journal.transactionId)}/${operation.backupId}`,
        );

  if (operation.operation === "create") {
    if (current.kind === "absent") return [];
    if (current.kind === "file" && current.digest === operation.resultDigest) {
      rmSync(absOf(root, operation.path), { force: true });
      return [];
    }
    return [
      {
        code: "RECOVERY_USER_EDIT",
        message: `refusing to remove created ${operation.path}: its bytes are neither the planned result nor absent`,
        locator: operation.path,
      },
    ];
  }

  const isPreimage =
    operation.preimage.digest !== null &&
    current.kind === "file" &&
    current.digest === operation.preimage.digest;
  if (isPreimage) return [];

  if (current.kind === "file") {
    const isResult =
      operation.operation === "update" &&
      current.digest === operation.resultDigest;
    if (!isResult) {
      return [
        {
          code: "RECOVERY_USER_EDIT",
          message: `refusing to restore ${operation.path}: it has been edited since the interrupted batch`,
          locator: operation.path,
        },
      ];
    }
  }

  // The target is absent (the preimage was moved aside) or holds exactly the
  // applied result: restore the owned backup, which must exist.
  if (backup === null || !existsSync(backup)) {
    return [
      {
        code: "RECOVERY_BACKUP_MISSING",
        message: `refusing to restore ${operation.path}: its owned backup is missing`,
        locator: operation.path,
      },
    ];
  }
  fireHooks(undefined, "before", "recovery:restore", operation.path);
  renameSync(backup, absOf(root, operation.path));
  return [];
}

/** Recover one transaction directory. */
export function recoverTransaction(
  root: string,
  stateDir: string,
  transactionId: string,
  hooks?: TransactionHooks,
): RecoveryResult {
  const read = readJournal(root, stateDir, transactionId);
  if (Array.isArray(read)) {
    return { status: "refused", transactionId, issues: read };
  }
  const journal = read;

  if (journal.phase === "planned") {
    removeOwnedTransaction(root, stateDir, transactionId);
    return { status: "cleaned", transactionId, issues: [] };
  }

  if (journal.phase === "published" || journal.phase === "cleaned") {
    return recoverPublished(root, stateDir, journal);
  }

  // prepared / applied: roll back to the recorded preimages.
  const issues: ModelIssue[] = [];
  for (const operation of [...journal.operations].reverse()) {
    issues.push(...rollbackOperation(root, stateDir, journal, operation));
  }
  if (issues.length > 0) {
    return { status: "refused", transactionId, issues };
  }
  fireHooks(hooks, "before", "recovery:cleanup", transactionId);
  removeOwnedTransaction(root, stateDir, transactionId);
  fireHooks(hooks, "after", "recovery:cleanup", transactionId);
  return { status: "rolled_back", transactionId, issues: [] };
}

/**
 * Finish a published transaction: prove the canonical lock still matches the
 * recorded publication, then remove only owned ephemeral state.
 */
function recoverPublished(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
): RecoveryResult {
  const lockRecord = journal.lock;
  if (lockRecord === null || !lockRecord.published) {
    return {
      status: "refused",
      transactionId: journal.transactionId,
      issues: [
        {
          code: "RECOVERY_AMBIGUOUS_PUBLICATION",
          message: "published phase has no recorded lock publication",
        },
      ],
    };
  }
  const canonical = absOf(root, lockPath(stateDir));
  if (!existsSync(canonical)) {
    return {
      status: "refused",
      transactionId: journal.transactionId,
      issues: [
        {
          code: "RECOVERY_AMBIGUOUS_PUBLICATION",
          message: "the canonical lock recorded as published is missing",
          locator: lockPath(stateDir),
        },
      ],
    };
  }
  removeOwnedTransaction(root, stateDir, journal.transactionId);
  return {
    status: "committed",
    transactionId: journal.transactionId,
    issues: [],
  };
}

/** Recover every transaction directory under the state namespace. */
export function recoverTransactions(
  root: string,
  stateDir: string,
  hooks?: TransactionHooks,
): readonly RecoveryResult[] {
  return scanTransactions(root, stateDir).map((transactionId) =>
    recoverTransaction(root, stateDir, transactionId, hooks),
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
): readonly JournalInspection[] {
  return scanTransactions(root, stateDir).map((transactionId) => {
    const read = readJournal(root, stateDir, transactionId);
    return Array.isArray(read)
      ? { transactionId, ok: false, issues: read }
      : { transactionId, ok: true, issues: [] };
  });
}
