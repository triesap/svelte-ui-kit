/** One strict canonical project format. Desired config never establishes installed authority. */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  validateWithSchema,
  type SchemaAuthority,
} from "../registry/schema.js";
import { isSemVer, TOOL_VERSION } from "../registry/versions.js";
import { deepFreeze } from "./immutable.js";
import {
  isSafeLogicalRelativePath,
  isSameOrBelow,
  pathsOverlap,
} from "./paths.js";
export const KIT_CONFIG_SCHEMA = "kit.schema.json";

export const SUPPORTED_SCHEMA_VERSION = 1 as const;
export const DEFAULT_REGISTRY = "builtin" as const;
export const DEFAULT_UI_DIR = "src/lib/components/ui";
export const DEFAULT_STYLES_DIR = "src/styles";
export const DEFAULT_LAYOUT_FILE = "src/routes/+layout.svelte";

/** Fixed derivations (not extra configurable modes). */
export const STATE_DIR_NAME = "_kit";
export const ROOT_EXPORTS_NAME = "index.ts";
export const KIT_CSS_NAME = "kit.css";
export const THEMES_CSS_NAME = "themes.css";
export const APP_CSS_NAME = "app.css";

export type TargetKind = "sveltekit" | "astro" | "svelte-library";
interface ConfigCommon {
  readonly schemaVersion: 1;
  readonly toolVersion: string;
  readonly registry: typeof DEFAULT_REGISTRY;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly requested: readonly string[];
}
export type SvelteKitConfig = ConfigCommon & {
  readonly target: "sveltekit";
  readonly layoutFile: string;
  readonly styleEntry?: never;
};
export type AstroConfig = ConfigCommon & {
  readonly target: "astro";
  readonly layoutFile: string;
  readonly styleEntry?: never;
};
export type LibraryConfig = ConfigCommon & {
  readonly target: "svelte-library";
  readonly styleEntry: string;
  readonly layoutFile?: never;
};
export type ApplicationConfig = SvelteKitConfig | AstroConfig;
export type KitConfig = ApplicationConfig | LibraryConfig;
export const DEFAULT_KIT_CONFIG: SvelteKitConfig = {
  schemaVersion: 1,
  target: "sveltekit",
  toolVersion: TOOL_VERSION,
  registry: DEFAULT_REGISTRY,
  uiDir: DEFAULT_UI_DIR,
  stylesDir: DEFAULT_STYLES_DIR,
  layoutFile: DEFAULT_LAYOUT_FILE,
  requested: [],
};
/** Derived logical paths for a validated configuration. */
export interface KitDerivedPaths {
  readonly stateDir: string;
  readonly rootExportsDir: string;
  readonly rootExports: string;
  readonly kitCss: string;
  readonly themesCss: string;
  readonly appCss: string;
}

function joinLogical(...segments: readonly string[]): string {
  return segments
    .map((segment, index) =>
      index === 0
        ? segment.replace(/\/+$/, "")
        : segment.replace(/^\/+|\/+$/g, ""),
    )
    .filter((segment) => segment !== "")
    .join("/");
}

/** Derive the fixed `_kit`/exports/stylesheet paths from validated roots. */
export function deriveKitPaths<
  T extends Pick<KitConfig, "uiDir" | "stylesDir">,
>(config: T): KitDerivedPaths {
  const uiDir = config.uiDir.replace(/\/+$/, "");
  const stylesDir = config.stylesDir.replace(/\/+$/, "");
  return {
    stateDir: joinLogical(uiDir, STATE_DIR_NAME),
    rootExportsDir: uiDir,
    rootExports: joinLogical(uiDir, ROOT_EXPORTS_NAME),
    kitCss: joinLogical(stylesDir, KIT_CSS_NAME),
    themesCss: joinLogical(stylesDir, THEMES_CSS_NAME),
    appCss: joinLogical(stylesDir, APP_CSS_NAME),
  };
}

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

export function integrationMapping(config: KitConfig): TargetIntegration {
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
export function parseKitConfig(
  value: unknown,
  locator = "kit.json",
  authority?: SchemaAuthority,
): ModelResult<KitConfig> {
  const valid = validateWithSchema(
    KIT_CONFIG_SCHEMA,
    value,
    locator,
    authority,
  );
  if (
    !valid.ok &&
    valid.issues.some((entry) => entry.code !== "SCHEMA_INVALID")
  )
    return fail(valid.issues);
  // Safe logical roles retain their owning diagnostics even if a framework suffix
  // is also invalid. Never normalize or accept a schema-invalid input.
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return fail(
      valid.ok
        ? [
            issue(
              "SCHEMA_INVALID",
              "Canonical project object required",
              locator,
            ),
          ]
        : valid.issues,
    );
  const shape = value as Record<string, unknown>;
  if (
    shape.schemaVersion !== 1 ||
    typeof shape.target !== "string" ||
    !["sveltekit", "astro", "svelte-library"].includes(shape.target) ||
    ["uiDir", "stylesDir"].some(
      (field) => shape[field] !== undefined && typeof shape[field] !== "string",
    ) ||
    typeof shape[
      shape.target === "svelte-library" ? "styleEntry" : "layoutFile"
    ] !== "string" ||
    (shape.requested !== undefined && !Array.isArray(shape.requested))
  ) {
    if (!valid.ok) return fail(valid.issues);
    return fail([
      issue("SCHEMA_INVALID", "Canonical project shape is required", locator),
    ]);
  }
  const record = value as Record<string, unknown>;
  if (record.toolVersion !== undefined && !isSemVer(record.toolVersion))
    return fail([
      issue(
        "SCHEMA_INVALID",
        "toolVersion must be strict SemVer",
        "toolVersion",
      ),
    ]);
  const common = {
    schemaVersion: 1 as const,
    toolVersion:
      (record.toolVersion as string | undefined) ??
      DEFAULT_KIT_CONFIG.toolVersion,
    registry: "builtin" as const,
    uiDir: (record.uiDir as string | undefined) ?? DEFAULT_KIT_CONFIG.uiDir,
    stylesDir:
      (record.stylesDir as string | undefined) ?? DEFAULT_KIT_CONFIG.stylesDir,
    requested: [...((record.requested as string[] | undefined) ?? [])],
  };
  const config: KitConfig =
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
  const integration = integrationMapping(config);
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
        `Target mappings must be safe package-relative logical paths: ${[
          ...directories,
          ...files,
        ]
          .filter((value) => !isSafeLogicalRelativePath(value))
          .map((value) => JSON.stringify(value))
          .join(", ")}`,
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
  if (!valid.ok) return fail(valid.issues);
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

export function isLibraryConfig(config: KitConfig): config is LibraryConfig {
  return config.target === "svelte-library";
}
export function generationTarget(config: KitConfig): TargetKind {
  return config.target;
}
export function generationInputPaths(): readonly string[] {
  return ["package.json", ...TARGET_CONFIG_FILES];
}
export function generationFields(
  config: ApplicationConfig,
): import("./integration-fields.js").ApplicationIntegrationFields;
export function generationFields(
  config: LibraryConfig,
): import("./integration-fields.js").LibraryIntegrationFields;
export function generationFields(
  config: KitConfig,
): import("./integration-fields.js").IntegrationFields;
export function generationFields(
  config: KitConfig,
): import("./integration-fields.js").IntegrationFields {
  return config.target === "svelte-library"
    ? {
        configSchema: 1 as const,
        target: config.target,
        styleEntry: config.styleEntry,
      }
    : {
        configSchema: 1 as const,
        target: config.target,
        layoutFile: config.layoutFile,
      };
}
export function initializationFields(config: KitConfig, source: string) {
  return config.target === "svelte-library"
    ? { config, styleEntry: config.styleEntry, styleSource: source }
    : { config, layoutFile: config.layoutFile, layoutSource: source };
}

/** Deterministic canonical writer metadata and desired state. Reading historical
 * toolVersion remains valid; a new publication always identifies this build. */
export function serializeKitConfig(config: KitConfig): string {
  return (
    JSON.stringify(
      {
        schemaVersion: SUPPORTED_SCHEMA_VERSION,
        target: config.target,
        toolVersion: TOOL_VERSION,
        registry: config.registry,
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        ...(config.target === "svelte-library"
          ? { styleEntry: config.styleEntry }
          : { layoutFile: config.layoutFile }),
        requested: [...config.requested],
      },
      null,
      2,
    ) + "\n"
  );
}
