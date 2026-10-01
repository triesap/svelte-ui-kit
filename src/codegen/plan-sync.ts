/**
 * Full synchronization planning (S060–S062).
 *
 * Reconciles the desired roots (the config's requested closure) with the
 * incoming registry through the frozen ownership policy and the conservative
 * cohort rule. It shares the read-only reconciliation engine with the add
 * planner, then composes the configuration-driven retirement view:
 *
 * - a removed root recalculates the closure; a shared dependency that is still
 *   reachable is retained;
 * - a clean retired source or managed CSS block is deleted;
 * - a customized retired asset keeps its complete bytes/span and its ownership
 *   is detached, with a warning diagnostic;
 * - an unobserved or malformed retired target is a conflict.
 *
 * Application exports and imports are never rewritten: the root barrel is
 * regenerated only from the retained closure's declarations, and arbitrary
 * application imports are left untouched. No remove command or auto-install is
 * introduced. A genuine conflict makes the whole batch non-executable and every
 * project target (including `kit.json`) is left unchanged. Planning is pure and
 * read-only.
 */
import { fail, ok, type ModelResult } from "../registry/errors.js";
import type { DependencyPlan } from "../registry/dependency-plan.js";
import type { RequestProjection } from "../registry/projection.js";
import type { DependencyInstruction } from "../project/dependency-instructions.js";
import { planAdd, type AddPlanInput } from "./plan-add.js";
import { retireManagedCss } from "./css-retire.js";
import type { KitLock } from "./lock.js";
import type { PlannedWrite } from "./plan-init.js";
import {
  planCssRetirement,
  planSourceRetirement,
  type CssRetirementPlanRecord,
  type RetirementRecord,
} from "./retire.js";
import type { SourcePlan } from "./source-plan.js";
import type { ProjectSnapshot } from "./snapshot.js";

export type SyncPlanInput = Omit<AddPlanInput, "addedRoots">;

export interface SyncPlan {
  readonly executable: boolean;
  readonly projection: RequestProjection;
  readonly dependencies: DependencyPlan;
  readonly dependencyInstructions: DependencyInstruction | null;
  readonly sourcePlan: SourcePlan;
  readonly retirement: readonly RetirementRecord[];
  readonly cssRetirement: readonly CssRetirementPlanRecord[];
  readonly writes: readonly PlannedWrite[];
  readonly lock: KitLock | null;
  readonly diagnostics: readonly string[];
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function observedText(
  snapshot: ProjectSnapshot,
  logicalPath: string,
): string | null {
  const observation = snapshot.entries.get(logicalPath);
  if (observation === undefined || observation.kind !== "file") return null;
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      observation.bytes as Uint8Array,
    );
  } catch {
    return null;
  }
}

/**
 * Build the full synchronization plan. Retirement is composed after the shared
 * reconciliation; any source or CSS retirement conflict blocks the whole batch.
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
  const cssRetirement = planCssRetirement(
    input.snapshot,
    input.lock?.cssBlocks ?? [],
    retainedOwners,
  );

  const diagnostics = [...base.value.diagnostics];
  for (const record of retirement) {
    diagnostics.push(
      `retired target ${record.path}: ${record.action} — ${record.reason}`,
    );
  }
  for (const record of cssRetirement) {
    diagnostics.push(
      `retired block ${record.path}#${record.blockId}: ${record.action} — ${record.reason}`,
    );
  }

  const retirementConflict =
    retirement.some((record) => record.action === "conflict") ||
    cssRetirement.some((record) => record.action === "conflict");
  const executable = base.value.executable && !retirementConflict;
  if (!executable && base.value.executable) {
    diagnostics.push(
      "a retirement conflict makes the whole batch non-executable; every target is left unchanged",
    );
  }

  const writes: PlannedWrite[] = executable ? [...base.value.writes] : [];
  if (executable) {
    // Compose clean CSS-block removals into the already-planned stylesheet (or
    // the observed text). Customized retired spans are left byte-for-byte.
    const removals = new Map<string, { id: string; clean: boolean }[]>();
    for (const record of cssRetirement) {
      if (record.action !== "remove") continue;
      const list = removals.get(record.path) ?? [];
      list.push({ id: record.blockId, clean: true });
      removals.set(record.path, list);
    }
    for (const [stylesheetPath, retiredBlocks] of removals) {
      const index = writes.findIndex((write) => write.path === stylesheetPath);
      const current =
        index >= 0
          ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(
              writes[index]?.bytes,
            )
          : observedText(input.snapshot, stylesheetPath);
      if (current === null) continue;
      const retired = retireManagedCss(current, retiredBlocks);
      if (!retired.ok) return fail(retired.issues);
      if (retired.value.text !== current) {
        const bytes = utf8(retired.value.text);
        if (index >= 0) writes[index] = { path: stylesheetPath, bytes };
        else writes.push({ path: stylesheetPath, bytes });
      }
    }
    for (const record of retirement) {
      if (record.action !== "delete") continue;
      if (writes.some((write) => write.path === record.path)) continue;
      // Retirement is an explicit operation, never a zero-byte write that a
      // consumer could mistake for creating an empty file.
      writes.push({
        path: record.path,
        operation: "retire",
        bytes: new Uint8Array(),
      });
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
    cssRetirement,
    writes,
    lock: base.value.lock,
    diagnostics: diagnostics.sort(),
  });
}
