/**
 * Canonical install-lock publication (S071).
 *
 * `kit.lock.json` is the semantic commit point. It is validated as a complete
 * lock and published *after* every source/CSS/config/export/layout target has
 * been replaced. The staged lock is written on the same filesystem and renamed
 * over the canonical path; an invalid planned lock never replaces existing
 * state.
 *
 * A publication whose bytes equal the current lock is still recorded with the
 * unique transaction id and an `unchanged` flag, because byte equality alone is
 * not a commit event.
 */
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import { parseKitLock } from "./lock.js";
import {
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import { journalPath, lockPath, stagedDir } from "./transaction-types.js";

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
  const validated = parseKitLock(parsed, lockPath(stateDir), { stateDir });
  if (!validated.ok) {
    issues.push(...validated.issues);
    return { ok: false, issues };
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Publish the validated lock last. The current lock is read only to classify an
 * unchanged-byte publication; it is never overwritten until the staged lock has
 * been fully written.
 */
export function publishLock(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  lockBytes: Uint8Array,
  hooks?: TransactionHooks,
): LockPublicationResult {
  const validation = validateLockForPublication(journal, lockBytes, stateDir);
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

  const stagedLock = absOf(
    root,
    `${stagedDir(stateDir, journal.transactionId)}/kit.lock.json`,
  );
  try {
    mkdirSync(path.dirname(stagedLock), { recursive: true, mode: 0o700 });
    fireHooks(hooks, "before", "lock:stage", lockPath(stateDir));
    writeFileSync(stagedLock, lockBytes, { mode: 0o600 });
    fireHooks(hooks, "after", "lock:stage", lockPath(stateDir));

    fireHooks(hooks, "before", "lock:publish", lockPath(stateDir));
    mkdirSync(path.dirname(destination), { recursive: true });
    renameSync(stagedLock, destination);
    fireHooks(hooks, "after", "lock:publish", lockPath(stateDir));
  } catch (error) {
    return {
      ok: false,
      journal,
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
