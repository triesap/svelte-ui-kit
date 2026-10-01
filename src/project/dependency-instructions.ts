/**
 * Dependency installation instructions (S040).
 *
 * Renders an explicit, shell-safe installation command for the selected
 * package manager. It only *reports* what a developer should run: it never
 * executes a package manager and never edits a manifest, lockfile or
 * `node_modules`. Consumer runtime/peer requirements are separated from the
 * CLI's own tooling requirements, which are never installed into the consumer.
 *
 * Manager evidence is the valid `packageManager` field when present; otherwise
 * exactly one recognized lockfile family in the selected package. Unsupported
 * or conflicting evidence returns an actionable manual instruction instead of a
 * guessed executable command.
 */
import { lstatSync, readFileSync, type Stats } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";

export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const LOCKFILE_MANAGERS = [
  { file: "pnpm-lock.yaml", manager: "pnpm" },
  { file: "package-lock.json", manager: "npm" },
  { file: "yarn.lock", manager: "yarn" },
] as const;

export interface ManagerEvidence {
  readonly manager: PackageManager | null;
  readonly source: "packageManager" | "lockfile" | "none";
}

export interface DependencyInstruction {
  readonly manager: PackageManager;
  readonly runtimeCommand: string | null;
  readonly peerCommand: string | null;
  /** Manual guidance when no supported manager could be proven. */
  readonly manual: string | null;
}

function lstatOrNull(abs: string): Stats | null {
  try {
    return lstatSync(abs);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  }
}

function isRegularFile(abs: string): boolean {
  const stats = lstatOrNull(abs);
  return stats !== null && stats.isFile();
}

function isManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/** Read the `packageManager` field from a manifest, if it names a supported one. */
function manifestManager(root: string): PackageManager | null {
  const manifestAbs = path.join(root, "package.json");
  if (!isRegularFile(manifestAbs)) return null;
  try {
    const parsed: unknown = JSON.parse(readFileSync(manifestAbs, "utf8"));
    const field =
      typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)["packageManager"]
        : undefined;
    if (typeof field !== "string") return null;
    const name = field.split("@")[0];
    return isManager(name) ? name : null;
  } catch {
    return null;
  }
}

/** Proof that reads the packageManager field without a manifest write. */
export function detectPackageManager(
  root: string,
): ModelResult<ManagerEvidence> {
  const declared = manifestManager(root);
  if (declared) return ok({ manager: declared, source: "packageManager" });

  const found = LOCKFILE_MANAGERS.filter((entry) =>
    isRegularFile(path.join(root, entry.file)),
  ).map((entry) => entry.manager);
  const unique = [...new Set(found)];
  if (unique.length === 1) {
    return ok({ manager: unique[0] as PackageManager, source: "lockfile" });
  }
  if (unique.length > 1) {
    return fail([
      issue(
        "DEPENDENCY_MANAGER_CONFLICTING",
        `multiple lockfile families are present (${found.join(", ")}); remove the stale lockfile or declare a single packageManager, then install the required dependencies manually`,
        "package.json",
      ),
    ]);
  }
  return ok({ manager: null, source: "none" });
}

const SAFE_SPEC = /^[A-Za-z0-9@/._^~<>=|*:+-]+$/;

/** Validate and shell-quote one `name@range` install spec. */
function quoteSpec(spec: string): string | null {
  // eslint-disable-next-line no-control-regex
  if (spec.length === 0 || /[\u0000-\u001f\u007f]/.test(spec)) return null;
  if (SAFE_SPEC.test(spec)) return spec;
  if (spec.includes("'")) return null;
  return `'${spec}'`;
}

function commandFor(
  manager: PackageManager,
  specs: readonly string[],
  dev: boolean,
): string | null {
  const quoted: string[] = [];
  for (const spec of specs) {
    const value = quoteSpec(spec);
    if (value === null) return null;
    quoted.push(value);
  }
  if (quoted.length === 0) return null;
  const suffix = quoted.join(" ");
  switch (manager) {
    case "pnpm":
      return `pnpm add${dev ? " -D" : ""} ${suffix}`;
    case "npm":
      return `npm install${dev ? " -D" : ""} ${suffix}`;
    case "yarn":
      return `yarn add${dev ? " -D" : ""} ${suffix}`;
  }
}

export interface DependencyInstructionRequest {
  /** Consumer runtime dependency specs (`name@range`). */
  readonly runtime: readonly string[];
  /** Consumer peer dependency specs (`name@range`). */
  readonly peers: readonly string[];
}

/**
 * Render the explicit installation instructions for the selected package.
 * Reporting only: no package manager is executed and no file is written.
 */
export function renderDependencyInstructions(
  root: string,
  request: DependencyInstructionRequest,
): ModelResult<DependencyInstruction> {
  const evidence = detectPackageManager(root);
  if (!evidence.ok) return evidence;
  const manager = evidence.value.manager;
  const issues: ModelIssue[] = [];

  if (manager === null) {
    const all = [...request.runtime, ...request.peers];
    return ok({
      manager: "npm",
      runtimeCommand: null,
      peerCommand: null,
      manual: `No supported package manager was proven for this package. Install the required consumer dependencies manually: ${all.join(", ") || "none"}. Do not install the CLI's tooling dependencies into the consumer.`,
    });
  }

  const runtimeCommand = commandFor(manager, request.runtime, false);
  const peerCommand = commandFor(manager, request.peers, false);
  if (request.runtime.length > 0 && runtimeCommand === null) {
    issues.push(
      issue(
        "DEPENDENCY_SPEC_UNSAFE",
        "a runtime dependency spec contains unsupported characters and cannot be rendered safely",
        "package.json",
      ),
    );
  }
  if (request.peers.length > 0 && peerCommand === null) {
    issues.push(
      issue(
        "DEPENDENCY_SPEC_UNSAFE",
        "a peer dependency spec contains unsupported characters and cannot be rendered safely",
        "package.json",
      ),
    );
  }
  if (issues.length > 0) return fail(issues);

  return ok({
    manager,
    runtimeCommand,
    peerCommand,
    manual: null,
  });
}
