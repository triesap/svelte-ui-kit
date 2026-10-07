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
import {
  fail,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { deriveKitPaths, type KitConfig } from "../project/config.js";
import type { DependencyPlan } from "../registry/dependency-plan.js";
import type { RequestProjection } from "../registry/projection.js";
import type { DependencyInstruction } from "../project/dependency-instructions.js";
import type { DependencyStateEntry } from "../project/dependencies.js";
import { planAdd, revokeAddPlanning, type AddPlanInput } from "./plan-add.js";
import type { BarrelExportAuthority } from "./exports.js";
import { hashBytes } from "./compare.js";
import { composeManagedCss, FOUNDATION_TOKENS_CONTRACT } from "./css.js";
import { retireManagedCss } from "./css-retire.js";
import { parseKitLock, type KitLock } from "./lock.js";
import { TOKENS_BODY, type PlannedWrite } from "./plan-init.js";
import {
  planCssRetirement,
  planSourceRetirement,
  type CssRetirementPlanRecord,
  type RetirementRecord,
} from "./retire.js";
import type { SourcePlan } from "./source-plan.js";
import type { ProjectSnapshot } from "./snapshot.js";
import { describePlanning, type OriginalPlanningReceipt } from "./plan.js";
const ORIGINAL_SYNC_PLANS = new WeakMap<object, OriginalPlanningReceipt>();
export function originalSyncPlanning(
  authority: object,
): OriginalPlanningReceipt | undefined {
  return ORIGINAL_SYNC_PLANS.get(authority);
}

export type SyncPlanInput = Omit<AddPlanInput, "addedRoots">;

export interface SyncPlan {
  readonly executable: boolean;
  readonly projection: RequestProjection;
  readonly dependencies: DependencyPlan;
  readonly dependencyInstructions: DependencyInstruction | null;
  readonly dependencyState: readonly DependencyStateEntry[] | null;
  readonly dependencyIssues: readonly ModelIssue[];
  readonly sourcePlan: SourcePlan;
  /** The effective mapping resolved from captured evidence. */
  readonly effectiveConfig: KitConfig;
  readonly retirement: readonly RetirementRecord[];
  readonly cssRetirement: readonly CssRetirementPlanRecord[];
  readonly writes: readonly PlannedWrite[];
  /** Independent export-cohort authority carried from the shared add plan. */
  readonly exportAuthority: readonly BarrelExportAuthority[];
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
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
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
  revokeAddPlanning(base.value.exportAuthority);
  // The shared compose step resolves one effective mapping; retirement and the
  // final lock projection use the same mapping rather than the stale supplied
  // defaults.
  const effectiveConfig = base.value.effectiveConfig;

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
  let finalLock = base.value.lock;
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
      let finalText = retired.value.text;
      // Removing the registry-owned `tokens` block transfers ownership back to
      // the minimal foundation once, so the required layers remain present and
      // a later sync is a satisfied no_change rather than an empty stylesheet.
      if (
        retiredBlocks.some((block) => block.id === "tokens") &&
        stylesheetPath === deriveKitPaths(effectiveConfig).kitCss
      ) {
        const recomposed = composeManagedCss(finalText, [
          { id: "tokens", body: TOKENS_BODY },
        ]);
        if (!recomposed.ok) return fail(recomposed.issues);
        finalText = recomposed.value;
      }
      if (finalText !== current) {
        const bytes = utf8(finalText);
        const operation =
          input.snapshot.entries.get(stylesheetPath)?.kind === "absent"
            ? "create"
            : "update";
        if (index >= 0) {
          writes[index] = { path: stylesheetPath, operation, bytes };
        } else {
          writes.push({ path: stylesheetPath, operation, bytes });
        }
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

    // Finalize the lock only after every retirement effect is applied: the
    // serialized integration baselines must describe the final planned bytes,
    // not the pre-retirement stylesheet. Re-validate after the adjustment.
    if (finalLock !== null) {
      const derived = deriveKitPaths(effectiveConfig);
      const lockPath = `${derived.stateDir}/kit.lock.json`;
      const integrations = finalLock.integrations
        .map((integration) => {
          if (integration.kind !== "stylesheet") return integration;
          // A `foundation-tokens-v1` baseline hashes the owned foundation body,
          // not the aggregate stylesheet, so plan-add already recorded the
          // legitimate base. Only aggregate `stylesheet-v1` bookkeeping is
          // recalculated against the final applied bytes.
          if (integration.contract === FOUNDATION_TOKENS_CONTRACT) {
            return integration;
          }
          const write = writes.find((entry) => entry.path === integration.path);
          const text =
            write !== undefined
              ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(
                  write.bytes,
                )
              : observedText(input.snapshot, integration.path);
          if (text === null) return integration;
          return {
            ...integration,
            baseline: hashBytes(utf8(text)) as string,
          };
        })
        .sort((left, right) => {
          if (left.path !== right.path) return left.path < right.path ? -1 : 1;
          if (left.kind === right.kind) return 0;
          return left.kind < right.kind ? -1 : 1;
        });
      const validated = parseKitLock({ ...finalLock, integrations }, lockPath, {
        stateDir: derived.stateDir,
        uiDir: effectiveConfig.uiDir,
        stylesDir: effectiveConfig.stylesDir,
        layoutFile: effectiveConfig.layoutFile,
      });
      if (!validated.ok) return fail(validated.issues);
      finalLock = validated.value;

      const lockJson = `${JSON.stringify(finalLock, null, 2)}\n`;
      const lockIndex = writes.findIndex((entry) => entry.path === lockPath);
      if (lockIndex >= 0) {
        writes[lockIndex] = {
          path: lockPath,
          operation: writes[lockIndex]?.operation ?? "update",
          bytes: utf8(lockJson),
          exportAuthority: base.value.exportAuthority,
        };
      } else {
        const observedLock = input.snapshot.entries.get(lockPath);
        const observedLockText =
          observedLock?.kind === "file" && observedLock.bytes !== null
            ? new TextDecoder("utf-8", { ignoreBOM: true }).decode(
                observedLock.bytes,
              )
            : null;
        if (observedLockText !== lockJson) {
          writes.push({
            path: lockPath,
            operation: observedLock?.kind === "absent" ? "create" : "update",
            bytes: utf8(lockJson),
            exportAuthority: base.value.exportAuthority,
          });
        }
      }
    }

    writes.sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
  }

  if (executable && finalLock !== null) {
    ORIGINAL_SYNC_PLANS.set(
      base.value.exportAuthority,
      describePlanning(
        writes,
        finalLock,
        input.snapshot,
        `${deriveKitPaths(effectiveConfig).stateDir}/kit.lock.json`,
      ),
    );
  }
  return ok({
    executable,
    projection: base.value.projection,
    dependencies: base.value.dependencies,
    dependencyInstructions: base.value.dependencyInstructions,
    dependencyState: base.value.dependencyState,
    dependencyIssues: base.value.dependencyIssues,
    sourcePlan: base.value.sourcePlan,
    effectiveConfig,
    retirement,
    cssRetirement,
    writes,
    exportAuthority: base.value.exportAuthority,
    lock: finalLock,
    diagnostics: diagnostics.sort(),
  });
}
