/**
 * Requested versus transitive provenance (S030).
 *
 * Projects the explicit roots and the resolved closure into one view:
 *
 * - every closure member carries its `provenance` (`explicit` when it is a
 *   configured root, otherwise `transitive`);
 * - every member records the sorted explicit roots that require it, so a shared
 *   dependency remains while any root still needs it;
 * - `retired` is the previous closure minus the current closure, for later
 *   synchronization. Removing a root never removes an explicitly requested or
 *   still-required item.
 *
 * This is a pure projection: it writes nothing and never mutates the roots.
 */
import { compareItemIds } from "../project/requests.js";
import { fail, ok, type ModelResult } from "./errors.js";
import type { RegistrySnapshot } from "./load.js";
import { orderedUnique } from "./order.js";
import { resolveClosure } from "./resolve.js";

export type Provenance = "explicit" | "transitive";

export interface ProjectedItem {
  readonly id: string;
  readonly provenance: Provenance;
  readonly requiredBy: readonly string[];
}

export interface RequestProjection {
  /** Sorted explicit roots; the closure is never written back here. */
  readonly requested: readonly string[];
  /** Deterministic dependency-before-dependent install order. */
  readonly order: readonly string[];
  /** Closure members with provenance and requiring roots. */
  readonly items: readonly ProjectedItem[];
  /** Current closure to retain (same set as `order`). */
  readonly retained: readonly string[];
  /** Previously owned items no longer in the closure. */
  readonly retired: readonly string[];
}

export function projectRequests(
  snapshot: RegistrySnapshot,
  requested: readonly string[],
  previousOwned: readonly string[] = [],
): ModelResult<RequestProjection> {
  const closure = resolveClosure(snapshot, requested);
  if (!closure.ok) return fail(closure.issues);

  const requestedSet = new Set(closure.value.roots);
  const requiredBy = new Map<string, Set<string>>();
  for (const root of closure.value.roots) {
    const single = resolveClosure(snapshot, [root]);
    if (!single.ok) return fail(single.issues);
    for (const id of single.value.items) {
      const set = requiredBy.get(id) ?? new Set<string>();
      set.add(root);
      requiredBy.set(id, set);
    }
  }

  const items: ProjectedItem[] = closure.value.order.map((id) => ({
    id,
    provenance: requestedSet.has(id) ? "explicit" : "transitive",
    requiredBy: [...(requiredBy.get(id) ?? [])].sort(compareItemIds),
  }));

  const memberSet = new Set(closure.value.items);
  const retired = orderedUnique(
    previousOwned.filter((id) => !memberSet.has(id)),
  );

  return ok({
    requested: closure.value.roots,
    order: closure.value.order,
    items,
    retained: closure.value.order,
    retired,
  });
}
