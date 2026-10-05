/**
 * Complete projected-batch coherence (RCLD04-R2-1/R2-2).
 *
 * The guarded boundary must never publish a lock whose mapping, configuration
 * identity, requested roots, integration roles or owned inventory disagrees
 * with the batch that is actually about to be applied. Validating the lock's
 * JSON shape and roles in isolation is not enough: a composed plan could carry
 * a config write that changes the effective mapping while the lock still
 * describes the old default-mapped integration, drop the planned layout write
 * while the lock still claims a layout integration, or publish a lock whose
 * `configHash` is not the identity of any file that will exist. Either would
 * leave an installed project whose published lock lies about the files on disk.
 *
 * This module derives the *effective projected* configuration, requested roots
 * and content from the exact projected target results plus the original
 * captured read-only evidence that `composeApplyPlan` carried through (never a
 * live recapture and never a fabricated default), then validates the final lock
 * against that projected state before any coordination or write:
 *
 * - the effective projected configuration is the planned config write when one
 *   exists, otherwise the captured unchanged configuration file; a batch that
 *   leaves no configuration at all is incomplete authority and is refused;
 * - the projected configuration must be a valid strict configuration whose
 *   mapping matches the declared roots;
 * - the final lock must satisfy its schema/roles under the projected mapping;
 * - the lock `configHash` must be the exact projected configuration identity and
 *   the lock `requested` set must equal the projected configuration's roots;
 * - every lock integration, owned file and CSS block must exist in the projected
 *   tree, and every managed stylesheet integration/CSS block must be backed by
 *   the exact projected content that proves its contract (a `foundation-tokens-v1`
 *   stylesheet must contain the owned `tokens` block; every recorded block must
 *   be present in its projected stylesheet).
 *
 * Pure data. No filesystem observation, no coordination, no writes.
 */
import {
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
} from "../project/config.js";
import { issue, type ModelIssue } from "../registry/errors.js";
import { parseManagedCss } from "./css-parse.js";
import { FOUNDATION_TOKENS_CONTRACT } from "./css.js";
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

/** Exact projected bytes for one path that content coherence must inspect. */
export interface ProjectedContent {
  readonly path: string;
  readonly bytes: Uint8Array;
}

export interface ProjectedBatch {
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly targets: readonly ProjectedTarget[];
  readonly evidence: readonly ProjectedEvidence[];
  /**
   * Exact effective bytes carried from the original captured composition (or
   * the planned target result). Content coherence never guesses: a stylesheet
   * or configuration whose bytes are absent is incomplete authority.
   */
  readonly content: readonly ProjectedContent[];
}

export type ProjectedConfigState =
  "created" | "updated" | "unchanged" | "missing";

export interface ProjectedConfig {
  /** The effective mapping used to validate the final lock, or null on refusal. */
  readonly config: KitConfig | null;
  /** The exact effective projected configuration bytes, or null on refusal. */
  readonly bytes: Uint8Array | null;
  /** How the effective configuration is projected to exist. */
  readonly state: ProjectedConfigState;
  readonly issues: readonly ModelIssue[];
}

const HEX64 = /^[0-9a-f]{64}$/;

function sameLogical(left: string, right: string): boolean {
  return left.toLowerCase() === right.toLowerCase();
}

function compareCodeUnit(left: string, right: string): number {
  return left < right ? -1 : left > right ? 1 : 0;
}

function sameSorted(
  left: readonly string[],
  right: readonly string[],
): boolean {
  const a = [...left].sort(compareCodeUnit);
  const b = [...right].sort(compareCodeUnit);
  if (a.length !== b.length) return false;
  return a.every((entry, index) => entry === b[index]);
}

/** The reserved config logical path for a projected state directory. */
export function projectedConfigPath(stateDir: string): string {
  return `${stateDir.replace(/\/+$/, "")}/kit.json`;
}

function decodeUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder("utf-8", {
      fatal: true,
      ignoreBOM: true,
    }).decode(bytes);
  } catch {
    return null;
  }
}

/** The managed block ids present in one projected stylesheet, or null on error. */
export function managedBlockIds(
  bytes: Uint8Array,
): { readonly ids: ReadonlySet<string> } | { readonly invalid: true } {
  const text = decodeUtf8(bytes);
  if (text === null) return { invalid: true };
  const parsed = parseManagedCss(text);
  if (!parsed.ok) return { invalid: true };
  return { ids: new Set(parsed.value.blocks.map((block) => block.id)) };
}

/**
 * Derive the effective projected configuration. When the batch writes
 * `${stateDir}/kit.json`, that exact write is the projected configuration
 * (created/updated). Otherwise the original captured configuration content
 * carried through composition is the unchanged projected configuration. A
 * batch that leaves no configuration at all is incomplete authority: it is a
 * typed refusal, never a fabricated declaration-root fallback.
 */
export function resolveProjectedConfig(batch: ProjectedBatch): ProjectedConfig {
  const configPath = projectedConfigPath(batch.stateDir);
  const target = batch.targets.find((entry) =>
    sameLogical(entry.path, configPath),
  );
  if (target !== undefined && target.operation === "retire") {
    return {
      config: null,
      bytes: null,
      state: "missing",
      issues: [
        issue(
          "PROJECTED_CONFIG_MISSING",
          "the projected batch retires the effective configuration; a guarded apply must leave a valid installed configuration",
          configPath,
        ),
      ],
    };
  }
  const content = batch.content.find((entry) =>
    sameLogical(entry.path, configPath),
  );
  let bytes: Uint8Array | null = null;
  let state: ProjectedConfigState = "missing";
  if (target !== undefined) {
    bytes = target.bytes;
    state = target.operation === "create" ? "created" : "updated";
  } else if (content !== undefined) {
    bytes = content.bytes;
    state = "unchanged";
  }
  if (bytes === null) {
    return {
      config: null,
      bytes: null,
      state: "missing",
      issues: [
        issue(
          "PROJECTED_CONFIG_MISSING",
          "the projected batch leaves no installed configuration and carries no original captured configuration; refusing to fabricate defaults",
          configPath,
        ),
      ],
    };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(bytes).toString("utf8"));
  } catch (error) {
    return {
      config: null,
      bytes,
      state,
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
    return { config: null, bytes, state, issues: validated.issues };
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
  return { config: validated.value, bytes, state, issues };
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
  const config = projected.config;
  if (config === null || projected.bytes === null) return issues;
  const derived = deriveKitPaths(config);
  if (derived.stateDir !== batch.stateDir) {
    issues.push(
      issue(
        "PROJECTED_CONFIG_MISMATCH",
        `the projected configuration derives state directory ${JSON.stringify(derived.stateDir)} rather than the planned ${JSON.stringify(batch.stateDir)}`,
        projectedConfigPath(batch.stateDir),
      ),
    );
  }

  // The lock's config identity must be the exact projected configuration bytes,
  // whether that configuration is created, updated or unchanged.
  if (sha256Hex(projected.bytes) !== lock.configHash) {
    issues.push(
      issue(
        "PROJECTED_CONFIG_HASH_MISMATCH",
        "the final lock configHash does not match the effective projected configuration bytes",
        projectedConfigPath(batch.stateDir),
      ),
    );
  }

  // The lock's requested roots must equal the effective projected configuration
  // roots, so a config write that requests an item can never publish a lock that
  // silently drops or invents the request set.
  if (!sameSorted(lock.requested, config.requested)) {
    issues.push(
      issue(
        "PROJECTED_REQUESTED_MISMATCH",
        `the final lock requested ${JSON.stringify([...lock.requested].sort(compareCodeUnit))} does not match the projected configuration roots ${JSON.stringify([...config.requested].sort(compareCodeUnit))}`,
        projectedConfigPath(batch.stateDir),
      ),
    );
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
  const contentByPath = new Map<string, Uint8Array>();
  for (const entry of batch.content) {
    contentByPath.set(entry.path.toLowerCase(), entry.bytes);
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
  const requireContent = (
    logical: string,
    label: string,
  ): Uint8Array | null => {
    const folded = logical.toLowerCase();
    if (!present.has(folded)) return null;
    const bytes = contentByPath.get(folded);
    if (bytes === undefined) {
      issues.push(
        issue(
          "PROJECTED_CONTENT_MISSING",
          `${label} ${JSON.stringify(logical)} is present in the projected tree but its exact projected content was not carried from the original capture; path presence alone is not contract proof`,
          logical,
        ),
      );
      return null;
    }
    return bytes;
  };

  for (const integration of lock.integrations) {
    requirePresent(
      integration.path,
      "PROJECTED_INTEGRATION_MISSING",
      `${integration.kind} integration`,
    );
    // A `foundation-tokens-v1` stylesheet integration owns the minimal
    // foundation `tokens` block. The projected content must actually contain
    // that managed block; an aggregate or unmanaged file that omits it does not
    // satisfy the claimed contract.
    if (
      integration.kind === "stylesheet" &&
      integration.contract === FOUNDATION_TOKENS_CONTRACT
    ) {
      const bytes = requireContent(
        integration.path,
        "managed foundation stylesheet",
      );
      if (bytes !== null) {
        const managed = managedBlockIds(bytes);
        if ("invalid" in managed) {
          issues.push(
            issue(
              "PROJECTED_CSS_INVALID",
              `the projected ${JSON.stringify(integration.path)} is not a parseable managed stylesheet`,
              integration.path,
            ),
          );
        } else if (!managed.ids.has("tokens")) {
          issues.push(
            issue(
              "PROJECTED_FOUNDATION_MISSING",
              `the projected ${JSON.stringify(integration.path)} declares the ${FOUNDATION_TOKENS_CONTRACT} contract but contains no managed foundation tokens block`,
              integration.path,
            ),
          );
        }
      }
    }
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
    const bytes = requireContent(block.path, "managed CSS block");
    if (bytes === null) continue;
    const managed = managedBlockIds(bytes);
    if ("invalid" in managed) {
      issues.push(
        issue(
          "PROJECTED_CSS_INVALID",
          `the projected ${JSON.stringify(block.path)} is not a parseable managed stylesheet`,
          block.path,
        ),
      );
    } else if (!managed.ids.has(block.blockId)) {
      issues.push(
        issue(
          "PROJECTED_BLOCK_MISSING",
          `the lock owns block ${JSON.stringify(block.blockId)} in ${JSON.stringify(block.path)} but the projected stylesheet does not contain that managed block`,
          block.path,
        ),
      );
    }
  }
  return issues;
}

/** Stable 64-hex guard reused by the caller for projected config identity. */
export function isProjectedDigest(value: unknown): value is string {
  return typeof value === "string" && HEX64.test(value);
}
