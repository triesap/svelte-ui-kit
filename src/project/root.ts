/**
 * Explicit project-root resolution (S036).
 *
 * The CLI must operate on exactly one application package and must never guess a
 * workspace sibling. Two selection modes exist:
 *
 * - an explicit `--cwd <path>` selects that package directly; when the path is
 *   a workspace root it is accepted only if the workspace resolves to exactly
 *   one application package, otherwise an actionable ambiguity diagnostic is
 *   returned;
 * - without `--cwd`, the nearest enclosing package (walking upward from the
 *   invocation directory) is selected. Upward discovery never looks at
 *   sibling packages.
 *
 * Resolution is read-only. It inspects `package.json`/`pnpm-workspace.yaml`
 * metadata only; it never executes config or package scripts. Canonical root
 * identity, symlink policy and generated-target ancestry remain the later
 * filesystem gate (S041–S042); this module keeps the selected path explicit so
 * that gate can observe it.
 */
import { lstatSync, readFileSync, readdirSync, type Stats } from "node:fs";
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export type RootSelection = "cwd" | "nearest";

export interface ResolvedProjectRoot {
  /** Absolute selected package root (runtime value, never a diagnostic locator). */
  readonly root: string;
  readonly selectedBy: RootSelection;
  readonly packageName: string | null;
  /** Absolute workspace root when the selection came from a workspace. */
  readonly workspaceRoot: string | null;
}

export interface ResolveProjectRootOptions {
  /** Explicit `--cwd` value, already parsed by the CLI grammar. */
  readonly cwd?: string | null;
  /** Invocation directory (defaults to `process.cwd()`); never mutated. */
  readonly invocationDir?: string;
}

function lstatOrNull(abs: string): Stats | null {
  try {
    return lstatSync(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function isRealDirectory(abs: string): boolean {
  const stats = lstatOrNull(abs);
  return stats !== null && stats.isDirectory();
}

function isRegularFile(abs: string): boolean {
  const stats = lstatOrNull(abs);
  return stats !== null && stats.isFile();
}

function readManifest(abs: string): Record<string, unknown> | null {
  if (!isRegularFile(abs)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(abs, "utf8"));
    return typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

/** Read the `workspaces` patterns declared by a package manifest. */
function manifestWorkspacePatterns(
  manifest: Record<string, unknown>,
): string[] | null {
  const value = manifest["workspaces"];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "object" && value !== null) {
    const packages = (value as Record<string, unknown>)["packages"];
    if (Array.isArray(packages)) {
      return packages.filter(
        (entry): entry is string => typeof entry === "string",
      );
    }
  }
  return null;
}

/** Read simple `- pattern` entries from a `pnpm-workspace.yaml` file. */
function pnpmWorkspacePatterns(abs: string): string[] | null {
  if (!isRegularFile(abs)) return null;
  const patterns: string[] = [];
  let inPackages = false;
  for (const line of readFileSync(abs, "utf8").split(/\r?\n/)) {
    if (/^packages\s*:/.test(line)) {
      inPackages = true;
      continue;
    }
    if (!inPackages) continue;
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (match) {
      patterns.push(match[1].replace(/^['"]|['"]$/g, ""));
      continue;
    }
    if (line.trim() !== "" && !/^\s/.test(line)) break;
  }
  return patterns.length > 0 ? patterns : null;
}

function workspacePatterns(root: string): string[] | null {
  const manifest = readManifest(path.join(root, "package.json"));
  const fromManifest = manifest ? manifestWorkspacePatterns(manifest) : null;
  if (fromManifest && fromManifest.length > 0) return fromManifest;
  return pnpmWorkspacePatterns(path.join(root, "pnpm-workspace.yaml"));
}

/**
 * Expand one workspace pattern to candidate member directories. Only literal
 * paths and a single trailing `/*` segment are expanded; an unsupported deeper
 * glob contributes no members rather than silently matching something.
 */
function expandWorkspacePattern(root: string, pattern: string): string[] {
  const clean = pattern.replace(/^!/, "");
  if (!clean.includes("*")) {
    return [path.resolve(root, clean)];
  }
  if (clean.endsWith("/*")) {
    const base = path.resolve(root, clean.slice(0, -2));
    if (!isRealDirectory(base)) return [];
    return readdirSync(base)
      .sort()
      .map((name) => path.join(base, name))
      .filter((candidate) => isRealDirectory(candidate));
  }
  return [];
}

/** Application packages reachable from a workspace root, deterministically. */
function workspaceMembers(root: string): string[] {
  const patterns = workspacePatterns(root);
  if (!patterns) return [];
  const members = new Set<string>();
  for (const pattern of patterns) {
    for (const candidate of expandWorkspacePattern(root, pattern)) {
      if (isRegularFile(path.join(candidate, "package.json"))) {
        members.add(candidate);
      }
    }
  }
  return [...members].sort();
}

/** Resolve the nearest enclosing package by walking strictly upward. */
function nearestPackageDir(startDir: string): string | null {
  let current = path.resolve(startDir);
  for (;;) {
    if (isRegularFile(path.join(current, "package.json"))) return current;
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function packageName(root: string): string | null {
  const manifest = readManifest(path.join(root, "package.json"));
  const name = manifest?.["name"];
  return typeof name === "string" ? name : null;
}

/**
 * Resolve exactly one application package root from `--cwd`/invocation
 * directory. Returns typed diagnostics for a missing path, missing package or
 * an ambiguous workspace root with more than one application member.
 */
export function resolveProjectRoot(
  options: ResolveProjectRootOptions = {},
): ModelResult<ResolvedProjectRoot> {
  const invocationDir = path.resolve(options.invocationDir ?? process.cwd());

  if (options.cwd != null) {
    const selected = path.resolve(invocationDir, options.cwd);
    if (!isRealDirectory(selected)) {
      return fail([
        issue(
          "PROJECT_CWD_NOT_FOUND",
          `--cwd ${JSON.stringify(options.cwd)} is not an existing directory`,
          options.cwd,
        ),
      ]);
    }
    const patterns = workspacePatterns(selected);
    if (patterns) {
      const members = workspaceMembers(selected);
      if (members.length === 0) {
        return fail([
          issue(
            "PROJECT_PACKAGE_NOT_FOUND",
            `--cwd ${JSON.stringify(options.cwd)} is a workspace root with no application package members`,
            options.cwd,
          ),
        ]);
      }
      if (members.length > 1) {
        return fail([
          issue(
            "PROJECT_AMBIGUOUS_WORKSPACE",
            `--cwd ${JSON.stringify(options.cwd)} resolves to ${members.length} application packages; pass --cwd for the exact application package`,
            options.cwd,
          ),
        ]);
      }
      const member = members[0] as string;
      return ok({
        root: member,
        selectedBy: "cwd",
        packageName: packageName(member),
        workspaceRoot: selected,
      });
    }
    if (!isRegularFile(path.join(selected, "package.json"))) {
      return fail([
        issue(
          "PROJECT_PACKAGE_NOT_FOUND",
          `--cwd ${JSON.stringify(options.cwd)} does not contain a package.json`,
          options.cwd,
        ),
      ]);
    }
    return ok({
      root: selected,
      selectedBy: "cwd",
      packageName: packageName(selected),
      workspaceRoot: null,
    });
  }

  const nearest = nearestPackageDir(invocationDir);
  if (nearest === null) {
    return fail([
      issue(
        "PROJECT_PACKAGE_NOT_FOUND",
        `no enclosing package.json was found above the invocation directory; run inside a SvelteKit application package or pass --cwd`,
      ),
    ]);
  }
  return ok({
    root: nearest,
    selectedBy: "nearest",
    packageName: packageName(nearest),
    workspaceRoot: null,
  });
}
