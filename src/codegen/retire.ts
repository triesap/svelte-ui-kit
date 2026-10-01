/**
 * Source retirement (S046).
 *
 * A configuration removal recalculates the request closure. Any item still
 * reachable transitively (a shared dependency) stays and keeps its files. Only
 * files owned by items that left the closure are retired, and only a clean
 * target (local bytes equal the recorded base) is deleted. A customized or
 * absent retired target is retained as application-owned text and its lock
 * ownership is detached truthfully, so a later add can never silently reacquire
 * deletion rights over it.
 *
 * Planning is pure and read-only.
 */
import type { LockFileRecord } from "./lock.js";
import type { ProjectSnapshot } from "./snapshot.js";

export interface RetirementRecord {
  readonly path: string;
  readonly owner: string;
  readonly action: "delete" | "retain" | "conflict";
  /** Always true: a retired target is removed from lock ownership. */
  readonly detachOwnership: boolean;
  readonly reason: string;
}

/**
 * Plan retirement for every lock file whose owner is no longer in the effective
 * closure. A file whose owner remains (including a shared transitive
 * dependency) is untouched. A retired file that was never observed is
 * incomplete evidence and becomes a conflict, never a silent detach.
 */
export function planSourceRetirement(
  snapshot: ProjectSnapshot,
  lockFiles: readonly LockFileRecord[],
  retainedOwners: ReadonlySet<string>,
): readonly RetirementRecord[] {
  const records: RetirementRecord[] = [];
  for (const file of lockFiles) {
    if (retainedOwners.has(file.owner)) continue;
    const observation = snapshot.entries.get(file.path);
    if (observation === undefined) {
      records.push({
        path: file.path,
        owner: file.owner,
        action: "conflict",
        detachOwnership: false,
        reason:
          "retired target was not observed; the snapshot is incomplete and retirement cannot be decided",
      });
      continue;
    }
    if (observation.kind === "absent") {
      records.push({
        path: file.path,
        owner: file.owner,
        action: "retain",
        detachOwnership: true,
        reason: "retired target is already absent; ownership detached",
      });
      continue;
    }
    if (observation.kind !== "file") {
      records.push({
        path: file.path,
        owner: file.owner,
        action: "retain",
        detachOwnership: true,
        reason:
          "retired target is not a regular file; retained untouched and ownership detached",
      });
      continue;
    }
    if (observation.hash === file.baseHash) {
      records.push({
        path: file.path,
        owner: file.owner,
        action: "delete",
        detachOwnership: true,
        reason: "clean owned target may be retired",
      });
    } else {
      records.push({
        path: file.path,
        owner: file.owner,
        action: "retain",
        detachOwnership: true,
        reason:
          "customized retired target retained as application-owned text; ownership detached",
      });
    }
  }
  return records.sort((left, right) =>
    left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
  );
}

/** The lock records that survive retirement (owners still in the closure). */
export function survivingLockFiles(
  lockFiles: readonly LockFileRecord[],
  retainedOwners: ReadonlySet<string>,
): readonly LockFileRecord[] {
  return lockFiles.filter((file) => retainedOwners.has(file.owner));
}
