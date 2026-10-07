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
import path from "node:path";

import {
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
} from "../project/config.js";
import { issue, type ModelIssue } from "../registry/errors.js";
import { parseManagedCss } from "./css-parse.js";
import { FOUNDATION_TOKENS_CONTRACT } from "./css.js";
import { sha256Hex } from "./digest.js";
import {
  authoritativeExportKey,
  effectiveExportKey,
  parseGeneratedDeclarations,
  type BarrelExportAuthority,
  type ExportDeclaration,
} from "./exports.js";
import { parseExportRegion } from "./export-parse.js";
import type { KitLock } from "./lock.js";
import {
  isTokenMetadataPath,
  tokenMetadataPaths,
  parseThemeMetadata,
} from "../registry/theme.js";
import { parseSvelteLayout } from "./svelte-parse.js";

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

/**
 * The registry-declared export cohort a managed barrel is expected to carry,
 * carried from the original planning authority. The effective region is
 * compared against these full relationships (owner, source binding, public
 * name, type/value role and runtime target), never against a filename guess,
 * marker presence or candidate output.
 */
export type ExportAuthority = BarrelExportAuthority;

/** Versioned integration contracts proven from the effective projected bytes. */
export const LAYOUT_CONTRACT = "layout-v1";
export const EXPORTS_CONTRACT = "exports-v1";

export interface ProjectedBatch {
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly targets: readonly ProjectedTarget[];
  readonly evidence: readonly ProjectedEvidence[];
  /**
   * Exact captured pre-state bytes carried from the original immutable
   * composition. These are never the target results: the effective content is
   * resolved once by overlaying the planned target results over this captured
   * pre-state (create/update overrides, retire removes). Content coherence
   * never guesses: a stylesheet or configuration whose effective bytes are
   * absent is incomplete authority.
   */
  readonly content: readonly ProjectedContent[];
  /**
   * Registry-declared export cohorts carried from the original planning
   * authority, keyed by barrel path. A managed `exports-v1` integration's
   * effective region must still carry every declared export; marker presence
   * alone is not proof.
   */
  readonly exportAuthority?: readonly ExportAuthority[];
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
 * The single effective projected content authority for one batch. Effective
 * content is resolved once from the planned target results and the original
 * captured pre-state: a create/update result overrides captured bytes for the
 * same logical path, a retirement removes the content, and captured evidence
 * supplies bytes only for a genuinely unchanged file. Two entries that alias the
 * same path under ASCII case folding but are spelled differently cannot be
 * ordered, so they are an ambiguous authority and are refused before any effect.
 */
interface EffectiveContent {
  /** Folded logical paths present after the projected effects. */
  readonly present: ReadonlySet<string>;
  /** Folded logical path -> exact effective bytes (only for present paths). */
  readonly bytes: ReadonlyMap<string, Uint8Array>;
  readonly issues: readonly ModelIssue[];
}

function resolveEffectiveContent(batch: ProjectedBatch): EffectiveContent {
  const issues: ModelIssue[] = [];
  const captured = new Map<string, ProjectedContent>();
  for (const entry of batch.content) {
    const folded = entry.path.toLowerCase();
    const existing = captured.get(folded);
    if (existing !== undefined && existing.path !== entry.path) {
      issues.push(
        issue(
          "PROJECTED_CONTENT_CASE_ALIAS",
          `captured content ${JSON.stringify(existing.path)} and ${JSON.stringify(entry.path)} are ASCII case aliases with no single effective authority`,
          entry.path,
        ),
      );
      continue;
    }
    if (existing === undefined) captured.set(folded, entry);
  }
  const targets = new Map<string, ProjectedTarget>();
  for (const target of batch.targets) {
    const folded = target.path.toLowerCase();
    const existing = targets.get(folded);
    if (existing !== undefined) {
      issues.push(
        issue(
          "PROJECTED_TARGET_AMBIGUOUS",
          `projected targets ${JSON.stringify(existing.path)} and ${JSON.stringify(target.path)} alias the same logical path`,
          target.path,
        ),
      );
      continue;
    }
    targets.set(folded, target);
  }
  for (const [folded, target] of targets) {
    const cap = captured.get(folded);
    if (cap !== undefined && cap.path !== target.path) {
      issues.push(
        issue(
          "PROJECTED_CONTENT_CASE_ALIAS",
          `the projected target ${JSON.stringify(target.path)} and captured content ${JSON.stringify(cap.path)} are ASCII case aliases with no single effective authority`,
          target.path,
        ),
      );
    }
  }
  const present = new Set<string>();
  for (const entry of batch.evidence) {
    const folded = entry.path.toLowerCase();
    if (entry.kind === "file") present.add(folded);
    else present.delete(folded);
  }
  for (const [folded, target] of targets) {
    if (target.operation === "retire") present.delete(folded);
    else present.add(folded);
  }
  const bytes = new Map<string, Uint8Array>();
  for (const [folded, entry] of captured) {
    if (targets.has(folded) || !present.has(folded)) continue;
    bytes.set(folded, entry.bytes);
  }
  for (const [folded, target] of targets) {
    if (target.operation !== "retire" && present.has(folded)) {
      bytes.set(folded, target.bytes);
    }
  }
  return { present, bytes, issues };
}

/** The relative module specifier a layout uses to import one mapped stylesheet. */
function relativeSpecifier(from: string, to: string): string {
  const relative = path.posix.relative(path.posix.dirname(from), to);
  return relative.startsWith(".") ? relative : `./${relative}`;
}

/**
 * Prove an approved `layout-v1` integration from its effective bytes.
 *
 * The contract is semantic, not byte equality with upstream: the layout must be
 * a parseable Svelte component that integrates the three mapped stylesheet
 * imports (kit, then themes, then app) and still renders its child content. A
 * comment-only or otherwise dis-integrated replacement cannot claim the owned
 * integration merely because the path exists. Customized rendering, unmanaged
 * markup and customized import spellings that still map to the approved
 * stylesheets are preserved.
 */
function validateLayoutIntegration(
  layoutPath: string,
  bytes: Uint8Array,
  config: KitConfig,
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const text = decodeUtf8(bytes);
  if (text === null) {
    return [
      issue(
        "PROJECTED_LAYOUT_INVALID",
        `the projected layout ${JSON.stringify(layoutPath)} is not valid UTF-8`,
        layoutPath,
      ),
    ];
  }
  const parsed = parseSvelteLayout(text);
  if (!parsed.ok) {
    return [
      issue(
        "PROJECTED_LAYOUT_INVALID",
        `the projected layout ${JSON.stringify(layoutPath)} is not a parseable Svelte component: ${parsed.issues[0]?.message ?? "unknown parse failure"}`,
        layoutPath,
      ),
    ];
  }
  const derived = deriveKitPaths(config);
  const desired = [derived.kitCss, derived.themesCss, derived.appCss].map(
    (target) => relativeSpecifier(config.layoutFile, target),
  );
  const imports = parsed.value.instanceImports;
  const indices: number[] = [];
  for (const specifier of desired) {
    const index = imports.indexOf(specifier);
    if (index === -1) {
      issues.push(
        issue(
          "PROJECTED_LAYOUT_INTEGRATION_MISSING",
          `the projected layout ${JSON.stringify(layoutPath)} declares the ${LAYOUT_CONTRACT} contract but does not integrate the approved stylesheet import ${JSON.stringify(specifier)}`,
          layoutPath,
        ),
      );
      continue;
    }
    indices.push(index);
  }
  if (
    indices.some(
      (index, position) =>
        position > 0 && index < (indices[position - 1] as number),
    )
  ) {
    issues.push(
      issue(
        "PROJECTED_LAYOUT_ORDER",
        `the projected layout ${JSON.stringify(layoutPath)} imports the approved stylesheets out of the required kit/themes/app order`,
        layoutPath,
      ),
    );
  }
  if (!parsed.value.rendersChildren) {
    issues.push(
      issue(
        "PROJECTED_LAYOUT_RENDERING_MISSING",
        `the projected layout ${JSON.stringify(layoutPath)} declares the ${LAYOUT_CONTRACT} contract but does not render its child content`,
        layoutPath,
      ),
    );
  }
  return issues;
}

/**
 * Prove an approved `exports-v1` integration from its effective bytes. The
 * barrel must be a valid managed TypeScript module that still carries its
 * managed export region. Valid TypeScript alone is not proof of the managed
 * integration, and an invalid replacement cannot claim it through path
 * presence.
 */
/** One stable comparability key for a managed export declaration. */
function exportKey(declaration: ExportDeclaration): string {
  return effectiveExportKey(declaration);
}

function validateExportsIntegration(
  exportsPath: string,
  bytes: Uint8Array,
  authority: ExportAuthority | null,
): ModelIssue[] {
  const text = decodeUtf8(bytes);
  if (text === null) {
    return [
      issue(
        "PROJECTED_EXPORTS_INVALID",
        `the projected exports barrel ${JSON.stringify(exportsPath)} is not valid UTF-8`,
        exportsPath,
      ),
    ];
  }
  const parsed = parseExportRegion(exportsPath, text);
  if (!parsed.ok) {
    return [
      issue(
        "PROJECTED_EXPORTS_INVALID",
        `the projected exports barrel ${JSON.stringify(exportsPath)} is not a valid managed TypeScript module: ${parsed.issues[0]?.message ?? "unknown parse failure"}`,
        exportsPath,
      ),
    ];
  }
  const region = parsed.value.region;
  if (region === null) {
    return [
      issue(
        "PROJECTED_EXPORTS_INTEGRATION_MISSING",
        `the projected exports barrel ${JSON.stringify(exportsPath)} declares the ${EXPORTS_CONTRACT} contract but has no managed export region`,
        exportsPath,
      ),
    ];
  }
  // The `exports-v1` integration is proven from the registry-declared
  // relationship authority, never from marker presence or a recorded baseline
  // byte match. Without independent authority the effective region cannot be
  // certified at all, so a missing entry is a typed refusal, not a silent pass.
  if (authority === null || authority.declarations === undefined) {
    return [
      issue(
        "PROJECTED_EXPORTS_AUTHORITY_MISSING",
        `the projected exports barrel ${JSON.stringify(exportsPath)} has no independent registry-declared export authority; marker presence is not cohort proof`,
        exportsPath,
      ),
    ];
  }
  // The effective region must still carry every declared relationship: a
  // replacement barrel that silently drops a declared export, retargets one to
  // a different module, changes the original source binding or changes a
  // value/type kind cannot claim the contract. Whitespace and application-owned
  // bytes outside the markers are never compared, so a customized-but-equivalent
  // region and app exports stay legitimate.
  const effectiveRegion = text.slice(region.contentStart, region.contentEnd);
  const effective = new Set(
    parseGeneratedDeclarations(effectiveRegion).map(exportKey),
  );
  const expected = new Set(authority.declarations.map(authoritativeExportKey));
  const missing = [...expected].filter((key) => !effective.has(key));
  if (missing.length > 0) {
    const names = authority.declarations
      .filter((declaration) =>
        missing.includes(authoritativeExportKey(declaration)),
      )
      .map((declaration) => declaration.name);
    return [
      issue(
        "PROJECTED_EXPORTS_COHORT_MISSING",
        `the effective managed export region of ${JSON.stringify(exportsPath)} omits, retargets or rebinds ${missing.length} declared export relationship(s): ${[...new Set(names)].join(", ")}`,
        exportsPath,
      ),
    ];
  }
  return [];
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

  // Resolve the single effective content authority first: target results
  // override the captured pre-state and a retirement removes content. Every
  // content-dependent check below reads this map, never the raw content list.
  const effective = resolveEffectiveContent(batch);
  issues.push(...effective.issues);

  const requirePresent = (
    logical: string,
    code: string,
    label: string,
  ): void => {
    if (!effective.present.has(logical.toLowerCase())) {
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
    if (!effective.present.has(folded)) return null;
    const bytes = effective.bytes.get(folded);
    if (bytes === undefined) {
      issues.push(
        issue(
          "PROJECTED_CONTENT_MISSING",
          `${label} ${JSON.stringify(logical)} is present in the projected tree but its exact effective content was not carried from the original capture; path presence alone is not contract proof`,
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
    // A `layout-v1` integration owns the mapped style integration and child
    // rendering; a `foundation-tokens-v1` stylesheet owns the foundation
    // `tokens` block. Contract proof is read from the effective projected
    // content, so a dis-integrated replacement is refused before any effect.
    if (
      integration.kind === "layout" &&
      integration.contract === LAYOUT_CONTRACT
    ) {
      const bytes = requireContent(integration.path, "layout integration");
      if (bytes !== null) {
        issues.push(
          ...validateLayoutIntegration(integration.path, bytes, config),
        );
      }
    }
    if (
      integration.kind === "exports" &&
      integration.contract === EXPORTS_CONTRACT
    ) {
      const bytes = requireContent(integration.path, "exports integration");
      if (bytes !== null) {
        const authority = (batch.exportAuthority ?? []).find((entry) =>
          sameLogical(entry.path, integration.path),
        );
        issues.push(
          ...validateExportsIntegration(
            integration.path,
            bytes,
            authority ?? null,
          ),
        );
      }
    }
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
  if (
    lock.files.some((file) => isTokenMetadataPath(file.path, batch.stateDir))
  ) {
    const documents: unknown[] = [];
    for (const metadataPath of tokenMetadataPaths(batch.stateDir)) {
      const owned = lock.files.some(
        (file) =>
          file.path === metadataPath &&
          file.owner === "tokens" &&
          file.cohort === "tokens",
      );
      if (!owned)
        issues.push(
          issue(
            "PROJECTED_METADATA_INCOMPLETE",
            "Token metadata must be owned as one complete tokens cohort.",
            metadataPath,
          ),
        );
      const bytes = requireContent(metadataPath, "token metadata");
      try {
        documents.push(
          bytes === null
            ? undefined
            : JSON.parse(
                new TextDecoder("utf-8", { fatal: true }).decode(bytes),
              ),
        );
      } catch {
        documents.push(undefined);
        issues.push(
          issue(
            "PROJECTED_METADATA_INVALID",
            "Token metadata must be valid UTF-8 JSON.",
            metadataPath,
          ),
        );
      }
    }
    const parsed = parseThemeMetadata({
      tokenContract: documents[0],
      componentCustomization: documents[1],
      themeIntegration: documents[2],
    });
    if (!parsed.ok) issues.push(...parsed.issues);
    else if (parsed.value.themeIntegration.stylesheet !== "kit.css")
      issues.push(
        issue(
          "PROJECTED_METADATA_STYLESHEET",
          "Token metadata must describe the mapped kit.css stylesheet.",
          tokenMetadataPaths(batch.stateDir)[2],
        ),
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
