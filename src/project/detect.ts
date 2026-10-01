/**
 * Default SvelteKit application detection (S035) and `_kit` discovery (S037).
 *
 * Read-only detection of a supported consumer package. The detector reads
 * `package.json` and, when present, *statically* inspects exactly one
 * `svelte.config.*` through `inspectSvelteConfigSource`; it never executes
 * `svelte.config.*`, a package script or any application code. Actual SvelteKit
 * evidence (a declared `@sveltejs/kit` dependency) is required: the mere
 * presence of a config filename proves nothing, and an unresolvable or
 * ambiguous mapping yields a typed manual diagnostic instead of a guessed
 * default.
 *
 * Every filesystem read goes through the typed `observeEntry`/`readJsonObject`
 * helpers, so absence, malformed content, nonregular/unsafe entries and
 * unreadable I/O are distinguished and a host path never escapes as an
 * exception.
 */
import { readFileSync, readdirSync } from "node:fs";
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
  DEFAULT_STYLES_DIR,
  DEFAULT_UI_DIR,
  deriveKitPaths,
  parseKitConfig,
  type KitConfig,
  type KitDerivedPaths,
} from "./config.js";
import { isRegularFile, observeEntry, readJsonObject } from "./io.js";
import { inspectSvelteConfigSource } from "./svelte-config.js";

/** Static SvelteKit configuration filenames, in deterministic order. */
export const SVELTE_CONFIG_FILES = [
  "svelte.config.js",
  "svelte.config.mjs",
  "svelte.config.cjs",
  "svelte.config.ts",
] as const;

const DEFAULT_ROUTES_DIR = "src/routes";
const DEFAULT_LIB_DIR = "src/lib";
const LAYOUT_NAME = "+layout.svelte";

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
  /** Resolved SvelteKit routes directory (default `src/routes`). */
  readonly routesDir: string;
  /** Resolved SvelteKit lib directory (default `src/lib`). */
  readonly libDir: string;
  readonly libDirPresent: boolean;
  readonly routesDirPresent: boolean;
  readonly layoutPresent: boolean;
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

/** The literal manual reconciliation step when a mapping cannot be proven. */
const MANUAL_INTEGRATION_STEPS =
  "make the relevant kit.files.routes/kit.files.lib value a literal string in svelte.config.* (remove env/imports/computed values and spreads), or create a kit configuration explicitly at src/lib/components/ui/_kit/kit.json with the desired uiDir/stylesDir/layoutFile";

/** Read one static config file's text, returning a typed outcome. */
type ConfigTextObservation =
  | { readonly kind: "ok"; readonly text: string }
  | { readonly kind: "unsafe" }
  | { readonly kind: "unreadable"; readonly code: string };

function readConfigText(abs: string): ConfigTextObservation {
  const entry = observeEntry(abs);
  if (entry.kind === "unreadable") return entry;
  if (entry.kind !== "file") return { kind: "unsafe" };
  try {
    return { kind: "ok", text: readFileSync(abs, "utf8") };
  } catch (error) {
    return {
      kind: "unreadable",
      code: (error as NodeJS.ErrnoException | null)?.code ?? "EIO",
    };
  }
}

/**
 * Detect a default SvelteKit application at `root`. Returns typed
 * `PROJECT_*`/`PROJECT_SVELTEKIT_*` diagnostics for an unsupported or
 * ambiguous target and never writes.
 */
export function detectDefaultProject(
  root: string,
): ModelResult<DetectedProject> {
  const manifestRel = "package.json";
  const manifestAbs = path.join(root, manifestRel);
  const manifestObservation = observeEntry(manifestAbs);
  if (manifestObservation.kind === "absent") {
    return fail([
      issue(
        "PROJECT_MANIFEST_MISSING",
        `no ${manifestRel} was found in the selected package; run the command in a SvelteKit application package`,
        manifestRel,
      ),
    ]);
  }
  if (manifestObservation.kind === "unreadable") {
    return fail([
      issue(
        "PROJECT_MANIFEST_UNREADABLE",
        `${manifestRel} could not be read (${manifestObservation.code})`,
        manifestRel,
      ),
    ]);
  }
  if (manifestObservation.kind !== "file") {
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
  const peerDependencies = dependencyRecord(manifest, "peerDependencies");
  const hasSvelteKitDependency =
    "@sveltejs/kit" in dependencies ||
    "@sveltejs/kit" in devDependencies ||
    "@sveltejs/kit" in peerDependencies;

  // Collect every present config candidate with its non-following kind.
  const present: string[] = [];
  const issues: ModelIssue[] = [];
  for (const candidate of SVELTE_CONFIG_FILES) {
    const observation = observeEntry(path.join(root, candidate));
    if (observation.kind === "absent") continue;
    if (observation.kind === "unreadable") {
      issues.push(
        issue(
          "PROJECT_SVELTEKIT_CONFIG_UNREADABLE",
          `${candidate} could not be read (${observation.code})`,
          candidate,
        ),
      );
      continue;
    }
    if (observation.kind !== "file") {
      issues.push(
        issue(
          "PROJECT_SVELTEKIT_CONFIG_UNSAFE",
          `${candidate} is not a regular file; refusing to inspect a symlink or nonregular SvelteKit config`,
          candidate,
        ),
      );
      continue;
    }
    present.push(candidate);
  }
  if (issues.length > 0) return fail(issues);

  if (!hasSvelteKitDependency) {
    return fail([
      issue(
        "PROJECT_NOT_SVELTEKIT",
        present.length > 0
          ? `the package declares a ${present[0]} file but no @sveltejs/kit dependency; a config filename alone is not proof of a SvelteKit application`
          : "the selected package does not declare an @sveltejs/kit dependency; a default SvelteKit application cannot be assumed",
        manifestRel,
      ),
    ]);
  }

  if (present.length > 1) {
    return fail([
      issue(
        "PROJECT_SVELTEKIT_CONFIG_AMBIGUOUS",
        `multiple SvelteKit configuration files are present (${present.join(", ")}); keep exactly one, because the generator will not guess which mapping applies`,
        present[0],
      ),
    ]);
  }

  let routesDir = DEFAULT_ROUTES_DIR;
  let libDir = DEFAULT_LIB_DIR;
  const svelteConfigFile = present[0] ?? null;
  if (svelteConfigFile !== null) {
    const text = readConfigText(path.join(root, svelteConfigFile));
    if (text.kind === "unreadable") {
      return fail([
        issue(
          "PROJECT_SVELTEKIT_CONFIG_UNREADABLE",
          `${svelteConfigFile} could not be read (${text.code})`,
          svelteConfigFile,
        ),
      ]);
    }
    if (text.kind === "unsafe") {
      return fail([
        issue(
          "PROJECT_SVELTEKIT_CONFIG_UNSAFE",
          `${svelteConfigFile} is not a regular file`,
          svelteConfigFile,
        ),
      ]);
    }
    const inspection = inspectSvelteConfigSource(svelteConfigFile, text.text);
    if (inspection.kind === "unsupported") {
      return fail([
        issue(
          "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
          `${svelteConfigFile} could not be resolved statically: ${inspection.reason}. ${MANUAL_INTEGRATION_STEPS}`,
          svelteConfigFile,
        ),
      ]);
    }
    if (inspection.mapping.routesDir !== null) {
      routesDir = inspection.mapping.routesDir;
    }
    if (inspection.mapping.libDir !== null) {
      libDir = inspection.mapping.libDir;
    }
  }

  const layoutFile = joinLogical(routesDir, LAYOUT_NAME);
  const libDirPresent =
    observeEntry(path.join(root, ...libDir.split("/"))).kind === "directory";
  const routesDirPresent =
    observeEntry(path.join(root, ...routesDir.split("/"))).kind === "directory";
  const layoutPresent = isRegularFile(
    path.join(root, ...layoutFile.split("/")),
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
    layoutFile,
    routesDir,
    libDir,
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

/** Deterministic candidate collection with typed discovery issues. */
interface CandidateScan {
  readonly candidates: readonly string[];
  readonly issues: readonly ModelIssue[];
}

/**
 * Deterministically collect candidate `<uiDir>/_kit/kit.json` paths below the
 * selected package root. The walk is sorted, skips dependency/VCS/build-output
 * directories and nested package roots (any descendant directory other than the
 * root that contains its own `package.json`), and never follows a symlink.
 *
 * `_kit` entries are observed deliberately: a symlinked/nonregular `_kit` or a
 * symlinked/nonregular `kit.json` becomes a typed unsafe/kind issue instead of
 * being silently skipped. Unrelated symlink subtrees are not traversed and are
 * not claimed to be verified.
 */
function scanKitConfigCandidates(root: string): CandidateScan {
  const results: string[] = [];
  const issues: ModelIssue[] = [];

  const walk = (dir: string, relDir: string): void => {
    let names: string[];
    try {
      names = readdirSync(dir).sort();
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code ?? "EIO";
      issues.push(
        issue(
          "KIT_CONFIG_DISCOVERY_UNREADABLE",
          `the directory ${JSON.stringify(relDir === "" ? "." : relDir)} could not be listed (${code})`,
          relDir === "" ? "." : relDir,
        ),
      );
      return;
    }
    for (const name of names) {
      const abs = path.join(dir, name);
      const rel = relDir === "" ? name : `${relDir}/${name}`;
      const entry = observeEntry(abs);
      if (name === "_kit") {
        const kitJson = observeEntry(path.join(abs, "kit.json"));
        if (entry.kind === "directory") {
          if (kitJson.kind === "file") results.push(`${rel}/kit.json`);
          else if (kitJson.kind === "unreadable") {
            issues.push(
              issue(
                "KIT_CONFIG_UNREADABLE",
                `${rel}/kit.json could not be read (${kitJson.code})`,
                `${rel}/kit.json`,
              ),
            );
          } else if (
            kitJson.kind === "symlink" ||
            kitJson.kind === "directory" ||
            kitJson.kind === "other"
          ) {
            issues.push(
              issue(
                "KIT_CONFIG_UNSAFE",
                `${rel}/kit.json is not a regular file; refusing to treat it as a kit configuration`,
                `${rel}/kit.json`,
              ),
            );
          }
        } else if (entry.kind === "symlink") {
          issues.push(
            issue(
              "KIT_CONFIG_UNSAFE",
              `${rel} is a symlink; a discovered _kit directory must be a real directory, not a link`,
              rel,
            ),
          );
        } else if (entry.kind === "file" || entry.kind === "other") {
          issues.push(
            issue(
              "KIT_CONFIG_UNSAFE",
              `${rel} is a non-directory entry where a _kit directory was expected`,
              rel,
            ),
          );
        } else if (entry.kind === "unreadable") {
          issues.push(
            issue(
              "KIT_CONFIG_UNREADABLE",
              `${rel} could not be inspected (${entry.code})`,
              rel,
            ),
          );
        }
        continue;
      }
      if (entry.kind !== "directory") continue;
      if (EXCLUDED_DIR_SET.has(name)) continue;
      if (isRegularFile(path.join(abs, "package.json"))) continue;
      walk(abs, rel);
    }
  };

  const rootEntry = observeEntry(root);
  if (rootEntry.kind === "directory") walk(root, "");
  return { candidates: results.sort(), issues };
}

/**
 * Discover the selected custom `_kit/kit.json` within the package (S037). No
 * candidate means a default bootstrap; more than one validated candidate, a
 * malformed candidate, an unsafe/nonregular candidate or a candidate whose
 * declared `uiDir` disagrees with its location fails visibly. Reading is
 * JSON-only and never executes `svelte.config.*` or a package script.
 */
export function discoverKitConfig(
  root: string,
): ModelResult<DiscoveredKitConfig> {
  const scan = scanKitConfigCandidates(root);
  const issues: ModelIssue[] = [...scan.issues];
  const valid: DiscoveredKitConfig[] = [];

  for (const rel of scan.candidates) {
    const abs = path.join(root, ...rel.split("/"));
    const observation = readJsonObject(abs);
    if (observation.kind === "unreadable") {
      issues.push(
        issue(
          "KIT_CONFIG_UNREADABLE",
          `${rel} could not be read (${observation.code})`,
          rel,
        ),
      );
      continue;
    }
    if (observation.kind === "unsafe") {
      issues.push(
        issue(
          "KIT_CONFIG_UNSAFE",
          `${rel} is not a regular file; refusing to treat it as a kit configuration`,
          rel,
        ),
      );
      continue;
    }
    if (observation.kind === "malformed") {
      issues.push(
        issue(
          "KIT_CONFIG_INVALID_JSON",
          `${rel} is not valid JSON; fix the kit configuration before discovery`,
          rel,
        ),
      );
      continue;
    }
    if (observation.kind === "absent") {
      // Disappeared between the scan and the read: treat as missing, not a
      // config, but never as a silent default when another issue exists.
      continue;
    }
    const parsed = parseKitConfig(observation.value, rel);
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
          .join(
            ", ",
          )}); keep exactly one and remove or relocate the others, because the generator will not guess which installation applies`,
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
