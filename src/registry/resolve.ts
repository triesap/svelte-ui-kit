/**
 * Dependency closure resolution (S028).
 *
 * Traverses the validated registry graph from the explicit roots, resolving
 * registry dependencies to a deterministic dependency-before-dependent order.
 * It is read-only and writes nothing.
 *
 * Diagnostics are explicit and deterministic:
 *
 * - `RESOLVE_MISSING_ITEM` for an unknown root or dependency;
 * - `RESOLVE_CYCLE` with the concrete cycle path (`a -> b -> a`).
 *
 * Every diagnostic names the registry identity (version + content hash) so a
 * failure is attributable to the packaged inventory it was resolved against.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import type { RegistrySnapshot, RegistrySnapshotItem } from "./load.js";
import { orderDependencies, orderedUnique } from "./order.js";

export interface ResolvedClosure {
  /** Sorted explicit roots. */
  readonly roots: readonly string[];
  /** Sorted closure member ids. */
  readonly items: readonly string[];
  /** Deterministic dependency-before-dependent install order. */
  readonly order: readonly string[];
}

function registryIdentity(snapshot: RegistrySnapshot): string {
  return `${snapshot.root.registryVersion}#${snapshot.root.contentHash.slice(0, 12)}`;
}

function itemById(
  snapshot: RegistrySnapshot,
  id: string,
): RegistrySnapshotItem | undefined {
  return snapshot.items.find((item) => item.id === id);
}

/**
 * Resolve the closure of `requested` roots. A diamond dependency is visited
 * once; a cycle reports its full path; an unknown id reports the registry
 * identity.
 */
export function resolveClosure(
  snapshot: RegistrySnapshot,
  requested: readonly string[],
): ModelResult<ResolvedClosure> {
  const identity = registryIdentity(snapshot);
  const roots = orderedUnique(requested);
  const issues: ModelIssue[] = [];
  const state = new Map<string, "visiting" | "done">();
  const stack: string[] = [];
  const order: string[] = [];

  const visit = (id: string): void => {
    const status = state.get(id);
    if (status === "done") return;
    if (status === "visiting") {
      const start = stack.indexOf(id);
      const cycle = [...stack.slice(start), id];
      issues.push(
        issue(
          "RESOLVE_CYCLE",
          `registry dependency cycle: ${cycle.join(" -> ")} (registry ${identity})`,
          id,
        ),
      );
      return;
    }
    const item = itemById(snapshot, id);
    if (item === undefined) {
      issues.push(
        issue(
          "RESOLVE_MISSING_ITEM",
          `registry item ${JSON.stringify(id)} is not present in registry ${identity}`,
          id,
        ),
      );
      return;
    }
    state.set(id, "visiting");
    stack.push(id);
    const dependencies = orderDependencies(item.manifest.registryDependencies);
    for (const dependency of dependencies) visit(dependency);
    stack.pop();
    state.set(id, "done");
    order.push(id);
  };

  for (const root of roots) visit(root);
  if (issues.length > 0) return fail(issues);

  return ok({
    roots,
    items: orderedUnique(order),
    order,
  });
}

/** True when `id` is within the resolved closure. */
export function isInClosure(closure: ResolvedClosure, id: string): boolean {
  return closure.items.includes(id);
}
