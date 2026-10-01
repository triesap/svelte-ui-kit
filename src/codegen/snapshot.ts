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
 * zero-length `bytes`. Bytes are defensively copied, the result is deeply
 * frozen and the entry lookup is a truly immutable view (it exposes only
 * read-only accessors, so `clear`/`set`/`delete` cannot remove captured
 * evidence).
 *
 * A target is observed through its *physical* ancestry: the canonical root is
 * resolved, and an intermediate symlink, non-directory or unreadable ancestor
 * is a typed `unsafe`/`unreadable` observation rather than being followed
 * outside the project. A missing intermediate is a genuine absence. Text
 * decoding is strict UTF-8 and preserves a byte-order mark, so application
 * bytes are never replaced lossily.
 */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readlinkSync, realpathSync } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";

export type ObservedKind =
  | "absent"
  | "file"
  | "directory"
  | "symlink"
  | "other"
  | "unsafe"
  | "unreadable";

export interface TargetObservation {
  readonly path: string;
  readonly kind: ObservedKind;
  /** Exact bytes for a regular file, or `null`. Never shared with the caller. */
  readonly bytes: Uint8Array | null;
  readonly mode: number | null;
  readonly size: number | null;
  readonly linkTarget: string | null;
  readonly hash: string | null;
  /** Stable I/O or ancestry code for `kind: "unreadable"`/`"unsafe"`. */
  readonly errorCode: string | null;
}

export interface ProjectSnapshot {
  /** Canonical absolute root (runtime value, never used as a diagnostic locator). */
  readonly root: string;
  readonly entries: ReadonlyMap<string, TargetObservation>;
  /** The logical paths captured, in request order. */
  readonly paths: readonly string[];
}

/**
 * A genuinely immutable lookup over captured observations. It implements the
 * read-only subset of `ReadonlyMap`; there is no `set`, `delete` or `clear`, so
 * a caller cannot remove or replace captured evidence.
 */
class FrozenObservations implements ReadonlyMap<string, TargetObservation> {
  readonly #map: Map<string, TargetObservation>;

  constructor(source: Map<string, TargetObservation>) {
    this.#map = new Map(source);
    Object.freeze(this);
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: string): TargetObservation | undefined {
    return this.#map.get(key);
  }

  has(key: string): boolean {
    return this.#map.has(key);
  }

  forEach(
    callbackfn: (
      value: TargetObservation,
      key: string,
      map: ReadonlyMap<string, TargetObservation>,
    ) => void,
    thisArg?: unknown,
  ): void {
    this.#map.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  keys(): MapIterator<string> {
    return this.#map.keys();
  }

  values(): MapIterator<TargetObservation> {
    return this.#map.values();
  }

  entries(): MapIterator<[string, TargetObservation]> {
    return this.#map.entries();
  }

  [Symbol.iterator](): MapIterator<[string, TargetObservation]> {
    return this.#map.entries();
  }
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

function absentObservation(logicalPath: string): TargetObservation {
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

function unsafeObservation(
  logicalPath: string,
  code: string,
): TargetObservation {
  return makeObservation(
    {
      path: logicalPath,
      kind: "unsafe",
      mode: null,
      size: null,
      linkTarget: null,
      hash: null,
      errorCode: code,
    },
    null,
  );
}

function unreadableObservation(
  logicalPath: string,
  code: string,
): TargetObservation {
  return makeObservation(
    {
      path: logicalPath,
      kind: "unreadable",
      mode: null,
      size: null,
      linkTarget: null,
      hash: null,
      errorCode: code,
    },
    null,
  );
}

type AncestorObservation =
  | { readonly kind: "ok" }
  | { readonly kind: "absent" }
  | { readonly kind: "unsafe" }
  | { readonly kind: "unreadable"; readonly code: string };

/**
 * Walk the non-final components of `logicalPath`, rejecting a symlinked or
 * non-directory ancestor before the final target is ever read. A missing
 * ancestor is a real absence; an unreadable ancestor is a typed I/O cause.
 */
function observeAncestors(
  root: string,
  logicalPath: string,
): AncestorObservation {
  const segments = logicalPath.split("/");
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index] as string);
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code;
      if (code === "ENOENT") return { kind: "absent" };
      return { kind: "unreadable", code: code ?? "EIO" };
    }
    if (stats.isSymbolicLink()) return { kind: "unsafe" };
    if (!stats.isDirectory()) return { kind: "unsafe" };
  }
  return { kind: "ok" };
}

/** Observe one logical target beneath `root` without following a final link. */
function observeOne(root: string, logicalPath: string): TargetObservation {
  const ancestors = observeAncestors(root, logicalPath);
  if (ancestors.kind === "absent") return absentObservation(logicalPath);
  if (ancestors.kind === "unsafe") {
    return unsafeObservation(logicalPath, "UNSAFE_ANCESTRY");
  }
  if (ancestors.kind === "unreadable") {
    return unreadableObservation(logicalPath, ancestors.code);
  }

  const abs = path.join(root, ...logicalPath.split("/"));
  let stats;
  try {
    stats = lstatSync(abs);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    if (code === "ENOENT") return absentObservation(logicalPath);
    return unreadableObservation(logicalPath, code ?? "EIO");
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
      return unreadableObservation(logicalPath, code ?? "EIO");
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
 * Resolve the canonical root identity and reject a root that is not a real
 * directory (a symlink or nonregular entry could otherwise redirect every
 * subsequent observation).
 */
function canonicalRoot(root: string): ModelResult<string> {
  let stats;
  try {
    stats = lstatSync(root);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNREADABLE",
        `the project root could not be observed (${code ?? "EIO"})`,
      ),
    ]);
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNSAFE",
        "the project root is not a real directory; refusing to observe through a symlink or nonregular root",
      ),
    ]);
  }
  try {
    return ok(realpathSync(root));
  } catch (error) {
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNREADABLE",
        `the project root could not be canonicalized (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
      ),
    ]);
  }
}

/**
 * Capture read-only observations for the given logical paths. A lexically
 * unsafe path or unsafe root is a typed failure; every safe path yields exactly
 * one observation. No write of any kind occurs.
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

  const canonical = canonicalRoot(root);
  if (!canonical.ok) return canonical;

  const entries = new Map<string, TargetObservation>();
  for (const logicalPath of logicalPaths) {
    entries.set(logicalPath, observeOne(canonical.value, logicalPath));
  }
  return ok(
    Object.freeze({
      root: canonical.value,
      entries: new FrozenObservations(entries),
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

/** Typed text-decoding outcome for an observed regular file. */
export type ObservedText =
  | { readonly kind: "none" }
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "invalid"; readonly code: string };

/**
 * Decode observed bytes as strict UTF-8, preserving any byte-order mark. An
 * unrepresentable byte sequence is `invalid` rather than lossily replaced.
 */
export function decodeObservedText(
  observation: TargetObservation,
): ObservedText {
  const bytes = observation.bytes;
  if (bytes === null) return { kind: "none" };
  try {
    return {
      kind: "text",
      text: new TextDecoder("utf-8", {
        fatal: true,
        ignoreBOM: true,
      }).decode(bytes),
    };
  } catch {
    return { kind: "invalid", code: "INVALID_UTF8" };
  }
}

/**
 * Decode observed bytes as UTF-8, or `null` when there are no bytes or the
 * bytes are not valid UTF-8.
 */
export function observedText(observation: TargetObservation): string | null {
  const decoded = decodeObservedText(observation);
  return decoded.kind === "text" ? decoded.text : null;
}
