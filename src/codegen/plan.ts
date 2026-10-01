/**
 * Read-only planning-outcome boundary (and the deterministic plan envelope).
 *
 * `PlanningOutcome` expresses the result of a pure planning pass so
 * orchestration can report and apply it without depending on planning
 * internals. `toPlanningEnvelope` normalizes any planner's writes into a
 * deterministic, content-visible envelope: entries are sorted by logical path
 * and each carries the exact byte length and digest, so a semantic reordering
 * of equivalent inputs is invisible while a real content change is not.
 *
 * This module is type-only plus one pure normalizer: importing it performs no
 * planning, no filesystem access and no writer/package-manager work.
 */
import { hashBytes } from "./compare.js";

export interface PlanningOutcome {
  /** Whether the plan would change anything. */
  readonly kind: "no-op" | "apply";
  /** Planned target paths in deterministic order (empty for a no-op). */
  readonly writes: readonly string[];
  /** Human-readable diagnostics produced during planning. */
  readonly diagnostics: readonly string[];
}

/**
 * The content operation a planned write performs. `retire` is an explicit
 * deletion (bytes are empty) that must never be confused with creating an
 * empty file.
 */
export type ChangeOperation = "create" | "update" | "retire";

/** A planned write as produced by a planner. */
export interface PlanWrite {
  readonly path: string;
  readonly bytes: Uint8Array;
  /** Defaults to `create`/`update` when a planner does not state one. */
  readonly operation?: ChangeOperation;
}

export interface PlannedWriteEnvelope {
  readonly path: string;
  readonly operation: ChangeOperation;
  readonly bytesLength: number;
  readonly digest: string;
}

export type PlanCommand = "init" | "add" | "sync";

export interface PlanningEnvelope {
  readonly command: PlanCommand;
  readonly executable: boolean;
  readonly writes: readonly PlannedWriteEnvelope[];
  readonly diagnostics: readonly string[];
}

/**
 * Normalize a planner's writes into a deterministic envelope. Writes are
 * sorted by logical path and each entry exposes the exact byte length and
 * SHA-256 digest, so equivalent logical inputs produce identical envelopes and
 * a hidden content change can never be masked.
 */
export function toPlanningEnvelope(
  command: PlanCommand,
  executable: boolean,
  writes: readonly PlanWrite[],
  diagnostics: readonly string[],
): PlanningEnvelope {
  const entries = [...writes]
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    )
    .map((write) => ({
      path: write.path,
      operation: write.operation ?? "update",
      bytesLength: write.bytes.byteLength,
      digest: hashBytes(write.bytes) as string,
    }));
  return {
    command,
    executable,
    diagnostics: [...diagnostics].sort(),
    writes: entries,
  };
}
