/**
 * Plan preimage revalidation under exclusive coordination (S067).
 *
 * A plan is only a proposal. After the writer lock is acquired — and before any
 * live byte is replaced — the engine re-observes every planned target and its
 * ancestor chain. A target whose kind, exact bytes or mode changed since
 * planning is a stale plan and is refused; the engine never silently replans
 * mid-transaction. Ancestor directories are checked with non-following
 * metadata, so a replaced/symlinked parent is detected within the documented
 * trusted-local threat model.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { observeEntry } from "../project/io.js";
import { sha256Hex } from "./digest.js";
import {
  verifyAncestors,
  verifyReadFiles,
  verifyRootIdentity,
  type PhysicalIdentity,
  type PlanAncestor,
  type PlanReadFile,
} from "./authority.js";

export interface TargetPreimage {
  readonly path: string;
  readonly kind: "absent" | "file";
  readonly digest: string | null;
  readonly mode: number | null;
}

export type CurrentObservation =
  | { readonly kind: "absent" }
  | { readonly kind: "file"; readonly digest: string; readonly mode: number }
  | { readonly kind: "unsafe"; readonly reason: string };

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/** Re-observe one target with non-following metadata and exact bytes. */
export function observeTarget(
  root: string,
  logicalPath: string,
): CurrentObservation {
  const abs = path.join(root, ...logicalPath.split("/"));
  const entry = observeEntry(abs);
  if (entry.kind === "absent") return { kind: "absent" };
  if (entry.kind === "unreadable") {
    return { kind: "unsafe", reason: `unreadable (${entry.code})` };
  }
  if (entry.kind !== "file") {
    return { kind: "unsafe", reason: `not a regular file (${entry.kind})` };
  }
  let bytes: Buffer;
  try {
    bytes = readFileSync(abs);
  } catch (error) {
    return { kind: "unsafe", reason: `unreadable (${codeOf(error)})` };
  }
  return {
    kind: "file",
    digest: sha256Hex(bytes),
    mode: entry.stats.mode & 0o777,
  };
}

/** Capture the preimage of one target for a later revalidation. */
export function capturePreimage(
  root: string,
  logicalPath: string,
): TargetPreimage {
  const observed = observeTarget(root, logicalPath);
  if (observed.kind === "file") {
    return {
      path: logicalPath,
      kind: "file",
      digest: observed.digest,
      mode: observed.mode,
    };
  }
  if (observed.kind === "absent") {
    return { path: logicalPath, kind: "absent", digest: null, mode: null };
  }
  // An unsafe current entry cannot be a captured preimage; record it as a
  // distinct absent-like sentinel so revalidation deterministically refuses.
  return {
    path: logicalPath,
    kind: "file",
    digest: `unsafe:${observed.reason}`,
    mode: null,
  };
}

function checkAncestry(root: string, logicalPath: string): string | null {
  const segments = logicalPath.split("/");
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index]);
    const entry = observeEntry(current);
    if (entry.kind === "absent") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is absent`;
    }
    if (entry.kind === "unreadable") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is unreadable (${entry.code})`;
    }
    if (entry.kind !== "directory") {
      return `ancestor ${segments.slice(0, index + 1).join("/")} is not a real directory (${entry.kind})`;
    }
  }
  return null;
}

export interface RevalidateOptions {
  /**
   * The captured ancestor chain. When supplied, absence is legitimate for a
   * component the plan recorded as absent (fresh init/custom mapping), and a
   * replaced physical identity is refused instead of being followed.
   */
  readonly ancestors?: readonly PlanAncestor[];
  /** Captured root identity to prove the root was not replaced. */
  readonly root?: PhysicalIdentity;
  /** Captured config/manifest/mapping/lock evidence. */
  readonly files?: readonly PlanReadFile[];
}

/**
 * Revalidate every preimage and its ancestor chain. Returns typed
 * `STALE_PLAN` issues for the first differences; an unchanged plan passes.
 * When the plan carries a physical readset the root identity, ancestor
 * identities and evidence bytes are proven as well.
 */
export function revalidatePreimages(
  root: string,
  expected: readonly TargetPreimage[],
  options: RevalidateOptions = {},
): ModelResult<null> {
  const issues = [];
  if (options.root) issues.push(...verifyRootIdentity(root, options.root));
  if (options.files && options.files.length > 0) {
    issues.push(...verifyReadFiles(root, options.files));
  }
  const capturedAncestors = options.ancestors;
  const ancestorsChecked = capturedAncestors !== undefined;
  if (capturedAncestors) {
    issues.push(...verifyAncestors(root, capturedAncestors));
  }
  for (const target of expected) {
    if (!ancestorsChecked) {
      const ancestry = checkAncestry(root, target.path);
      if (ancestry !== null) {
        issues.push(issue("STALE_PLAN", ancestry, target.path));
        continue;
      }
    }
    const current = observeTarget(root, target.path);
    if (target.kind === "absent") {
      if (current.kind !== "absent") {
        issues.push(
          issue(
            "STALE_PLAN",
            `target ${target.path} was expected absent but is now ${current.kind}`,
            target.path,
          ),
        );
      }
      continue;
    }
    if (current.kind === "absent") {
      issues.push(
        issue(
          "STALE_PLAN",
          `target ${target.path} was expected to exist but is now absent`,
          target.path,
        ),
      );
      continue;
    }
    if (current.kind === "unsafe") {
      issues.push(
        issue(
          "STALE_PLAN",
          `target ${target.path} is now unsafe: ${current.reason}`,
          target.path,
        ),
      );
      continue;
    }
    if (current.digest !== target.digest) {
      issues.push(
        issue(
          "STALE_PLAN",
          `target ${target.path} changed since planning`,
          target.path,
        ),
      );
      continue;
    }
    if (target.mode !== null && current.mode !== target.mode) {
      issues.push(
        issue(
          "STALE_PLAN",
          `target ${target.path} mode changed since planning`,
          target.path,
        ),
      );
    }
  }
  return issues.length > 0 ? fail(issues) : ok(null);
}
