/**
 * Filesystem ancestry and symlink validation (S042).
 *
 * Extends lexical path safety to actual filesystem targets. A target's
 * ancestry is walked segment by segment from a canonicalized project root with
 * non-following `lstat`, so an unsupported symlink, a broken link, a
 * non-directory intermediate component or a directory where a file is expected
 * is rejected rather than followed. The walk never opens a target, so a FIFO or
 * other special file cannot block the process.
 *
 * The validated root identity (canonical path plus device/inode) is preserved
 * so a later recheck can detect that the root was replaced between planning and
 * mutation. This module only observes; it never writes or creates a directory.
 */
import { lstatSync, realpathSync, type Stats } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "./paths.js";

export interface RootIdentity {
  /** Canonical (realpath-resolved) root used for every target walk. */
  readonly root: string;
  /** The root value as requested (runtime value only). */
  readonly requestedRoot: string;
  readonly device: number;
  readonly inode: number;
}

export type TargetKind = "absent" | "file" | "directory" | "symlink" | "other";

export interface TargetAncestry {
  readonly path: string;
  readonly kind: TargetKind;
  readonly mode: number | null;
  /** Logical ancestors that do not currently exist, in walk order. */
  readonly missingAncestors: readonly string[];
}

function classify(stats: Stats): TargetKind {
  if (stats.isSymbolicLink()) return "symlink";
  if (stats.isDirectory()) return "directory";
  if (stats.isFile()) return "file";
  return "other";
}

/** Observe a path with `lstat`, returning a typed error for non-ENOENT. */
function lstatTyped(abs: string):
  | { readonly kind: "absent" }
  | { readonly kind: "error"; readonly code: string }
  | {
      readonly kind: "stats";
      readonly stats: Stats;
    } {
  try {
    return { kind: "stats", stats: lstatSync(abs) };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") return { kind: "absent" };
    return { kind: "error", code: code ?? "EIO" };
  }
}

/**
 * Canonicalize the explicitly selected root once and record its physical
 * identity. The root itself may be reached through a symlink; that is resolved
 * here, after which no symlink is permitted below it.
 */
export function captureRootIdentity(root: string): ModelResult<RootIdentity> {
  let real: string;
  try {
    real = realpathSync(root);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code ?? "EIO";
    return fail([
      issue(
        "ROOT_UNAVAILABLE",
        `the selected project root could not be resolved (${code})`,
      ),
    ]);
  }
  const observed = lstatTyped(real);
  if (observed.kind !== "stats" || !observed.stats.isDirectory()) {
    return fail([
      issue(
        "ROOT_NOT_DIRECTORY",
        "the selected project root is not a real directory",
      ),
    ]);
  }
  return ok({
    root: real,
    requestedRoot: path.resolve(root),
    device: observed.stats.dev,
    inode: observed.stats.ino,
  });
}

/** Recheck that the preserved root identity still names the same directory. */
export function assertRootIdentity(identity: RootIdentity): ModelResult<null> {
  const observed = lstatTyped(identity.root);
  if (observed.kind !== "stats") {
    return fail([
      issue(
        "ROOT_CHANGED",
        "the validated project root is no longer available",
      ),
    ]);
  }
  if (
    observed.stats.dev !== identity.device ||
    observed.stats.ino !== identity.inode
  ) {
    return fail([
      issue(
        "ROOT_CHANGED",
        "the validated project root was replaced since it was selected",
      ),
    ]);
  }
  return ok(null);
}

/**
 * Walk the ancestry of one logical target. Symlinks below the root, nonregular
 * intermediates and unreadable components are typed failures; a genuinely
 * absent suffix is reported as absent with its missing ancestors.
 */
export function observeTargetAncestry(
  identity: RootIdentity,
  logicalPath: string,
  expected: "file" | "directory",
): ModelResult<TargetAncestry> {
  if (!isSafeLogicalRelativePath(logicalPath)) {
    return fail([
      issue(
        "TARGET_PATH_INVALID",
        `${JSON.stringify(logicalPath)} is not a safe logical relative path`,
      ),
    ]);
  }
  const segments = logicalPath.split("/");
  const missingAncestors: string[] = [];
  let current = identity.root;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index] as string;
    current = path.join(current, segment);
    const logical = segments.slice(0, index + 1).join("/");
    const observed = lstatTyped(current);
    if (observed.kind === "error") {
      return fail([
        issue(
          "TARGET_ANCESTRY_UNREADABLE",
          `${JSON.stringify(logical)} could not be inspected (${observed.code})`,
          logical,
        ),
      ]);
    }
    const isFinal = index === segments.length - 1;
    if (observed.kind === "absent") {
      missingAncestors.push(logical);
      if (isFinal) {
        return ok({
          path: logicalPath,
          kind: "absent",
          mode: null,
          missingAncestors,
        });
      }
      continue;
    }
    const kind = classify(observed.stats);
    if (kind === "symlink") {
      return fail([
        issue(
          "TARGET_SYMLINK",
          `${JSON.stringify(logical)} is a symlink below the project root; symlinked targets are not supported`,
          logical,
        ),
      ]);
    }
    if (!isFinal) {
      if (kind !== "directory") {
        return fail([
          issue(
            "TARGET_ANCESTRY_NOT_DIRECTORY",
            `${JSON.stringify(logical)} is not a directory and cannot contain the target`,
            logical,
          ),
        ]);
      }
      continue;
    }
    if (
      (kind === "file" && expected === "file") ||
      (kind === "directory" && expected === "directory")
    ) {
      return ok({
        path: logicalPath,
        kind,
        mode: observed.stats.mode & 0o7777,
        missingAncestors,
      });
    }
    return fail([
      issue(
        "TARGET_KIND_CONFLICT",
        `${JSON.stringify(logical)} is an unsupported ${kind} entry where a ${expected} is expected`,
        logical,
      ),
    ]);
  }
  // Unreachable: the loop returns on the final segment.
  return fail([
    issue(
      "TARGET_PATH_INVALID",
      `could not resolve ${JSON.stringify(logicalPath)}`,
    ),
  ]);
}
