/**
 * Owned creation and removal of absent generated ancestry (RCLD04-R2-2).
 *
 * A fresh install or a custom mapping legitimately writes through directories
 * that did not exist at planning time. The guarded apply must create those
 * directories itself and record their exact physical identity, so a later
 * rollback removes only a directory this attempt actually created and left
 * empty — never an unrelated directory that merely appeared at the same
 * logical path.
 *
 * Creation is explicit and shallowest-first: every recorded-absent ancestor is
 * re-checked immediately before `mkdir`, an ancestor that appeared since
 * planning is refused as unrelated newly-appearing ancestry, and each created
 * directory is observed with non-following metadata. Removal is deepest-first
 * and empty-only, and a directory whose device/inode no longer matches the
 * recorded identity is preserved and reported.
 */
import { lstatSync, mkdirSync, rmdirSync } from "node:fs";
import path from "node:path";

import type { ModelIssue } from "../registry/errors.js";
import type { PlanAncestor } from "./authority.js";
import type { JournalCreatedDir } from "./transaction-journal.js";

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

function depth(logical: string): number {
  return logical.split("/").filter((segment) => segment !== "").length;
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

function issue(code: string, message: string, locator?: string): ModelIssue {
  return locator === undefined ? { code, message } : { code, message, locator };
}

export interface OwnedAncestryResult {
  readonly created: readonly JournalCreatedDir[];
  readonly issues: readonly ModelIssue[];
}

/**
 * Create the recorded-absent generated ancestry this attempt owns. An ancestor
 * that already exists, or appears between the check and `mkdir`, is refused
 * rather than silently adopted. On any failure the caller removes the already
 * created directories through `removeOwnedAncestors`.
 */
export function createOwnedAncestors(
  root: string,
  ancestors: readonly PlanAncestor[],
): OwnedAncestryResult {
  const candidates = ancestors
    .filter((ancestor) => ancestor.kind === "absent")
    .sort((left, right) => {
      const byDepth = depth(left.path) - depth(right.path);
      if (byDepth !== 0) return byDepth;
      return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
    });
  const created: JournalCreatedDir[] = [];
  const issues: ModelIssue[] = [];
  for (const ancestor of candidates) {
    const abs = absOf(root, ancestor.path);
    let existing = false;
    try {
      lstatSync(abs);
      existing = true;
    } catch (error) {
      if (codeOf(error) !== "ENOENT") {
        issues.push(
          issue(
            "AUTHORITY_ANCESTOR_UNREADABLE",
            `owned ancestor ${ancestor.path} is unreadable (${codeOf(error)})`,
            ancestor.path,
          ),
        );
        return { created, issues };
      }
    }
    if (existing) {
      issues.push(
        issue(
          "AUTHORITY_ANCESTOR_APPEARED",
          `ancestor ${ancestor.path} appeared after planning and was not created by this attempt; refusing unrelated newly appearing ancestry`,
          ancestor.path,
        ),
      );
      return { created, issues };
    }
    try {
      mkdirSync(abs, { recursive: false });
    } catch (error) {
      issues.push(
        issue(
          "OWNED_ANCESTRY_FAILED",
          `could not create owned ancestor ${ancestor.path} (${codeOf(error)})`,
          ancestor.path,
        ),
      );
      return { created, issues };
    }
    let stats;
    try {
      stats = lstatSync(abs);
    } catch (error) {
      issues.push(
        issue(
          "AUTHORITY_ANCESTOR_UNREADABLE",
          `owned ancestor ${ancestor.path} could not be observed after creation (${codeOf(error)})`,
          ancestor.path,
        ),
      );
      return { created, issues };
    }
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      issues.push(
        issue(
          "OWNED_ANCESTRY_FAILED",
          `owned ancestor ${ancestor.path} was not created as a real directory`,
          ancestor.path,
        ),
      );
      return { created, issues };
    }
    created.push({
      path: ancestor.path,
      device: stats.dev,
      inode: stats.ino,
    });
  }
  return { created, issues };
}

/**
 * Remove only the recorded owned empty ancestry directories, deepest-first. A
 * directory that disappeared is already gone; one whose identity changed or
 * that is no longer empty is preserved and reported rather than deleted.
 */
export function removeOwnedAncestors(
  root: string,
  created: readonly JournalCreatedDir[],
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const ordered = [...created].sort(
    (left, right) => depth(right.path) - depth(left.path),
  );
  for (const entry of ordered) {
    const abs = absOf(root, entry.path);
    let stats;
    try {
      stats = lstatSync(abs);
    } catch (error) {
      if (codeOf(error) === "ENOENT") continue;
      issues.push(
        issue(
          "RECOVERY_ANCESTRY_UNREADABLE",
          `owned ancestor ${entry.path} is unreadable (${codeOf(error)})`,
          entry.path,
        ),
      );
      continue;
    }
    if (
      stats.isSymbolicLink() ||
      !stats.isDirectory() ||
      stats.dev !== entry.device ||
      stats.ino !== entry.inode
    ) {
      issues.push(
        issue(
          "RECOVERY_ANCESTRY_CHANGED",
          `owned ancestor ${entry.path} changed identity since creation; preserving it`,
          entry.path,
        ),
      );
      continue;
    }
    try {
      rmdirSync(abs);
    } catch (error) {
      if (codeOf(error) === "ENOENT") continue;
      issues.push(
        issue(
          "RECOVERY_ANCESTRY_NOT_EMPTY",
          `owned ancestor ${entry.path} is not empty; preserving it (${codeOf(error)})`,
          entry.path,
        ),
      );
    }
  }
  return issues;
}
