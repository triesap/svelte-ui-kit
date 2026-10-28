/** Explicit v2 target intent. V1 remains an independent, unchanged format. */
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
  type KitConfig,
} from "./config.js";
import { deepFreeze } from "./immutable.js";
import {
  isSafeLogicalRelativePath,
  isSameOrBelow,
  pathsOverlap,
} from "./paths.js";
import { isSemVer } from "../registry/versions.js";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  validateWithSchema,
  type SchemaAuthority,
} from "../registry/schema.js";

export type TargetKind = "sveltekit" | "astro" | "svelte-library";
interface TargetCommon extends Omit<KitConfig, "schemaVersion" | "layoutFile"> {
  readonly schemaVersion: 2;
}
export type TargetConfig = TargetCommon &
  (
    | {
        readonly target: "sveltekit" | "astro";
        readonly layoutFile: string;
        readonly styleEntry?: never;
      }
    | {
        readonly target: "svelte-library";
        readonly styleEntry: string;
        readonly layoutFile?: never;
      }
  );

export type TargetIntegration =
  | {
      readonly kind: "layout";
      readonly path: string;
      readonly contract: "layout-v1" | "astro-layout-v1";
    }
  | {
      readonly kind: "stylesheet-entry";
      readonly path: string;
      readonly contract: "library-styles-v1";
    };

export function integrationFor(config: TargetConfig): TargetIntegration {
  return config.target === "svelte-library"
    ? {
        kind: "stylesheet-entry",
        path: config.styleEntry,
        contract: "library-styles-v1",
      }
    : {
        kind: "layout",
        path: config.layoutFile,
        contract: config.target === "astro" ? "astro-layout-v1" : "layout-v1",
      };
}

/** Strict contained schema validation, no conversion of v1 or application configuration. */
export function parseTargetConfig(
  value: unknown,
  locator = "kit.json",
  authority?: SchemaAuthority,
): ModelResult<TargetConfig> {
  const valid = validateWithSchema(
    "v2/kit.schema.json",
    value,
    locator,
    authority,
  );
  if (!valid.ok) return fail(valid.issues);
  const record = value as Record<string, unknown>;
  if (record.toolVersion !== undefined && !isSemVer(record.toolVersion))
    return fail([
      issue("SCHEMA_INVALID", "toolVersion must be strict SemVer", locator),
    ]);
  const common = {
    schemaVersion: 2 as const,
    toolVersion:
      (record.toolVersion as string | undefined) ??
      DEFAULT_KIT_CONFIG.toolVersion,
    registry: "builtin" as const,
    uiDir: (record.uiDir as string | undefined) ?? DEFAULT_KIT_CONFIG.uiDir,
    stylesDir:
      (record.stylesDir as string | undefined) ?? DEFAULT_KIT_CONFIG.stylesDir,
    requested: [...((record.requested as string[] | undefined) ?? [])],
  };
  const config: TargetConfig =
    record.target === "svelte-library"
      ? {
          ...common,
          target: "svelte-library",
          styleEntry: record.styleEntry as string,
        }
      : {
          ...common,
          target: record.target as "sveltekit" | "astro",
          layoutFile: record.layoutFile as string,
        };
  const integration = integrationFor(config);
  const derived = deriveKitPaths(common);
  const directories = [config.uiDir, config.stylesDir];
  const files = [
    integration.path,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
  ];
  if (
    [...directories, ...files].some(
      (value) => !isSafeLogicalRelativePath(value),
    )
  )
    return fail([
      issue(
        "PATH_UNSAFE",
        "Target mappings must be safe package-relative logical paths",
        locator,
      ),
    ]);
  if (
    directories.some((dir) => files.some((file) => isSameOrBelow(dir, file))) ||
    pathsOverlap(integration.path, derived.stateDir) ||
    pathsOverlap(config.stylesDir, derived.stateDir) ||
    files.some((file, index) =>
      files.slice(index + 1).some((other) => pathsOverlap(file, other)),
    )
  )
    return fail([
      issue(
        "PATH_OVERLAP",
        "Target integration, generated files and reserved state must have distinct roles",
        locator,
      ),
    ]);
  return ok(deepFreeze(config));
}

export const ASTRO_CONFIG_FILES = [
  "astro.config.ts",
  "astro.config.mts",
  "astro.config.js",
  "astro.config.mjs",
] as const;
export const TARGET_CONFIG_FILES = [
  ...ASTRO_CONFIG_FILES,
  "astro.config.cjs",
  "svelte.config.ts",
  "svelte.config.js",
  "svelte.config.mjs",
  "svelte.config.cjs",
] as const;
