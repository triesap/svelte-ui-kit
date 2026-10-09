/**
 * Joint framework compatibility validation (S016–S018/S027–S032).
 *
 * The registry root advertises the *qualified* support range for each axis
 * (the exact Svelte version and authenticated local Bits build). Each
 * advertised item separately declares the range it was tested against. Health
 * must prove the root's qualified support remains usable by the complete
 * selected closure: one single joint intersection per axis is built from the
 * root range, *every* selected item's declared compatibility and *every*
 * selected explicit npm requirement on that package. Per-item or pairwise
 * overlap is deliberately not sufficient, because items A `>=3.8.1 <3.10.0`
 * and B `>=3.10.0 <4.0.0` each overlap the root `^3.8.1` while having no
 * jointly satisfiable version.
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

/** Stable owner label for the qualified root support claim. */
const ROOT_OWNER = "root";

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

/** One declared range contributing to an axis constraint set. */
interface AxisConstraint {
  /** `root` or the registry item id that declared the range. */
  readonly owner: string;
  readonly range: string;
}

/**
 * Validate that the complete selected closure is jointly satisfiable on every
 * mapped axis with the qualified root support and all explicit npm
 * requirements on the same package. Diagnostics name the package/axis and the
 * involved owners and ranges in stable order.
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

  for (const { axis, package: packageName } of COMPATIBILITY_AXES) {
    // ONE complete constraint set per mapped axis: the qualified root, every
    // selected item's declared compatibility and every selected explicit npm
    // requirement for the package. Roles are preserved by `planDependencies`;
    // they are not dropped here, and support metadata never fabricates a
    // dependency record.
    const constraints: AxisConstraint[] = [
      { owner: ROOT_OWNER, range: snapshot.root.compatibility[axis] },
    ];
    for (const id of order) {
      const manifest = byId.get(id);
      if (manifest === undefined) continue;
      constraints.push({ owner: id, range: manifest.compatibility[axis] });
      for (const dependency of manifest.npmDependencies) {
        if (dependency.name === packageName) {
          constraints.push({ owner: id, range: dependency.range });
        }
      }
    }

    const ranges = [...new Set(constraints.map((entry) => entry.range))];
    const joint = intersectRangesDetailed(ranges);
    if (joint.kind === "unable") {
      issues.push(
        issue(
          "COMPATIBILITY_UNSUPPORTED",
          `could not evaluate the joint ${packageName} (${axis}) compatibility for the selected closure: ${joint.reason}`,
          packageName,
        ),
      );
      continue;
    }
    if (joint.kind === "empty") {
      const detail = [...constraints]
        .sort(
          (left, right) =>
            compareCodeUnit(left.owner, right.owner) ||
            compareCodeUnit(left.range, right.range),
        )
        .map((entry) => `${JSON.stringify(entry.range)} (${entry.owner})`)
        .join(", ");
      issues.push(
        issue(
          "COMPATIBILITY_CONFLICT",
          `the selected closure declares jointly unsatisfiable ${axis} (${packageName}) constraints: ${detail}`,
          packageName,
        ),
      );
    }
  }

  if (issues.length > 0) return fail(issues);
  return ok(order);
}
