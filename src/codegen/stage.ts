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
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import type { ChangeOperation } from "./plan.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import { stagedDir } from "./transaction-types.js";

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
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/**
 * Stage every create/update operation. Retire operations carry no staged bytes
 * and are omitted. Failure removes only the staged directory this call created
 * (best effort) and reports the I/O cause; live files are never touched.
 */
export function stageOperations(
  root: string,
  stateDir: string,
  transactionId: string,
  operations: readonly StageOperation[],
  hooks?: TransactionHooks,
): ModelResult<StagedBatch> {
  const stagedLogical = stagedDir(stateDir, transactionId);
  const stagedAbs = path.join(root, ...stagedLogical.split("/"));
  try {
    mkdirSync(stagedAbs, { recursive: true, mode: 0o700 });
  } catch (error) {
    return fail([
      issue(
        "STAGE_UNAVAILABLE",
        `could not create the owned staging directory: ${codeOf(error)}`,
      ),
    ]);
  }

  const records: StagedRecord[] = [];
  try {
    for (const [index, operation] of operations.entries()) {
      if (operation.operation === "retire") continue;
      const stagedId = `stage-${index}`;
      const stagedPath = path.join(stagedAbs, stagedId);
      fireHooks(hooks, "before", "stage:write", operation.path);
      writeFileSync(stagedPath, operation.bytes, { mode: 0o600 });
      chmodSync(stagedPath, operation.mode);
      fireHooks(hooks, "after", "stage:write", operation.path);

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
  } catch (error) {
    cleanupStaged(stagedAbs);
    return fail([
      issue(
        "STAGE_FAILED",
        `staging did not complete: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ]);
  }

  return ok({ stagedDirectory: stagedLogical, records });
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
export function cleanupStaged(stagedAbs: string): void {
  try {
    rmSync(stagedAbs, { recursive: true, force: true });
  } catch {
    // Best-effort owned cleanup; recovery retains the evidence if it fails.
  }
}
