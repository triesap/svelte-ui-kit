/** Complete fresh inventory proof; no authentication survives this call. */
import { createHash } from "node:crypto";
import {
  closeSync,
  constants,
  fstatSync,
  lstatSync,
  openSync,
  readFileSync,
  readdirSync,
  realpathSync,
  type Stats,
} from "node:fs";
import path from "node:path";
import { isSafeLogicalRelativePath } from "./paths.js";

function directory(file: string): Stats {
  const current = lstatSync(file);
  if (!current.isDirectory() || current.isSymbolicLink())
    throw new Error("Native inventory directory must remain real");
  return current;
}

function sameIdentity(before: Stats, after: Stats): boolean {
  return (
    before.dev === after.dev &&
    before.ino === after.ino &&
    before.mode === after.mode
  );
}

function sameContents(before: Stats, after: Stats): boolean {
  return (
    sameIdentity(before, after) &&
    before.size === after.size &&
    before.mtimeMs === after.mtimeMs &&
    before.ctimeMs === after.ctimeMs
  );
}

/**
 * Walk each declared directory once and hash every current regular file. The
 * selected root can be an ordinary pnpm/hoisted alias; links inside it refuse.
 * File descriptors bind reads to real files. Closing checks bind the current
 * directory ancestry and selected alias without caching any success between
 * mutation boundaries.
 */
export function verifyNativeInventory(
  packageRoot: string,
  expected: ReadonlyMap<string, string>,
): void {
  const remaining = new Map(expected);
  const directories = new Set<string>();
  for (const [logical, hash] of remaining) {
    if (!isSafeLogicalRelativePath(logical) || !/^[a-f0-9]{64}$/.test(hash))
      throw new Error("Invalid native inventory input");
    const segments = logical.split("/");
    for (let index = 1; index < segments.length; index++) {
      const parent = segments.slice(0, index).join("/");
      if (remaining.has(parent))
        throw new Error("Native inventory file/directory overlap");
      directories.add(parent);
    }
  }
  if (
    typeof constants.O_NOFOLLOW !== "number" ||
    typeof constants.O_NONBLOCK !== "number"
  )
    throw new Error("Native inventory requires nonfollowing file opens");
  const actualRoot = realpathSync(packageRoot);
  const rootIdentity = directory(actualRoot);
  const ancestry: { path: string; stat: Stats }[] = [];
  const visited: { path: string; stat: Stats }[] = [];
  for (let parent = path.dirname(actualRoot); ; parent = path.dirname(parent)) {
    ancestry.push({ path: parent, stat: directory(parent) });
    if (path.dirname(parent) === parent) break;
  }
  const visit = (current: string, prefix: string): void => {
    const before = directory(current);
    visited.push({ path: current, stat: before });
    const entries = readdirSync(current, { withFileTypes: true });
    entries.sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
    for (const entry of entries) {
      const logical = `${prefix}${entry.name}`;
      const physical = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error("Native inventory link");
      if (entry.isDirectory()) {
        if (!directories.delete(logical))
          throw new Error("Extra native inventory directory");
        visit(physical, `${logical}/`);
      } else {
        const hash = remaining.get(logical);
        if (!entry.isFile() || hash === undefined)
          throw new Error("Extra native inventory entry");
        const fd = openSync(
          physical,
          constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
        );
        try {
          const opened = fstatSync(fd);
          if (!opened.isFile())
            throw new Error("Native inventory file must be regular");
          if (
            createHash("sha256").update(readFileSync(fd)).digest("hex") !== hash
          )
            throw new Error("Native inventory bytes changed");
          const closed = lstatSync(physical);
          if (
            !closed.isFile() ||
            closed.isSymbolicLink() ||
            !sameContents(opened, closed)
          )
            throw new Error("Native inventory file identity changed");
        } finally {
          closeSync(fd);
        }
        remaining.delete(logical);
      }
    }
    const closed = directory(current);
    if (!sameContents(before, closed))
      throw new Error("Native inventory directory changed");
  };
  visit(actualRoot, "");
  if (remaining.size || directories.size)
    throw new Error("Missing native inventory entry");
  // A later sibling read must not leave changes in an earlier subtree. Retain
  // every directory receipt until all bytes have been read, as the former
  // separate final inventory walk did; do not rely only on root metadata.
  for (const entry of visited)
    if (!sameContents(entry.stat, directory(entry.path)))
      throw new Error("Native inventory directory changed after traversal");
  for (const parent of ancestry)
    if (!sameIdentity(parent.stat, directory(parent.path)))
      throw new Error("Native inventory ancestry changed");
  if (realpathSync(packageRoot) !== actualRoot)
    throw new Error("Native inventory root alias changed");
  if (!sameContents(rootIdentity, directory(actualRoot)))
    throw new Error("Native inventory root changed");
}
