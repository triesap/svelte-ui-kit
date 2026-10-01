/**
 * Pure add-request planning (S058).
 *
 * Combines the initialization prerequisites with an explicit root addition and
 * the resolved registry closure into one read-only proposed batch. It resolves
 * the requested roots, the dependency closure and the dependency instructions
 * as data, then plans the source, managed-CSS, integration and root-export
 * changes against the immutable snapshot and the recorded lock ownership.
 *
 * Planning is pure: no file is written and no writer or package manager is
 * started. Every conflict is collected (not stopped at the first), and a
 * genuine conflict makes the whole batch non-executable, so a conflicting
 * source/CSS/export change can never update `kit.json` on its own.
 *
 * RCLD03-R4-1: the composed entry validates the complete observed state before
 * any executable result. Every reason-about target must have been observed,
 * a nonregular/unreadable target is a typed conflict instead of an assumed
 * empty file, observed config/lock metadata is parsed rather than ignored, the
 * registry identity is taken from the validated snapshot rather than a
 * separately supplied scalar, and BOM-preserving decoding is shared with the
 * initialization planner. A fresh add also emits the minimal initialization
 * prerequisites (foundation stylesheet, empty themes/app stylesheets) and
 * records integration ownership so a later sync never loses it.
 */
import path from "node:path";

import {
  fail,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
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
import {
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
} from "../project/config.js";
import {
  renderDependencyInstructions,
  type DependencyInstruction,
} from "../project/dependency-instructions.js";
import {
  inspectDependencyState,
  validatePeerDependencies,
  type DependencyStateEntry,
} from "../project/dependencies.js";
import { readJsonObject } from "../project/io.js";
import { hashBytes } from "./compare.js";
import { canonicalJson } from "./serialize.js";
import { composeManagedCss, type ManagedBlockInput } from "./css.js";
import { classifyCssBlocks } from "./css-compare.js";
import { applyCohortPolicy, type CohortMember } from "./cohorts.js";
import { parseManagedCss } from "./css-parse.js";
import {
  exportDeclarationKey,
  exportRegionContent,
  findRootBarrelImports,
  parseGeneratedDeclarations,
  patchExportRegion,
  type ExportDeclaration,
} from "./exports.js";
import { parseExportRegion } from "./export-parse.js";
import type { OwnershipDisposition } from "./ownership-policy.js";
import type { KitLock, LockIntegration, LockOrigin } from "./lock.js";
import { parseKitLock } from "./lock.js";
import { buildLockProjection } from "./lock-projection.js";
import { TOKENS_BODY, type PlannedWrite } from "./plan-init.js";
import { assembleSourcePlan, type SourcePlan } from "./source-plan.js";
import { planSourceTargets, type IncomingSource } from "./source-targets.js";
import {
  decodeObservedText,
  type ProjectSnapshot,
  type TargetObservation,
} from "./snapshot.js";
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
  /** Declared/installed/peer readiness evidence, when a manifest is present. */
  readonly dependencyState: readonly DependencyStateEntry[] | null;
  /** Typed declaration/install/peer causes that block an executable batch. */
  readonly dependencyIssues: readonly ModelIssue[];
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

/**
 * Validated state of one observed target. `file` carries BOM-preserving text;
 * `absent` is the *only* creation case; `conflict` records why the target
 * cannot be reasoned about (unobserved, nonregular, unreadable or invalid
 * UTF-8).
 */
type ObservedTextState =
  | { readonly status: "absent" }
  | {
      readonly status: "file";
      readonly text: string;
      readonly hash: string;
    }
  | { readonly status: "conflict"; readonly reason: string };

function observeText(
  snapshot: ProjectSnapshot,
  logicalPath: string,
): ObservedTextState {
  const observation: TargetObservation | undefined =
    snapshot.entries.get(logicalPath);
  if (observation === undefined) {
    return {
      status: "conflict",
      reason: `${logicalPath} was not observed; the snapshot is incomplete`,
    };
  }
  if (observation.kind === "absent") return { status: "absent" };
  if (observation.kind !== "file") {
    return {
      status: "conflict",
      reason: `${logicalPath} is not a regular file (${observation.kind}); refusing to plan over it`,
    };
  }
  const decoded = decodeObservedText(observation);
  if (decoded.kind === "invalid") {
    return {
      status: "conflict",
      reason: `${logicalPath} is not valid UTF-8`,
    };
  }
  if (decoded.kind !== "text") {
    return {
      status: "conflict",
      reason: `${logicalPath} could not be decoded`,
    };
  }
  return {
    status: "file",
    text: decoded.text,
    hash: observation.hash ?? (hashBytes(observation.bytes) as string),
  };
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

function itemById(
  registry: RegistrySnapshot,
  id: string,
): RegistrySnapshot["items"][number] | undefined {
  return registry.items.find((item) => item.id === id);
}

function itemVersion(registry: RegistrySnapshot, id: string): string | null {
  return itemById(registry, id)?.manifest.version ?? null;
}

/**
 * Build the add-request plan. The desired config only changes when the batch is
 * executable, so a conflict leaves `kit.json` untouched.
 */
export function planAdd(input: AddPlanInput): ModelResult<AddPlan> {
  const { registry, config, snapshot, lock } = input;
  const diagnostics: string[] = [];
  const derived = deriveKitPaths(config);
  let hasConflict = false;

  // The actual validated snapshot identity is authoritative. A separately
  // supplied scalar is never trusted; a mismatch is recorded as a diagnostic
  // but cannot change the projected identity.
  const registryVersion = registry.root.registryVersion;
  const registryHash = registry.root.contentHash;
  if (
    input.registryVersion !== registryVersion ||
    input.registryHash !== registryHash
  ) {
    diagnostics.push(
      "the composed plan uses the validated registry snapshot identity, not the separately supplied registry version/hash",
    );
  }

  // ---- Observed config/lock metadata --------------------------------------
  const kitJsonPath = joinLogical(config.uiDir, "_kit/kit.json");
  const lockPath = joinLogical(config.uiDir, "_kit/kit.lock.json");
  const kitJsonState = observeText(snapshot, kitJsonPath);
  if (kitJsonState.status === "conflict") {
    diagnostics.push(`config conflict: ${kitJsonState.reason}`);
    hasConflict = true;
  } else if (kitJsonState.status === "file") {
    let parsedConfig: unknown;
    let configMalformed = false;
    try {
      parsedConfig = JSON.parse(kitJsonState.text);
    } catch {
      configMalformed = true;
      diagnostics.push(
        `config conflict: ${kitJsonPath} is not valid JSON; reconcile the observed configuration before planning`,
      );
      hasConflict = true;
    }
    if (!configMalformed) {
      const validatedConfig = parseKitConfig(parsedConfig, kitJsonPath);
      if (!validatedConfig.ok) {
        for (const entry of validatedConfig.issues) {
          diagnostics.push(
            `config conflict: observed ${kitJsonPath} is invalid (${entry.code}); reconcile the observed configuration before planning`,
          );
        }
        hasConflict = true;
      } else {
        const observedConfig = validatedConfig.value;
        const mappingMismatch =
          observedConfig.registry !== config.registry ||
          observedConfig.uiDir !== config.uiDir ||
          observedConfig.stylesDir !== config.stylesDir ||
          observedConfig.layoutFile !== config.layoutFile;
        if (mappingMismatch) {
          diagnostics.push(
            `config conflict: the supplied configuration does not match the observed mapping in ${kitJsonPath}; an unexplained mapping/state mismatch must be reconciled before planning`,
          );
          hasConflict = true;
        }
      }
    }
  }
  const lockState = observeText(snapshot, lockPath);
  if (lockState.status === "conflict") {
    diagnostics.push(`lock conflict: ${lockState.reason}`);
    hasConflict = true;
  } else if (lockState.status === "file") {
    let parsedObserved: unknown;
    let malformed = false;
    try {
      parsedObserved = JSON.parse(lockState.text);
    } catch {
      malformed = true;
      diagnostics.push(
        `lock conflict: ${lockPath} is not valid JSON; reconcile the observed lock before planning`,
      );
      hasConflict = true;
    }
    if (!malformed) {
      // The supplied in-memory lineage must describe real, schema-valid
      // observed bytes; a typed interface is not proof that the two agree.
      const validatedObservedLock = parseKitLock(parsedObserved, lockPath, {
        stateDir: joinLogical(config.uiDir, "_kit"),
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
      });
      if (!validatedObservedLock.ok) {
        for (const entry of validatedObservedLock.issues) {
          diagnostics.push(
            `lock conflict: observed ${lockPath} is invalid (${entry.code}); reconcile the observed lock before planning`,
          );
        }
        hasConflict = true;
      } else if (lock === null) {
        diagnostics.push(
          `lock conflict: ${lockPath} was observed but no lock was supplied; a typed null is not proof that the installed lineage is absent`,
        );
        hasConflict = true;
      } else if (
        canonicalJson(validatedObservedLock.value) !== canonicalJson(lock)
      ) {
        diagnostics.push(
          `lock conflict: the observed ${lockPath} does not match the supplied lock lineage; re-read the installed lineage before planning`,
        );
        hasConflict = true;
      }
    }
  } else if (lock !== null) {
    // A supplied lock against an observed absence is unsafe: missing installed
    // lineage cannot authorize ownership writes.
    diagnostics.push(
      `lock conflict: a lock was supplied but ${lockPath} was observed absent; missing installed lineage cannot authorize ownership writes`,
    );
    hasConflict = true;
  }

  // ---- Request projection and dependencies --------------------------------
  const projection = projectRequests(
    registry,
    [...config.requested, ...input.addedRoots],
    lock?.items.map((item) => item.id) ?? [],
  );
  if (!projection.ok) return fail(projection.issues);
  const desired = projection.value;
  const retiredOwners = new Set(desired.retired);

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
  // Compose the declared/installed/peer readiness evidence when the selected
  // package provides a manifest; readiness semantics stay owned by S038/S039.
  const dependencyStateResult = inspectDependencyState(
    snapshot.root,
    dependencyPlan.value.entries.map((entry) => ({
      name: entry.name,
      range: entry.range,
    })),
  );
  const dependencyIssues: ModelIssue[] = [];
  let dependencyState: readonly DependencyStateEntry[] | null = null;
  if (dependencyStateResult.ok) {
    dependencyState = dependencyStateResult.value;
  } else if (
    !dependencyStateResult.issues.every(
      (entry) => entry.code === "DEPENDENCY_MANIFEST_MISSING",
    )
  ) {
    // Invalid declaration/install evidence is a typed conflict; a project with
    // no package.json simply has no consumer dependency evidence yet.
    dependencyIssues.push(...dependencyStateResult.issues);
  }
  if (hasPackageManifest(snapshot.root)) {
    // The actual upstream peer audit is part of the same readiness decision: an
    // installed dependency whose required peer is absent or incompatible, or
    // whose metadata is malformed, must not report ready or authorize writes.
    const peerResult = validatePeerDependencies(
      snapshot.root,
      dependencyPlan.value,
    );
    if (peerResult.ok) {
      if (dependencyState === null) dependencyState = peerResult.value;
    } else {
      dependencyIssues.push(...peerResult.issues);
    }
  }
  if (dependencyIssues.length > 0) {
    for (const entry of dependencyIssues) {
      diagnostics.push(`dependency conflict (${entry.code}): ${entry.message}`);
    }
    hasConflict = true;
  }

  // ---- Incoming registry content ------------------------------------------
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
      hasConflict = true;
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
      // Cycle qualification: a generated source must use direct sibling imports
      // and never the generated root barrel. The existing AST authority is
      // composed here rather than a text search.
      if (
        logicalPath !== derived.rootExports &&
        /\.(?:svelte|ts|mts|cts|js|mjs|cjs)$/.test(logicalPath)
      ) {
        const text = decodeText(file.bytes);
        if (text !== null) {
          const relative = path.posix
            .relative(path.posix.dirname(logicalPath), derived.rootExports)
            .replace(/\.ts$/, "");
          const specifier = relative.startsWith(".")
            ? relative
            : `./${relative}`;
          const offenders = findRootBarrelImports(text, new Set([specifier]));
          if (offenders.length > 0) {
            diagnostics.push(
              `registry source ${logicalPath} imports the root UI barrel ${JSON.stringify(offenders[0])}; generated sources must use direct sibling imports to avoid a cycle`,
            );
            hasConflict = true;
          }
        }
      }
    }
    for (const style of item.manifest.styles) {
      const logicalPath = joinLogical(config.stylesDir, style.target);
      const registryFile = item.files.find(
        (file) => file.blockId === style.blockId,
      );
      if (registryFile === undefined) continue;
      const body = decodeText(registryFile.bytes);
      if (body === null) {
        diagnostics.push(
          `managed block ${JSON.stringify(style.blockId)} is not valid UTF-8`,
        );
        hasConflict = true;
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

  // ---- Source targets -----------------------------------------------------
  const sourceRecords = planSourceTargets(
    snapshot,
    (lock?.files ?? []).filter((record) => !retiredOwners.has(record.owner)),
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
  if (!sourcePlan.executable) hasConflict = true;

  // ---- Managed stylesheet -------------------------------------------------
  const kitCssPath = derived.kitCss;
  const stylesheetPlan = new Map<string, string>();
  const effectiveCss = new Map<string, string>();
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
    ...(lock?.cssBlocks
      .filter((block) => !retiredOwners.has(block.owner))
      .map((block) => block.path) ?? []),
    kitCssPath,
  ]);
  const cssMembers: CohortMember[] = [];
  for (const cssPath of [...cssTargets].sort()) {
    const state = observeText(snapshot, cssPath);
    if (state.status === "conflict") {
      diagnostics.push(`css conflict: ${state.reason}`);
      hasConflict = true;
      continue;
    }
    const existing = state.status === "file" ? state.text : "";
    const parsedExisting = parseManagedCss(existing);
    if (!parsedExisting.ok) {
      diagnostics.push(...parsedExisting.issues.map((entry) => entry.message));
      hasConflict = true;
      continue;
    }
    const desiredIds = (cssBlocksByTarget.get(cssPath) ?? []).map(
      (block) => block.id,
    );
    const desiredWithFoundation: ManagedBlockInput[] =
      cssPath === kitCssPath && !desiredIds.includes("tokens")
        ? [
            { id: "tokens", body: TOKENS_BODY },
            ...(cssBlocksByTarget.get(cssPath) ?? []),
          ]
        : (cssBlocksByTarget.get(cssPath) ?? []);
    const desiredById = new Map(
      desiredWithFoundation.map((block) => [block.id, block.body]),
    );
    const lockByBlock = new Map(
      (lock?.cssBlocks ?? [])
        .filter(
          (block) => block.path === cssPath && !retiredOwners.has(block.owner),
        )
        .map((block) => [block.blockId, block]),
    );
    const allLockByBlock = new Map(
      (lock?.cssBlocks ?? [])
        .filter((block) => block.path === cssPath)
        .map((block) => [block.blockId, block]),
    );
    const stylesheetIntegration = (lock?.integrations ?? []).find(
      (entry) => entry.kind === "stylesheet" && entry.path === cssPath,
    );
    const parsedBlocks = parsedExisting.value.blocks;
    const registryProvidesTokens = (cssBlocksByTarget.get(cssPath) ?? []).some(
      (block) => block.id === "tokens",
    );
    // The foundation `tokens` layer is owned by the stylesheet integration, not
    // by a registry item. Markers or an identical body alone confer nothing:
    // the integration record must prove ownership first.
    const integrationOwnsTokens = (blockId: string): boolean =>
      blockId === "tokens" &&
      stylesheetIntegration !== undefined &&
      !lockByBlock.has(blockId) &&
      !allLockByBlock.has(blockId);
    const existingBodies = new Map(
      parsedBlocks.map((block) => [
        block.id,
        existing.slice(block.contentStart, block.contentEnd),
      ]),
    );
    // An existing managed block the lock does not own is application-owned;
    // markers alone never confer ownership. It is a conflict even when it is
    // byte-identical to incoming. The foundation `tokens` layer is owned by the
    // stylesheet integration rather than an item, so proven integration
    // ownership exempts only that layer.
    for (const block of parsedBlocks) {
      if (integrationOwnsTokens(block.id)) continue;
      if (!lockByBlock.has(block.id) && !allLockByBlock.has(block.id)) {
        diagnostics.push(
          `css conflict at ${cssPath}#${block.id}: a managed block is present that the lock does not own; markers alone do not confer ownership`,
        );
        hasConflict = true;
      }
    }
    // A tracked integration must never be silently recreated when its target
    // has gone missing: ownership implies the bytes should exist.
    if (stylesheetIntegration !== undefined && state.status === "absent") {
      diagnostics.push(
        `css conflict at ${cssPath}: the lock owns this stylesheet but the target is absent; reconcile the missing integration explicitly rather than recreating it`,
      );
      hasConflict = true;
    }
    const ids = new Set([...existingBodies.keys(), ...desiredById.keys()]);
    const effective: ManagedBlockInput[] = [];
    const outcomeBlocks: (typeof cssOutcomes)[number]["blocks"] = [];
    for (const blockId of [...ids].sort()) {
      const local = existingBodies.get(blockId) ?? null;
      const incomingBody = desiredById.get(blockId) ?? null;
      const allRecord = allLockByBlock.get(blockId);
      if (allRecord !== undefined && retiredOwners.has(allRecord.owner)) {
        if (local !== null) effective.push({ id: blockId, body: local });
        continue;
      }
      const record = lockByBlock.get(blockId);
      const tokensOwned = integrationOwnsTokens(blockId);
      if (tokensOwned && !registryProvidesTokens) {
        // The registry does not provide tokens: the integration-owned foundation
        // layer is preserved byte-for-byte, whether or not it was customized.
        effective.push({
          id: blockId,
          body: local ?? incomingBody ?? TOKENS_BODY,
        });
        continue;
      }
      // When the registry starts providing `tokens`, a clean, integration-owned
      // foundation layer is adopted with the canonical foundation body as its
      // legitimate base, so an identical transition is a no_change/update and a
      // customized foundation layer still conflicts under the original policy.
      const adoptFoundation = tokensOwned && registryProvidesTokens;
      const adoptMeta = cssMeta.get(cssPath)?.get(blockId);
      const classification = classifyCssBlocks([
        {
          id: blockId,
          owner: adoptFoundation
            ? (adoptMeta?.owner ?? null)
            : (record?.owner ?? null),
          baseHash: adoptFoundation
            ? (hashBytes(utf8(TOKENS_BODY)) as string)
            : (record?.baseHash ?? null),
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
        version: meta?.version ?? itemVersion(registry, owner) ?? "0.0.0",
        baseHash,
      });
    }
    const composed = composeManagedCss(existing, effective);
    if (!composed.ok) return fail(composed.issues);
    if (composed.value !== existing) {
      stylesheetPlan.set(cssPath, composed.value);
    }
    effectiveCss.set(cssPath, composed.value);
    cssOutcomes.push({ path: cssPath, blocks: outcomeBlocks });
  }

  // ---- Minimal initialization prerequisites (themes/app stylesheets) ------
  for (const [logicalPath, label] of [
    [derived.themesCss, "themes"],
    [derived.appCss, "app"],
  ] as const) {
    const state = observeText(snapshot, logicalPath);
    if (state.status === "conflict") {
      diagnostics.push(`stylesheet conflict: ${state.reason}`);
      hasConflict = true;
      continue;
    }
    if (state.status === "absent") {
      diagnostics.push(
        `initialization creates absent empty ${label} stylesheet ${logicalPath}`,
      );
      stylesheetPlan.set(logicalPath, "");
      effectiveCss.set(logicalPath, "");
    } else {
      effectiveCss.set(logicalPath, state.text);
    }
  }

  // ---- Root export region -------------------------------------------------
  const rootExports = derived.rootExports;
  let plannedExports: string | null = null;
  let finalExports = "";
  let observedExportDeclarations: ExportDeclaration[] = [];
  const exportsState = observeText(snapshot, rootExports);
  if (exportsState.status === "conflict") {
    diagnostics.push(`export conflict: ${exportsState.reason}`);
    hasConflict = true;
  } else {
    const existing = exportsState.status === "file" ? exportsState.text : "";
    finalExports = existing;
    const exportsIntegration = (lock?.integrations ?? []).find(
      (entry) => entry.kind === "exports" && entry.path === rootExports,
    );
    if (exportsIntegration !== undefined && exportsState.status === "absent") {
      diagnostics.push(
        `export conflict at ${rootExports}: the lock owns this export region but the target is absent; reconcile the missing integration explicitly rather than recreating it`,
      );
      hasConflict = true;
    }
    const parsedRegion = parseExportRegion(rootExports, existing);
    if (!parsedRegion.ok) {
      diagnostics.push(...parsedRegion.issues.map((entry) => entry.message));
      hasConflict = true;
    } else {
      const region = parsedRegion.value.region;
      const observedRegionContent =
        region === null
          ? ""
          : existing.slice(region.contentStart, region.contentEnd);
      if (region !== null) {
        observedExportDeclarations = parseGeneratedDeclarations(
          observedRegionContent,
        );
      }
      // The owned region is customized only when its own content differs from
      // the recorded region baseline; application edits outside the markers
      // never mark the region customized.
      const regionCustomized =
        exportsIntegration !== undefined &&
        (hashBytes(utf8(observedRegionContent)) as string) !==
          exportsIntegration.baseline;
      if (region !== null && exportsIntegration === undefined) {
        diagnostics.push(
          `export conflict at ${rootExports}: a managed export region is present that the lock does not own; markers alone do not confer ownership`,
        );
        hasConflict = true;
      }
      const patched = patchExportRegion(
        rootExports,
        existing,
        exportDeclarations,
      );
      if (!patched.ok) {
        diagnostics.push(...patched.issues.map((entry) => entry.message));
        hasConflict = true;
      } else if (
        exportsIntegration !== undefined &&
        regionCustomized &&
        patched.value !== existing
      ) {
        diagnostics.push(
          `export conflict at ${rootExports}: the owned export region does not match its canonical baseline and incoming declarations would change it`,
        );
        hasConflict = true;
      } else if (patched.value !== existing) {
        plannedExports = patched.value;
        finalExports = patched.value;
      }
    }
  }

  // ---- Layout imports -----------------------------------------------------
  let plannedLayout: string | null = null;
  let finalLayout = "";
  const layoutState = observeText(snapshot, config.layoutFile);
  if (layoutState.status === "conflict") {
    diagnostics.push(`layout conflict: ${layoutState.reason}`);
    hasConflict = true;
  } else {
    const existing = layoutState.status === "file" ? layoutState.text : "";
    finalLayout = existing;
    const layoutIntegration = (lock?.integrations ?? []).find(
      (entry) => entry.kind === "layout" && entry.path === config.layoutFile,
    );
    if (layoutIntegration !== undefined && layoutState.status === "absent") {
      diagnostics.push(
        `layout conflict at ${config.layoutFile}: the lock owns this layout integration but the target is absent; reconcile the missing integration explicitly rather than recreating it`,
      );
      hasConflict = true;
    }
    const specifiers = [derived.kitCss, derived.themesCss, derived.appCss].map(
      (target) => ({
        specifier: relativeSpecifier(config.layoutFile, target),
      }),
    );
    const patched = patchLayoutImports(existing, specifiers);
    if (!patched.ok) {
      diagnostics.push(...patched.issues.map((entry) => entry.message));
      hasConflict = true;
    } else if (patched.value !== existing) {
      plannedLayout = patched.value;
      finalLayout = patched.value;
    }
  }

  const desiredConfig: KitConfig = {
    ...config,
    requested: desired.requested,
  };

  // ---- Conservative compatibility cohorts (S059) --------------------------
  // Effective export-surface comparison (RCLD03-R4-2): an owner's export member
  // participates in its compatibility unit, and an actual declaration change is
  // proven from the observed region rather than item-version inequality.
  const exportOwnerByTarget = new Map<string, string>();
  const incomingByOwner = new Map<string, ExportDeclaration[]>();
  for (const id of desired.order) {
    const item = itemById(registry, id);
    if (item === undefined) continue;
    for (const file of item.files) {
      if (file.blockId !== null) continue;
      const target = file.target.startsWith(".")
        ? file.target
        : `./${file.target}`;
      if (!exportOwnerByTarget.has(target)) exportOwnerByTarget.set(target, id);
    }
    incomingByOwner.set(
      id,
      item.manifest.exports.map((entry) => ({
        name: entry.name,
        target: entry.target.startsWith(".")
          ? entry.target
          : `./${entry.target}`,
        kind: entry.kind,
      })),
    );
  }
  const observedByOwner = new Map<string, ExportDeclaration[]>();
  for (const declaration of observedExportDeclarations) {
    const owner = exportOwnerByTarget.get(declaration.target);
    if (owner === undefined) continue;
    const list = observedByOwner.get(owner) ?? [];
    list.push(declaration);
    observedByOwner.set(owner, list);
  }
  const exportMembers: CohortMember[] = [];
  const exportApiChanged = new Set<string>();
  for (const id of desired.order) {
    if (retiredOwners.has(id)) continue;
    const incoming = incomingByOwner.get(id) ?? [];
    const observed = observedByOwner.get(id) ?? [];
    const incomingKeys = [
      ...new Set(incoming.map(exportDeclarationKey)),
    ].sort();
    const observedKeys = [
      ...new Set(observed.map(exportDeclarationKey)),
    ].sort();
    const equal =
      incomingKeys.length === observedKeys.length &&
      incomingKeys.every((key, index) => key === observedKeys[index]);
    if (equal) {
      exportMembers.push({ owner: id, disposition: "no_change" });
      continue;
    }
    const disposition: OwnershipDisposition =
      observed.length === 0 ? "create" : "update";
    exportMembers.push({ owner: id, disposition });
    exportApiChanged.add(id);
  }

  const cohortMembers: CohortMember[] = [
    ...sourcePlan.changes
      .filter((change) => !retiredOwners.has(change.owner))
      .map((change) => ({
        owner: change.owner,
        disposition: change.disposition,
      })),
    ...sourcePlan.conflicts
      .filter((conflict) => !retiredOwners.has(conflict.owner ?? ""))
      .map((conflict) => ({
        owner: conflict.owner ?? conflict.path,
        disposition: conflict.disposition,
      })),
    ...cssMembers.filter((member) => !retiredOwners.has(member.owner)),
    ...exportMembers.filter((member) => !retiredOwners.has(member.owner)),
  ];
  const exportedApiChanged = exportApiChanged;
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

  // ---- Planned writes and truthful lock projection ------------------------
  const writes: PlannedWrite[] = [];
  let projectedLock: KitLock | null = lock;
  if (!hasConflict) {
    const configJson = `${JSON.stringify(desiredConfig, null, 2)}\n`;
    if (kitJsonState.status !== "file" || kitJsonState.text !== configJson) {
      writes.push({
        operation: "create",
        path: kitJsonPath,
        bytes: utf8(configJson),
      });
    }
    for (const change of sourcePlan.changes) {
      if (!change.producesBytes) continue;
      const meta = sourceMeta.get(change.path);
      if (meta === undefined) continue;
      writes.push({
        operation: "update",
        path: change.path,
        bytes: meta.bytes,
      });
    }
    for (const [cssPath, text] of stylesheetPlan) {
      const prior = observeText(snapshot, cssPath);
      writes.push({
        operation: prior.status === "absent" ? "create" : "update",
        path: cssPath,
        bytes: utf8(text),
      });
    }
    if (plannedExports !== null) {
      writes.push({
        operation: exportsState.status === "absent" ? "create" : "update",
        path: rootExports,
        bytes: utf8(plannedExports),
      });
    }
    if (plannedLayout !== null) {
      writes.push({
        operation: layoutState.status === "absent" ? "create" : "update",
        path: config.layoutFile,
        bytes: utf8(plannedLayout),
      });
    }

    const integrationBaseline = (
      prior: LockIntegration | undefined,
      wrote: boolean,
      finalText: string,
    ): LockIntegration["baseline"] =>
      wrote
        ? (hashBytes(utf8(finalText)) as string)
        : (prior?.baseline ?? (hashBytes(utf8(finalText)) as string));
    const priorIntegration = (kind: LockIntegration["kind"], p: string) =>
      (lock?.integrations ?? []).find(
        (entry) => entry.kind === kind && entry.path === p,
      );
    const integrations: LockIntegration[] = [
      {
        kind: "layout" as const,
        path: config.layoutFile,
        baseline: integrationBaseline(
          priorIntegration("layout", config.layoutFile),
          plannedLayout !== null,
          finalLayout,
        ),
        contract: "layout-v1",
      },
      {
        kind: "stylesheet" as const,
        path: kitCssPath,
        baseline: integrationBaseline(
          priorIntegration("stylesheet", kitCssPath),
          stylesheetPlan.has(kitCssPath),
          effectiveCss.get(kitCssPath) ?? "",
        ),
        contract: "stylesheet-v1",
      },
      {
        kind: "exports" as const,
        path: rootExports,
        baseline: integrationBaseline(
          priorIntegration("exports", rootExports),
          plannedExports !== null,
          exportRegionContent(rootExports, finalExports) ?? "",
        ),
        contract: "exports-v1",
      },
    ].sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );

    const built = buildLockProjection({
      items: desired.items.map((entry) => ({
        id: entry.id,
        version: itemVersion(registry, entry.id) ?? "0.0.0",
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
      integrations,
      registryVersion,
      registryHash,
      configHash: hashBytes(utf8(configJson)) as string,
      toolVersion: INITIAL_TOOL_VERSION,
    });
    const validated = parseKitLock(built.lock, lockPath, {
      stateDir: joinLogical(config.uiDir, "_kit"),
      uiDir: config.uiDir,
      stylesDir: config.stylesDir,
    });
    if (!validated.ok) return fail(validated.issues);
    projectedLock = validated.value;
    const lockJson = `${JSON.stringify(projectedLock, null, 2)}\n`;
    if (lockState.status !== "file" || lockState.text !== lockJson) {
      writes.push({
        operation: lockState.status === "absent" ? "create" : "update",
        path: lockPath,
        bytes: utf8(lockJson),
      });
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
    dependencyState,
    dependencyIssues,
    sourcePlan,
    writes: hasConflict ? [] : writes,
    lock: projectedLock,
    diagnostics: diagnostics.sort(),
  });
}

function decodeText(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(
      bytes,
    );
  } catch {
    return null;
  }
}

function hasPackageManifest(root: string): boolean {
  return readJsonObject(path.join(root, "package.json")).kind !== "absent";
}

function manifestDigest(registry: RegistrySnapshot, id: string): string {
  const item = itemById(registry, id);
  if (item === undefined) return "0".repeat(64);
  const asset = registry.assets.find(
    (entry) => entry.path === item.manifestPath,
  );
  return asset?.digest ?? "0".repeat(64);
}
