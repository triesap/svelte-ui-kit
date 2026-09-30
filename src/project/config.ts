/**
 * Strict kit configuration (S014).
 *
 * `kit.json` is the user-editable desired state. This module performs strict
 * draft-07 schema validation plus a small amount of semantic validation, then
 * normalizes the result with the documented defaults. It never coerces a
 * value, injects a JSON Schema `default`, removes an unknown field or executes
 * application/Svelte configuration.
 *
 * Absent optional fields receive the documented defaults; an explicit custom
 * safe mapping is honored. Lexical path safety, overlap and reserved-state
 * checks are separate later gates (S033/S034), so this checkpoint does not
 * pretend to perform them.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { validateWithSchema } from "../registry/schema.js";
import {
  INITIAL_SCHEMA_VERSION,
  INITIAL_TOOL_VERSION,
  isSemVer,
} from "../registry/versions.js";

/** Schema document that owns the `kit.json` shape. */
export const KIT_CONFIG_SCHEMA = "kit.schema.json";

export const SUPPORTED_SCHEMA_VERSION = INITIAL_SCHEMA_VERSION;
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

export interface KitConfig {
  readonly schemaVersion: number;
  readonly toolVersion: string;
  readonly registry: typeof DEFAULT_REGISTRY;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly requested: readonly string[];
}

export const DEFAULT_KIT_CONFIG: KitConfig = {
  schemaVersion: SUPPORTED_SCHEMA_VERSION,
  toolVersion: INITIAL_TOOL_VERSION,
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
export function deriveKitPaths(config: KitConfig): KitDerivedPaths {
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

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return Array.isArray(value) ? "an array" : typeof value;
}

/**
 * Parse and normalize a candidate `kit.json` value. Unknown/legacy fields, bad
 * types, unsupported schema versions and malformed values fail with typed
 * issues; a valid value is completed with the documented defaults.
 */
export function parseKitConfig(
  value: unknown,
  locator = "kit.json",
): ModelResult<KitConfig> {
  const schemaResult = validateWithSchema(KIT_CONFIG_SCHEMA, value, locator);
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues: ModelIssue[] = [];

  const toolVersion = record["toolVersion"];
  if (toolVersion !== undefined && !isSemVer(toolVersion)) {
    issues.push(
      issue(
        "SCHEMA_INVALID",
        `toolVersion must be a strict SemVer 2.0.0 release, received ${describe(toolVersion)}`,
        "toolVersion",
      ),
    );
  }
  if (issues.length > 0) return fail(issues);

  const requested = record["requested"];
  return ok({
    schemaVersion: SUPPORTED_SCHEMA_VERSION,
    toolVersion:
      typeof toolVersion === "string" ? toolVersion : INITIAL_TOOL_VERSION,
    registry: DEFAULT_REGISTRY,
    uiDir:
      typeof record["uiDir"] === "string" ? record["uiDir"] : DEFAULT_UI_DIR,
    stylesDir:
      typeof record["stylesDir"] === "string"
        ? record["stylesDir"]
        : DEFAULT_STYLES_DIR,
    layoutFile:
      typeof record["layoutFile"] === "string"
        ? record["layoutFile"]
        : DEFAULT_LAYOUT_FILE,
    requested: Array.isArray(requested)
      ? (requested as readonly string[]).slice()
      : [],
  });
}
