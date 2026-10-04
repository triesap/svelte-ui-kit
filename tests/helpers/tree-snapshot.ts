import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstatSync,
  readFileSync,
  readlinkSync,
  readdirSync,
  type Stats,
} from "node:fs";
import path from "node:path";

/**
 * Deterministic complete-tree snapshot for integration tests.
 *
 * The walk uses `lstat` and `readlink` only, so symlinks are recorded by kind
 * and target without following them, and it includes hidden entries,
 * directories, file bytes, file sizes and permission bits. Entries are emitted
 * in sorted order so two snapshots of unchanged trees compare equal.
 */
export type TreeEntryKind = "file" | "directory" | "symbolic-link" | "other";

export interface TreeEntry {
  readonly path: string;
  readonly kind: TreeEntryKind;
  readonly mode: number;
  readonly size: number;
  readonly sha256: string | null;
  readonly linkTarget: string | null;
}

function classify(stats: Stats): TreeEntryKind {
  if (stats.isDirectory()) return "directory";
  if (stats.isSymbolicLink()) return "symbolic-link";
  if (stats.isFile()) return "file";
  return "other";
}

export function snapshotTree(root: string): TreeEntry[] {
  const entries: TreeEntry[] = [];
  const walk = (abs: string, rel: string): void => {
    const stats = lstatSync(abs);
    const kind = classify(stats);
    const base = {
      path: rel,
      kind,
      mode: stats.mode & 0o7777,
      size: 0,
      sha256: null as string | null,
      linkTarget: null as string | null,
    };
    if (kind === "directory") {
      entries.push(base);
      for (const name of readdirSync(abs).sort()) {
        walk(path.join(abs, name), rel === "" ? name : `${rel}/${name}`);
      }
      return;
    }
    if (kind === "symbolic-link") {
      entries.push({ ...base, linkTarget: readlinkSync(abs) });
      return;
    }
    if (kind === "file") {
      entries.push({
        ...base,
        size: stats.size,
        sha256: createHash("sha256").update(readFileSync(abs)).digest("hex"),
      });
      return;
    }
    entries.push(base);
  };
  walk(root, "");
  return entries;
}

/**
 * Assert the complete tree after a guarded apply equals the tree implied by the
 * captured pre-state and the planned mutations, not by re-observing the result.
 *
 * Every pre-existing entry must survive unchanged unless the plan explicitly
 * updates or retires it; every planned postimage must appear with its exact
 * bytes, mode and kind; and every directory that a mutation needs as a
 * structural parent must be the *only* newly appearing directory. An
 * unexplained addition, removal or field change fails, so transient residue
 * left by the guarded transaction cannot be mistaken for a planned result.
 */
export interface TreeMutation {
  readonly path: string;
  readonly operation: "create" | "update" | "retire";
  /** Result bytes for a create/update; omitted for a retirement. */
  readonly bytes?: Uint8Array;
  readonly mode?: number;
}

/** The mode `fs.mkdirSync` applies to a freshly created directory. */
export function defaultDirectoryMode(): number {
  return 0o777 & ~process.umask();
}

function fileEntry(path: string, bytes: Uint8Array, mode: number): TreeEntry {
  return {
    path,
    kind: "file",
    mode,
    size: bytes.byteLength,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    linkTarget: null,
  };
}

function entryEquals(left: TreeEntry, right: TreeEntry): boolean {
  return (
    left.kind === right.kind &&
    left.mode === right.mode &&
    left.size === right.size &&
    left.sha256 === right.sha256 &&
    left.linkTarget === right.linkTarget
  );
}

/** Ancestor directories of a logical path, shallowest first. */
function ancestorDirectories(logicalPath: string): string[] {
  const segments = logicalPath.split("/");
  const ancestors: string[] = [];
  for (let index = 1; index < segments.length; index += 1) {
    ancestors.push(segments.slice(0, index).join("/"));
  }
  return ancestors;
}

/**
 * Assert the exact resulting tree. The expectation is derived only from the
 * captured `before` snapshot and the `mutations`; the actual tree is then
 * compared field-for-field. Newly created structural parent directories are
 * permitted only when a mutation requires them as an ancestor.
 */
export function assertTreeAfterMutations(
  root: string,
  before: readonly TreeEntry[],
  mutations: readonly TreeMutation[],
): void {
  const expected = new Map<string, TreeEntry>(
    before.map((entry) => [entry.path, entry]),
  );
  const justifiedDirectories = new Set<string>();
  for (const mutation of mutations) {
    for (const ancestor of ancestorDirectories(mutation.path)) {
      if (!expected.has(ancestor)) justifiedDirectories.add(ancestor);
    }
    if (mutation.operation === "retire") {
      expected.delete(mutation.path);
      continue;
    }
    const bytes = mutation.bytes ?? new Uint8Array();
    expected.set(
      mutation.path,
      fileEntry(mutation.path, bytes, mutation.mode ?? 0o644),
    );
  }
  for (const directory of justifiedDirectories) {
    if (expected.has(directory)) continue;
    expected.set(directory, {
      path: directory,
      kind: "directory",
      mode: defaultDirectoryMode(),
      size: 0,
      sha256: null,
      linkTarget: null,
    });
  }

  const actual = snapshotTree(root);
  const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
  const unexpected = actual
    .map((entry) => entry.path)
    .filter((path) => !expected.has(path))
    .sort();
  const missing = [...expected.keys()]
    .filter((path) => !actualByPath.has(path))
    .sort();
  assert.deepEqual(
    unexpected,
    [],
    `unexplained tree entries after apply:\n${unexpected.join("\n")}`,
  );
  assert.deepEqual(
    missing,
    [],
    `planned tree entries missing after apply:\n${missing.join("\n")}`,
  );
  const mismatched: string[] = [];
  for (const [path, wanted] of expected) {
    const found = actualByPath.get(path);
    if (found !== undefined && !entryEquals(wanted, found)) {
      mismatched.push(
        `${path}: expected ${JSON.stringify(wanted)} but found ${JSON.stringify(found)}`,
      );
    }
  }
  assert.deepEqual(
    mismatched,
    [],
    `tree entries changed unexpectedly:\n${mismatched.join("\n")}`,
  );
}

/** Index a snapshot by path for targeted assertions. */
export function snapshotByPath(
  entries: readonly TreeEntry[],
): Map<string, TreeEntry> {
  return new Map(entries.map((entry) => [entry.path, entry]));
}
