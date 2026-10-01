/**
 * Pure add-request planning (S058).
 *
 * Combines the initialization prerequisites with an explicit root addition and
 * the resolved registry closure into one read-only proposed batch. It resolves
 * the requested roots, the dependency closure and the dependency instructions
 * as data, then plans the source, managed-CSS and root-export changes against
 * the immutable snapshot and the recorded lock ownership.
 *
 * Planning is pure: no file is written and no writer or package manager is
 * started. Every conflict is collected (not stopped at the first), and a
 * genuine conflict makes the whole batch non-executable, so a conflicting
 * source/CSS/export change can never update `kit.json` on its own.
 */
import path from "node:path";

import { fail, ok, type ModelResult } from "../registry/errors.js";
import type { RegistrySnapshot } from "../registry/load.js";
import {
  projectRequests,
  type RequestProjection,
} from "../registry/projection.js";
import {
  planDependencies,
  type DependencyPlan,
} from "../registry/dependency-plan.js";
import { INITIAL_TOOL_VERSION } from "../registry/versions.js";
import type { KitConfig } from "../project/config.js";
import {
  renderDependencyInstructions,
  type DependencyInstruction,
} from "../project/dependency-instructions.js";
import { hashBytes } from "./compare.js";
import { composeManagedCss, type ManagedBlockInput } from "./css.js";
import { classifyCssBlocks } from "./css-compare.js";
import { applyCohortPolicy, type CohortMember } from "./cohorts.js";
import { parseManagedCss } from "./css-parse.js";
import { patchExportRegion, type ExportDeclaration } from "./exports.js";
import type { KitLock, LockOrigin } from "./lock.js";
import { parseKitLock } from "./lock.js";
import { buildLockProjection } from "./lock-projection.js";
import type { PlannedWrite } from "./plan-init.js";
import { assembleSourcePlan, type SourcePlan } from "./source-plan.js";
import { planSourceTargets, type IncomingSource } from "./source-targets.js";
import type { ProjectSnapshot } from "./snapshot.js";
import { patchLayoutImports } from "./svelte.js";

export interface AddPlanInput {
  readonly registry: RegistrySnapshot;
  readonly config: KitConfig;
  /** Explicit roots being added by this request. */
  readonly addedRoots: readonly string[];
  readonly snapshot: ProjectSnapshot;
  readonly lock: KitLock | null;
  readonly registryVersion: string;
  readonly registryHash: string;
}

export interface AddPlan {
  /** Whether the proposed batch can be applied; conflicts make it false. */
  readonly executable: boolean;
  readonly projection: RequestProjection;
  readonly dependencies: DependencyPlan;
  readonly dependencyInstructions: DependencyInstruction | null;
  readonly sourcePlan: SourcePlan;
  readonly writes: readonly PlannedWrite[];
  readonly lock: KitLock | null;
  readonly diagnostics: readonly string[];
}

interface SourceMeta {
  readonly owner: string;
  readonly cohort: string;
  readonly version: string;
  readonly bytes: Uint8Array;
}

interface CssMeta {
  readonly owner: string;
  readonly cohort: string;
  readonly version: string;
  readonly body: string;
}

function joinLogical(base: string, relative: string): string {
  return `${base.replace(/\/+$/, "")}/${relative.replace(/^\/+/, "")}`;
}

function relativeSpecifier(from: string, to: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), to);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function decode(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function observedText(
  snapshot: ProjectSnapshot,
  logicalPath: string,
): string | null {
  const observation = snapshot.entries.get(logicalPath);
  if (observation === undefined || observation.kind !== "file") return null;
  return decode(observation.bytes as Uint8Array);
}

function itemById(
  registry: RegistrySnapshot,
  id: string,
): RegistrySnapshot["items"][number] | undefined {
  return registry.items.find((item) => item.id === id);
}

function manifestDigest(registry: RegistrySnapshot, id: string): string {
  const item = itemById(registry, id);
  if (item === undefined) return "0".repeat(64);
  const asset = registry.assets.find(
    (entry) => entry.path === item.manifestPath,
  );
  return asset?.digest ?? "0".repeat(64);
}

function itemVersion(registry: RegistrySnapshot, id: string): string {
  return itemById(registry, id)?.manifest.version ?? "0.0.0";
}

/**
 * Build the add-request plan. The desired config only changes when the batch is
 * executable, so a conflict leaves `kit.json` untouched.
 */
export function planAdd(input: AddPlanInput): ModelResult<AddPlan> {
  const { registry, config, snapshot, lock } = input;
  const diagnostics: string[] = [];

  const projection = projectRequests(
    registry,
    [...config.requested, ...input.addedRoots],
    lock?.items.map((item) => item.id) ?? [],
  );
  if (!projection.ok) return fail(projection.issues);
  const desired = projection.value;

  const dependencyPlan = planDependencies(registry, desired.order);
  if (!dependencyPlan.ok) return fail(dependencyPlan.issues);

  const runtime = dependencyPlan.value.entries
    .filter((entry) => entry.roles.includes("runtime"))
    .map((entry) => `${entry.name}@${entry.range}`);
  const peers = dependencyPlan.value.entries
    .filter((entry) => entry.roles.includes("peer"))
    .map((entry) => `${entry.name}@${entry.range}`);
  const instructions = renderDependencyInstructions(snapshot.root, {
    runtime,
    peers,
  });
  if (!instructions.ok) return fail(instructions.issues);

  // Incoming source and style files for the whole closure in install order.
  const incomingSources: IncomingSource[] = [];
  const sourceMeta = new Map<string, SourceMeta>();
  const cssBlocksByTarget = new Map<string, ManagedBlockInput[]>();
  const cssMeta = new Map<string, Map<string, CssMeta>>();
  const exportDeclarations: ExportDeclaration[] = [];

  for (const id of desired.order) {
    const item = itemById(registry, id);
    if (item === undefined) {
      diagnostics.push(
        `closure item ${JSON.stringify(id)} is not in the registry`,
      );
      continue;
    }
    for (const file of item.files) {
      if (file.blockId !== null) continue;
      const logicalPath = joinLogical(config.uiDir, file.target);
      incomingSources.push({ path: logicalPath, bytes: file.bytes });
      sourceMeta.set(logicalPath, {
        owner: id,
        cohort: file.cohort,
        version: item.manifest.version,
        bytes: file.bytes,
      });
    }
    for (const style of item.manifest.styles) {
      const logicalPath = joinLogical(config.stylesDir, style.target);
      const registryFile = item.files.find(
        (file) => file.blockId === style.blockId,
      );
      if (registryFile === undefined) continue;
      const body = decode(registryFile.bytes);
      if (body === null) {
        diagnostics.push(
          `managed block ${JSON.stringify(style.blockId)} is not valid UTF-8`,
        );
        continue;
      }
      const targetBlocks = cssBlocksByTarget.get(logicalPath) ?? [];
      targetBlocks.push({ id: style.blockId, body });
      cssBlocksByTarget.set(logicalPath, targetBlocks);
      const byBlock = cssMeta.get(logicalPath) ?? new Map<string, CssMeta>();
      byBlock.set(style.blockId, {
        owner: id,
        cohort: style.cohort,
        version: item.manifest.version,
        body,
      });
      cssMeta.set(logicalPath, byBlock);
    }
    for (const entry of item.manifest.exports) {
      exportDeclarations.push({
        name: entry.name,
        target: entry.target.startsWith(".")
          ? entry.target
          : `./${entry.target}`,
        kind: entry.kind,
      });
    }
  }

  const sourceRecords = planSourceTargets(
    snapshot,
    lock?.files ?? [],
    incomingSources,
  );
  const incomingForPlan = incomingSources.map((entry) => ({
    path: entry.path,
    owner: sourceMeta.get(entry.path)?.owner ?? "",
    bytes: entry.bytes,
  }));
  const sourcePlan = assembleSourcePlan(sourceRecords, incomingForPlan);
  for (const conflict of sourcePlan.conflicts) {
    diagnostics.push(`source conflict at ${conflict.path}: ${conflict.reason}`);
  }

  let hasConflict = !sourcePlan.executable;

  // Managed stylesheet: classify per block, preserve customized blocks and
  // conflict on genuinely diverged blocks.
  const stylesheetPlan = new Map<string, string>();
  const cssOutcomes: {
    path: string;
    blocks: {
      id: string;
      owner: string;
      cohort: string;
      version: string;
      baseHash: string;
    }[];
  }[] = [];
  const cssTargets = new Set([
    ...cssBlocksByTarget.keys(),
    ...(lock?.cssBlocks.map((block) => block.path) ?? []),
  ]);
  const cssMembers: CohortMember[] = [];
  for (const cssPath of [...cssTargets].sort()) {
    const observation = snapshot.entries.get(cssPath);
    if (observation === undefined) {
      diagnostics.push(
        `managed stylesheet ${cssPath} was not observed; the snapshot is incomplete`,
      );
      hasConflict = true;
      continue;
    }
    const existing =
      observation.kind === "file"
        ? decode(observation.bytes as Uint8Array)
        : "";
    if (existing === null) {
      diagnostics.push(`managed stylesheet ${cssPath} is not valid UTF-8`);
      hasConflict = true;
      continue;
    }
    const parsedExisting = parseManagedCss(existing);
    if (!parsedExisting.ok) {
      diagnostics.push(...parsedExisting.issues.map((entry) => entry.message));
      hasConflict = true;
      continue;
    }
    const desiredById = new Map(
      (cssBlocksByTarget.get(cssPath) ?? []).map((block) => [
        block.id,
        block.body,
      ]),
    );
    const lockByBlock = new Map(
      (lock?.cssBlocks ?? [])
        .filter((block) => block.path === cssPath)
        .map((block) => [block.blockId, block]),
    );
    const existingBodies = new Map(
      parsedExisting.value.blocks.map((block) => [
        block.id,
        existing.slice(block.contentStart, block.contentEnd),
      ]),
    );
    const ids = new Set([...existingBodies.keys(), ...desiredById.keys()]);
    const effective: ManagedBlockInput[] = [];
    const outcomeBlocks: (typeof cssOutcomes)[number]["blocks"] = [];
    for (const blockId of [...ids].sort()) {
      const local = existingBodies.get(blockId) ?? null;
      const incomingBody = desiredById.get(blockId) ?? null;
      const record = lockByBlock.get(blockId);
      const classification = classifyCssBlocks([
        {
          id: blockId,
          owner: record?.owner ?? null,
          baseHash: record?.baseHash ?? null,
          localBody: local,
          incomingBody,
        },
      ])[0];
      if (classification === undefined) continue;
      if (classification.owner !== null) {
        cssMembers.push({
          owner: classification.owner,
          disposition: classification.disposition,
        });
      }
      if (
        classification.disposition === "conflict" ||
        classification.disposition === "untracked_conflict"
      ) {
        diagnostics.push(
          `css conflict at ${cssPath}#${blockId}: local and incoming managed text both changed`,
        );
        hasConflict = true;
        if (local !== null) effective.push({ id: blockId, body: local });
        continue;
      }
      if (incomingBody === null) {
        // A block the registry no longer provides is left untouched here;
        // retirement is a separate, config-driven operation.
        if (local !== null) effective.push({ id: blockId, body: local });
        continue;
      }
      const adoptsIncoming =
        classification.disposition === "create" ||
        classification.disposition === "update";
      effective.push({
        id: blockId,
        body: adoptsIncoming ? incomingBody : (local ?? incomingBody),
      });
      const meta = cssMeta.get(cssPath)?.get(blockId);
      const owner = meta?.owner ?? record?.owner ?? "";
      if (owner === "") continue;
      const baseHash = adoptsIncoming
        ? (hashBytes(utf8(incomingBody)) as string)
        : (record?.baseHash ??
          (hashBytes(utf8(local ?? incomingBody)) as string));
      outcomeBlocks.push({
        id: blockId,
        owner,
        cohort: meta?.cohort ?? record?.cohort ?? "",
        version: meta?.version ?? itemVersion(registry, owner),
        baseHash,
      });
    }
    const composed = composeManagedCss(existing, effective);
    if (!composed.ok) return fail(composed.issues);
    if (composed.value !== existing) {
      stylesheetPlan.set(cssPath, composed.value);
    }
    cssOutcomes.push({ path: cssPath, blocks: outcomeBlocks });
  }

  // Root export region: generated declarations only.
  const rootExports = joinLogical(config.uiDir, "index.ts");
  const exportsObservation = snapshot.entries.get(rootExports);
  let plannedExports: string | null = null;
  if (exportsObservation === undefined) {
    diagnostics.push(
      `root export region ${rootExports} was not observed; the snapshot is incomplete`,
    );
    hasConflict = true;
  } else {
    const existing =
      exportsObservation.kind === "file"
        ? decode(exportsObservation.bytes as Uint8Array)
        : "";
    if (existing === null) {
      diagnostics.push(`root export region ${rootExports} is not valid UTF-8`);
      hasConflict = true;
    } else {
      const patched = patchExportRegion(
        rootExports,
        existing,
        exportDeclarations,
      );
      if (!patched.ok) {
        diagnostics.push(...patched.issues.map((entry) => entry.message));
        hasConflict = true;
      } else if (patched.value !== existing) {
        plannedExports = patched.value;
      }
    }
  }

  // Layout imports.
  let plannedLayout: string | null = null;
  const layoutObservation = snapshot.entries.get(config.layoutFile);
  if (layoutObservation === undefined) {
    diagnostics.push(
      `layout ${config.layoutFile} was not observed; the snapshot is incomplete`,
    );
    hasConflict = true;
  } else {
    const existing =
      layoutObservation.kind === "file"
        ? decode(layoutObservation.bytes as Uint8Array)
        : "";
    if (existing === null) {
      diagnostics.push(`layout ${config.layoutFile} is not valid UTF-8`);
      hasConflict = true;
    } else {
      const specifiers = [
        joinLogical(config.stylesDir, "kit.css"),
        joinLogical(config.stylesDir, "themes.css"),
        joinLogical(config.stylesDir, "app.css"),
      ].map((target) => ({
        specifier: relativeSpecifier(config.layoutFile, target),
      }));
      const patched = patchLayoutImports(existing, specifiers);
      if (!patched.ok) {
        diagnostics.push(...patched.issues.map((entry) => entry.message));
        hasConflict = true;
      } else if (patched.value !== existing) {
        plannedLayout = patched.value;
      }
    }
  }

  const desiredConfig: KitConfig = {
    ...config,
    requested: desired.requested,
  };

  // Conservative compatibility cohorts (S059): a component's source, managed CSS
  // and export members must not partially update when compatibility cannot be
  // established. A changed public API widens the unit to its dependents.
  const cohortMembers: CohortMember[] = [
    ...sourcePlan.changes.map((change) => ({
      owner: change.owner,
      disposition: change.disposition,
    })),
    ...sourcePlan.conflicts.map((conflict) => ({
      owner: conflict.owner ?? conflict.path,
      disposition: conflict.disposition,
    })),
    ...cssMembers,
  ];
  const lockVersion = new Map(
    (lock?.items ?? []).map((item) => [item.id, item.version]),
  );
  const exportedApiChanged = new Set(
    desired.items
      .map((item) => item.id)
      .filter(
        (id) =>
          lockVersion.has(id) &&
          lockVersion.get(id) !== itemVersion(registry, id),
      ),
  );
  const dependents = new Map<string, string[]>();
  for (const item of registry.items) {
    for (const dependency of item.manifest.registryDependencies) {
      const list = dependents.get(dependency) ?? [];
      list.push(item.id);
      dependents.set(dependency, list);
    }
  }
  const cohorts = applyCohortPolicy({
    members: cohortMembers,
    dependents,
    exportedApiChanged,
  });
  if (cohorts.conflicts.length > 0) {
    hasConflict = true;
    for (const conflict of cohorts.conflicts) {
      diagnostics.push(
        `cohort conflict for ${conflict.owner}: ${conflict.reason}`,
      );
    }
  }

  const writes: PlannedWrite[] = [];
  let projectedLock: KitLock | null = lock;
  if (!hasConflict) {
    const kitJsonPath = joinLogical(config.uiDir, "_kit/kit.json");
    const configJson = `${JSON.stringify(desiredConfig, null, 2)}\n`;
    if (observedText(snapshot, kitJsonPath) !== configJson) {
      writes.push({ path: kitJsonPath, bytes: utf8(configJson) });
    }
    for (const change of sourcePlan.changes) {
      if (!change.producesBytes) continue;
      const meta = sourceMeta.get(change.path);
      if (meta === undefined) continue;
      writes.push({ path: change.path, bytes: meta.bytes });
    }
    for (const [cssPath, text] of stylesheetPlan) {
      writes.push({ path: cssPath, bytes: utf8(text) });
    }
    if (plannedExports !== null) {
      writes.push({ path: rootExports, bytes: utf8(plannedExports) });
    }
    if (plannedLayout !== null) {
      writes.push({ path: config.layoutFile, bytes: utf8(plannedLayout) });
    }

    const built = buildLockProjection({
      items: desired.items.map((entry) => ({
        id: entry.id,
        version: itemVersion(registry, entry.id),
        digest: manifestDigest(registry, entry.id),
        origin: (entry.provenance === "explicit"
          ? "explicit"
          : "transitive") as LockOrigin,
      })),
      desired,
      lock,
      sourcePlan,
      sourceMeta,
      cssOutcomes,
      registryVersion: input.registryVersion,
      registryHash: input.registryHash,
      configHash: hashBytes(utf8(configJson)) as string,
      toolVersion: INITIAL_TOOL_VERSION,
    });
    const lockPath = joinLogical(config.uiDir, "_kit/kit.lock.json");
    const validated = parseKitLock(built.lock, lockPath, {
      stateDir: joinLogical(config.uiDir, "_kit"),
      uiDir: config.uiDir,
      stylesDir: config.stylesDir,
    });
    if (!validated.ok) return fail(validated.issues);
    projectedLock = validated.value;
    const lockJson = `${JSON.stringify(projectedLock, null, 2)}\n`;
    if (observedText(snapshot, lockPath) !== lockJson) {
      writes.push({ path: lockPath, bytes: utf8(lockJson) });
    }
    writes.sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
  } else {
    diagnostics.push(
      "the proposed batch is not executable; kit.json and every other target are left unchanged",
    );
  }

  return ok({
    executable: !hasConflict,
    projection: desired,
    dependencies: dependencyPlan.value,
    dependencyInstructions: instructions.value,
    sourcePlan,
    writes: hasConflict ? [] : writes,
    lock: projectedLock,
    diagnostics: diagnostics.sort(),
  });
}
