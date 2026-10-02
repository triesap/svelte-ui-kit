/**
 * Cooperative exclusive writer coordination (S066).
 *
 * One writer may own the mutation phase. Ownership is a `writer.lock`
 * directory created with `mkdir`, which is atomic on the supported platforms:
 * exactly one creation succeeds and every competing writer observes `EEXIST`.
 * Inside it an owner record names the unique transaction and process.
 *
 * A lock is never removed based on age, PID equality or the bytes of another
 * transaction. Release removes the directory only when the recorded
 * transaction id still equals the caller's; an ambiguous (missing/corrupt)
 * owner record is reported and left in place. Read-only commands never acquire
 * a lock, so planning creates no coordination state at all.
 */
import {
  mkdirSync,
  readFileSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
  statSync,
  lstatSync,
  type Stats,
} from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isTransactionId, writerLockDir } from "./transaction-types.js";

export interface WriterOwner {
  readonly schemaVersion: 1;
  readonly transactionId: string;
  readonly pid: number;
}

export interface WriterLockHandle {
  readonly root: string;
  readonly stateDir: string;
  readonly lockDir: string;
  readonly transactionId: string;
}

const OWNER_FILE = "owner.json";

function lockDirAbs(root: string, stateDir: string): string {
  return path.join(root, ...writerLockDir(stateDir).split("/"));
}

function ownerFileAbs(lockDir: string): string {
  return path.join(lockDir, OWNER_FILE);
}

/**
 * Acquire the single cooperative writer lock. A second writer receives
 * `WRITER_BUSY`; no lock is created on failure, and a partially created lock is
 * removed before returning.
 */
export function acquireWriterLock(
  root: string,
  stateDir: string,
  transactionId: string,
): ModelResult<WriterLockHandle> {
  if (!isTransactionId(transactionId)) {
    return fail([
      issue(
        "WRITER_LOCK_INVALID",
        "writer coordination requires a valid transaction id",
        "transactionId",
      ),
    ]);
  }
  const lockDir = lockDirAbs(root, stateDir);
  const parent = path.dirname(lockDir);
  try {
    mkdirSync(parent, { recursive: true, mode: 0o700 });
  } catch (error) {
    return fail([
      issue(
        "WRITER_LOCK_UNAVAILABLE",
        `could not prepare the transient namespace: ${codeOf(error)}`,
      ),
    ]);
  }
  try {
    mkdirSync(lockDir, { recursive: false, mode: 0o700 });
  } catch (error) {
    if (codeOf(error) === "EEXIST") {
      return fail([
        issue(
          "WRITER_BUSY",
          "another cooperative writer already owns the mutation lock",
          writerLockDir(stateDir),
        ),
      ]);
    }
    return fail([
      issue(
        "WRITER_LOCK_UNAVAILABLE",
        `could not acquire the writer lock: ${codeOf(error)}`,
      ),
    ]);
  }

  const owner: WriterOwner = {
    schemaVersion: 1,
    transactionId,
    pid: process.pid,
  };
  try {
    writeFileSync(ownerFileAbs(lockDir), `${JSON.stringify(owner)}\n`, {
      mode: 0o600,
    });
  } catch (error) {
    // Remove only the lock directory this call just created.
    safeRemove(lockDir);
    return fail([
      issue(
        "WRITER_LOCK_UNAVAILABLE",
        `could not record writer ownership: ${codeOf(error)}`,
      ),
    ]);
  }
  return ok({ root, stateDir, lockDir, transactionId });
}

/**
 * Release the lock only when it is still owned by this transaction. A missing
 * or corrupt owner record is an ambiguous stale lock and is never deleted.
 */
export function releaseWriterLock(handle: WriterLockHandle): ModelResult<null> {
  const read = readOwner(handle.lockDir);
  if (!read.ok) {
    return fail([
      issue(
        "WRITER_LOCK_UNOWNED",
        `refusing to remove an unowned or ambiguous writer lock: ${read.reason}`,
        writerLockDir(handle.stateDir),
      ),
    ]);
  }
  if (read.value.transactionId !== handle.transactionId) {
    return fail([
      issue(
        "WRITER_LOCK_UNOWNED",
        "refusing to remove a writer lock owned by a different transaction",
        writerLockDir(handle.stateDir),
      ),
    ]);
  }
  try {
    // Remove only the owned owner record, then the now-empty lock directory.
    // A non-empty directory (unexpected entries) makes the removal fail rather
    // than silently deleting unrelated state.
    unlinkSync(ownerFileAbs(handle.lockDir));
    rmdirSync(handle.lockDir);
  } catch (error) {
    return fail([
      issue(
        "WRITER_LOCK_RELEASE_FAILED",
        `could not release the owned writer lock: ${codeOf(error)}`,
      ),
    ]);
  }
  return ok(null);
}

/** Read the current owner record, distinguishing absent/ambiguous/held. */
export function readWriterLock(
  root: string,
  stateDir: string,
): {
  readonly kind: "absent" | "ambiguous" | "held";
  readonly owner?: WriterOwner;
} {
  const lockDir = lockDirAbs(root, stateDir);
  let stats: Stats;
  try {
    stats = lstatSync(lockDir);
  } catch (error) {
    if (codeOf(error) === "ENOENT") return { kind: "absent" };
    return { kind: "ambiguous" };
  }
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    return { kind: "ambiguous" };
  }
  const read = readOwner(lockDir);
  return read.ok ? { kind: "held", owner: read.value } : { kind: "ambiguous" };
}

function readOwner(
  lockDir: string,
):
  | { readonly ok: true; readonly value: WriterOwner }
  | { readonly ok: false; readonly reason: string } {
  let text: string;
  try {
    text = readFileSync(ownerFileAbs(lockDir), "utf8");
  } catch (error) {
    return {
      ok: false,
      reason: `owner record is unreadable (${codeOf(error)})`,
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "owner record is not valid JSON" };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { ok: false, reason: "owner record is not an object" };
  }
  const record = parsed as Record<string, unknown>;
  if (record["schemaVersion"] !== 1) {
    return { ok: false, reason: "owner record schemaVersion is not 1" };
  }
  if (!isTransactionId(record["transactionId"])) {
    return { ok: false, reason: "owner record transactionId is invalid" };
  }
  if (!Number.isInteger(record["pid"])) {
    return { ok: false, reason: "owner record pid is invalid" };
  }
  return {
    ok: true,
    value: {
      schemaVersion: 1,
      transactionId: record["transactionId"] as string,
      pid: record["pid"] as number,
    },
  };
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

function safeRemove(target: string): void {
  try {
    statSync(target);
    rmSync(target, { recursive: true, force: true });
  } catch {
    // Best-effort removal of a lock this call created; never mask the cause.
  }
}
