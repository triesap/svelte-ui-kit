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
 * is killed between the intent and the rename, recovery uses the recorded
 * physical rename witness to distinguish publication from the original
 * canonical preimage. Equal bytes alone cannot prove either outcome.
 *
 * A publication whose bytes equal the current lock is still recorded with the
 * unique transaction id and an `unchanged` flag, because byte equality alone is
 * not a commit event. The existing canonical mode is preserved.
 */
import { renameSync } from "node:fs";
import path from "node:path";
import {
  forgetRenamedCreation,
  verifyOwnedCreations,
  writeOwnedFile,
  type OwnedCreation,
} from "./transaction-inventory.js";

import type { ModelIssue } from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory, flushFile } from "./durability.js";
import { parseKitLock, type LockValidationContext } from "./lock.js";
import {
  persistJournal,
  type TransactionJournal,
} from "./transaction-journal.js";
import { writePublicationIntent } from "./publication-intent.js";
import {
  verifyMutationAuthority,
  verifyMutationTarget,
  type MutationAuthority,
} from "./mutation-authority.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import { revalidatePreimages, type TargetPreimage } from "./revalidate.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
} from "./transaction-types.js";

export type LockPublicationResult =
  | {
      readonly ok: true;
      readonly canonical: TargetPreimage;
      readonly journal: TransactionJournal;
      readonly issues: readonly ModelIssue[];
    }
  | {
      readonly ok: false;
      readonly journal: TransactionJournal;
      readonly issues: readonly ModelIssue[];
    };

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
  if (
    journal.schemaVersion !== validated.value.schemaVersion ||
    (journal.schemaVersion === 2
      ? journal.target !== validated.value.target ||
        journal.target !== context.target
      : journal.target !== undefined || validated.value.target !== undefined)
  )
    issues.push({
      code: "LOCK_JOURNAL_TARGET_MISMATCH",
      message:
        "Publication requires the same approved journal, config and semantic-lock schema/target",
      locator: lockPath(stateDir),
    });
  return { ok: issues.length === 0, issues };
}

class PublicationRefusal extends Error {
  constructor(readonly issues: readonly ModelIssue[]) {
    super(issues.map((entry) => entry.message).join("; "));
  }
}

function requireProof(issues: readonly ModelIssue[]): void {
  if (issues.length > 0) throw new PublicationRefusal(issues);
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
  mode: number,
  context: LockValidationContext,
  hooks: TransactionHooks | undefined,
  ownership: OwnedCreation[] | undefined,
  authority: MutationAuthority,
): LockPublicationResult {
  // Copy before any hook can mutate the caller's Uint8Array. Its digest remains
  // fixed throughout the intent, staged receipt, witness and published result.
  const intendedBytes = Uint8Array.from(lockBytes);
  const intendedDigest = sha256Hex(intendedBytes);
  const validation = validateLockForPublication(
    journal,
    intendedBytes,
    stateDir,
    context,
  );
  if (!validation.ok) {
    return { ok: false, journal, issues: validation.issues };
  }

  const destination = absOf(root, lockPath(stateDir));
  const stagedLogical = `${stagedDir(stateDir, journal.transactionId)}/kit.lock.json`;
  const stagedLock = absOf(root, stagedLogical);
  const receipts = ownership ?? [];
  const original = authority.preimages.get(lockPath(stateDir));
  const finalProof = () => {
    requireProof(
      verifyMutationAuthority(authority, root, stateDir, receipts, [
        lockPath(stateDir),
        stagedLogical,
      ]),
    );
    requireProof(verifyMutationTarget(authority, lockPath(stateDir)));
  };
  try {
    finalProof();
  } catch (error) {
    return {
      ok: false,
      journal,
      issues:
        error instanceof PublicationRefusal
          ? error.issues
          : [
              {
                code: "LOCK_PUBLICATION_FAILED",
                message: `could not prove publication authority: ${codeOf(error)}`,
                locator: lockPath(stateDir),
              },
            ],
    };
  }
  const unchanged =
    original?.kind === "file" && original.digest === intendedDigest;
  const effectiveMode = original?.mode ?? mode;
  const published: TransactionJournal = {
    ...journal,
    phase: "published",
    lock: {
      path: lockPath(stateDir),
      digest: intendedDigest,
      published: true,
      unchanged,
    },
  };
  let current = journal;
  let canonical: TargetPreimage | undefined;
  const publishedProof = () => {
    requireProof(
      verifyMutationAuthority(authority, root, stateDir, receipts, [
        lockPath(stateDir),
        stagedLogical,
      ]),
    );
    if (canonical === undefined)
      throw new Error("missing canonical rename proof");
    const proof = revalidatePreimages(root, [canonical], { ancestors: [] });
    if (!proof.ok) requireProof(proof.issues);
  };

  // Durable publication intent. The physical witness below supplies the unique
  // rename proof; this digest alone never grants publication or rollback.
  const intent: TransactionJournal = {
    ...journal,
    phase: "applied",
    lock: {
      path: lockPath(stateDir),
      digest: intendedDigest,
      published: false,
      unchanged,
    },
  };
  try {
    requireProof(
      verifyMutationAuthority(authority, root, stateDir, receipts, [
        lockPath(stateDir),
        stagedLogical,
      ]),
    );
    persistJournal(
      root,
      journalPath(stateDir, journal.transactionId),
      intent,
      hooks,
      ownership,
    );
  } catch (error) {
    return {
      ok: false,
      journal: intent,
      issues:
        error instanceof PublicationRefusal
          ? error.issues
          : [
              {
                code: "LOCK_INTENT_FAILED",
                message: `could not persist the publication intent: ${codeOf(error)}`,
                locator: lockPath(stateDir),
              },
            ],
    };
  }

  try {
    current = intent;
    fireHooks(hooks, "before", "lock:stage", lockPath(stateDir));
    finalProof();
    writeOwnedFile(stagedLock, intendedBytes, effectiveMode, receipts);
    const stagedReceipt = receipts.find(
      (entry) => entry.path === stagedLock && entry.kind === "file",
    )!;
    const stageProof = () => {
      finalProof();
      requireProof(verifyOwnedCreations([stagedReceipt]));
      if (
        stagedReceipt.digest !== intendedDigest ||
        stagedReceipt.mode !== effectiveMode
      )
        throw new PublicationRefusal([
          {
            code: "LOCK_STAGE_CORRUPT",
            message: "the staged lock contradicts the intended bytes or mode",
            locator: stagedLogical,
          },
        ]);
    };
    fireHooks(hooks, "before", "durability:lock-stage", lockPath(stateDir));
    stageProof();
    flushFile(stagedLock);
    // The staged lock's directory entry must be durable before the publication
    // intent records its physical identity; otherwise a crash could preserve an
    // intent that names an image the filesystem never durably created.
    flushDirectory(path.dirname(stagedLock));
    fireHooks(hooks, "after", "durability:lock-stage", lockPath(stateDir));
    fireHooks(hooks, "after", "lock:stage", lockPath(stateDir));
    stageProof();

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
          digest: intendedDigest,
          mode: effectiveMode,
          preimage: original?.identity ?? null,
          staged: { device: stagedReceipt.device, inode: stagedReceipt.inode },
        },
        ownership,
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
    stageProof();
    renameSync(stagedLock, destination);
    current = published;
    canonical = Object.freeze({
      path: lockPath(stateDir),
      kind: "file",
      digest: intendedDigest,
      mode: effectiveMode,
      identity: Object.freeze({
        device: stagedReceipt.device,
        inode: stagedReceipt.inode,
      }),
    });
    forgetRenamedCreation(stagedLock, receipts);
    fireHooks(hooks, "before", "durability:lock-publish", lockPath(stateDir));
    publishedProof();
    // The canonical rename is cross-directory: flush the destination directory
    // that gained the lock and the staged directory that lost it.
    flushDirectory(path.dirname(destination));
    flushDirectory(path.dirname(stagedLock));
    fireHooks(hooks, "after", "durability:lock-publish", lockPath(stateDir));
    fireHooks(hooks, "after", "lock:publish", lockPath(stateDir));
    publishedProof();
  } catch (error) {
    return {
      ok: false,
      journal: current,
      issues:
        error instanceof PublicationRefusal
          ? error.issues
          : [
              {
                code: "LOCK_PUBLICATION_FAILED",
                message: `could not publish the install lock: ${codeOf(error)}`,
                locator: lockPath(stateDir),
              },
            ],
    };
  }

  try {
    publishedProof();
    persistJournal(
      root,
      journalPath(stateDir, journal.transactionId),
      published,
      hooks,
      ownership,
    );
    publishedProof();
  } catch (error) {
    // The lock is already published; the durable publication record is what
    // failed. Report a committed-but-needs-cleanup outcome rather than
    // pretending the batch did not commit.
    return {
      ok: false,
      journal: published,
      issues:
        error instanceof PublicationRefusal
          ? error.issues
          : [
              {
                code: "LOCK_RECORD_FAILED",
                message: `the lock was published but its journal record could not be persisted: ${codeOf(error)}`,
                locator: lockPath(stateDir),
              },
            ],
    };
  }
  return { ok: true, journal: published, canonical: canonical!, issues: [] };
}
