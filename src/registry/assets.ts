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
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
} from "node:fs";
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
  /** List regular files under an allowed directory prefix, sorted. */
  list(prefix?: string): ModelResult<readonly string[]>;
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

/**
 * Convert an ordinary filesystem failure into a typed logical diagnostic. Only
 * the errno code is reported, never the host path or stack in `error.message`,
 * so public output stays machine-independent and safe to print.
 */
function ioFailure(
  logicalPath: string,
  action: string,
  error: unknown,
): ModelIssue {
  const code = (error as NodeJS.ErrnoException | undefined)?.code;
  const cause = typeof code === "string" ? code : "UNKNOWN";
  return issue(
    "ASSET_IO_FAILURE",
    `could not ${action} ${JSON.stringify(logicalPath)} (${cause})`,
    logicalPath,
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

function isSafeDirPrefix(value: string): boolean {
  if (value === "") return true;
  if (value.startsWith("/") || value.includes("\\")) return false;
  const segments = value.split("/");
  if (
    !segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    )
  ) {
    return false;
  }
  return ASSET_ROOTS.some(
    (root) => value === root || value.startsWith(`${root}/`),
  );
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
    let stats: ReturnType<typeof lstatSync>;
    try {
      stats = lstatSync(absolute);
    } catch (error) {
      return fail([ioFailure(logicalPath, "stat", error)]);
    }
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
      return fail([ioFailure(logicalPath, "resolve", error)]);
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
    let bytes: Buffer;
    try {
      bytes = readFileSync(absolute);
    } catch (error) {
      return fail([ioFailure(logicalPath, "read", error)]);
    }
    return ok(new Uint8Array(bytes));
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

  const list = (prefix = "registry"): ModelResult<readonly string[]> => {
    if (!isSafeDirPrefix(prefix)) {
      return fail([
        issue(
          "ASSET_PATH_INVALID",
          `directory prefix must be under ${ASSET_ROOTS.join(" or ")}: ${JSON.stringify(prefix)}`,
        ),
      ]);
    }
    const base = prefix === "" ? resolvedRoot : resolve(resolvedRoot, prefix);
    if (base !== resolvedRoot && !contained(resolvedRoot, base)) {
      return fail([
        issue(
          "ASSET_PATH_INVALID",
          `directory prefix escapes the package root: ${prefix}`,
        ),
      ]);
    }
    // The traversal start and every ancestor down from the package root must be
    // real directories contained in the package: a symlinked start directory
    // must never be followed outside it.
    try {
      const relativeStart = relative(resolvedRoot, base);
      if (relativeStart !== "" && !relativeStart.startsWith("..")) {
        let current = resolvedRoot;
        for (const segment of relativeStart.split(sep)) {
          current = join(current, segment);
          let ancestor: ReturnType<typeof lstatSync>;
          try {
            ancestor = lstatSync(current);
          } catch (error) {
            if ((error as NodeJS.ErrnoException).code === "ENOENT") {
              return ok([]);
            }
            throw error;
          }
          if (ancestor.isSymbolicLink()) {
            return fail([
              issue(
                "ASSET_SYMLINK_ESCAPE",
                `directory prefix must not traverse a symlink: ${JSON.stringify(prefix)}`,
                prefix,
              ),
            ]);
          }
        }
      }
      if (!existsSync(base)) return ok([]);
      const baseStats = lstatSync(base);
      if (baseStats.isSymbolicLink()) {
        return fail([
          issue(
            "ASSET_SYMLINK_ESCAPE",
            `directory prefix must not be a symlink: ${JSON.stringify(prefix)}`,
            prefix,
          ),
        ]);
      }
      if (!baseStats.isDirectory()) {
        return fail([
          issue(
            "ASSET_NOT_DIRECTORY",
            `directory prefix is not a directory: ${JSON.stringify(prefix)}`,
            prefix,
          ),
        ]);
      }
      const realBase = realpathSync(base);
      if (!contained(realRoot(), realBase) && realBase !== realRoot()) {
        return fail([
          issue(
            "ASSET_SYMLINK_ESCAPE",
            `directory prefix resolves outside the package root: ${JSON.stringify(prefix)}`,
            prefix,
          ),
        ]);
      }

      const out: string[] = [];
      const walk = (dir: string, rel: string): void => {
        const entries = readdirSync(dir, { withFileTypes: true }).sort(
          (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
        );
        for (const entry of entries) {
          const abs = join(dir, entry.name);
          const stats = lstatSync(abs);
          if (stats.isSymbolicLink()) continue;
          const logical = rel === "" ? entry.name : `${rel}/${entry.name}`;
          if (stats.isDirectory()) walk(abs, logical);
          else if (stats.isFile()) out.push(logical);
        }
      };
      walk(base, prefix);
      return ok(out.sort());
    } catch (error) {
      return fail([ioFailure(prefix, "list", error)]);
    }
  };

  return {
    root: resolvedRoot,
    readBytes,
    readText,
    exists: (logicalPath: string) => readBytes(logicalPath).ok,
    list,
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
