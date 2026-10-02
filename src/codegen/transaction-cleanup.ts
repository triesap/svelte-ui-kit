/**
 * Owned transaction cleanup and safe ignore integration (S072).
 *
 * After the install lock is published, only ephemeral state remains. Cleanup
 * removes the transaction's owned staging, backups and progress records, then
 * its journal and directory, in that order. It removes only the directory named
 * by the transaction id it was given, so another transaction's state and any
 * unrelated temporary entry survive. If cleanup cannot finish, the caller
 * reports a committed-but-needs-cleanup outcome and the evidence is retained
 * rather than deleted unsafely.
 *
 * Ignore integration is applied only when required: a single managed entry is
 * appended to the application `.gitignore` while every existing rule is
 * preserved byte-for-byte.
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import type { TransactionJournal } from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  backupsDir,
  ignoreEntryFor,
  progressDir,
  stagedDir,
  transactionDir,
} from "./transaction-types.js";

export interface CleanupResult {
  readonly ok: boolean;
  readonly needsCleanup: boolean;
  readonly issues: readonly ModelIssue[];
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

function removeIfPresent(target: string): void {
  if (existsSync(target)) rmSync(target, { recursive: true, force: true });
}

/**
 * Clean a published transaction. `published`/`cleaned` are the only phases for
 * which ephemeral state is safe to remove; a planned/prepared/applied journal
 * is never deleted here (recovery owns it).
 */
export function cleanupTransaction(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  hooks?: TransactionHooks,
): CleanupResult {
  if (journal.phase !== "published" && journal.phase !== "cleaned") {
    return {
      ok: false,
      needsCleanup: false,
      issues: [
        {
          code: "CLEANUP_NOT_PUBLISHED",
          message: `refusing to clean a transaction in phase "${journal.phase}"`,
        },
      ],
    };
  }

  const ownedDir = absOf(root, transactionDir(stateDir, journal.transactionId));
  const targets: readonly [
    string,
    (
      | "cleanup:staged"
      | "cleanup:backups"
      | "cleanup:progress"
      | "cleanup:journal"
    ),
  ][] = [
    [absOf(root, stagedDir(stateDir, journal.transactionId)), "cleanup:staged"],
    [
      absOf(root, backupsDir(stateDir, journal.transactionId)),
      "cleanup:backups",
    ],
    [
      absOf(root, progressDir(stateDir, journal.transactionId)),
      "cleanup:progress",
    ],
    [
      absOf(
        root,
        `${transactionDir(stateDir, journal.transactionId)}/journal.json`,
      ),
      "cleanup:journal",
    ],
  ];

  try {
    for (const [target, boundary] of targets) {
      fireHooks(hooks, "before", boundary, target);
      removeIfPresent(target);
      fireHooks(hooks, "after", boundary, target);
    }
    // Remove the now-empty owned transaction directory itself.
    if (existsSync(ownedDir)) rmdirSync(ownedDir);
  } catch (error) {
    return {
      ok: false,
      needsCleanup: true,
      issues: [
        {
          code: "COMMITTED_NEEDS_CLEANUP",
          message: `the transaction committed but owned cleanup did not finish: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  return { ok: true, needsCleanup: false, issues: [] };
}

export interface IgnoreResult {
  readonly changed: boolean;
  readonly issues: readonly ModelIssue[];
}

const MANAGED_HEADER = "# svelte-ui-kit transient transaction state";

/**
 * Ensure the transient namespace is ignored, appended as one managed block.
 * Existing rules are preserved; a second call is a no-op. The namespace is only
 * added when no rule already mentions the transient directory.
 */
export function ensureIgnoreEntry(
  root: string,
  stateDir: string,
): IgnoreResult {
  const entry = ignoreEntryFor(stateDir);
  const gitignore = path.join(root, ".gitignore");
  let existing: string;
  try {
    existing = existsSync(gitignore) ? readFileSync(gitignore, "utf8") : "";
  } catch (error) {
    return {
      changed: false,
      issues: [
        {
          code: "IGNORE_UNREADABLE",
          message: `.gitignore is unreadable: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  if (existing.split("\n").some((line) => line.trim() === entry)) {
    return { changed: false, issues: [] };
  }
  const prefix = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  const block = `${existing}${prefix}${MANAGED_HEADER}\n${entry}\n`;
  try {
    mkdirSync(path.dirname(gitignore), { recursive: true });
    writeFileSync(gitignore, block);
  } catch (error) {
    return {
      changed: false,
      issues: [
        {
          code: "IGNORE_WRITE_FAILED",
          message: `.gitignore could not be updated: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
  return { changed: true, issues: [] };
}
