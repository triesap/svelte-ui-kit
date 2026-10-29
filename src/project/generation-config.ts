/** Shared executable intent; legacy app APIs retain their independent types. */
import type { SchemaAuthority } from "../registry/schema.js";
import { parseKitConfig, type KitConfig } from "./config.js";
import {
  integrationFor,
  parseTargetConfig,
  TARGET_CONFIG_FILES,
  type TargetConfig,
  type TargetIntegration,
  type TargetKind,
} from "./target-config.js";
export type LibraryConfig = Extract<
  TargetConfig,
  { readonly target: "svelte-library" }
>;
export type GenerationConfig = KitConfig | TargetConfig;
export function isExplicitTargetConfig(
  config: GenerationConfig,
): config is TargetConfig {
  return config.schemaVersion === 2 && "target" in config;
}
export function isLibraryConfig(
  config: GenerationConfig,
): config is LibraryConfig {
  return isExplicitTargetConfig(config) && config.target === "svelte-library";
}
export function generationTarget(config: GenerationConfig): TargetKind {
  return isExplicitTargetConfig(config) ? config.target : "sveltekit";
}
export function integrationMapping(
  config: GenerationConfig,
): TargetIntegration {
  return isExplicitTargetConfig(config)
    ? integrationFor(config)
    : { kind: "layout", path: config.layoutFile, contract: "layout-v1" };
}
export function generationLockIdentity(
  config: GenerationConfig,
): { schemaVersion: 1 } | { schemaVersion: 2; target: TargetKind } {
  return isExplicitTargetConfig(config)
    ? { schemaVersion: 2, target: config.target }
    : { schemaVersion: 1 };
}
export function generationPlanIdentity(
  config: GenerationConfig,
):
  | { configSchema?: never; target?: never }
  | { configSchema: 2; target: TargetKind } {
  return isExplicitTargetConfig(config)
    ? { configSchema: 2, target: config.target }
    : {};
}
export function generationLockContext(config: GenerationConfig) {
  if (isLibraryConfig(config))
    return {
      configSchema: 2 as const,
      target: "svelte-library" as const,
      styleEntry: config.styleEntry,
    };
  if (isExplicitTargetConfig(config))
    return {
      configSchema: 2 as const,
      target: config.target,
      layoutFile: config.layoutFile,
    };
  return {
    configSchema: 1 as const,
    target: "sveltekit" as const,
    layoutFile: config.layoutFile,
  };
}
export function generationInputPaths(
  config: GenerationConfig,
): readonly string[] {
  return isExplicitTargetConfig(config)
    ? ["package.json", ...TARGET_CONFIG_FILES]
    : [];
}
export function parseGenerationConfig(
  value: unknown,
  locator = "kit.json",
  authority?: SchemaAuthority,
) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).schemaVersion === 2
    ? parseTargetConfig(value, locator, authority)
    : parseKitConfig(value, locator, authority);
}
/** Mapping names remain truthful: a library carries no layout field. */
export function generationFields(config: GenerationConfig) {
  if (isLibraryConfig(config))
    return {
      configSchema: 2 as const,
      target: "svelte-library" as const,
      styleEntry: config.styleEntry,
    };
  if (isExplicitTargetConfig(config))
    return {
      configSchema: 2 as const,
      target: config.target,
      layoutFile: config.layoutFile,
    };
  return { layoutFile: config.layoutFile };
}

export function initializationFields(config: GenerationConfig, source: string) {
  return isLibraryConfig(config)
    ? { config, styleEntry: config.styleEntry, styleSource: source }
    : { config, layoutFile: config.layoutFile, layoutSource: source };
}
