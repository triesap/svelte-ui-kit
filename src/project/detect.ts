/**
 * Default SvelteKit application detection (S035).
 *
 * Read-only detection of a supported consumer package. The detector reads
 * `package.json` and the *presence* of static SvelteKit configuration evidence;
 * it never executes `svelte.config.*`, a package script or any application
 * code. Missing or non-SvelteKit projects return typed diagnostics instead of a
 * guessed layout, and detection performs no write of any kind.
 *
 * Only the frozen default interpretation is resolved here. Explicit custom
 * mappings, workspace selection and `_kit/kit.json` discovery are later
 * checkpoints (S036–S037); those layers override the inferred defaults in this
 * module.
 */
import { lstatSync, readFileSync, readdirSync, type Stats } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import {
  DEFAULT_KIT_CONFIG,
  DEFAULT_LAYOUT_FILE,
  DEFAULT_STYLES_DIR,
  DEFAULT_UI_DIR,
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
  type KitDerivedPaths,
} from "./config.js";

/** Static SvelteKit configuration filenames, in deterministic order. */
export const SVELTE_CONFIG_FILES = [
  "svelte.config.js",
  "svelte.config.mjs",
  "svelte.config.cjs",
  "svelte.config.ts",
] as const;

/** The default UI, style and layout paths for a detected application. */
export interface DetectedProject {
  readonly kind: "default";
  /** The selected package root (runtime value, never used as a locator). */
  readonly root: string;
  readonly packageName: string | null;
  readonly hasSvelteKitDependency: boolean;
  readonly svelteConfigFile: string | null;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly libDirPresent: boolean;
  readonly routesDirPresent: boolean;
  readonly layoutPresent: boolean;
}

/** `lstat`, returning null only for a genuinely absent entry. */
function lstatOrNull(abs: string): Stats | null {
  try {
    return lstatSync(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

/** True for an existing regular (non-symlink) file. */
function isRegularFile(abs: string): boolean {
  const stats = lstatOrNull(abs);
  return stats !== null && stats.isFile();
}

/** True for an existing directory reached without following a symlink. */
function isRealDirectory(abs: string): boolean {
  const stats = lstatOrNull(abs);
  return stats !== null && stats.isDirectory();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function dependencyRecord(
  manifest: Record<string, unknown>,
  field: string,
): Record<string, unknown> {
  const value = manifest[field];
  return isRecord(value) ? value : {};
}

/**
 * Detect a default SvelteKit application at `root`. Returns typed
 * `PROJECT_MANIFEST_*`/`PROJECT_NOT_SVELTEKIT` diagnostics for an unsupported
 * or ambiguous target and never writes.
 */
export function detectDefaultProject(
  root: string,
): ModelResult<DetectedProject> {
  const manifestRel = "package.json";
  const manifestAbs = path.join(root, manifestRel);
  const manifestStats = lstatOrNull(manifestAbs);
  if (manifestStats === null) {
    return fail([
      issue(
        "PROJECT_MANIFEST_MISSING",
        `no ${manifestRel} was found in the selected package; run the command in a SvelteKit application package`,
        manifestRel,
      ),
    ]);
  }
  if (!manifestStats.isFile()) {
    return fail([
      issue(
        "PROJECT_MANIFEST_UNSAFE",
        `${manifestRel} is not a regular file; refusing to read a symlink or nonregular manifest`,
        manifestRel,
      ),
    ]);
  }

  let manifest: unknown;
  try {
    manifest = JSON.parse(readFileSync(manifestAbs, "utf8"));
  } catch {
    return fail([
      issue(
        "PROJECT_MANIFEST_INVALID",
        `${manifestRel} is not valid JSON; fix the manifest before running the generator`,
        manifestRel,
      ),
    ]);
  }
  if (!isRecord(manifest)) {
    return fail([
      issue(
        "PROJECT_MANIFEST_INVALID",
        `${manifestRel} must contain a JSON object`,
        manifestRel,
      ),
    ]);
  }

  const dependencies = dependencyRecord(manifest, "dependencies");
  const devDependencies = dependencyRecord(manifest, "devDependencies");
  const hasSvelteKitDependency =
    "@sveltejs/kit" in dependencies || "@sveltejs/kit" in devDependencies;

  let svelteConfigFile: string | null = null;
  for (const candidate of SVELTE_CONFIG_FILES) {
    if (isRegularFile(path.join(root, candidate))) {
      svelteConfigFile = candidate;
      break;
    }
  }

  if (!hasSvelteKitDependency && svelteConfigFile === null) {
    return fail([
      issue(
        "PROJECT_NOT_SVELTEKIT",
        `the selected package declares neither an @sveltejs/kit dependency nor a static svelte.config.* file; a default SvelteKit application cannot be assumed`,
        manifestRel,
      ),
    ]);
  }

  const libDirPresent = isRealDirectory(path.join(root, "src", "lib"));
  const routesDirPresent = isRealDirectory(path.join(root, "src", "routes"));
  const layoutPresent = isRegularFile(
    path.join(root, ...DEFAULT_LAYOUT_FILE.split("/")),
  );

  const packageName =
    typeof manifest["name"] === "string" ? manifest["name"] : null;
  return ok({
    kind: "default",
    root,
    packageName,
    hasSvelteKitDependency,
    svelteConfigFile,
    uiDir: DEFAULT_UI_DIR,
    stylesDir: DEFAULT_STYLES_DIR,
    layoutFile: DEFAULT_LAYOUT_FILE,
    libDirPresent,
    routesDirPresent,
    layoutPresent,
  });
}

/** Directory names never descended into during kit.json discovery. */
export const DISCOVERY_EXCLUDED_DIRS = [
  "node_modules",
  ".git",
  ".svelte-kit",
  ".output",
  "build",
  "dist",
  "coverage",
] as const;
const EXCLUDED_DIR_SET = new Set<string>(DISCOVERY_EXCLUDED_DIRS);

/** A selected kit configuration and where it was discovered. */
export interface DiscoveredKitConfig {
  readonly kind: "default" | "custom";
  /** Package-relative `_kit/kit.json` path. */
  readonly configPath: string;
  readonly config: KitConfig;
  readonly derived: KitDerivedPaths;
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

/**
 * Deterministically collect candidate `<uiDir>/_kit/kit.json` paths below the
 * selected package root. The walk is sorted, skips dependency/VCS/build-output
 * directories and nested package roots (any descendant directory other than the
 * root that contains its own `package.json`), and never follows a symlink.
 */
function findKitConfigCandidates(root: string): string[] {
  const results: string[] = [];
  const walk = (dir: string, relDir: string): void => {
    const stats = lstatOrNull(dir);
    if (stats === null || !stats.isDirectory()) return;
    for (const name of readdirSync(dir).sort()) {
      const abs = path.join(dir, name);
      const rel = relDir === "" ? name : `${relDir}/${name}`;
      const entry = lstatOrNull(abs);
      if (entry === null || entry.isSymbolicLink() || !entry.isDirectory()) {
        continue;
      }
      if (EXCLUDED_DIR_SET.has(name)) continue;
      if (isRegularFile(path.join(abs, "package.json"))) continue;
      if (name === "_kit") {
        if (isRegularFile(path.join(abs, "kit.json"))) {
          results.push(`${rel}/kit.json`);
        }
        continue;
      }
      walk(abs, rel);
    }
  };
  walk(root, "");
  return results.sort();
}

/**
 * Discover the selected custom `_kit/kit.json` within the package (S037). No
 * candidate means a default bootstrap; more than one validated candidate, a
 * malformed candidate or a candidate whose declared `uiDir` disagrees with its
 * location fails visibly. Reading is JSON-only and never executes
 * `svelte.config.*` or a package script.
 */
export function discoverKitConfig(
  root: string,
): ModelResult<DiscoveredKitConfig> {
  const candidates = findKitConfigCandidates(root);
  const issues: ModelIssue[] = [];
  const valid: DiscoveredKitConfig[] = [];

  for (const rel of candidates) {
    const abs = path.join(root, ...rel.split("/"));
    let raw: unknown;
    try {
      raw = JSON.parse(readFileSync(abs, "utf8"));
    } catch {
      issues.push(
        issue(
          "KIT_CONFIG_INVALID_JSON",
          `${rel} is not valid JSON; fix the kit configuration before discovery`,
          rel,
        ),
      );
      continue;
    }
    const parsed = parseKitConfig(raw, rel);
    if (!parsed.ok) {
      for (const entry of parsed.issues) issues.push(entry);
      continue;
    }
    const derived = deriveKitPaths(parsed.value);
    const expected = joinLogical(parsed.value.uiDir, "_kit", "kit.json");
    if (expected !== rel) {
      issues.push(
        issue(
          "KIT_CONFIG_LOCATION_MISMATCH",
          `${rel} declares uiDir ${JSON.stringify(parsed.value.uiDir)} which derives ${JSON.stringify(expected)}; a custom kit.json must live where its uiDir requires`,
          rel,
        ),
      );
      continue;
    }
    valid.push({
      kind: "custom",
      configPath: rel,
      config: parsed.value,
      derived,
    });
  }

  if (issues.length > 0) return fail(issues);
  if (valid.length > 1) {
    return fail([
      issue(
        "KIT_CONFIG_AMBIGUOUS",
        `found ${valid.length} valid kit.json candidates (${valid
          .map((entry) => entry.configPath)
          .join(", ")}); keep exactly one or pass an explicit mapping`,
        valid[0]?.configPath,
      ),
    ]);
  }
  if (valid.length === 1) return ok(valid[0] as DiscoveredKitConfig);

  return ok({
    kind: "default",
    configPath: "src/lib/components/ui/_kit/kit.json",
    config: DEFAULT_KIT_CONFIG,
    derived: deriveKitPaths(DEFAULT_KIT_CONFIG),
  });
}
