/**
 * Source target planning (S045).
 *
 * Combines an immutable S041 snapshot, the lock's recorded ownership and the
 * incoming registry bytes into one disposition per source target. It is pure
 * and read-only: it never writes, and a targeted `conflict` is reported with the
 * exact cause rather than applied.
 *
 * Missing tracked targets follow the frozen policy: they are a visible conflict
 * and never a silent restoration. Existing untracked targets are
 * application-owned and are never adopted or deleted, even when byte-identical
 * to incoming. New absent untracked targets are planned creations.
 */
import { hashBytes, classifyOwnershipHashes } from "./compare.js";
import type { OwnershipDisposition } from "./ownership-policy.js";
import type { ProjectSnapshot } from "./snapshot.js";
import type { LockFileRecord } from "./lock.js";

export interface IncomingSource {
  readonly path: string;
  readonly bytes: Uint8Array;
}

export interface SourceTargetRecord {
  readonly path: string;
  readonly tracked: boolean;
  /** Lock owner when tracked, otherwise `null`. */
  readonly owner: string | null;
  readonly disposition: OwnershipDisposition;
  readonly baseHash: string | null;
  readonly localHash: string | null;
  readonly incomingHash: string | null;
  /** Safe logical explanation of the disposition. */
  readonly reason: string;
}

function reasonFor(
  disposition: OwnershipDisposition,
  tracked: boolean,
  localPresent: boolean,
): string {
  switch (disposition) {
    case "create":
      return "new untracked target will be created";
    case "no_change":
      return localPresent
        ? "content already matches incoming"
        : "no local target and no incoming content";
    case "update":
      return "locally untouched; safe incoming update";
    case "customized":
      return "local customization preserved; recorded base retained";
    case "untracked_conflict":
      return "existing untracked target is application-owned; no adoption or deletion rights";
    case "conflict":
      return tracked && !localPresent
        ? "tracked target is missing; reconcile explicitly, no silent restoration"
        : "local and incoming content both changed; explicit reconciliation required";
  }
}

/**
 * Classify every source target in the union of the snapshot, the lock and the
 * incoming set. The result is deterministic and sorted by logical path.
 */
export function planSourceTargets(
  snapshot: ProjectSnapshot,
  lockFiles: readonly LockFileRecord[],
  incoming: readonly IncomingSource[],
): readonly SourceTargetRecord[] {
  const lockByPath = new Map(lockFiles.map((record) => [record.path, record]));
  const incomingByPath = new Map(
    incoming.map((entry) => [entry.path, entry.bytes]),
  );
  const paths = [
    ...new Set([
      ...lockByPath.keys(),
      ...incomingByPath.keys(),
      ...snapshot.paths,
    ]),
  ].sort();

  const records: SourceTargetRecord[] = [];
  for (const logicalPath of paths) {
    const lockRecord = lockByPath.get(logicalPath);
    const observation = snapshot.entries.get(logicalPath);
    const incomingBytes = incomingByPath.get(logicalPath) ?? null;

    const localHash =
      observation && observation.kind === "file" ? observation.hash : null;
    const localPresent = observation?.kind === "file";
    const unsafeLocal =
      observation !== undefined &&
      observation.kind !== "file" &&
      observation.kind !== "absent";

    let disposition: OwnershipDisposition;
    if (unsafeLocal) {
      disposition = "conflict";
    } else {
      disposition = classifyOwnershipHashes({
        tracked: lockRecord !== undefined,
        baseHash: lockRecord?.baseHash ?? null,
        localHash,
        incomingHash: hashBytes(incomingBytes),
      });
    }

    records.push({
      path: logicalPath,
      tracked: lockRecord !== undefined,
      owner: lockRecord?.owner ?? null,
      disposition,
      baseHash: lockRecord?.baseHash ?? null,
      localHash,
      incomingHash: hashBytes(incomingBytes),
      reason: unsafeLocal
        ? "local target is not a regular file; refusing to plan against it"
        : reasonFor(disposition, lockRecord !== undefined, localPresent),
    });
  }
  return records;
}

/** True when any record is a conflict of either kind. */
export function hasSourceConflict(
  records: readonly SourceTargetRecord[],
): boolean {
  return records.some(
    (record) =>
      record.disposition === "conflict" ||
      record.disposition === "untracked_conflict",
  );
}
