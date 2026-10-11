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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import { flushDirectory } from "./durability.js";
import {
  verifyMutationAuthority,
  verifyMutationTarget,
  type MutationAuthority,
} from "./mutation-authority.js";
import {
  parseJournal,
  serializeJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  ownedInventoryFor,
  captureCleanupInventory,
  removeCleanupEntries,
  verifyOwnedCreations,
  type OwnedCreation,
} from "./transaction-inventory.js";
import {
  backupsDir,
  ignoreEntryFor,
  progressDir,
  publicationIntentPath,
  lockPath,
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

/**
 * Clean a published transaction. `published`/`cleaned` are the only phases for
 * which ephemeral state is safe to remove; a planned/prepared/applied journal
 * is never deleted here (recovery owns it).
 */
export function cleanupTransaction(
  root: string,
  stateDir: string,
  journal: TransactionJournal,
  hooks: TransactionHooks | undefined,
  ownership: readonly OwnedCreation[] | undefined,
  authority: MutationAuthority,
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
  if (ownership !== undefined) {
    const proof = verifyOwnedCreations(ownership);
    if (proof.length > 0)
      return {
        ok: false,
        needsCleanup: true,
        issues: proof.map((entry) => ({
          ...entry,
          code: "COMMITTED_NEEDS_CLEANUP",
        })),
      };
  }

  // Cleanup removes only the exact inventory recorded by the validated
  // journal, checked recursively. An unexpected or wrong-kind entry at any
  // depth blocks cleanup and is retained rather than recursed.
  const inventory = captureCleanupInventory(
    root,
    stateDir,
    journal.transactionId,
    ownedInventoryFor(journal),
  );
  if (!inventory.ok) {
    return {
      ok: false,
      needsCleanup: true,
      issues: [
        {
          code: "COMMITTED_NEEDS_CLEANUP",
          message: `the transaction committed but its owned directory contains unexpected state (${inventory.issues
            .map((entry) => entry.message)
            .join("; ")})`,
        },
      ],
    };
  }

  // A recorded filename is insufficient: prove actual journal content and the
  // exact images/modes it claims before freezing them as removal authority.
  try {
    for (const entry of inventory.value.entries) {
      if (entry.kind === "directory") {
        if (entry.mode !== 0o700)
          throw new Error("owned transaction directory mode changed");
        continue;
      }
      const name = path.basename(entry.path);
      if (name === "journal.json") {
        const parsed = parseJournal(readFileSync(entry.path, "utf8"));
        if (
          !parsed.ok ||
          serializeJournal(parsed.value) !== serializeJournal(journal) ||
          entry.mode !== 0o600
        )
          throw new Error(
            "journal content or mode does not authenticate cleanup",
          );
      } else if (
        path.dirname(entry.path) ===
        absOf(root, stagedDir(stateDir, journal.transactionId))
      ) {
        const operation = journal.operations.find(
          (record) => record.stagedId === name,
        );
        if (
          operation === undefined ||
          entry.digest !== operation.resultDigest ||
          entry.mode !== operation.resultMode
        )
          throw new Error("staged cleanup image or mode changed");
      } else if (
        path.dirname(entry.path) ===
        absOf(root, backupsDir(stateDir, journal.transactionId))
      ) {
        const operation = journal.operations.find(
          (record) => record.backupId === name,
        );
        if (
          operation === undefined ||
          entry.digest !== operation.preimage.digest ||
          entry.mode !== operation.preimage.mode
        )
          throw new Error("backup cleanup image or mode changed");
      } else if (name !== "publication.json" || entry.mode !== 0o600) {
        throw new Error("unproven temporary cleanup content");
      }
    }
    const journalEntry = inventory.value.entries.find(
      (entry) => entry.path === path.join(ownedDir, "journal.json"),
    );
    if (inventory.value.entries.length > 0 && journalEntry === undefined)
      throw new Error("cleanup requires its authentic journal");
  } catch (error) {
    return {
      ok: false,
      needsCleanup: true,
      issues: [
        {
          code: "COMMITTED_NEEDS_CLEANUP",
          message: `owned cleanup proof failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }

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
    [
      absOf(root, publicationIntentPath(stateDir, journal.transactionId)),
      "cleanup:journal",
    ],
  ];

  try {
    const prove = () => {
      const issues = [
        ...verifyMutationAuthority(
          authority,
          root,
          stateDir,
          [],
          [lockPath(stateDir), transactionDir(stateDir, journal.transactionId)],
        ),
        ...verifyMutationTarget(authority, lockPath(stateDir)),
      ];
      if (issues.length > 0)
        throw new Error(issues.map((entry) => entry.message).join("; "));
    };
    prove();
    for (const [target, boundary] of targets) {
      fireHooks(hooks, "before", boundary, target);
      prove();
      // Re-prove the complete owned inventory immediately before each removal,
      // so an entry introduced at a cleanup boundary is retained and reported
      // rather than recursively deleted.
      const recheck = removeCleanupEntries(inventory.value, target);
      if (recheck.length > 0) {
        return {
          ok: false,
          needsCleanup: true,
          issues: [
            {
              code: "COMMITTED_NEEDS_CLEANUP",
              message: `the transaction committed but its owned directory contains unexpected state (${recheck
                .map((entry) => entry.message)
                .join("; ")})`,
            },
          ],
        };
      }
      // The removal must be durable in the containing directory so a crash
      // cannot resurrect state recovery already proved safe to remove.
      fireHooks(hooks, "before", "durability:cleanup", target);
      prove();
      flushDirectory(path.dirname(target));
      fireHooks(hooks, "after", "durability:cleanup", target);
      fireHooks(hooks, "after", boundary, target);
      prove();
    }
    // Remove the now-empty owned transaction directory itself, then flush the
    // parent transaction namespace so the completed cleanup is durable.
    {
      prove();
      const removed = removeCleanupEntries(inventory.value, ownedDir);
      if (removed.length > 0)
        return {
          ok: false,
          needsCleanup: true,
          issues: removed.map((entry) => ({
            ...entry,
            code: "COMMITTED_NEEDS_CLEANUP",
          })),
        };
      if (inventory.value.entries.some((entry) => entry.path === ownedDir)) {
        fireHooks(hooks, "before", "durability:cleanup", ownedDir);
        prove();
        flushDirectory(path.dirname(ownedDir));
        fireHooks(hooks, "after", "durability:cleanup", ownedDir);
        prove();
      }
    }
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
 * Append the managed ignore block to existing ignore content, preserving every
 * existing rule byte-for-byte. Exported so the planner can compute the exact
 * bytes of a guarded ignore-file change without writing.
 */
export function ignoreBlockWithEntry(existing: string, entry: string): string {
  const prefix = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  return `${existing}${prefix}${MANAGED_HEADER}\n${entry}\n`;
}

/** True when the managed entry is already present as a whole line. */
export function hasIgnoreEntry(existing: string, entry: string): boolean {
  return existing.split("\n").some((line) => line.trim() === entry);
}

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
  const block = ignoreBlockWithEntry(existing, entry);
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
