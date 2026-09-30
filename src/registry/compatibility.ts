/**
 * Joint framework compatibility validation (S016–S018/S027–S032).
 *
 * The registry root advertises the *qualified* support range for each axis
 * (initially the exact Svelte `5.57.1` / Bits UI `2.19.3` baseline). Each
 * advertised item separately declares the range it was tested against. Health
 * must prove the root's qualified support remains usable by every advertised
 * item: their ranges must have a non-empty joint intersection on every axis.
 *
 * The axes are mapped explicitly to the packages they describe. Explicit npm
 * requirements on those packages are reconciled into the same joint
 * intersection, so a declared peer is never dropped and never silently
 * overridden by the support metadata. This is deliberately separate from
 * `planDependencies`: tested-support metadata does not fabricate a runtime
 * dependency record, and a package that is only a support axis is not reported
 * as an install requirement.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import { intersectRangesDetailed } from "./dependency-plan.js";
import type { RegistrySnapshot } from "./load.js";

/** Framework compatibility axes mapped to the npm package they describe. */
export const COMPATIBILITY_AXES = [
  { axis: "svelte", package: "svelte" },
  { axis: "bits", package: "bits-ui" },
  { axis: "date", package: "@internationalized/date" },
] as const;

export type CompatibilityAxis = (typeof COMPATIBILITY_AXES)[number]["axis"];

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * Validate that every closure item's declared compatibility is jointly
 * satisfiable with the qualified root support and any explicit npm
 * requirement on the same package. Diagnostics name the item, the axis and the
 * involved ranges.
 */
export function validateCompatibility(
  snapshot: RegistrySnapshot,
  closure: readonly string[],
): ModelResult<readonly string[]> {
  const closureSet = new Set(closure);
  const byId = new Map(
    snapshot.items.map((item) => [item.id, item.manifest] as const),
  );
  const issues: ModelIssue[] = [];
  const order = [...closureSet].sort(compareCodeUnit);

  for (const id of order) {
    const manifest = byId.get(id);
    if (manifest === undefined) continue;
    for (const { axis, package: packageName } of COMPATIBILITY_AXES) {
      const rootRange = snapshot.root.compatibility[axis];
      const itemRange = manifest.compatibility[axis];
      const ranges = [rootRange, itemRange];
      for (const dependency of manifest.npmDependencies) {
        if (dependency.name === packageName) ranges.push(dependency.range);
      }
      const joint = intersectRangesDetailed(ranges);
      if (joint.kind === "unable") {
        issues.push(
          issue(
            "COMPATIBILITY_UNSUPPORTED",
            `could not evaluate the joint ${packageName} compatibility for item ${JSON.stringify(id)}: ${joint.reason}`,
            id,
          ),
        );
        continue;
      }
      if (joint.kind === "empty") {
        issues.push(
          issue(
            "COMPATIBILITY_CONFLICT",
            `item ${JSON.stringify(id)} declares ${axis} ${JSON.stringify(itemRange)}, which is incompatible with the qualified root support ${JSON.stringify(rootRange)}${ranges.length > 2 ? ` and its explicit ${packageName} requirement ${JSON.stringify(ranges.slice(2).join(", "))}` : ""}`,
            id,
          ),
        );
      }
    }
  }

  if (issues.length > 0) return fail(issues);
  return ok(order);
}
