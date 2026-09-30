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
 * Each operand keeps its own prerelease admission rule. A comparator set admits
 * a prerelease only when one of its comparators names the same major/minor/patch
 * tuple (npm's normal `*` excludes prereleases). Concatenating comparators alone
 * would widen that admission, so the intersection is computed as a union of:
 *
 * - the stable part of each satisfiable comparator combination;
 * - the prerelease-only slice for every tuple admitted by *all* operands.
 *
 * This reports the *declared* plan only. Exact installed-version discovery and
 * any package-manager execution are deliberately separate; the CLI never
 * installs or edits package manifests.
 */
import { Range, minVersion, type Comparator, type SemVer } from "semver";

import {
  fail,
  issue,
  ModelError,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import type { NpmRole, RegistryItem } from "./item.js";
import type { RegistrySnapshot } from "./load.js";
import { isCompatibilityRange } from "./versions.js";

/**
 * Upper bound on comparator-set combinations. Reaching it returns a typed
 * inability-to-evaluate result, never a claimed conflict.
 */
const MAX_COMBINATIONS = 4096;

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

/** Typed outcome of a joint-range computation. */
export type RangeIntersection =
  | { readonly kind: "empty" }
  | { readonly kind: "range"; readonly range: string }
  | { readonly kind: "unable"; readonly reason: string };

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function tupleOf(version: SemVer): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

/** Major/minor/patch tuples admitted for prereleases by one comparator group. */
function prereleaseTuples(group: readonly Comparator[]): ReadonlySet<string> {
  const tuples = new Set<string>();
  for (const comparator of group) {
    if (comparator.value === "") continue;
    const version = comparator.semver;
    if (version.prerelease.length > 0) tuples.add(tupleOf(version));
  }
  return tuples;
}

/**
 * Stable-version equivalent of one comparator. Prerelease comparators are
 * rewritten to their stable boundary; a comparator that can only match a
 * prerelease has no stable equivalent and yields `null`.
 */
function stableComparator(comparator: Comparator): string | null {
  if (comparator.value === "") return null;
  const version = comparator.semver;
  if (version.prerelease.length === 0) return comparator.value;
  const release = tupleOf(version);
  switch (comparator.operator) {
    case ">":
    case ">=":
      return `>=${release}`;
    case "<":
    case "<=":
      return `<${release}`;
    default:
      return null;
  }
}

function minOf(rangeString: string): SemVer | null {
  try {
    return minVersion(rangeString);
  } catch {
    return null;
  }
}

function combinations<T>(lists: readonly (readonly T[])[]): T[][] {
  let result: T[][] = [[]];
  for (const list of lists) {
    const next: T[][] = [];
    for (const prefix of result) {
      for (const entry of list) next.push([...prefix, entry]);
    }
    result = next;
  }
  return result;
}

/**
 * Compute the joint intersection of `ranges`. The returned range is membership
 * equivalent to "satisfies every operand"; `empty` is a proven empty
 * intersection and `unable` is a typed complexity limit, never a conflict.
 */
export function intersectRangesDetailed(
  ranges: readonly string[],
): RangeIntersection {
  if (ranges.length === 0) return { kind: "range", range: "*" };
  for (const range of ranges) {
    // Invalid input must never be silently accepted.
    if (!isCompatibilityRange(range)) {
      return {
        kind: "unable",
        reason: `${JSON.stringify(range)} is not a valid registry npm range`,
      };
    }
  }

  const groupLists = ranges.map((range) =>
    new Range(range).set.map((group) => [...group]),
  );

  let total = 1;
  for (const groups of groupLists) {
    total *= groups.length;
    if (total > MAX_COMBINATIONS) {
      return {
        kind: "unable",
        reason: `joint range needs ${total} comparator combinations (limit ${MAX_COMBINATIONS})`,
      };
    }
  }

  const branches: string[] = [];
  for (const group of combinations(groupLists)) {
    const comparators = group.flat();
    const values = comparators
      .map((comparator) => comparator.value)
      .filter((value) => value !== "");
    const concat = values.length === 0 ? "*" : values.join(" ");
    if (minOf(concat) === null) continue;

    const concatTuples = new Set<string>();
    for (const comparator of comparators) {
      if (comparator.value === "") continue;
      const version = comparator.semver;
      if (version.prerelease.length > 0) concatTuples.add(tupleOf(version));
    }

    let allowed: Set<string> | null = null;
    for (const single of group) {
      const tuples = prereleaseTuples(single);
      if (allowed === null) allowed = new Set(tuples);
      else {
        for (const tuple of [...allowed]) {
          if (!tuples.has(tuple)) allowed.delete(tuple);
        }
      }
    }
    if (allowed === null) allowed = new Set();

    const sameAdmission =
      allowed.size === concatTuples.size &&
      [...concatTuples].every((tuple) => allowed?.has(tuple) === true);
    if (sameAdmission) {
      branches.push(concat);
      continue;
    }

    // Stable slice: stable-equivalent comparators admit exactly the stable
    // versions of the concatenation, and no prereleases.
    let stableOk = true;
    const stableValues: string[] = [];
    for (const comparator of comparators) {
      const mapped = stableComparator(comparator);
      if (comparator.value === "") continue;
      if (mapped === null) {
        stableOk = false;
        break;
      }
      stableValues.push(mapped);
    }
    if (stableOk) {
      const stableRange =
        stableValues.length === 0 ? "*" : stableValues.join(" ");
      if (minOf(stableRange) !== null) branches.push(stableRange);
    }

    // Prerelease slice per tuple admitted by every operand.
    for (const tuple of allowed) {
      const slice = `${concat} >=${tuple}-0 <${tuple}`;
      if (minOf(slice) !== null) branches.push(slice);
    }
  }

  const unique = [...new Set(branches)].sort();
  if (unique.length === 0) return { kind: "empty" };
  return { kind: "range", range: unique.join(" || ") };
}

/**
 * Convenience wrapper returning the joint range string, or `null` for a proven
 * empty intersection. A complexity limit throws a typed `ModelError` rather
 * than masquerading as a conflict; `planDependencies` uses the detailed form.
 */
export function intersectRanges(ranges: readonly string[]): string | null {
  const result = intersectRangesDetailed(ranges);
  if (result.kind === "range") return result.range;
  if (result.kind === "empty") return null;
  throw new ModelError([
    issue(
      "DEPENDENCY_RANGE_UNSUPPORTED",
      `joint range could not be evaluated: ${result.reason}`,
    ),
  ]);
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
    const joint = intersectRangesDetailed(ranges);
    const owners = [
      ...new Set(requirementList.map((entry) => entry.owner)),
    ].sort(compareCodeUnit);
    if (joint.kind === "unable") {
      issues.push(
        issue(
          "DEPENDENCY_RANGE_UNSUPPORTED",
          `could not evaluate the joint range for ${name}: ${joint.reason} (required by ${owners.join(", ")})`,
          name,
        ),
      );
      continue;
    }
    if (joint.kind === "empty") {
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
      range: joint.range,
      roles: [...new Set(requirementList.map((entry) => entry.role))].sort(
        compareCodeUnit,
      ) as NpmRole[],
      requiredBy: owners,
    });
  }
  if (issues.length > 0) return fail(issues);
  return ok({ entries });
}
