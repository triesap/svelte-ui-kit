/**
 * Joint dependency-range reconciliation (S031).
 *
 * Produces one truthful npm plan from the selected closure. Requirements are
 * grouped by package name, their roles (runtime/tooling/peer) are preserved and
 * their *joint* intersection is computed with strict npm SemVer behavior
 * (including OR clauses, zero-major and prerelease ranges). Pairwise overlap is
 * not sufficient: `^1 || ^2`, `^2 || ^3` and `^1 || ^3` pairwise overlap but
 * have an empty joint intersection.
 *
 * This reports the *declared* plan only. Exact installed-version discovery and
 * any package-manager execution are deliberately separate; the CLI never
 * installs or edits package manifests.
 */
import { Range, minVersion } from "semver";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import type { NpmRole, RegistryItem } from "./item.js";
import type { RegistrySnapshot } from "./load.js";
import { isCompatibilityRange } from "./versions.js";

/** Upper bound on OR-clause combinations before a range is treated as opaque. */
const MAX_COMBINATIONS = 512;

export interface NpmPlanEntry {
  readonly name: string;
  /** Joint range (or the single declared range). */
  readonly range: string;
  readonly roles: readonly NpmRole[];
  readonly requiredBy: readonly string[];
}

export interface DependencyPlan {
  readonly entries: readonly NpmPlanEntry[];
}

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function rangeGroups(range: string): string[][] {
  const parsed = new Range(range);
  return parsed.set.map((group) =>
    group.map((comparator) => comparator.value).filter((value) => value !== ""),
  );
}

function groupSatisfiable(rangeString: string): boolean {
  try {
    return minVersion(rangeString) !== null;
  } catch {
    return false;
  }
}

/**
 * Compute a satisfiable joint range for `ranges`, or `null` when their joint
 * intersection is empty. A single range is returned unchanged.
 */
export function intersectRanges(ranges: readonly string[]): string | null {
  if (ranges.length === 0) return "*";
  if (ranges.length === 1) return ranges[0];
  let combinations: string[][] = [[]];
  for (const range of ranges) {
    const groups = rangeGroups(range);
    const next: string[][] = [];
    for (const combination of combinations) {
      for (const group of groups) {
        next.push([...combination, ...group]);
        if (next.length > MAX_COMBINATIONS) return null;
      }
    }
    combinations = next;
  }
  for (const combination of combinations) {
    const rangeString = combination.length === 0 ? "*" : combination.join(" ");
    if (groupSatisfiable(rangeString)) return rangeString;
  }
  return null;
}

/** Build the joint dependency plan for a resolved closure. */
export function planDependencies(
  snapshot: RegistrySnapshot,
  closure: readonly string[],
): ModelResult<DependencyPlan> {
  const byId = new Map<string, RegistryItem>(
    snapshot.items.map((item) => [item.id, item.manifest]),
  );
  interface Requirement {
    readonly range: string;
    readonly role: NpmRole;
    readonly owner: string;
  }
  const requirements = new Map<string, Requirement[]>();
  const issues: ModelIssue[] = [];

  for (const id of [...closure].sort(compareCodeUnit)) {
    const manifest = byId.get(id);
    if (manifest === undefined) {
      issues.push(
        issue(
          "DEPENDENCY_UNKNOWN_ITEM",
          `closure item ${JSON.stringify(id)} is not in the snapshot`,
          id,
        ),
      );
      continue;
    }
    for (const dependency of manifest.npmDependencies) {
      if (!isCompatibilityRange(dependency.range)) {
        issues.push(
          issue(
            "DEPENDENCY_SOURCE_UNSUPPORTED",
            `item ${JSON.stringify(id)} requires ${dependency.name} from an unsupported git/file/url source: ${JSON.stringify(dependency.range)}`,
            id,
          ),
        );
        continue;
      }
      const list = requirements.get(dependency.name) ?? [];
      list.push({ range: dependency.range, role: dependency.role, owner: id });
      requirements.set(dependency.name, list);
    }
  }
  if (issues.length > 0) return fail(issues);

  const entries: NpmPlanEntry[] = [];
  for (const [name, requirementList] of [...requirements.entries()].sort(
    (left, right) => compareCodeUnit(left[0], right[0]),
  )) {
    const ranges = [...new Set(requirementList.map((entry) => entry.range))];
    const joint = intersectRanges(ranges);
    if (joint === null) {
      const owners = [
        ...new Set(requirementList.map((entry) => entry.owner)),
      ].sort(compareCodeUnit);
      issues.push(
        issue(
          "DEPENDENCY_RANGE_CONFLICT",
          `incompatible ranges for ${name}: ${ranges.join(", ")} (required by ${owners.join(", ")})`,
          name,
        ),
      );
      continue;
    }
    entries.push({
      name,
      range: joint,
      roles: [...new Set(requirementList.map((entry) => entry.role))].sort(
        compareCodeUnit,
      ) as NpmRole[],
      requiredBy: [
        ...new Set(requirementList.map((entry) => entry.owner)),
      ].sort(compareCodeUnit),
    });
  }
  if (issues.length > 0) return fail(issues);
  return ok({ entries });
}
