/**
 * Full synchronization planning (S060).
 *
 * Reconciles the desired roots (the config's requested closure) with the
 * incoming registry through the frozen ownership policy and the conservative
 * cohort rule. It shares the read-only reconciliation engine with the add
 * planner, then adds the configuration-driven retirement view: files owned by
 * items that left the closure are planned for deletion (clean), retention
 * (customized/nonregular) or a conflict (unobserved).
 *
 * A genuine conflict in any source, managed-CSS, export or retired target makes
 * the whole batch non-executable: no write is produced and every project target
 * (including `kit.json`) is left unchanged. Planning is pure and read-only.
 */
import { fail, ok, type ModelResult } from "../registry/errors.js";
import type { DependencyPlan } from "../registry/dependency-plan.js";
import type { RequestProjection } from "../registry/projection.js";
import type { DependencyInstruction } from "../project/dependency-instructions.js";
import { planAdd, type AddPlanInput } from "./plan-add.js";
import type { KitLock } from "./lock.js";
import type { PlannedWrite } from "./plan-init.js";
import { planSourceRetirement, type RetirementRecord } from "./retire.js";
import type { SourcePlan } from "./source-plan.js";

export type SyncPlanInput = Omit<AddPlanInput, "addedRoots">;

export interface SyncPlan {
  readonly executable: boolean;
  readonly projection: RequestProjection;
  readonly dependencies: DependencyPlan;
  readonly dependencyInstructions: DependencyInstruction | null;
  readonly sourcePlan: SourcePlan;
  readonly retirement: readonly RetirementRecord[];
  readonly writes: readonly PlannedWrite[];
  readonly lock: KitLock | null;
  readonly diagnostics: readonly string[];
}

/**
 * Build the full synchronization plan. Retirement is composed after the shared
 * reconciliation, and any retirement conflict blocks the whole batch. The
 * shared, effective-lineage lock projection is finalized at S061.
 */
export function planSync(input: SyncPlanInput): ModelResult<SyncPlan> {
  const base = planAdd({ ...input, addedRoots: [] });
  if (!base.ok) return fail(base.issues);

  const retainedOwners = new Set(
    base.value.projection.items.map((item) => item.id),
  );
  const retirement = planSourceRetirement(
    input.snapshot,
    input.lock?.files ?? [],
    retainedOwners,
  );

  const diagnostics = [...base.value.diagnostics];
  for (const record of retirement) {
    diagnostics.push(
      `retired target ${record.path}: ${record.action} — ${record.reason}`,
    );
  }

  const retirementConflict = retirement.some(
    (record) => record.action === "conflict",
  );
  const executable = base.value.executable && !retirementConflict;
  if (!executable && base.value.executable) {
    diagnostics.push(
      "a retirement conflict makes the whole batch non-executable; every target is left unchanged",
    );
  }

  const writes: PlannedWrite[] = executable ? [...base.value.writes] : [];
  if (executable) {
    for (const record of retirement) {
      if (record.action !== "delete") continue;
      if (writes.some((write) => write.path === record.path)) continue;
      writes.push({ path: record.path, bytes: new Uint8Array() });
    }
    writes.sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
  }

  return ok({
    executable,
    projection: base.value.projection,
    dependencies: base.value.dependencies,
    dependencyInstructions: base.value.dependencyInstructions,
    sourcePlan: base.value.sourcePlan,
    retirement,
    writes,
    lock: base.value.lock,
    diagnostics: diagnostics.sort(),
  });
}
