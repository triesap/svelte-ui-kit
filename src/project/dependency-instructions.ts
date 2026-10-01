/**
 * Dependency installation instructions (S040).
 *
 * Renders an explicit, shell-safe installation command for the selected
 * package manager. It only *reports* what a developer should run: it never
 * executes a package manager and never edits a manifest, lockfile or
 * `node_modules`. Consumer runtime/peer requirements are separated from the
 * CLI's own tooling requirements, which are never installed into the consumer.
 *
 * Every operand is validated (package name plus npm SemVer range) and encoded
 * with a proven POSIX single-quote encoding, so `>=`, `||`, `*` and spaces are
 * always passed as one literal argument rather than shell operators. A shell
 * that cannot be established (for example Windows `cmd.exe`/PowerShell) is
 * never quoted for; the caller receives the validated structured operands plus
 * manual guidance instead.
 *
 * Manager evidence is the valid `packageManager` field when present; otherwise
 * exactly one recognized lockfile family in the selected package. A malformed or
 * unsupported explicit `packageManager` yields typed manual guidance, never a
 * guessed executable or a fallback to a stale lockfile.
 */
import path from "node:path";

import { valid, validRange } from "semver";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { isRegularFile, readJsonObject } from "./io.js";
import { findOwningWorkspaceRoot } from "./root.js";

export const PACKAGE_MANAGERS = ["pnpm", "npm", "yarn"] as const;
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export const LOCKFILE_MANAGERS = [
  { file: "pnpm-lock.yaml", manager: "pnpm" },
  { file: "package-lock.json", manager: "npm" },
  { file: "yarn.lock", manager: "yarn" },
] as const;

export interface ManagerEvidence {
  readonly manager: PackageManager | null;
  readonly source: "packageManager" | "lockfile" | "none" | "unsupported";
  /** Human-readable reason when the explicit evidence is unusable. */
  readonly reason: string | null;
}

export interface DependencyInstruction {
  readonly manager: PackageManager | null;
  readonly runtimeCommand: string | null;
  readonly peerCommand: string | null;
  /** Validated structured runtime operands (`name@range`). */
  readonly runtimePackages: readonly string[];
  /** Validated structured peer operands (`name@range`). */
  readonly peerPackages: readonly string[];
  /** Manual guidance when no supported manager/shell could be established. */
  readonly manual: string | null;
}

function isManager(value: string): value is PackageManager {
  return (PACKAGE_MANAGERS as readonly string[]).includes(value);
}

/**
 * Validate an explicit `packageManager` field. The npm spec requires
 * `name@version`; a missing/invalid version or an unsupported manager is
 * reported rather than accepted or silently ignored.
 */
function explicitManager(value: unknown): ManagerEvidence {
  if (typeof value !== "string") {
    return {
      manager: null,
      source: "unsupported",
      reason: "the packageManager field is not a string",
    };
  }
  const at = value.indexOf("@", 1);
  if (at <= 0 || at === value.length - 1) {
    return {
      manager: null,
      source: "unsupported",
      reason: `the packageManager field ${JSON.stringify(value)} is not of the form name@version`,
    };
  }
  const name = value.slice(0, at);
  const version = value.slice(at + 1);
  if (valid(version) === null) {
    return {
      manager: null,
      source: "unsupported",
      reason: `the packageManager version ${JSON.stringify(version)} is not a valid SemVer version`,
    };
  }
  if (!isManager(name)) {
    return {
      manager: null,
      source: "unsupported",
      reason: `the package manager ${JSON.stringify(name)} is not supported (pnpm, npm or yarn)`,
    };
  }
  return { manager: name, source: "packageManager", reason: null };
}

/** Lockfile families present as regular files at one root, in stable order. */
function lockfileManagers(root: string): PackageManager[] {
  return [
    ...new Set(
      LOCKFILE_MANAGERS.filter((entry) =>
        isRegularFile(path.join(root, entry.file)),
      ).map((entry) => entry.manager),
    ),
  ];
}

/**
 * Detect the selected package manager from explicit or lockfile evidence.
 *
 * Evidence is taken from the selected package first, then from its *proven*
 * owning workspace (a workspace that declares the package as a member). A
 * malformed or unsupported explicit `packageManager` field, and a malformed
 * selected manifest, are typed manual outcomes: they never fall back to a
 * stale lockfile or a guessed executable.
 */
export function detectPackageManager(
  root: string,
): ModelResult<ManagerEvidence> {
  const manifest = readJsonObject(path.join(root, "package.json"));
  if (manifest.kind === "unreadable") {
    return fail([
      issue(
        "DEPENDENCY_MANIFEST_UNREADABLE",
        `package.json could not be read (${manifest.code})`,
        "package.json",
      ),
    ]);
  }
  if (manifest.kind === "malformed") {
    return ok({
      manager: null,
      source: "unsupported",
      reason:
        "package.json is not valid JSON, so package manager evidence cannot be trusted",
    });
  }
  if (manifest.kind === "unsafe") {
    return ok({
      manager: null,
      source: "unsupported",
      reason:
        "package.json is not a regular file, so package manager evidence cannot be trusted",
    });
  }
  if (manifest.kind === "value" && "packageManager" in manifest.value) {
    return ok(explicitManager(manifest.value["packageManager"]));
  }

  const selected = lockfileManagers(root);
  if (selected.length === 1) {
    return ok({
      manager: selected[0] as PackageManager,
      source: "lockfile",
      reason: null,
    });
  }
  if (selected.length > 1) {
    return fail([
      issue(
        "DEPENDENCY_MANAGER_CONFLICTING",
        `multiple lockfile families are present (${selected.join(", ")}); remove the stale lockfile or declare a single packageManager, then install the required dependencies manually`,
        "package.json",
      ),
    ]);
  }

  const owner = findOwningWorkspaceRoot(root);
  if (owner !== null) {
    const ownerManifest = readJsonObject(path.join(owner, "package.json"));
    if (
      ownerManifest.kind === "value" &&
      "packageManager" in ownerManifest.value
    ) {
      return ok(explicitManager(ownerManifest.value["packageManager"]));
    }
    const ownerLockfiles = lockfileManagers(owner);
    if (ownerLockfiles.length === 1) {
      return ok({
        manager: ownerLockfiles[0] as PackageManager,
        source: "lockfile",
        reason: null,
      });
    }
    if (ownerLockfiles.length > 1) {
      return fail([
        issue(
          "DEPENDENCY_MANAGER_CONFLICTING",
          `multiple lockfile families are present in the owning workspace (${ownerLockfiles.join(", ")}); remove the stale lockfile or declare a single packageManager, then install the required dependencies manually`,
          "package.json",
        ),
      ]);
    }
  }

  return ok({ manager: null, source: "none", reason: null });
}

const PACKAGE_NAME =
  /^(?:@[A-Za-z0-9][A-Za-z0-9._-]*\/)?[A-Za-z0-9][A-Za-z0-9._-]*$/;

type ParsedOperand =
  | { readonly kind: "ok"; readonly spec: string }
  | { readonly kind: "invalid"; readonly reason: string };

/**
 * Parse and validate one `name`/`name@range` operand. A malformed name, an
 * option-like operand, a control byte or an invalid npm range is rejected.
 */
export function parseOperand(spec: string): ParsedOperand {
  // eslint-disable-next-line no-control-regex
  if (spec.length === 0 || /[\u0000-\u001f\u007f]/.test(spec)) {
    return { kind: "invalid", reason: "empty or contains a control byte" };
  }
  if (spec.startsWith("-")) {
    return {
      kind: "invalid",
      reason: "looks like an option rather than a package",
    };
  }
  const at = spec.indexOf("@", 1);
  const name = at === -1 ? spec : spec.slice(0, at);
  const range = at === -1 ? null : spec.slice(at + 1);
  if (!PACKAGE_NAME.test(name)) {
    return {
      kind: "invalid",
      reason: `invalid package name ${JSON.stringify(name)}`,
    };
  }
  if (range !== null && validRange(range) === null) {
    return {
      kind: "invalid",
      reason: `invalid npm range ${JSON.stringify(range)} for ${JSON.stringify(name)}`,
    };
  }
  return { kind: "ok", spec };
}

/** Proven POSIX single-quote encoding (validated specs contain no quote). */
function posixQuote(spec: string): string {
  return `'${spec}'`;
}

function commandFor(
  manager: PackageManager,
  specs: readonly string[],
): string | null {
  if (specs.length === 0) return null;
  const suffix = specs.map(posixQuote).join(" ");
  switch (manager) {
    case "pnpm":
      return `pnpm add ${suffix}`;
    case "npm":
      return `npm install ${suffix}`;
    case "yarn":
      return `yarn add ${suffix}`;
  }
}

export interface DependencyInstructionRequest {
  /** Consumer runtime dependency specs (`name`/`name@range`). */
  readonly runtime: readonly string[];
  /** Consumer peer dependency specs (`name`/`name@range`). */
  readonly peers: readonly string[];
  /** Established shell; defaults to POSIX on non-Windows hosts. */
  readonly shell?: "posix" | "unsupported";
}

function validateAll(specs: readonly string[]): {
  readonly specs: readonly string[];
  readonly issues: readonly ModelIssue[];
} {
  const validated: string[] = [];
  const issues: ModelIssue[] = [];
  for (const spec of specs) {
    const parsed = parseOperand(spec);
    if (parsed.kind === "invalid") {
      issues.push(
        issue(
          "DEPENDENCY_SPEC_UNSAFE",
          `dependency operand ${JSON.stringify(spec)} cannot be rendered safely: ${parsed.reason}`,
          "package.json",
        ),
      );
      continue;
    }
    validated.push(parsed.spec);
  }
  return { specs: validated, issues };
}

const TOOLING_NOTE =
  "Do not install the CLI's tooling dependencies into the consumer.";

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
  return renderWithManagerEvidence(evidence.value, [], request);
}

/**
 * Render installation instructions from captured manager evidence. Planning
 * uses this variant so a package-manager read is never repeated after the
 * invocation evidence was captured.
 */
export function renderDependencyInstructionsFromEvidence(
  manager: ManagerEvidence,
  managerIssues: readonly ModelIssue[],
  request: DependencyInstructionRequest,
): ModelResult<DependencyInstruction> {
  return renderWithManagerEvidence(manager, managerIssues, request);
}

function renderWithManagerEvidence(
  managerEvidence: ManagerEvidence,
  managerIssues: readonly ModelIssue[],
  request: DependencyInstructionRequest,
): ModelResult<DependencyInstruction> {
  if (managerIssues.length > 0) return fail(managerIssues);
  const manager = managerEvidence.manager;

  const runtime = validateAll(request.runtime);
  const peers = validateAll(request.peers);
  const issues = [...runtime.issues, ...peers.issues];
  if (issues.length > 0) return fail(issues);

  const shell =
    request.shell ?? (process.platform === "win32" ? "unsupported" : "posix");
  const manualFor = (lead: string): string => {
    const runtimeList = runtime.specs.join(" ") || "none";
    const peerList = peers.specs.join(" ") || "none";
    return `${lead} Install the consumer runtime dependencies manually: ${runtimeList}. Consumer peers: ${peerList}. ${TOOLING_NOTE}`;
  };

  if (manager === null) {
    const lead =
      managerEvidence.source === "unsupported"
        ? `${managerEvidence.reason}.`
        : "No supported package manager was proven for this package.";
    return ok({
      manager: null,
      runtimeCommand: null,
      peerCommand: null,
      runtimePackages: runtime.specs,
      peerPackages: peers.specs,
      manual: manualFor(lead),
    });
  }

  if (shell === "unsupported") {
    return ok({
      manager,
      runtimeCommand: null,
      peerCommand: null,
      runtimePackages: runtime.specs,
      peerPackages: peers.specs,
      manual: manualFor(
        `The shell could not be established, so no command is quoted for it; run the ${manager} command yourself.`,
      ),
    });
  }

  return ok({
    manager,
    runtimeCommand: commandFor(manager, runtime.specs),
    peerCommand: commandFor(manager, peers.specs),
    runtimePackages: runtime.specs,
    peerPackages: peers.specs,
    manual: null,
  });
}
