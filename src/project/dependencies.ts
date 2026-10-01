/**
 * Consumer dependency state inspection (S038).
 *
 * Reads the selected package's declared dependency ranges and the *installed*
 * package metadata separately, then reports whether each requirement is ready,
 * merely undeclared, not installed or incompatible. The inspection uses the
 * package resolution context (a hoisted `node_modules/<name>/package.json`);
 * pnpm/hoisting links are read as evidence only and never authorize generated
 * target traversal or writes. It never executes a package manager, edits a
 * manifest/lockfile or requires hidden source-checkout state.
 */
import { lstatSync, readFileSync, type Stats } from "node:fs";
import path from "node:path";
import { satisfies, validRange } from "semver";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";

export const DECLARATION_FIELDS = [
  "dependencies",
  "devDependencies",
  "peerDependencies",
] as const;
export type DeclarationField = (typeof DECLARATION_FIELDS)[number];

/** One dependency requirement to assess (typically from the resolved closure). */
export interface DependencyRequirement {
  readonly name: string;
  readonly range: string;
}

export type DependencyStatus =
  "ready" | "missing_install" | "missing_declaration" | "incompatible";

export interface DependencyStateEntry {
  readonly name: string;
  readonly requiredRange: string;
  readonly declaredRange: string | null;
  readonly declaredField: DeclarationField | null;
  readonly installedVersion: string | null;
  readonly status: DependencyStatus;
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

function readJsonObject(abs: string): Record<string, unknown> | null {
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

/** Read the selected package's declared range for `name`, with its field. */
function declaredRange(
  manifest: Record<string, unknown> | null,
  name: string,
): { range: string | null; field: DeclarationField | null } {
  if (manifest) {
    for (const field of DECLARATION_FIELDS) {
      const record = manifest[field];
      if (
        typeof record === "object" &&
        record !== null &&
        !Array.isArray(record)
      ) {
        const value = (record as Record<string, unknown>)[name];
        if (typeof value === "string") return { range: value, field };
      }
    }
  }
  return { range: null, field: null };
}

/** Read an installed package version from the resolution context, if present. */
export function installedVersion(root: string, name: string): string | null {
  const manifest = readJsonObject(
    path.join(root, "node_modules", ...name.split("/"), "package.json"),
  );
  const version = manifest?.["version"];
  return typeof version === "string" ? version : null;
}

/**
 * Inspect declared/installed state for every requirement. An installed version
 * that does not satisfy the required range is `incompatible`; a declared but
 * uninstalled package is `missing_install`; an undeclared, uninstalled package
 * is `missing_declaration`; otherwise `ready`. A malformed required range or an
 * unparseable installed version is reported as a typed issue.
 */
export function inspectDependencyState(
  root: string,
  requirements: readonly DependencyRequirement[],
): ModelResult<readonly DependencyStateEntry[]> {
  const manifest = readJsonObject(path.join(root, "package.json"));
  const issues: ModelIssue[] = [];
  const entries: DependencyStateEntry[] = [];

  for (const requirement of requirements) {
    if (validRange(requirement.range) === null) {
      issues.push(
        issue(
          "DEPENDENCY_RANGE_INVALID",
          `required range ${JSON.stringify(requirement.range)} for ${JSON.stringify(requirement.name)} is not a valid npm SemVer range`,
          "package.json",
        ),
      );
      continue;
    }
    const declared = declaredRange(manifest, requirement.name);
    const installed = installedVersion(root, requirement.name);
    let status: DependencyStatus;
    if (declared.range === null && installed === null) {
      status = "missing_declaration";
    } else if (installed === null) {
      status = "missing_install";
    } else if (
      !satisfies(installed, requirement.range, { includePrerelease: true })
    ) {
      status = "incompatible";
    } else {
      status = "ready";
    }
    entries.push({
      name: requirement.name,
      requiredRange: requirement.range,
      declaredRange: declared.range,
      declaredField: declared.field,
      installedVersion: installed,
      status,
    });
  }

  if (issues.length > 0) return fail(issues);
  return ok(entries);
}
