/**
 * Canonical install-lock publication (S071, repaired for RCLD04-R1-3).
 *
 * `kit.lock.json` is the semantic commit point. It is validated as a complete
 * lock and published *after* every source/CSS/config/export/layout target has
 * been replaced. The staged lock is written on the same filesystem and renamed
 * over the canonical path; an invalid planned lock never replaces existing
 * state.
 *
 * A durable *publication intent* is persisted before the rename. If the process
 * is killed between the intent and the rename, recovery proves from the
 * canonical bytes whether the commit happened: a matching digest is a completed
 * publication (cleanup only), a non-matching digest is an uncommitted batch
 * (safe rollback). This closes the interruption window that previously left the
 * journal at `applied` and the new lock in place.
 *
 * A publication whose bytes equal the current lock is still recorded with the
 * unique transaction id and an `unchanged` flag, because byte equality alone is
 * not a commit event. The existing canonical mode is preserved.
 */
import {
  mkdirSync,
  readFileSync,
  renameSync,
  chmodSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory, flushFile } from "./durability.js";
import { parseKitLock, type LockValidationContext } from "./lock.js";
import {
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import {
  observeFileIdentity,
  writePublicationIntent,
} from "./publication-intent.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
} from "./transaction-types.js";

export interface LockPublicationResult {
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

/**
 * Validate the planned lock bytes and confirm the replacement journal is fully
 * applied. A partial or failed journal gives the lock no publication rights.
 */
export function validateLockForPublication(
  journal: TransactionJournal,
  lockBytes: Uint8Array,
  stateDir: string,
  context: LockValidationContext = {},
): { readonly ok: boolean; readonly issues: readonly ModelIssue[] } {
  const issues: ModelIssue[] = [];
  if (journal.phase !== "applied") {
    issues.push({
      code: "LOCK_EARLY_PUBLICATION",
      message: `lock publication requires an applied journal, found "${journal.phase}"`,
      locator: lockPath(stateDir),
    });
  }
  if (journal.operations.some((operation) => !operation.applied)) {
    issues.push({
      code: "LOCK_PARTIAL_APPLICATION",
      message:
        "lock publication requires every planned replacement to be applied",
      locator: lockPath(stateDir),
    });
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(lockBytes).toString("utf8"));
  } catch (error) {
    issues.push({
      code: "LOCK_INVALID",
      message: `planned lock is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
      locator: lockPath(stateDir),
    });
    return { ok: false, issues };
  }
  const validated = parseKitLock(parsed, lockPath(stateDir), {
    ...context,
    stateDir,
  });
  if (!validated.ok) {
    issues.push(...validated.issues);
    return { ok: false, issues };
  }
  return { ok: issues.length === 0, issues };
}

/** Read the current canonical lock mode, or `fallback` when it is absent. */
function currentLockMode(
  root: string,
  stateDir: string,
  fallback: number,
): number {
  try {
    return statSync(absOf(root, lockPath(stateDir))).mode & 0o777;
  } catch {
    return fallback;
  }
}

/**
 * Publish the validated lock last. A durable publication intent is persisted
 * before the rename; the target mode is preserved from the existing canonical
 * lock, or taken from the planned preimage for a fresh install.
 */
export function publishLock(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  lockBytes: Uint8Array,
  mode = 0o644,
  context: LockValidationContext = {},
  hooks?: TransactionHooks,
): LockPublicationResult {
  const validation = validateLockForPublication(
    journal,
    lockBytes,
    stateDir,
    context,
  );
  if (!validation.ok) {
    return { ok: false, journal, issues: validation.issues };
  }

  const destination = absOf(root, lockPath(stateDir));
  let unchanged: boolean;
  try {
    unchanged = sha256Hex(readFileSync(destination)) === sha256Hex(lockBytes);
  } catch {
    unchanged = false;
  }
  const effectiveMode = currentLockMode(root, stateDir, mode);

  // Durable publication intent. Recovery classifies a crash after this point by
  // comparing the canonical bytes to the recorded digest.
  const intent: TransactionJournal = {
    ...journal,
    phase: "applied",
    lock: {
      path: lockPath(stateDir),
      digest: sha256Hex(lockBytes),
      published: false,
      unchanged,
    },
  };
  try {
    persistJournal(
      root,
      journalPath(stateDir, journal.transactionId),
      intent,
      hooks,
    );
  } catch (error) {
    return {
      ok: false,
      journal: intent,
      issues: [
        {
          code: "LOCK_INTENT_FAILED",
          message: `could not persist the publication intent: ${codeOf(error)}`,
          locator: lockPath(stateDir),
        },
      ],
    };
  }

  const stagedLock = absOf(
    root,
    `${stagedDir(stateDir, journal.transactionId)}/kit.lock.json`,
  );
  try {
    mkdirSync(path.dirname(stagedLock), { recursive: true, mode: 0o700 });
    fireHooks(hooks, "before", "lock:stage", lockPath(stateDir));
    writeFileSync(stagedLock, lockBytes, { mode: effectiveMode });
    chmodSync(stagedLock, effectiveMode);
    fireHooks(hooks, "before", "durability:lock-stage", lockPath(stateDir));
    flushFile(stagedLock);
    // The staged lock's directory entry must be durable before the publication
    // intent records its physical identity; otherwise a crash could preserve an
    // intent that names an image the filesystem never durably created.
    flushDirectory(path.dirname(stagedLock));
    fireHooks(hooks, "after", "durability:lock-stage", lockPath(stateDir));
    fireHooks(hooks, "after", "lock:stage", lockPath(stateDir));

    // Record the physical rename witness before the canonical rename: the
    // exact canonical preimage identity and the uniquely identified staged
    // publication image. Recovery uses this instead of byte equality alone.
    try {
      writePublicationIntent(
        root,
        publicationIntentPath(stateDir, journal.transactionId),
        {
          schemaVersion: 1,
          transactionId: journal.transactionId,
          rootIdentity: journal.rootIdentity,
          planDigest: journal.planDigest,
          digest: sha256Hex(lockBytes),
          mode: effectiveMode,
          preimage: observeFileIdentity(destination),
          staged: observeFileIdentity(stagedLock),
        },
      );
    } catch (error) {
      return {
        ok: false,
        journal: intent,
        issues: [
          {
            code: "LOCK_INTENT_FAILED",
            message: `could not persist the publication witness: ${codeOf(error)}`,
            locator: lockPath(stateDir),
          },
        ],
      };
    }

    fireHooks(hooks, "before", "lock:publish", lockPath(stateDir));
    mkdirSync(path.dirname(destination), { recursive: true });
    renameSync(stagedLock, destination);
    chmodSync(destination, effectiveMode);
    fireHooks(hooks, "before", "durability:lock-publish", lockPath(stateDir));
    // The canonical rename is cross-directory: flush the destination directory
    // that gained the lock and the staged directory that lost it.
    flushDirectory(path.dirname(destination));
    flushDirectory(path.dirname(stagedLock));
    fireHooks(hooks, "after", "durability:lock-publish", lockPath(stateDir));
    fireHooks(hooks, "after", "lock:publish", lockPath(stateDir));
  } catch (error) {
    return {
      ok: false,
      journal: intent,
      issues: [
        {
          code: "LOCK_PUBLICATION_FAILED",
          message: `could not publish the install lock: ${codeOf(error)}`,
          locator: lockPath(stateDir),
        },
      ],
    };
  }

  const published: TransactionJournal = {
    ...journal,
    phase: "published",
    lock: {
      path: lockPath(stateDir),
      digest: sha256Hex(lockBytes),
      published: true,
      unchanged,
    },
  };
  try {
    persistJournal(
      root,
      journalPath(stateDir, journal.transactionId),
      published,
      hooks,
    );
  } catch (error) {
    // The lock is already published; the durable publication record is what
    // failed. Report a committed-but-needs-cleanup outcome rather than
    // pretending the batch did not commit.
    return {
      ok: false,
      journal: published,
      issues: [
        {
          code: "LOCK_RECORD_FAILED",
          message: `the lock was published but its journal record could not be persisted: ${codeOf(error)}`,
          locator: lockPath(stateDir),
        },
      ],
    };
  }
  return { ok: true, journal: published, issues: [] };
}
