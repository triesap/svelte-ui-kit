/**
 * Complete projected-batch coherence (RCLD04-R2-1/R2-2).
 *
 * The guarded boundary must never publish a lock whose mapping, configuration
 * identity, integration roles or owned inventory disagrees with the batch that
 * is actually about to be applied. Validating the lock's JSON shape and roles
 * in isolation is not enough: a composed plan could carry a config write that
 * changes the effective mapping while the lock still describes the old
 * default-mapped integration, or drop the planned layout write while the lock
 * still claims a layout integration. Either would leave an installed project
 * whose published lock lies about the files on disk.
 *
 * This module derives the *effective projected* configuration, target results
 * and unchanged captured evidence from the captured planning authority (never
 * a live recapture), then validates the final lock against that projected state
 * before any coordination or write:
 *
 * - a projected config write must be a valid strict configuration whose mapping
 *   matches the declared plan roots, and its exact bytes must match the lock's
 *   recorded `configHash`;
 * - the final lock must satisfy its schema/roles under the projected mapping;
 * - every lock integration, owned file and CSS block must exist in the projected
 *   tree (a created/updated target or unchanged captured file evidence);
 * - a projection that retires a required integration or owned record is refused
 *   as incomplete authority rather than silently accepted.
 *
 * Pure data. No filesystem observation, no coordination, no writes.
 */
import {
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
} from "../project/config.js";
import { issue, type ModelIssue } from "../registry/errors.js";
import { sha256Hex } from "./digest.js";
import type { KitLock } from "./lock.js";

/** One projected target result: `retire` means the path is absent afterwards. */
export interface ProjectedTarget {
  readonly path: string;
  readonly operation: "create" | "update" | "retire";
  readonly bytes: Uint8Array;
}

/** One unchanged captured read-only evidence entry. */
export interface ProjectedEvidence {
  readonly path: string;
  readonly kind: "file" | "absent";
}

export interface ProjectedBatch {
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly targets: readonly ProjectedTarget[];
  readonly evidence: readonly ProjectedEvidence[];
}

export interface ProjectedConfig {
  /** The effective mapping used to validate the final lock. */
  readonly config: KitConfig;
  /**
   * The exact projected config bytes when a config write is part of the batch;
   * `null` when the batch leaves the installed configuration unchanged.
   */
  readonly bytes: Uint8Array | null;
  readonly issues: readonly ModelIssue[];
}

const HEX64 = /^[0-9a-f]{64}$/;

/** The reserved config logical path for a projected state directory. */
export function projectedConfigPath(stateDir: string): string {
  return `${stateDir.replace(/\/+$/, "")}/kit.json`;
}

/**
 * Derive the effective projected configuration. When the batch writes
 * `${stateDir}/kit.json`, that exact write is the projected configuration and
 * must parse to a strict config whose mapping matches the declared roots; a
 * malformed, unknown-field or mapping-inconsistent projection is a typed
 * refusal. When no config write exists, the planner's declared mapping is the
 * effective projected mapping.
 */
export function resolveProjectedConfig(batch: ProjectedBatch): ProjectedConfig {
  const configPath = projectedConfigPath(batch.stateDir);
  const fallback: KitConfig = {
    schemaVersion: 1,
    toolVersion: "0.1.0",
    registry: "builtin",
    uiDir: batch.uiDir,
    stylesDir: batch.stylesDir,
    layoutFile: batch.layoutFile,
    requested: [],
  };
  const target = batch.targets.find(
    (entry) => entry.path.toLowerCase() === configPath.toLowerCase(),
  );
  if (target === undefined) {
    return { config: fallback, bytes: null, issues: [] };
  }
  if (target.operation === "retire") {
    return {
      config: fallback,
      bytes: null,
      issues: [
        issue(
          "PROJECTED_CONFIG_MISSING",
          "the projected batch retires the effective configuration; a guarded apply must leave a valid installed configuration",
          configPath,
        ),
      ],
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(target.bytes).toString("utf8"));
  } catch (error) {
    return {
      config: fallback,
      bytes: target.bytes,
      issues: [
        issue(
          "PROJECTED_CONFIG_INVALID",
          `the projected configuration is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
          configPath,
        ),
      ],
    };
  }
  const validated = parseKitConfig(parsed, configPath);
  if (!validated.ok) {
    return { config: fallback, bytes: target.bytes, issues: validated.issues };
  }
  const issues: ModelIssue[] = [];
  const mapping: readonly (readonly [string, string, string])[] = [
    ["uiDir", validated.value.uiDir, batch.uiDir],
    ["stylesDir", validated.value.stylesDir, batch.stylesDir],
    ["layoutFile", validated.value.layoutFile, batch.layoutFile],
  ];
  for (const [field, projected, declared] of mapping) {
    if (projected !== declared) {
      issues.push(
        issue(
          "PROJECTED_CONFIG_MISMATCH",
          `the projected configuration ${field} ${JSON.stringify(projected)} does not match the planned root ${JSON.stringify(declared)}`,
          configPath,
        ),
      );
    }
  }
  return { config: validated.value, bytes: target.bytes, issues };
}

/**
 * Validate the final lock against the projected batch. Returns every
 * inconsistency as a typed issue; an empty result means the lock truthfully
 * describes the projected tree. The caller still validates the lock's own
 * schema/roles with `parseKitLock` under the projected mapping.
 */
export function validateProjectedLock(
  batch: ProjectedBatch,
  lock: KitLock,
  projected: ProjectedConfig,
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const derived = deriveKitPaths(projected.config);
  if (derived.stateDir !== batch.stateDir) {
    issues.push(
      issue(
        "PROJECTED_CONFIG_MISMATCH",
        `the projected configuration derives state directory ${JSON.stringify(derived.stateDir)} rather than the planned ${JSON.stringify(batch.stateDir)}`,
        projectedConfigPath(batch.stateDir),
      ),
    );
  }

  // The lock's config identity must be the exact projected configuration bytes.
  if (projected.bytes !== null) {
    if (sha256Hex(projected.bytes) !== lock.configHash) {
      issues.push(
        issue(
          "PROJECTED_CONFIG_HASH_MISMATCH",
          "the final lock configHash does not match the projected configuration bytes",
          projectedConfigPath(batch.stateDir),
        ),
      );
    }
  }

  // Existence in the projected tree. Evidence is applied first, then target
  // results override it (a planned create/update exists; a retire is absent).
  const present = new Set<string>();
  const record = (logical: string, exists: boolean): void => {
    const folded = logical.toLowerCase();
    if (exists) present.add(folded);
    else present.delete(folded);
  };
  for (const evidence of batch.evidence) {
    record(evidence.path, evidence.kind === "file");
  }
  for (const target of batch.targets) {
    record(target.path, target.operation !== "retire");
  }

  const requirePresent = (
    logical: string,
    code: string,
    label: string,
  ): void => {
    if (!present.has(logical.toLowerCase())) {
      issues.push(
        issue(
          code,
          `${label} ${JSON.stringify(logical)} is absent from the projected tree; the published lock would describe a file that does not exist`,
          logical,
        ),
      );
    }
  };

  for (const integration of lock.integrations) {
    requirePresent(
      integration.path,
      "PROJECTED_INTEGRATION_MISSING",
      `${integration.kind} integration`,
    );
  }
  for (const file of lock.files) {
    requirePresent(file.path, "PROJECTED_OWNERSHIP_MISSING", "owned file");
  }
  for (const block of lock.cssBlocks) {
    requirePresent(
      block.path,
      "PROJECTED_OWNERSHIP_MISSING",
      "managed CSS block",
    );
  }
  return issues;
}

/** Stable 64-hex guard reused by the caller for projected config identity. */
export function isProjectedDigest(value: unknown): value is string {
  return typeof value === "string" && HEX64.test(value);
}
