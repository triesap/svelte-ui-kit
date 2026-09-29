/**
 * Read-only planning-outcome boundary.
 *
 * This expresses the result of a pure planning pass so orchestration can report
 * and apply it without depending on planning internals. It is a type-only
 * interface: importing it performs no planning and no filesystem access.
 */
export interface PlanningOutcome {
  /** Whether the plan would change anything. */
  readonly kind: "no-op" | "apply";
  /** Planned target paths in deterministic order (empty for a no-op). */
  readonly writes: readonly string[];
  /** Human-readable diagnostics produced during planning. */
  readonly diagnostics: readonly string[];
}
