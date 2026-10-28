/** Validated application configurations; the v1 public parser stays independent. */
import { parseKitConfig, type KitConfig } from "./config.js";
import { parseTargetConfig, type TargetConfig } from "./target-config.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { TARGET_CONFIG_FILES } from "./target-config.js";
import type { SchemaAuthority } from "../registry/schema.js";
export type AppTargetConfig = Exclude<
  TargetConfig,
  { readonly target: "svelte-library" }
>;
export type AppProjectConfig = KitConfig | AppTargetConfig;
export function isAppTargetConfig(
  config: AppProjectConfig,
): config is AppTargetConfig {
  return config.schemaVersion === 2 && "target" in config;
}
export function appTarget(config: AppProjectConfig): "sveltekit" | "astro" {
  return isAppTargetConfig(config) ? config.target : "sveltekit";
}
export function appLockIdentity(
  config: AppProjectConfig,
): { schemaVersion: 1 } | { schemaVersion: 2; target: "sveltekit" | "astro" } {
  return isAppTargetConfig(config)
    ? { schemaVersion: 2, target: config.target }
    : { schemaVersion: 1 };
}
export function targetInputPaths(config: AppProjectConfig): readonly string[] {
  return isAppTargetConfig(config)
    ? ["package.json", ...TARGET_CONFIG_FILES]
    : [];
}
export function appPlanIdentity(
  config: AppProjectConfig,
):
  | { configSchema?: never; target?: never }
  | { configSchema: 2; target: "sveltekit" | "astro" } {
  return isAppTargetConfig(config)
    ? { configSchema: 2, target: config.target }
    : {};
}

export function appLockContext(config: AppProjectConfig): {
  configSchema: 1 | 2;
  target: "sveltekit" | "astro";
} {
  return {
    configSchema: isAppTargetConfig(config) ? 2 : 1,
    target: appTarget(config),
  };
}
export function parseAppConfig(
  value: unknown,
  locator = "kit.json",
  authority?: SchemaAuthority,
): ModelResult<AppProjectConfig> {
  if (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).schemaVersion === 2
  ) {
    const parsed = parseTargetConfig(value, locator, authority);
    if (!parsed.ok) return parsed;
    if (parsed.value.target === "svelte-library")
      return fail([
        issue(
          "TARGET_GENERATION_UNAVAILABLE",
          "Standalone library discovery is available; its generator is not enabled in this version.",
          locator,
        ),
      ]);
    return ok(parsed.value);
  }
  return parseKitConfig(value, locator, authority);
}
