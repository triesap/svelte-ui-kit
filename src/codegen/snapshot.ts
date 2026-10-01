/**
 * Read-only project observations (S041).
 *
 * A snapshot captures the exact bytes, kind, mode and link target of the
 * project targets a plan depends on. It is the stable preimage the planner
 * reasons about and is deliberately *not* a writer: capturing a snapshot opens
 * no handle for writing, creates no temporary file and mutates nothing.
 *
 * Observations keep absence distinct from empty content: a missing target has
 * `kind: "absent"` and no bytes, while an empty file has `kind: "file"` and a
 * zero-length `bytes`. Bytes are defensively copied and the result is deeply
 * frozen, so a later filesystem change cannot mutate an already captured
 * snapshot.
 */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readlinkSync } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";

export type ObservedKind =
  "absent" | "file" | "directory" | "symlink" | "other" | "unreadable";

export interface TargetObservation {
  readonly path: string;
  readonly kind: ObservedKind;
  /** Exact bytes for a regular file, or `null`. Never shared with the caller. */
  readonly bytes: Uint8Array | null;
  readonly mode: number | null;
  readonly size: number | null;
  readonly linkTarget: string | null;
  readonly hash: string | null;
  /** Stable I/O error code for `kind: "unreadable"`. */
  readonly errorCode: string | null;
}

export interface ProjectSnapshot {
  /** Canonical absolute root (runtime value, never used as a diagnostic locator). */
  readonly root: string;
  readonly entries: ReadonlyMap<string, TargetObservation>;
  /** The logical paths captured, in request order. */
  readonly paths: readonly string[];
}

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function makeObservation(
  fields: Omit<TargetObservation, "bytes">,
  bytesSource: Uint8Array | null,
): TargetObservation {
  const observation = {
    ...fields,
    get bytes(): Uint8Array | null {
      return bytesSource === null ? null : new Uint8Array(bytesSource);
    },
  };
  return Object.freeze(observation);
}

/** Observe one logical target beneath `root` without following a final link. */
function observeOne(root: string, logicalPath: string): TargetObservation {
  const abs = path.join(root, ...logicalPath.split("/"));
  let stats;
  try {
    stats = lstatSync(abs);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") {
      return makeObservation(
        {
          path: logicalPath,
          kind: "absent",
          mode: null,
          size: null,
          linkTarget: null,
          hash: null,
          errorCode: null,
        },
        null,
      );
    }
    return makeObservation(
      {
        path: logicalPath,
        kind: "unreadable",
        mode: null,
        size: null,
        linkTarget: null,
        hash: null,
        errorCode: code ?? "EIO",
      },
      null,
    );
  }
  const base = {
    path: logicalPath,
    mode: stats.mode & 0o7777,
    size: stats.size,
    linkTarget: null as string | null,
    hash: null as string | null,
    errorCode: null as string | null,
  };
  if (stats.isSymbolicLink()) {
    let target: string | null;
    try {
      target = readlinkSync(abs);
    } catch {
      target = null;
    }
    return makeObservation(
      { ...base, kind: "symlink", linkTarget: target },
      null,
    );
  }
  if (stats.isDirectory()) {
    return makeObservation({ ...base, kind: "directory" }, null);
  }
  if (stats.isFile()) {
    let buffer: Buffer;
    try {
      buffer = readFileSync(abs);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code;
      return makeObservation(
        { ...base, kind: "unreadable", errorCode: code ?? "EIO" },
        null,
      );
    }
    const copy = new Uint8Array(buffer);
    return makeObservation(
      {
        ...base,
        kind: "file",
        size: copy.byteLength,
        hash: sha256(buffer),
      },
      copy,
    );
  }
  return makeObservation({ ...base, kind: "other" }, null);
}

/**
 * Capture read-only observations for the given logical paths. A lexically
 * unsafe path is a typed failure; every safe path yields exactly one
 * observation. No write of any kind occurs.
 */
export function captureSnapshot(
  root: string,
  logicalPaths: readonly string[],
): ModelResult<ProjectSnapshot> {
  const issues = [];
  for (const logicalPath of logicalPaths) {
    if (!isSafeLogicalRelativePath(logicalPath)) {
      issues.push(
        issue(
          "SNAPSHOT_PATH_INVALID",
          `${JSON.stringify(logicalPath)} is not a safe logical relative path`,
        ),
      );
    }
  }
  if (issues.length > 0) return fail(issues);

  const canonicalRoot = path.resolve(root);
  const entries = new Map<string, TargetObservation>();
  for (const logicalPath of logicalPaths) {
    entries.set(logicalPath, observeOne(canonicalRoot, logicalPath));
  }
  return ok(
    Object.freeze({
      root: canonicalRoot,
      entries,
      paths: Object.freeze([...logicalPaths]),
    }),
  );
}

/** Read a captured observation without exposing a mutable map. */
export function observationOf(
  snapshot: ProjectSnapshot,
  logicalPath: string,
): TargetObservation | undefined {
  return snapshot.entries.get(logicalPath);
}

/** True when the snapshot observed an existing regular file. */
export function isObservedFile(observation: TargetObservation): boolean {
  return observation.kind === "file";
}

/** Decode observed bytes as UTF-8, or `null` when there are no bytes. */
export function observedText(observation: TargetObservation): string | null {
  return observation.bytes === null
    ? null
    : new TextDecoder().decode(observation.bytes);
}
