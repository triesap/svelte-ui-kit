/**
 * Explicit project-root resolution (S036).
 *
 * The CLI must operate on exactly one application package and must never guess a
 * workspace sibling. Two selection modes exist:
 *
 * - an explicit `--cwd <path>` selects that package directly. An explicitly
 *   selected, *proven* application package is honored even when it also declares
 *   workspace members; a non-application workspace root is accepted only if the
 *   workspace resolves to exactly one proven application package, otherwise an
 *   actionable ambiguity or unsupported-syntax diagnostic is returned;
 * - without `--cwd`, the nearest enclosing package (walking upward from the
 *   invocation directory) is selected. Upward discovery never looks at sibling
 *   packages, but it does recognize an ambiguous workspace root.
 *
 * Membership inference only supports literal paths and a single trailing `/*`
 * wildcard, applies `!` exclusions, requires containment inside the workspace
 * root and requires actual SvelteKit application evidence. Deeper globs, `?`
 * and other glob constructs, escaping paths and unknown YAML/glob syntax
 * produce a typed diagnostic that instructs the developer to pass `--cwd`
 * rather than silently disappearing. Include and exclude patterns share the
 * same grammar, and a resolved member must be *physically* contained in the
 * workspace root, so a symlinked intermediate ancestor cannot select an
 * external application.
 *
 * Resolution is read-only. It inspects `package.json`/`pnpm-workspace.yaml`
 * metadata only; it never executes config or package scripts. Canonical root
 * identity, symlink policy and generated-target ancestry remain the later
 * filesystem gate (S041–S042); this module keeps the selected path explicit so
 * that gate can observe it.
 */
import { readFileSync, readdirSync, realpathSync } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { isRegularFile, observeEntry, readJsonObject } from "./io.js";

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

interface WorkspacePatterns {
  readonly include: readonly string[];
  readonly exclude: readonly string[];
}

type WorkspaceConfig =
  | { readonly kind: "none" }
  | { readonly kind: "patterns"; readonly patterns: WorkspacePatterns }
  | { readonly kind: "unsupported"; readonly reason: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ManifestPatterns =
  | { readonly kind: "none" }
  | { readonly kind: "patterns"; readonly patterns: WorkspacePatterns }
  | { readonly kind: "malformed"; readonly reason: string };

/** Read and validate the `workspaces` patterns declared by a package manifest. */
function manifestWorkspacePatterns(value: unknown): ManifestPatterns {
  if (value === undefined) return { kind: "none" };
  let entries: unknown;
  if (Array.isArray(value)) {
    entries = value;
  } else if (isRecord(value)) {
    entries = value["packages"];
    if (entries === undefined) {
      return {
        kind: "malformed",
        reason: "the `workspaces` object has no `packages` list",
      };
    }
  } else {
    return {
      kind: "malformed",
      reason: "`workspaces` must be an array or a `{ packages: [...] }` object",
    };
  }
  if (!Array.isArray(entries)) {
    return {
      kind: "malformed",
      reason: "`workspaces.packages` must be an array",
    };
  }
  for (const entry of entries) {
    if (typeof entry !== "string") {
      return {
        kind: "malformed",
        reason: "every `workspaces` entry must be a string",
      };
    }
  }
  const declared = entries as string[];
  const include = declared.filter((pattern) => !pattern.startsWith("!"));
  const exclude = declared
    .filter((pattern) => pattern.startsWith("!"))
    .map((pattern) => pattern.slice(1));
  return { kind: "patterns", patterns: { include, exclude } };
}

/**
 * Parse a `pnpm-workspace.yaml` `packages:` list. Only the supported simple
 * block-list form is accepted; inline flow arrays or unknown package entries
 * are reported as unsupported so the caller can request `--cwd` explicitly
 * instead of ignoring the file. A file without a `packages:` key has no
 * patterns.
 */
function pnpmWorkspacePatterns(abs: string): WorkspaceConfig {
  const entry = observeEntry(abs);
  if (entry.kind === "absent") return { kind: "none" };
  if (entry.kind === "unreadable") {
    return {
      kind: "unsupported",
      reason: `the file could not be read (${entry.code})`,
    };
  }
  if (entry.kind !== "file") {
    return { kind: "unsupported", reason: "the file is not a regular file" };
  }
  let text: string;
  try {
    text = readFileSync(abs, "utf8");
  } catch (error) {
    return {
      kind: "unsupported",
      reason: `the file could not be read (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
    };
  }

  const patterns: string[] = [];
  let inPackages = false;
  let sawPackages = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine;
    if (/^packages\s*:/.test(line)) {
      sawPackages = true;
      inPackages = true;
      const inline = line.replace(/^packages\s*:/, "").trim();
      if (inline.startsWith("[")) {
        return {
          kind: "unsupported",
          reason: "the `packages` value uses inline flow syntax",
        };
      }
      continue;
    }
    if (!inPackages) continue;
    if (line.trim() === "") continue;
    const match = line.match(/^\s+-\s+(.+?)\s*$/);
    if (match) {
      patterns.push(match[1].replace(/^['"]|['"]$/g, ""));
      continue;
    }
    if (!/^\s/.test(line)) break;
    return {
      kind: "unsupported",
      reason: "an unrecognized entry appears in the `packages` list",
    };
  }
  if (!sawPackages) return { kind: "none" };
  const include = patterns.filter((pattern) => !pattern.startsWith("!"));
  const exclude = patterns
    .filter((pattern) => pattern.startsWith("!"))
    .map((pattern) => pattern.slice(1));
  return { kind: "patterns", patterns: { include, exclude } };
}

/** Prefer manifest workspaces; otherwise read `pnpm-workspace.yaml`. */
function readWorkspaceConfig(root: string): WorkspaceConfig {
  const manifestObservation = readJsonObject(path.join(root, "package.json"));
  switch (manifestObservation.kind) {
    case "value": {
      const declared = manifestWorkspacePatterns(
        manifestObservation.value["workspaces"],
      );
      if (declared.kind === "malformed") {
        return { kind: "unsupported", reason: declared.reason };
      }
      if (
        declared.kind === "patterns" &&
        declared.patterns.include.length > 0
      ) {
        return { kind: "patterns", patterns: declared.patterns };
      }
      return pnpmWorkspacePatterns(path.join(root, "pnpm-workspace.yaml"));
    }
    case "malformed":
      return {
        kind: "unsupported",
        reason:
          "package.json is not valid JSON, so workspace membership cannot be proven",
      };
    case "unreadable":
      return {
        kind: "unsupported",
        reason: `package.json could not be read (${manifestObservation.code})`,
      };
    case "unsafe":
      return {
        kind: "unsupported",
        reason: "package.json is not a regular file",
      };
    case "absent":
      return pnpmWorkspacePatterns(path.join(root, "pnpm-workspace.yaml"));
  }
}

/** True when `abs` is strictly inside, or equal to, `root`. */
function isContained(root: string, abs: string): boolean {
  const relative = path.relative(root, abs);
  return (
    relative === "" ||
    (!path.isAbsolute(relative) &&
      relative !== ".." &&
      !relative.startsWith(`..${path.sep}`))
  );
}

/**
 * The reason a workspace pattern uses an unsupported glob shape, or `null` when
 * it is a literal path or a single trailing `/*`.
 */
function globUnsupportedReason(pattern: string): string | null {
  if (!/[*?[\]{}()]/.test(pattern)) return null;
  if (
    pattern.endsWith("/*") &&
    !/[*?[\]{}()]/.test(pattern.slice(0, -2)) &&
    !pattern.slice(0, -2).endsWith("/")
  ) {
    return null;
  }
  return "uses a glob shape other than a single trailing /*";
}

type ExpandedMembers =
  | { readonly kind: "members"; readonly members: readonly string[] }
  | { readonly kind: "unsupported"; readonly reason: string };

/**
 * Expand one workspace pattern. Only a literal path or a single trailing `/*`
 * wildcard is supported; anything else (including `?`, deeper globs and
 * escapes) is an unsupported pattern, never a silently dropped member. The
 * directory listing is a typed outcome, and a member that resolves outside the
 * *physical* workspace root is rejected.
 */
function expandWorkspacePattern(
  root: string,
  pattern: string,
  physicalRoot: string,
): ExpandedMembers {
  const globReason = globUnsupportedReason(pattern);
  if (globReason !== null) {
    return { kind: "unsupported", reason: globReason };
  }
  if (pattern.endsWith("/*")) {
    const base = path.resolve(root, pattern.slice(0, -2));
    if (!isContained(root, base)) {
      return { kind: "unsupported", reason: "escapes the workspace root" };
    }
    const baseEntry = observeEntry(base);
    if (baseEntry.kind === "absent") return { kind: "members", members: [] };
    if (baseEntry.kind !== "directory") {
      return {
        kind: "unsupported",
        reason: "the wildcard base is not a real directory",
      };
    }
    if (!isPhysicallyContained(physicalRoot, base)) {
      return {
        kind: "unsupported",
        reason: "the wildcard base resolves outside the workspace root",
      };
    }
    let names: string[];
    try {
      names = readdirSync(base);
    } catch (error) {
      return {
        kind: "unsupported",
        reason: `the wildcard base could not be listed (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
      };
    }
    return {
      kind: "members",
      members: names.sort().map((name) => path.join(base, name)),
    };
  }
  const resolved = path.resolve(root, pattern);
  if (!isContained(root, resolved)) {
    return { kind: "unsupported", reason: "escapes the workspace root" };
  }
  return { kind: "members", members: [resolved] };
}

/** True when `abs` physically resolves inside `physicalRoot`. */
function isPhysicallyContained(physicalRoot: string, abs: string): boolean {
  let real: string;
  try {
    real = realpathSync(abs);
  } catch {
    return false;
  }
  return isContained(physicalRoot, real);
}

/** True when a member path matches one literal or trailing-wildcard pattern. */
function memberMatches(root: string, pattern: string, abs: string): boolean {
  if (pattern.endsWith("/*")) {
    const base = path.resolve(root, pattern.slice(0, -2));
    return path.dirname(abs) === base;
  }
  return path.resolve(root, pattern) === abs;
}

/**
 * A proven application package: a real (non-symlink) directory containing a
 * regular `package.json` that declares `@sveltejs/kit`. An ordinary library
 * package does not count.
 */
function isApplicationPackage(abs: string): boolean {
  if (observeEntry(abs).kind !== "directory") return false;
  const manifest = readJsonObject(path.join(abs, "package.json"));
  if (manifest.kind !== "value") return false;
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const record = manifest.value[field];
    if (isRecord(record) && "@sveltejs/kit" in record) return true;
  }
  return false;
}

interface WorkspaceResolution {
  readonly members: readonly string[];
  readonly issues: readonly ModelIssue[];
}

/** Resolve workspace application members, collecting typed diagnostics. */
function workspaceMembers(
  root: string,
  config: WorkspacePatterns,
  physicalRoot: string,
): WorkspaceResolution {
  const issues: ModelIssue[] = [];
  const members: string[] = [];
  for (const pattern of config.include) {
    const expanded = expandWorkspacePattern(root, pattern, physicalRoot);
    if (expanded.kind === "unsupported") {
      issues.push(
        issue(
          "PROJECT_WORKSPACE_UNSUPPORTED",
          `workspace pattern ${JSON.stringify(pattern)} ${expanded.reason}; supported patterns are literal paths and a single trailing /*. Pass --cwd for the exact application package`,
          "package.json",
        ),
      );
      continue;
    }
    for (const candidate of expanded.members) {
      if (!isApplicationPackage(candidate)) continue;
      if (!isPhysicallyContained(physicalRoot, candidate)) {
        issues.push(
          issue(
            "PROJECT_WORKSPACE_UNSUPPORTED",
            `workspace member ${JSON.stringify(path.relative(root, candidate))} resolves outside the workspace root; pass --cwd for the exact application package`,
            "package.json",
          ),
        );
        continue;
      }
      const excluded = config.exclude.some((pattern) =>
        memberMatches(root, pattern, candidate),
      );
      if (excluded) continue;
      members.push(candidate);
    }
  }
  for (const pattern of config.exclude) {
    const globReason = globUnsupportedReason(pattern);
    if (globReason !== null) {
      issues.push(
        issue(
          "PROJECT_WORKSPACE_UNSUPPORTED",
          `workspace exclusion ${JSON.stringify(pattern)} ${globReason}; supported exclusions are literal paths and a single trailing /*. Pass --cwd for the exact application package`,
          "package.json",
        ),
      );
    }
  }
  return { members: [...new Set(members)].sort(), issues };
}

/** True when a workspace at `root` declares `target` as one of its members. */
function workspaceDeclaresMember(
  root: string,
  config: WorkspacePatterns,
  target: string,
): boolean {
  const canonical = canonicalRoot(root);
  if (!canonical.ok) return false;
  for (const pattern of config.include) {
    const expanded = expandWorkspacePattern(root, pattern, canonical.value);
    if (expanded.kind !== "members") continue;
    for (const member of expanded.members) {
      if (path.resolve(member) !== target) continue;
      if (!isPhysicallyContained(canonical.value, member)) continue;
      if (
        config.exclude.some((exclude) => memberMatches(root, exclude, member))
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

/**
 * Find the nearest ancestor that *proves* it owns `packageRoot` by declaring
 * it as a workspace member. Only proven membership is returned, so unrelated
 * ancestors are never treated as a manager evidence source.
 */
export function findOwningWorkspaceRoot(packageRoot: string): string | null {
  const target = path.resolve(packageRoot);
  let current = path.dirname(target);
  for (;;) {
    const config = readWorkspaceConfig(current);
    if (
      config.kind === "patterns" &&
      workspaceDeclaresMember(current, config.patterns, target)
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
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
  const manifest = readJsonObject(path.join(root, "package.json"));
  if (manifest.kind !== "value") return null;
  const name = manifest.value["name"];
  return typeof name === "string" ? name : null;
}

/** Canonicalize the workspace root, or report a typed reason. */
function canonicalRoot(root: string): ModelResult<string> {
  try {
    return ok(realpathSync(root));
  } catch (error) {
    return fail([
      issue(
        "PROJECT_WORKSPACE_UNSUPPORTED",
        `the workspace root could not be resolved to its canonical path (${(error as NodeJS.ErrnoException | null)?.code ?? "EIO"})`,
        "package.json",
      ),
    ]);
  }
}

/** Resolve a workspace root to exactly one application package. */
function resolveWorkspaceRoot(
  root: string,
  config: WorkspacePatterns,
  cwdValue: string | null,
): ModelResult<ResolvedProjectRoot> {
  const canonical = canonicalRoot(root);
  if (!canonical.ok) return canonical;
  const resolution = workspaceMembers(root, config, canonical.value);
  if (resolution.issues.length > 0) return fail(resolution.issues);
  if (resolution.members.length === 0) {
    return fail([
      issue(
        "PROJECT_PACKAGE_NOT_FOUND",
        cwdValue !== null
          ? `--cwd ${JSON.stringify(cwdValue)} is a workspace root with no application package members`
          : "the selected workspace root has no application package members",
        cwdValue ?? undefined,
      ),
    ]);
  }
  if (resolution.members.length > 1) {
    return fail([
      issue(
        "PROJECT_AMBIGUOUS_WORKSPACE",
        cwdValue !== null
          ? `--cwd ${JSON.stringify(cwdValue)} resolves to ${resolution.members.length} application packages; pass --cwd for the exact application package`
          : `the selected workspace root resolves to ${resolution.members.length} application packages; pass --cwd for the exact application package`,
        cwdValue ?? undefined,
      ),
    ]);
  }
  const member = resolution.members[0] as string;
  return ok({
    root: member,
    selectedBy: cwdValue !== null ? "cwd" : "nearest",
    packageName: packageName(member),
    workspaceRoot: root,
  });
}

/**
 * Resolve exactly one application package root from `--cwd`/invocation
 * directory. Returns typed diagnostics for a missing path, missing package, an
 * ambiguous workspace root or unsupported workspace syntax.
 */
export function resolveProjectRoot(
  options: ResolveProjectRootOptions = {},
): ModelResult<ResolvedProjectRoot> {
  const invocationDir = path.resolve(options.invocationDir ?? process.cwd());

  if (options.cwd != null) {
    const selected = path.resolve(invocationDir, options.cwd);
    const entry = observeEntry(selected);
    if (entry.kind === "absent") {
      return fail([
        issue(
          "PROJECT_CWD_NOT_FOUND",
          `--cwd ${JSON.stringify(options.cwd)} is not an existing directory`,
          options.cwd,
        ),
      ]);
    }
    if (entry.kind !== "directory") {
      return fail([
        issue(
          "PROJECT_CWD_NOT_FOUND",
          `--cwd ${JSON.stringify(options.cwd)} is not a real directory (it is absent, a symlink or a non-directory entry)`,
          options.cwd,
        ),
      ]);
    }
    // An explicitly selected proven application is honored even when it also
    // declares workspace members; workspace inference only fills the gap for a
    // directory that is not itself an application package.
    if (isApplicationPackage(selected)) {
      return ok({
        root: selected,
        selectedBy: "cwd",
        packageName: packageName(selected),
        workspaceRoot: null,
      });
    }
    const config = readWorkspaceConfig(selected);
    if (config.kind === "unsupported") {
      return fail([
        issue(
          "PROJECT_WORKSPACE_UNSUPPORTED",
          `the workspace configuration could not be interpreted: ${config.reason}; pass --cwd for the exact application package`,
          options.cwd,
        ),
      ]);
    }
    if (config.kind === "patterns") {
      return resolveWorkspaceRoot(selected, config.patterns, options.cwd);
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
  const config = readWorkspaceConfig(nearest);
  if (config.kind === "unsupported") {
    return fail([
      issue(
        "PROJECT_WORKSPACE_UNSUPPORTED",
        `the workspace configuration could not be interpreted: ${config.reason}; pass --cwd for the exact application package`,
      ),
    ]);
  }
  if (config.kind === "patterns") {
    const canonical = canonicalRoot(nearest);
    if (!canonical.ok) return canonical;
    const resolution = workspaceMembers(
      nearest,
      config.patterns,
      canonical.value,
    );
    if (resolution.issues.length > 0) return fail(resolution.issues);
    if (resolution.members.length > 1) {
      return fail([
        issue(
          "PROJECT_AMBIGUOUS_WORKSPACE",
          `the selected workspace root resolves to ${resolution.members.length} application packages; pass --cwd for the exact application package`,
        ),
      ]);
    }
    if (resolution.members.length === 1) {
      const member = resolution.members[0] as string;
      return ok({
        root: member,
        selectedBy: "nearest",
        packageName: packageName(member),
        workspaceRoot: nearest,
      });
    }
  }
  return ok({
    root: nearest,
    selectedBy: "nearest",
    packageName: packageName(nearest),
    workspaceRoot: null,
  });
}
