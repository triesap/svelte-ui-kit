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
 * safe mapping is honored. Lexical path safety and reserved-state overlap are
 * enforced here; real filesystem containment and later project discovery
 * remain a distinct later gate.
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
import { asciiFold, isSafeLogicalRelativePath, pathsOverlap } from "./paths.js";

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

/** Strip a single trailing separator run, matching `deriveKitPaths`. */
function trimTrailingSeparators(value: string): string {
  return value.replace(/\/+$/, "");
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
 * types, unsupported schema versions, malformed values, lexically unsafe roots
 * and reserved-state/overlap collisions fail with typed issues; a valid value
 * is completed with the documented defaults.
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

  const roots: readonly (readonly [string, string, string])[] = [
    ["uiDir", "UI root", DEFAULT_UI_DIR],
    ["stylesDir", "styles root", DEFAULT_STYLES_DIR],
    ["layoutFile", "layout file", DEFAULT_LAYOUT_FILE],
  ];
  const normalized = new Map<string, string>();
  for (const [field, label, fallback] of roots) {
    const raw = record[field];
    if (raw === undefined) {
      normalized.set(field, fallback);
      continue;
    }
    const candidate = trimTrailingSeparators(raw as string);
    if (!isSafeLogicalRelativePath(candidate)) {
      issues.push(
        issue(
          "PATH_UNSAFE",
          `${label} (${field}) must be a safe logical relative path, received ${describe(raw)}`,
          field,
        ),
      );
      continue;
    }
    normalized.set(field, candidate);
  }
  if (issues.length > 0) return fail(issues);

  const uiDir = normalized.get("uiDir") as string;
  const stylesDir = normalized.get("stylesDir") as string;
  const layoutFile = normalized.get("layoutFile") as string;
  const derived = deriveKitPaths({
    ...DEFAULT_KIT_CONFIG,
    uiDir,
    stylesDir,
    layoutFile,
  });

  if (pathsOverlap(stylesDir, derived.stateDir)) {
    issues.push(
      issue(
        "PATH_OVERLAP",
        `stylesDir ${JSON.stringify(stylesDir)} must not overlap the reserved state directory ${JSON.stringify(derived.stateDir)}`,
        "stylesDir",
      ),
    );
  }
  if (
    derived.stateDir === layoutFile ||
    asciiFold(layoutFile).startsWith(`${asciiFold(derived.stateDir)}/`)
  ) {
    issues.push(
      issue(
        "PATH_OVERLAP",
        `layoutFile ${JSON.stringify(layoutFile)} must not live inside the reserved state directory ${JSON.stringify(derived.stateDir)}`,
        "layoutFile",
      ),
    );
  }
  if (asciiFold(layoutFile) === asciiFold(derived.rootExports)) {
    issues.push(
      issue(
        "PATH_OVERLAP",
        `layoutFile ${JSON.stringify(layoutFile)} must not collide with the root exports file ${JSON.stringify(derived.rootExports)}`,
        "layoutFile",
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
    uiDir,
    stylesDir,
    layoutFile,
    requested: Array.isArray(requested)
      ? (requested as readonly string[]).slice()
      : [],
  });
}
