/**
 * Recursive owned-transient inventory proof (RCLD04-R2-4).
 *
 * A reserved directory name or a numeric filename never proves ownership of its
 * contents. The exact owned inventory is derived from the validated journal
 * transaction records: the recorded staged and backup identifiers, plus the
 * single staged publication lock. Before any recovery or cleanup effect this
 * walks the whole transaction directory with non-following metadata and
 * rejects, at every depth, a symlink, an unreadable entry, an unexpected entry,
 * or a recorded entry whose kind is not the required regular file. Unexpected
 * entries — including unrecorded numeric names and directories that merely look
 * like owned ids — are retained and reported, never recursively deleted.
 */
import {
  closeSync,
  fchmodSync,
  fstatSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmdirSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import path from "node:path";

import {
  fail,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import type { TransactionJournal } from "./transaction-journal.js";
import { sha256Hex } from "./digest.js";
import { flushDirectory } from "./durability.js";
import { fireHooks, type TransactionHooks } from "./transaction-hooks.js";
import {
  backupsDir,
  journalTempName,
  progressDir,
  publicationIntentTempName,
  stagedDir,
  transactionDir,
} from "./transaction-types.js";

export interface OwnedInventory {
  readonly topLevelFiles: ReadonlySet<string>;
  readonly topLevelDirs: ReadonlySet<string>;
  readonly staged: ReadonlySet<string>;
  readonly backups: ReadonlySet<string>;
  readonly progress: ReadonlySet<string>;
}

/** In-process receipt of an exclusive creation, never inferred from a name. */
export interface OwnedCreation {
  readonly path: string;
  readonly kind: "file" | "directory";
  readonly device: number;
  readonly inode: number;
  readonly mode: number;
  readonly digest: string | null;
}

const CREATIONS = new WeakSet<OwnedCreation>();

function recordCreation(entry: OwnedCreation): OwnedCreation {
  Object.freeze(entry);
  CREATIONS.add(entry);
  return entry;
}

/** Record the new directory before any caller hook or flush can fail. */
export function createOwnedDirectory(
  target: string,
  receipts: OwnedCreation[],
  mode = 0o700,
): void {
  mkdirSync(target, { recursive: false, mode });
  const stats = lstatSync(target);
  if (!stats.isDirectory() || stats.isSymbolicLink()) {
    throw new Error("exclusive directory creation changed kind");
  }
  receipts.push(
    recordCreation({
      path: target,
      kind: "directory",
      device: stats.dev,
      inode: stats.ino,
      mode: stats.mode & 0o7777,
      digest: null,
    }),
  );
}

/**
 * Record the open exclusive file before writing. Each completed partial write
 * updates only its known prefix; a later failure cannot bless foreign bytes.
 * The descriptor, rather than a reopened path, owns chmod and identity reads.
 */
export function writeOwnedFile(
  target: string,
  bytes: Uint8Array,
  mode: number,
  receipts: OwnedCreation[],
  onCreated?: () => void,
): void {
  const fd = openSync(target, "wx", 0o600);
  let primary: unknown;
  try {
    const stats = fstatSync(fd);
    const index = receipts.length;
    let entry = recordCreation({
      path: target,
      kind: "file",
      device: stats.dev,
      inode: stats.ino,
      mode: stats.mode & 0o7777,
      digest: sha256Hex(new Uint8Array()),
    });
    receipts.push(entry);
    onCreated?.();
    const proof = verifyOwnedCreations(receipts);
    if (proof.length > 0)
      throw new Error(proof.map((entry) => entry.message).join("; "));
    let offset = 0;
    while (offset < bytes.byteLength) {
      const written = writeSync(fd, bytes, offset, bytes.byteLength - offset);
      if (written === 0)
        throw new Error("exclusive staged write made no progress");
      offset += written;
      entry = recordCreation({
        ...entry,
        digest: sha256Hex(bytes.subarray(0, offset)),
      });
      receipts[index] = entry;
    }
    fchmodSync(fd, mode);
    receipts[index] = recordCreation({
      ...entry,
      mode: fstatSync(fd).mode & 0o7777,
    });
  } catch (error) {
    primary = error;
  }
  try {
    closeSync(fd);
  } catch (error) {
    if (primary !== undefined) {
      throw new AggregateError(
        [primary, error],
        "exclusive write and descriptor close failed",
        { cause: error },
      );
    }
    throw error;
  }
  if (primary !== undefined) throw primary;
}

/** Prove the complete receipt inventory without following links. */
export function verifyOwnedCreations(
  receipts: readonly OwnedCreation[],
): ModelIssue[] {
  if (receipts.some((entry) => !CREATIONS.has(entry))) {
    return [
      {
        code: "OWNED_CLEANUP_REFUSED",
        message: "creation receipt is not held by this process",
      },
    ];
  }
  return verifyPhysicalInventory(receipts);
}

function verifyPhysicalInventory(
  receipts: readonly OwnedCreation[],
): ModelIssue[] {
  const expected = new Map(receipts.map((entry) => [entry.path, entry]));
  try {
    for (const entry of receipts) {
      let stats;
      try {
        stats = lstatSync(entry.path);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
        throw error;
      }
      if (
        stats.isSymbolicLink() ||
        (entry.kind === "file" ? !stats.isFile() : !stats.isDirectory()) ||
        stats.dev !== entry.device ||
        stats.ino !== entry.inode ||
        (stats.mode & 0o7777) !== entry.mode
      ) {
        throw new Error(
          "created entry changed physical identity, kind or mode",
        );
      }
      if (entry.kind === "file") {
        if (sha256Hex(readFileSync(entry.path)) !== entry.digest) {
          throw new Error("created file changed bytes");
        }
      } else {
        for (const name of readdirSync(entry.path)) {
          if (!expected.has(path.join(entry.path, name))) {
            throw new Error("created directory contains unrecorded content");
          }
        }
      }
    }
  } catch (error) {
    return [
      {
        code: "OWNED_CLEANUP_REFUSED",
        message: `owned creation inventory is uncertain; preserving it: ${error instanceof Error ? error.message : String(error)}`,
      },
    ];
  }
  return [];
}

/** Frozen physical proof after the caller's journal/inventory validation. */
export interface HeldCleanupInventory {
  readonly entries: readonly OwnedCreation[];
}
const CLEANUP_INVENTORIES = new WeakSet<HeldCleanupInventory>();

export function captureCleanupInventory(
  root: string,
  stateDir: string,
  transactionId: string,
  inventory: OwnedInventory,
): ModelResult<HeldCleanupInventory> {
  const issues = verifyOwnedInventory(root, stateDir, transactionId, inventory);
  if (issues.length > 0) return fail(issues);
  const entries: OwnedCreation[] = [];
  const walk = (target: string): void => {
    let stats;
    try {
      stats = lstatSync(target);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return;
      throw error;
    }
    if (stats.isSymbolicLink() || (!stats.isDirectory() && !stats.isFile()))
      throw new Error("cleanup inventory changed kind");
    entries.push(
      Object.freeze({
        path: target,
        kind: stats.isDirectory() ? "directory" : "file",
        device: stats.dev,
        inode: stats.ino,
        mode: stats.mode & 0o7777,
        digest: stats.isFile() ? sha256Hex(readFileSync(target)) : null,
      }),
    );
    if (stats.isDirectory())
      for (const name of readdirSync(target)) walk(path.join(target, name));
  };
  try {
    walk(
      path.join(root, ...transactionDir(stateDir, transactionId).split("/")),
    );
  } catch (error) {
    return fail([
      {
        code: "OWNED_CLEANUP_REFUSED",
        message: `could not freeze cleanup inventory: ${error instanceof Error ? error.message : String(error)}`,
      },
    ]);
  }
  const proof = Object.freeze({ entries: Object.freeze(entries) });
  CLEANUP_INVENTORIES.add(proof);
  const inventoryRecheck = verifyOwnedInventory(
    root,
    stateDir,
    transactionId,
    inventory,
  );
  if (inventoryRecheck.length > 0) return fail(inventoryRecheck);
  const verified = verifyPhysicalInventory(proof.entries);
  return verified.length > 0 ? fail(verified) : ok(proof);
}

export function verifyCleanupInventory(
  proof: HeldCleanupInventory,
): ModelIssue[] {
  if (!CLEANUP_INVENTORIES.has(proof))
    return [
      {
        code: "OWNED_CLEANUP_REFUSED",
        message: "cleanup inventory is not held by this process",
      },
    ];
  return verifyPhysicalInventory(proof.entries);
}

/** Remove only frozen entries beneath this target, individually and durably. */
export function removeCleanupEntries(
  proof: HeldCleanupInventory,
  target: string,
): ModelIssue[] {
  const preflight = verifyCleanupInventory(proof);
  if (preflight.length > 0) return preflight;
  const entries = proof.entries
    .filter(
      (entry) =>
        entry.path === target || entry.path.startsWith(`${target}${path.sep}`),
    )
    .sort(
      (a, b) => b.path.split(path.sep).length - a.path.split(path.sep).length,
    );
  for (const entry of entries) {
    const recheck = verifyCleanupInventory(proof);
    if (recheck.length > 0) return recheck;
    let removed = false;
    try {
      if (entry.kind === "file") unlinkSync(entry.path);
      else rmdirSync(entry.path);
      removed = true;
      flushDirectory(path.dirname(entry.path));
    } catch (error) {
      if (!removed && (error as NodeJS.ErrnoException).code === "ENOENT")
        continue;
      return [
        {
          code: "OWNED_CLEANUP_FAILED",
          message: `frozen inventory removal did not finish: ${error instanceof Error ? error.message : String(error)}`,
        },
      ];
    }
  }
  return [];
}

/** Empty-only directory and individual-file removal after whole-inventory proof. */
export function cleanupOwnedCreations(
  receipts: readonly OwnedCreation[],
  hooks?: TransactionHooks,
): ModelIssue[] {
  const preflight = verifyOwnedCreations(receipts);
  if (preflight.length > 0) return preflight;
  const ordered = [...receipts].sort(
    (a, b) => b.path.split(path.sep).length - a.path.split(path.sep).length,
  );
  for (const entry of ordered) {
    const recheck = verifyOwnedCreations(receipts);
    if (recheck.length > 0) return recheck;
    let removed = false;
    try {
      if (entry.kind === "file") unlinkSync(entry.path);
      else rmdirSync(entry.path);
      removed = true;
      fireHooks(hooks, "before", "durability:cleanup", entry.path);
      flushDirectory(path.dirname(entry.path));
      fireHooks(hooks, "after", "durability:cleanup", entry.path);
    } catch (error) {
      if (!removed && (error as NodeJS.ErrnoException).code === "ENOENT")
        continue;
      return [
        {
          code: "OWNED_CLEANUP_FAILED",
          message: `owned creation cleanup did not finish: ${error instanceof Error ? error.message : String(error)}`,
        },
      ];
    }
  }
  return [];
}

/** Transfer a held file receipt through an owned rename to an absent path. */
export function renameOwnedCreation(
  source: string,
  destination: string,
  receipts: OwnedCreation[],
): void {
  const proof = verifyOwnedCreations(receipts);
  if (proof.length > 0)
    throw new Error(proof.map((entry) => entry.message).join("; "));
  const index = receipts.findIndex(
    (entry) => entry.path === source && entry.kind === "file",
  );
  if (index < 0) throw new Error("rename requires a held creation receipt");
  const existingIndex = receipts.findIndex(
    (entry) => entry.path === destination,
  );
  try {
    lstatSync(destination);
    if (existingIndex < 0) throw new Error("owned rename destination appeared");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  renameSync(source, destination);
  const moved = recordCreation({ ...receipts[index]!, path: destination });
  if (existingIndex >= 0) receipts.splice(existingIndex, 1);
  receipts[receipts.findIndex((entry) => entry.path === source)] = moved;
}

/** Transfer an authenticated live preimage into a newly owned backup entry. */
export function backupOwnedPreimage(
  source: string,
  destination: string,
  digest: string,
  mode: number,
  receipts: OwnedCreation[],
): void {
  const proof = verifyOwnedCreations(receipts);
  if (proof.length > 0)
    throw new Error(proof.map((entry) => entry.message).join("; "));
  const stats = lstatSync(source);
  if (
    !stats.isFile() ||
    stats.isSymbolicLink() ||
    (stats.mode & 0o7777) !== mode ||
    sha256Hex(readFileSync(source)) !== digest
  )
    throw new Error("backup preimage is not authentic");
  try {
    lstatSync(destination);
    throw new Error("backup destination appeared");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
  renameSync(source, destination);
  receipts.push(
    recordCreation({
      path: destination,
      kind: "file",
      device: stats.dev,
      inode: stats.ino,
      mode,
      digest,
    }),
  );
}

/** A staged image renamed into semantic source is no longer transient cleanup. */
export function forgetRenamedCreation(
  source: string,
  receipts: OwnedCreation[],
): void {
  const index = receipts.findIndex((entry) => entry.path === source);
  if (index >= 0) receipts.splice(index, 1);
}

const TOP_LEVEL_FILES = new Set(["journal.json", "publication.json"]);
const TOP_LEVEL_DIRS = new Set(["staged", "backups", "progress"]);

/** The single staged publication image name (never an ordinary staged id). */
export const STAGED_PUBLICATION_NAME = "kit.lock.json";

/**
 * Derive the exact owned inventory from validated transaction records. The only
 * names that may be removed are the ones this attempt itself recorded; a numeric
 * or temporary-looking name is not ownership.
 */
export function ownedInventoryFor(journal: TransactionJournal): OwnedInventory {
  const staged = new Set<string>([STAGED_PUBLICATION_NAME]);
  const backups = new Set<string>();
  for (const operation of journal.operations) {
    if (operation.stagedId !== null) staged.add(operation.stagedId);
    if (operation.backupId !== null) backups.add(operation.backupId);
  }
  return {
    topLevelFiles: TOP_LEVEL_FILES,
    topLevelDirs: TOP_LEVEL_DIRS,
    staged,
    backups,
    progress: new Set<string>(),
  };
}

/** An inventory with no recorded content, for a journal-less cleanup tail. */
export function emptyOwnedInventory(): OwnedInventory {
  return {
    topLevelFiles: TOP_LEVEL_FILES,
    topLevelDirs: TOP_LEVEL_DIRS,
    staged: new Set<string>([STAGED_PUBLICATION_NAME]),
    backups: new Set<string>(),
    progress: new Set<string>(),
  };
}

function inventoryIssue(
  transactionId: string,
  message: string,
  locator?: string,
): ModelIssue {
  return locator === undefined
    ? { code: "RECOVERY_UNEXPECTED_ENTRY", message }
    : { code: "RECOVERY_UNEXPECTED_ENTRY", message, locator };
}

/**
 * Check one owned directory. Every child must be a recorded name of a required
 * kind: a symlink, an unexpected name or a wrong-kind recorded entry is a typed
 * refusal. The directory itself must be a real directory.
 */
function checkDirectory(
  transactionId: string,
  dirAbs: string,
  allowedFiles: ReadonlySet<string>,
  allowedDirs: ReadonlySet<string>,
  allowedTempFiles: ReadonlySet<string>,
): ModelIssue[] {
  const entry = observeEntry(dirAbs);
  if (entry.kind === "absent") return [];
  if (entry.kind === "unreadable") {
    return [
      {
        code: "RECOVERY_INVENTORY_UNREADABLE",
        message: `transaction ${transactionId} inventory is unreadable at ${path.basename(dirAbs)} (${entry.code})`,
      },
    ];
  }
  if (entry.kind !== "directory") {
    return [
      inventoryIssue(
        transactionId,
        `transaction ${transactionId} entry ${path.basename(dirAbs)} is not a real directory (${entry.kind})`,
        path.basename(dirAbs),
      ),
    ];
  }
  let names: string[];
  try {
    names = readdirSync(dirAbs);
  } catch (error) {
    return [
      {
        code: "RECOVERY_INVENTORY_UNREADABLE",
        message: `transaction ${transactionId} inventory is unreadable (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
      },
    ];
  }
  const issues: ModelIssue[] = [];
  for (const name of names) {
    if (allowedTempFiles.has(name)) {
      // Only the exact temporary names this transaction records are owned; a
      // prefix or pattern match is never ownership.
      const tempKind = observeEntry(path.join(dirAbs, name)).kind;
      if (tempKind !== "file" && tempKind !== "absent") {
        issues.push(
          inventoryIssue(
            transactionId,
            `recorded temporary transaction entry ${name} is not a regular file (${tempKind}); refusing owned cleanup`,
            name,
          ),
        );
      }
      continue;
    }
    const child = path.join(dirAbs, name);
    const kind = observeEntry(child).kind;
    if (kind === "symlink") {
      issues.push(
        inventoryIssue(
          transactionId,
          `transaction ${transactionId} contains a symlink at ${name}; refusing owned cleanup`,
          name,
        ),
      );
      continue;
    }
    if (allowedDirs.has(name)) {
      if (kind !== "directory") {
        issues.push(
          inventoryIssue(
            transactionId,
            `recorded transaction directory ${name} is not a real directory (${kind}); refusing owned cleanup`,
            name,
          ),
        );
      }
      continue;
    }
    if (!allowedFiles.has(name)) {
      issues.push(
        inventoryIssue(
          transactionId,
          `transaction ${transactionId} contains an unexpected unrecorded entry (${name}); refusing owned cleanup`,
          name,
        ),
      );
      continue;
    }
    // A recorded file id must itself be a regular file; a directory or other
    // kind under a record name is contradictory and must be retained, not
    // recursed.
    if (kind !== "file") {
      issues.push(
        inventoryIssue(
          transactionId,
          `recorded transaction entry ${name} is not a regular file (${kind}); refusing owned cleanup`,
          name,
        ),
      );
    }
  }
  return issues;
}

/**
 * Prove the transaction directory and every owned subdirectory contain only the
 * exact recorded inventory. Any unexpected entry, symlink, wrong-kind recorded
 * entry or unreadable directory at any depth is a typed refusal.
 */
export function verifyOwnedInventory(
  root: string,
  stateDir: string,
  transactionId: string,
  inventory: OwnedInventory,
): ModelIssue[] {
  const abs = (logical: string): string =>
    path.join(root, ...logical.split("/"));
  const txDir = abs(transactionDir(stateDir, transactionId));
  const allowedTempFiles = new Set<string>([
    journalTempName(transactionId),
    publicationIntentTempName(transactionId),
  ]);
  const issues = checkDirectory(
    transactionId,
    txDir,
    inventory.topLevelFiles,
    inventory.topLevelDirs,
    allowedTempFiles,
  );
  if (issues.length > 0) return issues;
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(stagedDir(stateDir, transactionId)),
      inventory.staged,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(backupsDir(stateDir, transactionId)),
      inventory.backups,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  issues.push(
    ...checkDirectory(
      transactionId,
      abs(progressDir(stateDir, transactionId)),
      inventory.progress,
      new Set<string>(),
      new Set<string>(),
    ),
  );
  return issues;
}

/** True when the transaction directory holds any non-temporary owned state. */
export function hasOwnedMutationEvidence(
  root: string,
  stateDir: string,
  transactionId: string,
): boolean {
  const dirAbs = path.join(
    root,
    ...transactionDir(stateDir, transactionId).split("/"),
  );
  let names: string[];
  try {
    names = readdirSync(dirAbs);
  } catch {
    return true;
  }
  return names.some((name) => !/^journal\.json\.tmp-/.test(name));
}

/**
 * True when staged, backup or progress state remains, so a missing journal is
 * possible mutation evidence that must not be discarded. A lone publication
 * intent is handled separately by the publication classifier.
 */
export function hasRollbackEvidence(
  root: string,
  stateDir: string,
  transactionId: string,
): boolean {
  for (const logical of [
    stagedDir(stateDir, transactionId),
    backupsDir(stateDir, transactionId),
    progressDir(stateDir, transactionId),
  ]) {
    if (
      observeEntry(path.join(root, ...logical.split("/"))).kind !== "absent"
    ) {
      return true;
    }
  }
  return false;
}
