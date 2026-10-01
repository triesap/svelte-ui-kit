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
import { lstatSync, readFileSync, type Stats } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import {
  DEFAULT_LAYOUT_FILE,
  DEFAULT_STYLES_DIR,
  DEFAULT_UI_DIR,
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
