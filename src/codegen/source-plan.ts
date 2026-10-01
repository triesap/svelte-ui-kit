/**
 * Source change plan assembly (S047).
 *
 * Aggregates per-target dispositions into a deterministic, inspectable source
 * change plan without bypassing ownership guards. Any conflict in any target
 * makes the whole batch non-executable; conflicts are collected in full,
 * deterministically ordered order rather than stopping at the first. Candidate
 * (incoming) and installed (recorded base) lineage are preserved separately so a
 * later lock projection can advance only what actually changed.
 *
 * Planning is pure and read-only.
 */
import type { OwnershipDisposition } from "./ownership-policy.js";
import type { SourceTargetRecord } from "./source-targets.js";

export interface IncomingSourceFile {
  readonly path: string;
  readonly owner: string;
  readonly bytes: Uint8Array;
}

export interface SourcePlanChange {
  readonly path: string;
  readonly owner: string;
  readonly disposition: OwnershipDisposition;
  /** Installed lineage: the recorded base hash, or `null`. */
  readonly installedBaseHash: string | null;
  /** Candidate lineage: the incoming hash, or `null`. */
  readonly candidateHash: string | null;
  /** True when the plan would produce new bytes for this target. */
  readonly producesBytes: boolean;
}

export interface SourcePlan {
  readonly changes: readonly SourcePlanChange[];
  readonly conflicts: readonly SourceTargetRecord[];
  readonly executable: boolean;
}

/**
 * Assemble the source change plan from target records and the incoming files.
 * Ordering is by logical path (the records are already sorted), so equivalent
 * logical input yields an identical plan.
 */
export function assembleSourcePlan(
  records: readonly SourceTargetRecord[],
  incoming: readonly IncomingSourceFile[],
): SourcePlan {
  const ownerByPath = new Map(
    incoming.map((entry) => [entry.path, entry.owner]),
  );
  const changes: SourcePlanChange[] = [];
  const conflicts: SourceTargetRecord[] = [];

  for (const record of records) {
    if (
      record.disposition === "conflict" ||
      record.disposition === "untracked_conflict"
    ) {
      conflicts.push(record);
      continue;
    }
    const owner = record.owner ?? ownerByPath.get(record.path) ?? null;
    if (owner === null) {
      // A generated target with no owner cannot be assigned; treat it as a
      // conflict rather than producing an unattributable change.
      conflicts.push({
        ...record,
        disposition: "conflict",
        reason: "target has no owner in the lock or the incoming set",
      });
      continue;
    }
    changes.push({
      path: record.path,
      owner,
      disposition: record.disposition,
      installedBaseHash: record.baseHash,
      candidateHash: record.incomingHash,
      producesBytes:
        record.disposition === "create" || record.disposition === "update",
    });
  }

  return {
    changes,
    conflicts,
    executable: conflicts.length === 0,
  };
}
