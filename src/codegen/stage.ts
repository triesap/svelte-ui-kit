/**
 * Same-filesystem staging of exact replacement bytes (S068).
 *
 * Replacement never truncates a live application file. New bytes are written to
 * owned temporary files under the transaction's `staged/` directory on the same
 * filesystem, with the intended mode applied exactly. Each staged file is
 * re-read and digest-verified before it is eligible to replace a target.
 *
 * Staging writes only to owned transient paths, so a permission, disk or
 * injected write failure leaves every live target untouched. Cleanup removes
 * only the staged directory it created and never an unrelated temporary file.
 */
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory, flushFile } from "./durability.js";
import type { ChangeOperation } from "./plan.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import { stagedDir } from "./transaction-types.js";
import {
  cleanupOwnedCreations,
  createOwnedDirectory,
  verifyOwnedCreations,
  writeOwnedFile,
  type OwnedCreation,
} from "./transaction-inventory.js";

export interface StageOperation {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytes: Uint8Array;
  /** Exact mode to apply to the replacement (and the staged file). */
  readonly mode: number;
}

export interface StagedRecord {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly stagedId: string;
  readonly stagedPath: string;
  readonly digest: string;
  readonly mode: number;
}

export interface StagedBatch {
  readonly stagedDirectory: string;
  readonly records: readonly StagedRecord[];
  readonly ownership: readonly OwnedCreation[];
}

export type StageResult =
  | { readonly ok: true; readonly value: StagedBatch }
  | {
      readonly ok: false;
      readonly issues: readonly ModelIssue[];
      readonly ownership: readonly OwnedCreation[];
    };

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/**
 * Stage every create/update operation. Retire operations carry no staged bytes
 * and are omitted. Failure removes only entries with held creation receipts,
 * or retains the whole uncertain inventory and reports both causes. Live files
 * are never touched.
 */
export function stageOperations(
  root: string,
  stateDir: string,
  transactionId: string,
  operations: readonly StageOperation[],
  hooks?: TransactionHooks,
  parentOwnership: readonly OwnedCreation[] = [],
): StageResult {
  const stagedLogical = stagedDir(stateDir, transactionId);
  const stagedAbs = path.join(root, ...stagedLogical.split("/"));
  const ownership: OwnedCreation[] = [];
  try {
    let current = path.resolve(root);
    for (const segment of stagedLogical.split("/")) {
      current = path.join(current, segment);
      let stats;
      try {
        stats = lstatSync(current);
      } catch (error) {
        if (codeOf(error) !== "ENOENT") throw error;
      }
      if (stats !== undefined) {
        if (
          current === stagedAbs ||
          stats.isSymbolicLink() ||
          !stats.isDirectory()
        ) {
          throw new Error(
            "staging ancestry is not an available real directory",
          );
        }
      } else {
        createOwnedDirectory(current, ownership);
        flushDirectory(path.dirname(current));
      }
    }
  } catch (error) {
    return {
      ok: false,
      ownership: Object.freeze([...ownership]),
      issues: [
        issue(
          "STAGE_UNAVAILABLE",
          `could not create the owned staging directory: ${codeOf(error)}`,
        ),
        ...cleanupOwnedCreations([...parentOwnership, ...ownership], hooks),
      ],
    };
  }

  const records: StagedRecord[] = [];
  try {
    for (const [index, operation] of operations.entries()) {
      if (operation.operation === "retire") continue;
      const stagedId = `stage-${index}`;
      const stagedPath = path.join(stagedAbs, stagedId);
      fireHooks(hooks, "before", "stage:write", operation.path);
      const inventory = verifyOwnedCreations([
        ...parentOwnership,
        ...ownership,
      ]);
      if (inventory.length > 0)
        throw new Error(inventory.map((entry) => entry.message).join("; "));
      writeOwnedFile(
        stagedPath,
        operation.bytes,
        operation.mode,
        ownership,
        () => {
          fireHooks(hooks, "before", "stage:create", operation.path);
        },
      );
      fireHooks(hooks, "after", "stage:write", operation.path);

      fireHooks(hooks, "before", "durability:stage", operation.path);
      flushFile(stagedPath);
      fireHooks(hooks, "after", "durability:stage", operation.path);

      fireHooks(hooks, "before", "stage:verify", operation.path);
      const digest = sha256Hex(readFileSync(stagedPath));
      const expected = sha256Hex(operation.bytes);
      fireHooks(hooks, "after", "stage:verify", operation.path);
      if (digest !== expected) {
        throw new Error(`staged bytes for ${operation.path} do not match`);
      }
      records.push({
        path: operation.path,
        operation: operation.operation,
        stagedId,
        stagedPath: `${stagedLogical}/${stagedId}`,
        digest,
        mode: operation.mode,
      });
    }
    // Flush the staged directory so a crash cannot lose the staged entry.
    fireHooks(hooks, "before", "durability:stage", stagedLogical);
    flushDirectory(stagedAbs);
    fireHooks(hooks, "after", "durability:stage", stagedLogical);
  } catch (error) {
    return {
      ok: false,
      ownership: Object.freeze([...ownership]),
      issues: [
        issue(
          "STAGE_FAILED",
          `staging did not complete: ${error instanceof Error ? error.message : String(error)}`,
        ),
        ...cleanupOwnedCreations([...parentOwnership, ...ownership], hooks),
      ],
    };
  }

  const inventory = verifyOwnedCreations([...parentOwnership, ...ownership]);
  if (inventory.length > 0) {
    return {
      ok: false,
      ownership: Object.freeze([...ownership]),
      issues: inventory,
    };
  }
  return {
    ok: true,
    value: {
      stagedDirectory: stagedLogical,
      records,
      ownership: Object.freeze([...ownership]),
    },
  };
}

/**
 * Re-verify exact staged bytes against recorded digests. Used before
 * replacement and by recovery to prove an exact staged image.
 */
export function verifyStaged(
  root: string,
  records: readonly StagedRecord[],
): ModelResult<null> {
  const issues = [];
  for (const record of records) {
    const abs = path.join(root, ...record.stagedPath.split("/"));
    let bytes: Buffer;
    try {
      bytes = readFileSync(abs);
    } catch (error) {
      issues.push(
        issue(
          "STAGE_MISSING",
          `staged image for ${record.path} is unreadable (${codeOf(error)})`,
          record.path,
        ),
      );
      continue;
    }
    if (sha256Hex(bytes) !== record.digest) {
      issues.push(
        issue(
          "STAGE_CORRUPT",
          `staged image for ${record.path} no longer matches its digest`,
          record.path,
        ),
      );
    }
  }
  return issues.length > 0 ? fail(issues) : ok(null);
}

/** Remove only the owned staged directory. */
export function cleanupStaged(
  stagedAbs: string,
  ownership?: readonly OwnedCreation[],
): ModelIssue[] {
  if (
    ownership === undefined ||
    !ownership.some(
      (entry) => entry.path === stagedAbs && entry.kind === "directory",
    )
  ) {
    return [
      issue(
        "OWNED_CLEANUP_REFUSED",
        "staging cleanup requires held exclusive creation receipts",
      ),
    ];
  }
  return cleanupOwnedCreations(ownership);
}
