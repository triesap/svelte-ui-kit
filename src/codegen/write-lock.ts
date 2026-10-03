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
  readdirSync,
  rmSync,
  rmdirSync,
  unlinkSync,
  writeFileSync,
  statSync,
  lstatSync,
  type Stats,
} from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { flushDirectory } from "./durability.js";
import { removeOwnedAncestors } from "./owned-ancestry.js";
import type { PhysicalIdentity } from "./authority.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import { isTransactionId, writerLockDir } from "./transaction-types.js";
import type { JournalCreatedDir } from "./transaction-journal.js";

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
  /**
   * Generated state-directory ancestry this acquisition created, recorded with
   * exact physical identity so a rollback can remove only empty directories
   * this attempt owns. The transient namespace itself is coordination-owned and
   * excluded here.
   */
  readonly createdDirectories: readonly JournalCreatedDir[];
}

const OWNER_FILE = "owner.json";

/**
 * One in-process coordination claim. Possession is proven by the recorded
 * transaction id *and* the exact physical identity of the owner record this
 * process wrote. Equal bytes at a new inode are a different physical record
 * and therefore do not prove the original acquired authority.
 */
interface HeldClaim {
  readonly transactionId: string;
  readonly device: number;
  readonly inode: number;
}

/**
 * The set of lock directories this process actually acquired and has not yet
 * successfully released. Possession is proven by this in-process registry, not
 * by a recorded PID: a foreign owner record that merely names this process does
 * not grant coordination authority and must not bypass acquisition.
 */
const HELD_LOCKS = new Map<string, HeldClaim>();

function lockKey(root: string, stateDir: string): string {
  return lockDirAbs(root, stateDir);
}

/** True when this process currently holds the writer lock for the project. */
export function holdsWriterLock(root: string, stateDir: string): boolean {
  return HELD_LOCKS.has(lockKey(root, stateDir));
}

/** The transaction id this process last acquired the lock with, if any. */
export function heldWriterTransactionId(
  root: string,
  stateDir: string,
): string | null {
  return HELD_LOCKS.get(lockKey(root, stateDir))?.transactionId ?? null;
}

/**
 * Re-prove the in-process held coordination still matches the live physical
 * owner record before it is used to authorize a recovery effect. The in-process
 * registry alone proves this process once acquired the lock; it does not prove
 * the on-disk owner record is unchanged. A record that names a different
 * transaction, or is missing/corrupt, is a contradiction that must refuse
 * rather than silently bypass a live owner.
 */
export function verifyHeldWriterLock(
  root: string,
  stateDir: string,
): ModelIssue[] {
  const key = lockKey(root, stateDir);
  const held = HELD_LOCKS.get(key);
  if (held === undefined) {
    return [
      issue(
        "WRITER_LOCK_NOT_HELD",
        "this process does not hold the writer lock for the project",
        writerLockDir(stateDir),
      ),
    ];
  }
  const lockDir = lockDirAbs(root, stateDir);
  const read = readOwner(lockDir);
  if (!read.ok) {
    return [
      issue(
        "WRITER_LOCK_CONTRADICTED",
        `the held writer lock owner record is not authentic (${read.reason}); refusing to treat it as coordination authority`,
        writerLockDir(stateDir),
      ),
    ];
  }
  if (read.value.transactionId !== held.transactionId) {
    return [
      issue(
        "WRITER_LOCK_CONTRADICTED",
        `the live writer lock owner ${read.value.transactionId} contradicts the transaction ${held.transactionId} this process acquired; refusing to bypass a live owner`,
        writerLockDir(stateDir),
      ),
    ];
  }
  // The transaction id alone is not physical proof: a record replaced with
  // identical bytes at a new inode (or a different device) is not the exact
  // owner record this process wrote, so it cannot authorize recovery effects.
  const identity = observeOwnerIdentity(lockDir);
  if (!identity.ok) {
    return [
      issue(
        "WRITER_LOCK_CONTRADICTED",
        `the held writer lock owner record could not be observed (${identity.reason}); refusing to treat it as coordination authority`,
        writerLockDir(stateDir),
      ),
    ];
  }
  if (
    identity.value.device !== held.device ||
    identity.value.inode !== held.inode
  ) {
    return [
      issue(
        "WRITER_LOCK_CONTRADICTED",
        "the live writer lock owner record is a different physical file than the one this process acquired; refusing substituted owner evidence",
        writerLockDir(stateDir),
      ),
    ];
  }
  return [];
}

/** Non-following physical identity of the owner record, or a typed failure. */
function observeOwnerIdentity(
  lockDir: string,
):
  | { readonly ok: true; readonly value: PhysicalIdentity }
  | { readonly ok: false; readonly reason: string } {
  try {
    const stats = lstatSync(ownerFileAbs(lockDir));
    if (stats.isSymbolicLink() || !stats.isFile()) {
      return { ok: false, reason: "owner record is not a regular file" };
    }
    return { ok: true, value: { device: stats.dev, inode: stats.ino } };
  } catch (error) {
    return { ok: false, reason: `unreadable (${codeOf(error)})` };
  }
}

function lockDirAbs(root: string, stateDir: string): string {
  return path.join(root, ...writerLockDir(stateDir).split("/"));
}

/**
 * Create the state directory chain from the project root down to `stateDir`,
 * recording exactly the directories that did not previously exist. Each new
 * directory is observed with non-following metadata so ownership rests on a
 * physical identity rather than a path.
 */
function ensureStateDirectoryChain(
  root: string,
  stateDir: string,
  hooks?: TransactionHooks,
): {
  readonly created: readonly JournalCreatedDir[];
  readonly issue: ModelIssue | null;
} {
  const rootAbs = path.resolve(root);
  const stateAbs = path.join(rootAbs, ...stateDir.split("/"));
  const relative = path.relative(rootAbs, stateAbs);
  if (relative === "") return { created: [], issue: null };
  const segments = relative.split(path.sep);
  const created: JournalCreatedDir[] = [];
  let current = rootAbs;
  for (const segment of segments) {
    current = path.join(current, segment);
    const logical = path.relative(rootAbs, current).split(path.sep).join("/");
    let exists = false;
    try {
      lstatSync(current);
      exists = true;
    } catch (error) {
      if (codeOf(error) !== "ENOENT") {
        return {
          created,
          issue: issue(
            "WRITER_LOCK_UNAVAILABLE",
            `could not inspect the coordination ancestry ${logical}: ${codeOf(error)}`,
          ),
        };
      }
    }
    if (exists) continue;
    try {
      mkdirSync(current, { recursive: false });
      const stats = lstatSync(current);
      created.push({ path: logical, device: stats.dev, inode: stats.ino });
      // Record the new coordination directory durably in its parent. A flush
      // failure retains the already-created identity list so the caller can
      // account for and remove exactly the owned empty ancestry it made.
      fireHooks(hooks, "before", "durability:owned-create", current);
      flushDirectory(path.dirname(current));
      fireHooks(hooks, "after", "durability:owned-create", current);
    } catch (error) {
      return {
        created,
        issue: issue(
          "WRITER_LOCK_UNAVAILABLE",
          `could not prepare the coordination ancestry ${logical}: ${codeOf(error)}`,
        ),
      };
    }
  }
  return { created, issue: null };
}

function ownerFileAbs(lockDir: string): string {
  return path.join(lockDir, OWNER_FILE);
}

/** True when the owner record path currently exists (following no links). */
function ownerRecordPresent(ownerAbs: string): boolean {
  try {
    lstatSync(ownerAbs);
    return true;
  } catch {
    return false;
  }
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
  hooks?: TransactionHooks,
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
  const prepared = ensureStateDirectoryChain(root, stateDir, hooks);
  const createdDirectories = prepared.created;
  if (prepared.issue !== null) {
    // Account for and roll back exactly the owned empty coordination ancestry
    // this attempt made before the transient namespace is even created.
    removeOwnedAncestors(root, createdDirectories, hooks);
    return fail([prepared.issue]);
  }
  try {
    mkdirSync(parent, { recursive: true, mode: 0o700 });
  } catch (error) {
    removeOwnedAncestors(root, createdDirectories, hooks);
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
    // Remove only the lock directory this call just created, and account for
    // any owned empty coordination ancestry it created.
    safeRemove(lockDir);
    removeOwnedAncestors(root, createdDirectories, hooks);
    return fail([
      issue(
        "WRITER_LOCK_UNAVAILABLE",
        `could not record writer ownership: ${codeOf(error)}`,
      ),
    ]);
  }
  const identity = observeOwnerIdentity(lockDir);
  if (!identity.ok) {
    safeRemove(lockDir);
    removeOwnedAncestors(root, createdDirectories, hooks);
    return fail([
      issue(
        "WRITER_LOCK_UNAVAILABLE",
        `could not observe writer ownership: ${identity.reason}`,
      ),
    ]);
  }
  HELD_LOCKS.set(lockKey(root, stateDir), {
    transactionId,
    device: identity.value.device,
    inode: identity.value.inode,
  });
  return ok({ root, stateDir, lockDir, transactionId, createdDirectories });
}
/**
 * Release the lock only when it is still owned by this transaction. A missing
 * or corrupt owner record is an ambiguous stale lock and is never deleted.
 */
export function releaseWriterLock(
  handle: WriterLockHandle,
  hooks?: TransactionHooks,
): ModelResult<null> {
  const key = lockKey(handle.root, handle.stateDir);
  const read = readOwner(handle.lockDir);
  if (!read.ok) {
    // An unowned/ambiguous lock cannot be released by this process; drop the
    // in-process claim so this process never reuses stale coordination.
    HELD_LOCKS.delete(key);
    return fail([
      issue(
        "WRITER_LOCK_UNOWNED",
        `refusing to remove an unowned or ambiguous writer lock: ${read.reason}`,
        writerLockDir(handle.stateDir),
      ),
    ]);
  }
  const owner = read.value;
  if (owner.transactionId !== handle.transactionId) {
    HELD_LOCKS.delete(key);
    return fail([
      issue(
        "WRITER_LOCK_UNOWNED",
        "refusing to remove a writer lock owned by a different transaction",
        writerLockDir(handle.stateDir),
      ),
    ]);
  }
  try {
    // Remove the owned owner record and the now-empty lock directory only when
    // nothing unexpected is present. An unexpected entry retains the owner
    // evidence for safe follow-up rather than deleting unrelated state.
    const entries = readdirSync(handle.lockDir);
    if (entries.some((name) => name !== OWNER_FILE)) {
      HELD_LOCKS.delete(key);
      return fail([
        issue(
          "WRITER_LOCK_RELEASE_FAILED",
          `the writer lock contains unexpected entries (${entries
            .filter((name) => name !== OWNER_FILE)
            .sort()
            .join(", ")}); ownership evidence is retained`,
          writerLockDir(handle.stateDir),
        ),
      ]);
    }
    unlinkSync(ownerFileAbs(handle.lockDir));
    fireHooks(hooks, "before", "durability:release", handle.lockDir);
    flushDirectory(handle.lockDir);
    rmdirSync(handle.lockDir);
    flushDirectory(path.dirname(handle.lockDir));
    fireHooks(hooks, "after", "durability:release", handle.lockDir);
  } catch (error) {
    // A failed release must not leave this process with reusable in-process
    // authority, and must retain sufficient validated owner evidence: if the
    // owner record was already unlinked but the lock directory survives,
    // restore the exact owner record so the lock remains identifiable and
    // refuses new writers rather than becoming an ownerless stale lock.
    HELD_LOCKS.delete(key);
    const retained = restoreOwnerRecord(handle.lockDir, owner, handle.stateDir);
    return fail([
      issue(
        "WRITER_LOCK_RELEASE_FAILED",
        `could not release the owned writer lock: ${codeOf(error)}`,
      ),
      ...(retained === null ? [] : [retained]),
    ]);
  }
  HELD_LOCKS.delete(key);
  return ok(null);
}

/**
 * Restore the exact validated owner record when a release removed it but did
 * not durably finish. A record that has appeared since (a different owner, or
 * corrupt/unreadable bytes) is unrelated ownership evidence: it is retained
 * verbatim rather than truncated with the old owner's bytes, and the conflict
 * is reported. Best effort: the lock directory may already be gone (a completed
 * rmdir), in which case there is no stale lock to leave behind.
 */
function restoreOwnerRecord(
  lockDir: string,
  owner: WriterOwner,
  stateDir: string,
): ModelIssue | null {
  let stats;
  try {
    stats = lstatSync(lockDir);
  } catch {
    return null;
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) return null;
  const ownerAbs = ownerFileAbs(lockDir);
  if (ownerRecordPresent(ownerAbs)) {
    const current = readOwner(lockDir);
    if (!current.ok) {
      return issue(
        "WRITER_LOCK_RELEASE_FAILED",
        `an unreadable owner record appeared during release (${current.reason}); retaining it rather than overwriting unrelated ownership evidence`,
        writerLockDir(stateDir),
      );
    }
    if (
      current.value.transactionId !== owner.transactionId ||
      current.value.pid !== owner.pid
    ) {
      return issue(
        "WRITER_LOCK_RELEASE_FAILED",
        `a different owner record ${current.value.transactionId} appeared during release; retaining it rather than overwriting unrelated ownership evidence`,
        writerLockDir(stateDir),
      );
    }
    return null;
  }
  try {
    writeFileSync(ownerAbs, `${JSON.stringify(owner)}\n`, { mode: 0o600 });
  } catch {
    // The lock directory is gone or unreadable; nothing more can be retained.
  }
  return null;
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
