/**
 * Source/style compatibility cohorts (S059, resolves Q09).
 *
 * A component is a compatibility unit: its source files, managed CSS blocks and
 * public export surface are coupled, so a conflict in one member must not leave
 * the others newly installed while the unit is claimed updated. The frozen
 * conservative rule is:
 *
 * - A unit that only has already-satisfied (`no_change`) members is clean.
 * - A unit may adopt incoming content (`create`/`update`) while every other
 *   member is also adopting or already satisfied.
 * - If a unit mixes an adoption with a locally `customized` or
 *   `conflict`/`untracked_conflict` member, compatibility cannot be established
 *   from text hashes, so the whole unit is blocked and reported as a cohort
 *   conflict. A `customized` member with unchanged upstream is not itself a
 *   conflict.
 * - When a unit's exported public API changed, the affected set expands to its
 *   transitive dependents (only when justified), so a dependent unit is subject
 *   to the same conservative rule. Unrelated, unchanged units are never
 *   included in one permanent giant cohort.
 */
import type { OwnershipDisposition } from "./ownership-policy.js";

export interface CohortMember {
  /** The owning component/item id (the compatibility unit). */
  readonly owner: string;
  readonly disposition: OwnershipDisposition;
}

export interface CohortPolicyInput {
  readonly members: readonly CohortMember[];
  /** Owner id -> direct dependents (items that depend on the owner). */
  readonly dependents?: ReadonlyMap<string, readonly string[]>;
  /** Owners whose exported public API changed. */
  readonly exportedApiChanged?: ReadonlySet<string>;
}

export interface CohortConflict {
  readonly owner: string;
  readonly reason: string;
  readonly blockedOwners: readonly string[];
}

export interface CohortPolicyResult {
  readonly conflicts: readonly CohortConflict[];
  /** Owners whose adoption must be blocked by the conservative rule. */
  readonly blockedOwners: ReadonlySet<string>;
  /** Owners added by dependency expansion of a changed public API. */
  readonly expandedOwners: ReadonlySet<string>;
}

const ADOPTING: ReadonlySet<OwnershipDisposition> = new Set([
  "create",
  "update",
]);

function transitiveDependents(
  dependents: ReadonlyMap<string, readonly string[]>,
  roots: ReadonlySet<string>,
): Set<string> {
  const expanded = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const owner = queue.shift() as string;
    for (const dependent of dependents.get(owner) ?? []) {
      if (expanded.has(dependent)) continue;
      expanded.add(dependent);
      queue.push(dependent);
    }
  }
  return expanded;
}

/**
 * Apply the frozen cohort rule. The result is deterministic: owners and
 * conflicts are sorted by code unit.
 */
export function applyCohortPolicy(
  input: CohortPolicyInput,
): CohortPolicyResult {
  const byOwner = new Map<string, Set<OwnershipDisposition>>();
  for (const member of input.members) {
    const set = byOwner.get(member.owner) ?? new Set<OwnershipDisposition>();
    set.add(member.disposition);
    byOwner.set(member.owner, set);
  }

  const exportedApiChanged = input.exportedApiChanged ?? new Set<string>();
  const expandedOwners = new Set<string>();

  // Union-find over the compatibility groups. A changed public API widens the
  // unit to its transitive dependents (only the justified dependency edges).
  const parent = new Map<string, string>();
  const makeSet = (owner: string): void => {
    if (!parent.has(owner)) parent.set(owner, owner);
  };
  const find = (owner: string): string => {
    let root = owner;
    while (parent.get(root) !== root) root = parent.get(root) as string;
    let current = owner;
    while (parent.get(current) !== root) {
      const next = parent.get(current) as string;
      parent.set(current, root);
      current = next;
    }
    return root;
  };
  const union = (left: string, right: string): void => {
    makeSet(left);
    makeSet(right);
    const leftRoot = find(left);
    const rightRoot = find(right);
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot);
  };

  for (const owner of byOwner.keys()) makeSet(owner);
  for (const owner of exportedApiChanged) {
    makeSet(owner);
    if (input.dependents === undefined) continue;
    for (const dependent of transitiveDependents(
      input.dependents,
      new Set([owner]),
    )) {
      expandedOwners.add(dependent);
      makeSet(dependent);
      union(owner, dependent);
    }
  }

  const groups = new Map<string, string[]>();
  for (const owner of parent.keys()) {
    const root = find(owner);
    const list = groups.get(root) ?? [];
    list.push(owner);
    groups.set(root, list);
  }

  const conflicts: CohortConflict[] = [];
  const blockedOwners = new Set<string>();
  for (const members of [...groups.values()].sort((left, right) =>
    (left[0] as string) < (right[0] as string) ? -1 : 1,
  )) {
    const owners = [...members].sort();
    const dispositions = new Set<OwnershipDisposition>();
    for (const owner of owners) {
      for (const disposition of byOwner.get(owner) ?? []) {
        dispositions.add(disposition);
      }
    }
    const adoptingOwners = owners.filter((owner) =>
      [...(byOwner.get(owner) ?? [])].some((entry) => ADOPTING.has(entry)),
    );
    if (adoptingOwners.length === 0) continue;
    const hasCustomized = dispositions.has("customized");
    const hasConflict =
      dispositions.has("conflict") || dispositions.has("untracked_conflict");
    if (!hasCustomized && !hasConflict) continue;
    for (const owner of owners) blockedOwners.add(owner);
    const subject = adoptingOwners[0] as string;
    conflicts.push({
      owner: subject,
      reason: hasConflict
        ? `compatibility unit ${owners.join(", ")} mixes an incoming update with a conflicting member; the whole unit is preserved`
        : `compatibility unit ${owners.join(", ")} mixes an incoming update with a locally customized member; compatibility cannot be established by text hashes`,
      blockedOwners: owners,
    });
  }

  conflicts.sort((left, right) =>
    left.owner < right.owner ? -1 : left.owner > right.owner ? 1 : 0,
  );
  return {
    conflicts,
    blockedOwners,
    expandedOwners: new Set([...expandedOwners].sort()),
  };
}
