/**
 * Package-relative read-only asset provider (S025).
 *
 * Registry/schema assets are read from an explicit package root. There is no
 * CWD, source-checkout or network fallback: a caller that wants a different
 * root must say so (the source-tree provider is an explicit test/development
 * injection, never a hidden runtime path). Requests are restricted to the
 * `registry/` and `schema/v1/` roots and the known text asset extensions.
 *
 * Reads reject absolute/traversal/separator-confused logical paths, missing
 * assets, non-files, symlinked assets and symlinked ancestors that resolve
 * outside the package root, and (for text) invalid UTF-8.
 */
import { existsSync, lstatSync, readFileSync, realpathSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";

export const ASSET_ROOTS = ["registry", "schema/v1"] as const;
export const ASSET_EXTENSIONS = [".json", ".css", ".svelte", ".ts"] as const;

export interface AssetProvider {
  /** Absolute package root this provider is pinned to. */
  readonly root: string;
  readBytes(logicalPath: string): ModelResult<Uint8Array>;
  readText(logicalPath: string): ModelResult<string>;
  exists(logicalPath: string): boolean;
}

function contained(parent: string, child: string): boolean {
  const rel = relative(parent, child);
  return (
    rel !== "" &&
    !isAbsolute(rel) &&
    rel !== ".." &&
    !rel.startsWith(`..${sep}`)
  );
}

/** Locate the package root by walking up for `package.json` (no CWD use). */
export function resolvePackageRoot(fromUrl: string | URL): string {
  let dir = dirname(fileURLToPath(fromUrl));
  for (;;) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("could not locate the svelte-ui-kit package root");
    }
    dir = parent;
  }
}

/** Validate a logical asset path against the allowed roots/extensions. */
export function normalizeAssetPath(value: unknown): ModelResult<string> {
  const issues: ModelIssue[] = [];
  if (typeof value !== "string" || value.length === 0) {
    return fail([
      issue("ASSET_PATH_INVALID", "asset path must be a non-empty string"),
    ]);
  }
  if (
    value.startsWith("/") ||
    value.includes("\\") ||
    /^[A-Za-z]:/.test(value) ||
    value !== value.replace(/\/{2,}/g, "/")
  ) {
    return fail([
      issue(
        "ASSET_PATH_INVALID",
        `asset path must be a safe logical relative path, received ${JSON.stringify(value)}`,
      ),
    ]);
  }
  const segments = value.split("/");
  if (
    !segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    )
  ) {
    return fail([
      issue(
        "ASSET_PATH_INVALID",
        `asset path must not contain traversal or empty segments: ${JSON.stringify(value)}`,
      ),
    ]);
  }
  const root = ASSET_ROOTS.find(
    (candidate) => value === candidate || value.startsWith(`${candidate}/`),
  );
  if (root === undefined) {
    issues.push(
      issue(
        "ASSET_PATH_INVALID",
        `asset path must be under ${ASSET_ROOTS.join(" or ")}, received ${JSON.stringify(value)}`,
      ),
    );
  }
  if (!ASSET_EXTENSIONS.some((extension) => value.endsWith(extension))) {
    issues.push(
      issue(
        "ASSET_PATH_INVALID",
        `asset path must end with one of ${ASSET_EXTENSIONS.join(", ")}`,
      ),
    );
  }
  if (issues.length > 0) return fail(issues);
  return ok(value);
}

/**
 * Create a read-only provider pinned to `root`. The root need not exist at
 * construction time; a missing root simply makes every read fail as missing.
 */
export function createAssetProvider(root: string): AssetProvider {
  const resolvedRoot = resolve(root);

  const realRoot = (): string => {
    try {
      return realpathSync(resolvedRoot);
    } catch {
      return resolvedRoot;
    }
  };

  const readBytes = (logicalPath: string): ModelResult<Uint8Array> => {
    const normalized = normalizeAssetPath(logicalPath);
    if (!normalized.ok) return normalized;
    const absolute = resolve(resolvedRoot, normalized.value);
    if (!contained(resolvedRoot, absolute)) {
      return fail([
        issue(
          "ASSET_PATH_INVALID",
          `asset path escapes the package root: ${JSON.stringify(logicalPath)}`,
        ),
      ]);
    }
    if (!existsSync(absolute)) {
      return fail([
        issue(
          "ASSET_MISSING",
          `asset is missing: ${JSON.stringify(logicalPath)}`,
          logicalPath,
        ),
      ]);
    }
    const stats = lstatSync(absolute);
    if (stats.isSymbolicLink()) {
      return fail([
        issue(
          "ASSET_SYMLINK_ESCAPE",
          `asset must not be a symlink: ${JSON.stringify(logicalPath)}`,
          logicalPath,
        ),
      ]);
    }
    if (!stats.isFile()) {
      return fail([
        issue(
          "ASSET_NOT_FILE",
          `asset is not a regular file: ${JSON.stringify(logicalPath)}`,
          logicalPath,
        ),
      ]);
    }
    let real: string;
    try {
      real = realpathSync(absolute);
    } catch (error) {
      return fail([
        issue(
          "ASSET_SYMLINK_ESCAPE",
          `asset could not be resolved: ${error instanceof Error ? error.message : String(error)}`,
          logicalPath,
        ),
      ]);
    }
    if (!contained(realRoot(), real)) {
      return fail([
        issue(
          "ASSET_SYMLINK_ESCAPE",
          `asset resolves outside the package root: ${JSON.stringify(logicalPath)}`,
          logicalPath,
        ),
      ]);
    }
    return ok(new Uint8Array(readFileSync(absolute)));
  };

  const readText = (logicalPath: string): ModelResult<string> => {
    const bytes = readBytes(logicalPath);
    if (!bytes.ok) return bytes;
    try {
      return ok(new TextDecoder("utf-8", { fatal: true }).decode(bytes.value));
    } catch {
      return fail([
        issue(
          "ASSET_INVALID_UTF8",
          `asset is not valid UTF-8: ${JSON.stringify(logicalPath)}`,
          logicalPath,
        ),
      ]);
    }
  };

  return {
    root: resolvedRoot,
    readBytes,
    readText,
    exists: (logicalPath: string) => readBytes(logicalPath).ok,
  };
}

/** The installed-package provider for the running package. */
export function createInstalledAssetProvider(
  packageRoot?: string,
): AssetProvider {
  return createAssetProvider(
    packageRoot ?? resolvePackageRoot(import.meta.url),
  );
}

/**
 * Explicit source-tree provider. This is an injection for tests/development
 * only; it is never selected as a hidden fallback by the installed provider.
 */
export function createSourceAssetProvider(sourceRoot: string): AssetProvider {
  return createAssetProvider(sourceRoot);
}
