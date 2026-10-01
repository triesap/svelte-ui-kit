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
import {
  lstatSync,
  readFileSync,
  readlinkSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import {
  captureEnvironment,
  type CapturedEnvironment,
} from "../project/environment.js";

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
  /** Observed identity of the canonical root, for a later coordinated recheck. */
  readonly rootIdentity: RootIdentity;
  readonly entries: ReadonlyMap<string, TargetObservation>;
  /** Observed non-final ancestors, keyed by logical path. */
  readonly ancestors: ReadonlyMap<string, AncestorObservation>;
  /** The logical paths captured, in request order. */
  readonly paths: readonly string[];
  /**
   * Dependency/manager evidence captured at the same instant as the target
   * observations. Planners derive readiness from this evidence rather than
   * re-reading the live filesystem, so one immutable snapshot is never mixed
   * with later metadata.
   */
  readonly environment: CapturedEnvironment;
}

/** Stable identity of the canonical project root. */
export interface RootIdentity {
  readonly device: number;
  readonly inode: number;
}

/**
 * Observation of one non-final path component. A missing ancestor is recorded
 * as `absent` (with no identity), an existing directory carries its device and
 * inode, and an unsafe/unreadable ancestor carries a stable code. These are
 * retained so a later recheck can prove the same ancestry still holds.
 */
export interface AncestorObservation {
  readonly path: string;
  readonly kind: "directory" | "absent" | "symlink" | "other" | "unreadable";
  readonly device: number | null;
  readonly inode: number | null;
  readonly errorCode: string | null;
}

/**
 * A genuinely immutable lookup over captured observations. It implements the
 * read-only subset of `ReadonlyMap`; there is no `set`, `delete` or `clear`, so
 * a caller cannot remove or replace captured evidence.
 */
class FrozenMap<V> implements ReadonlyMap<string, V> {
  readonly #map: Map<string, V>;

  constructor(source: Map<string, V>) {
    this.#map = new Map(source);
    Object.freeze(this);
  }

  get size(): number {
    return this.#map.size;
  }

  get(key: string): V | undefined {
    return this.#map.get(key);
  }

  has(key: string): boolean {
    return this.#map.has(key);
  }

  forEach(
    callbackfn: (value: V, key: string, map: ReadonlyMap<string, V>) => void,
    thisArg?: unknown,
  ): void {
    this.#map.forEach((value, key) => {
      callbackfn.call(thisArg, value, key, this);
    });
  }

  keys(): MapIterator<string> {
    return this.#map.keys();
  }

  values(): MapIterator<V> {
    return this.#map.values();
  }

  entries(): MapIterator<[string, V]> {
    return this.#map.entries();
  }

  [Symbol.iterator](): MapIterator<[string, V]> {
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

function ancestorObservation(
  path: string,
  kind: AncestorObservation["kind"],
  device: number | null,
  inode: number | null,
  errorCode: string | null,
): AncestorObservation {
  return Object.freeze({ path, kind, device, inode, errorCode });
}

interface AncestryWalk {
  readonly status: "ok" | "absent" | "unsafe" | "unreadable";
  readonly code: string | null;
  readonly observations: readonly AncestorObservation[];
}

/**
 * Walk the non-final components of `logicalPath`, rejecting a symlinked or
 * non-directory ancestor before the final target is ever read. A missing
 * ancestor is a real absence; an unreadable ancestor is a typed I/O cause. The
 * observed non-final components are returned for a later coordinated recheck.
 */
function observeAncestors(root: string, logicalPath: string): AncestryWalk {
  const segments = logicalPath.split("/");
  const observations: AncestorObservation[] = [];
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index] as string);
    const logical = segments.slice(0, index + 1).join("/");
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code;
      if (code === "ENOENT") {
        observations.push(
          ancestorObservation(logical, "absent", null, null, null),
        );
        return { status: "absent", code: null, observations };
      }
      observations.push(
        ancestorObservation(logical, "unreadable", null, null, code ?? "EIO"),
      );
      return { status: "unreadable", code: code ?? "EIO", observations };
    }
    if (stats.isSymbolicLink()) {
      observations.push(
        ancestorObservation(
          logical,
          "symlink",
          stats.dev,
          stats.ino,
          "UNSAFE_ANCESTRY",
        ),
      );
      return { status: "unsafe", code: "UNSAFE_ANCESTRY", observations };
    }
    if (!stats.isDirectory()) {
      observations.push(
        ancestorObservation(
          logical,
          "other",
          stats.dev,
          stats.ino,
          "UNSAFE_ANCESTRY",
        ),
      );
      return { status: "unsafe", code: "UNSAFE_ANCESTRY", observations };
    }
    observations.push(
      ancestorObservation(logical, "directory", stats.dev, stats.ino, null),
    );
  }
  return { status: "ok", code: null, observations };
}

/** Observe one logical target beneath `root` without following a final link. */
function observeOne(
  root: string,
  logicalPath: string,
  ancestors: AncestryWalk,
): TargetObservation {
  if (ancestors.status === "absent") return absentObservation(logicalPath);
  if (ancestors.status === "unsafe") {
    return unsafeObservation(logicalPath, "UNSAFE_ANCESTRY");
  }
  if (ancestors.status === "unreadable") {
    return unreadableObservation(logicalPath, ancestors.code ?? "EIO");
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
 * Resolve the canonical root identity. An explicitly selected root alias is
 * canonicalized once; only links *below* the root remain unsupported. A root
 * that does not resolve to a real directory is a typed failure.
 */
function canonicalRoot(
  root: string,
): ModelResult<{ readonly path: string; readonly identity: RootIdentity }> {
  let canonicalPath: string;
  try {
    canonicalPath = realpathSync(root);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNREADABLE",
        `the project root could not be observed or canonicalized (${code ?? "EIO"})`,
      ),
    ]);
  }
  let stats;
  try {
    stats = statSync(canonicalPath);
  } catch (error) {
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNREADABLE",
        `the project root could not be observed (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
      ),
    ]);
  }
  if (!stats.isDirectory()) {
    return fail([
      issue(
        "SNAPSHOT_ROOT_UNSAFE",
        "the project root does not resolve to a real directory; refusing to observe a nonregular root",
      ),
    ]);
  }
  return ok({
    path: canonicalPath,
    identity: Object.freeze({ device: stats.dev, inode: stats.ino }),
  });
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
  const ancestorMap = new Map<string, AncestorObservation>();
  for (const logicalPath of logicalPaths) {
    const ancestors = observeAncestors(canonical.value.path, logicalPath);
    for (const observation of ancestors.observations) {
      if (!ancestorMap.has(observation.path)) {
        ancestorMap.set(observation.path, observation);
      }
    }
    entries.set(
      logicalPath,
      observeOne(canonical.value.path, logicalPath, ancestors),
    );
  }
  return ok(
    Object.freeze({
      root: canonical.value.path,
      rootIdentity: canonical.value.identity,
      entries: new FrozenMap(entries),
      ancestors: new FrozenMap(ancestorMap),
      paths: Object.freeze([...logicalPaths]),
      environment: captureEnvironment(canonical.value.path),
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
