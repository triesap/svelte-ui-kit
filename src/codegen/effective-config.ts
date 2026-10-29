import {
  integrationMapping,
  type GenerationConfig as KitConfig,
} from "../project/generation-config.js";
/**
 * Effective mapping resolution (RCLD03-R8-1).
 *
 * A complete planning entry must reason about one *effective* mapping rather
 * than a supplied default. This module composes the captured selected-project
 * evidence (S035) with the bounded `_kit/kit.json` discovery (S037) into a
 * single immutable decision used by init/add/sync:
 *
 * - exactly one valid observed custom installation determines the mapping;
 * - a malformed, ambiguous, unsafe or location-mismatched discovery is
 *   reported as a typed resolution failure;
 * - with no explicit configuration, the supported SvelteKit routes mapping
 *   (detected statically) determines the layout, while the supplied UI/styles
 *   roots remain the user's desired configuration;
 * - a valid explicit configuration resolves the documented dynamic/
 *   unsupported mapping case without executing Svelte configuration, but never
 *   waives manifest/SvelteKit identity or manager-conflict checks.
 *
 * Resolution is read-only and uses only captured evidence. A missing
 * effective target is reported by the planner as an incomplete observation;
 * this module never reads live files to fill a gap. Identity failures are a
 * hard typed failure; a discovery failure resolves to a typed `issues` list so
 * add/sync can report a non-executable conflict while init refuses outright.
 */
import { DEFAULT_KIT_CONFIG, deriveKitPaths } from "../project/config.js";
import {
  generationTarget,
  isExplicitTargetConfig,
  parseGenerationConfig,
} from "../project/generation-config.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import type { ProjectSnapshot } from "./snapshot.js";
import { inspectTargetEvidence } from "./target-evidence.js";
import { targetIntegrationAdapter } from "./target-integration.js";

/** Where the resolved mapping came from. */
export type MappingProvenance = "explicit" | "detected" | "default";

export interface EffectiveConfig {
  /** The effective mapping plus the desired `requested` roots. */
  readonly config: import("../project/app-config.js").AppProjectConfig;
  /**
   * The `requested` roots recorded in an observed explicit installation, or the
   * supplied roots when there is none. Initialization writes this back so a
   * satisfied installation is not spuriously rewritten, while add/sync use the
   * supplied desired roots from `config`.
   */
  readonly observedRequested: readonly string[];
  readonly provenance: MappingProvenance;
  /** Package-relative explicit `_kit/kit.json` path, or `null` when default. */
  readonly configPath: string | null;
  /** Non-empty when the mapping could not be proven; no executable plan. */
  readonly issues: readonly ModelIssue[];
}
export type GenerationEffectiveConfig = Omit<EffectiveConfig, "config"> & {
  readonly config: KitConfig;
};

/**
 * Detection failure codes that prove identity but leave the SvelteKit routes
 * mapping unresolved. Only these may be superseded by a valid explicit
 * `kit.json`; a malformed manifest, a non-SvelteKit package, ambiguous
 * configuration files or an unsafe/unreadable config still fail.
 */
const MAPPING_ONLY_CODES: ReadonlySet<string> = new Set([
  "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
]);

/**
 * Resolve the effective mapping for `supplied`. Identity failures (manifest,
 * SvelteKit, manager) are a hard typed failure. A discovery failure returns an
 * `EffectiveConfig` whose `issues` are non-empty and whose fallback mapping must
 * never authorize an executable plan.
 */
export function resolveEffectiveConfig(
  snapshot: ProjectSnapshot,
  supplied: import("../project/app-config.js").AppProjectConfig,
): ModelResult<EffectiveConfig>;
export function resolveEffectiveConfig(
  snapshot: ProjectSnapshot,
  supplied: import("../project/generation-config.js").LibraryConfig,
): ModelResult<GenerationEffectiveConfig>;
export function resolveEffectiveConfig(
  snapshot: ProjectSnapshot,
  supplied: KitConfig,
): ModelResult<GenerationEffectiveConfig>;
export function resolveEffectiveConfig(
  snapshot: ProjectSnapshot,
  supplied: KitConfig,
): ModelResult<GenerationEffectiveConfig> {
  const environment = snapshot.environment;
  if (environment.catalogIssues.length > 0) {
    return fail([...environment.catalogIssues]);
  }
  if (environment.managerIssues.length > 0) {
    return fail([...environment.managerIssues]);
  }

  const suppliedConfig = parseGenerationConfig(supplied);
  if (!suppliedConfig.ok) return suppliedConfig;
  const targetInstallation = environment.kitConfig;
  const observed =
    targetInstallation.ok && targetInstallation.value.kind === "custom"
      ? targetInstallation.value
      : null;
  if (
    (observed && isExplicitTargetConfig(observed.config)) ||
    isExplicitTargetConfig(supplied)
  ) {
    const installed = observed?.config ?? supplied;
    if (
      !isExplicitTargetConfig(installed) ||
      (isExplicitTargetConfig(supplied) &&
        generationTarget(supplied) !== installed.target) ||
      integrationMapping(supplied).kind !== integrationMapping(installed).kind
    )
      return fail([
        issue(
          "PROJECT_TARGET_MISMATCH",
          "Explicit target roles cannot silently migrate or reinterpret an existing installation",
          "kit.json",
        ),
      ]);
    const target = inspectTargetEvidence(snapshot, installed);
    if (!target.ok) return target;
    const adapter = targetIntegrationAdapter(installed.target);
    if (!adapter.ok) return adapter;
    return ok({
      config: { ...installed, requested: [...supplied.requested] },
      observedRequested: installed.requested,
      provenance: "explicit",
      configPath:
        observed?.configPath ??
        `${deriveKitPaths(installed).stateDir}/kit.json`,
      issues: [],
    });
  }

  const project = environment.project;
  if (!project.ok) {
    const codes = project.issues.map((entry) => entry.code);
    const onlyMapping =
      codes.length > 0 && codes.every((code) => MAPPING_ONLY_CODES.has(code));
    if (!onlyMapping) return fail(project.issues);
  }

  // A supported detected layout, used as the fallback mapping when discovery
  // itself could not prove an explicit installation.
  const detectedLayout = project.ok ? project.value.layoutFile : null;
  const fallback: KitConfig = {
    ...supplied,
    layoutFile: detectedLayout ?? integrationMapping(supplied).path,
    requested: [...supplied.requested],
  };

  const discovered = environment.kitConfig;
  if (!discovered.ok) {
    return ok({
      config: fallback,
      observedRequested: fallback.requested,
      provenance: "default",
      configPath: null,
      issues: discovered.issues,
    });
  }
  if (discovered.value.kind === "custom") {
    // The observed installation is the authoritative mapping. The desired
    // `requested` roots stay the caller's for add/sync, while initialization
    // reuses the installed set so a clean replay is not rewritten.
    return ok({
      config: {
        ...discovered.value.config,
        requested: [...supplied.requested],
      },
      observedRequested: discovered.value.config.requested,
      provenance: "explicit",
      configPath: discovered.value.configPath,
      issues: [],
    });
  }

  // No explicit installation anywhere. The SvelteKit routes mapping is only
  // provable when detection succeeded; otherwise the user must create the
  // explicit configuration the original diagnostic already asks for.
  if (!project.ok) return fail(project.issues);
  return ok({
    config: fallback,
    observedRequested: fallback.requested,
    provenance:
      detectedLayout === DEFAULT_KIT_CONFIG.layoutFile ? "default" : "detected",
    configPath: null,
    issues: [],
  });
}
