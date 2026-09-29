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

/** Index a snapshot by path for targeted assertions. */
export function snapshotByPath(
  entries: readonly TreeEntry[],
): Map<string, TreeEntry> {
  return new Map(entries.map((entry) => [entry.path, entry]));
}
