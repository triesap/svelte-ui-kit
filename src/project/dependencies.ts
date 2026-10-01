/**
 * Consumer dependency state and peer inspection (S038–S039).
 *
 * Reads the selected package's declared ranges and the *installed* package
 * metadata separately, then reports whether each requirement is ready, merely
 * undeclared, not installed, declaration-incompatible or install-incompatible.
 * Readiness requires all three of:
 *
 * 1. explicit declaration evidence in the selected package (an installed or
 *    hoisted dependency does not itself declare the dependency);
 * 2. a genuine compatible intersection between the required range and the
 *    declared range (the declared range need not be a subset); and
 * 3. an installed version that satisfies that joint intersection, using
 *    ordinary strict npm prerelease semantics (a `-beta` never satisfies `^5`
 *    just because prereleases were globally enabled).
 *
 * Installed lookup walks the selected package's actual resolution context
 * (nearest `node_modules`, then ancestors), so a hoisted or pnpm-linked install
 * is found without executing package code or falling back to the CLI author's
 * checkout. Malformed installed metadata and package-identity mismatches are
 * typed invalid evidence, never absence.
 *
 * `validatePeerDependencies` combines the resolved registry peer requirements
 * with the *actual* installed upstream `peerDependencies` metadata of every
 * selected package; a required peer that is missing or incompatible is a typed
 * conflict, and a missing upstream installation never fabricates a successful
 * audit. Actual optional upstream peers are only required when the registry
 * does not independently require that package.
 */
import path from "node:path";

import { satisfies, valid, validRange } from "semver";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { intersectRangesDetailed } from "../registry/dependency-plan.js";
import type { DependencyPlan } from "../registry/dependency-plan.js";
import { readJsonObject } from "./io.js";

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
  | "ready"
  | "missing_declaration"
  | "missing_install"
  | "declaration_incompatible"
  | "install_incompatible";

export interface DependencyStateEntry {
  readonly name: string;
  readonly requiredRange: string;
  readonly declaredRange: string | null;
  readonly declaredField: DeclarationField | null;
  readonly installedVersion: string | null;
  readonly status: DependencyStatus;
}

/** A typed observation of one installed package in the resolution context. */
export type InstalledObservation =
  | { readonly kind: "absent" }
  | { readonly kind: "unsafe" }
  | { readonly kind: "unreadable"; readonly code: string }
  | { readonly kind: "malformed" }
  | {
      readonly kind: "value";
      readonly version: string;
      readonly manifest: Record<string, unknown>;
    };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Find the nearest installed manifest for `name` in the selected package's
 * resolution context. The walk starts at `root/node_modules/<name>` and
 * proceeds to each ancestor's `node_modules`, matching npm/hoisting/pnpm
 * resolution. Only the final `package.json` component is observed for
 * regularity; a symlinked `node_modules/<name>` directory (a pnpm link) is
 * followed read-only by the operating system.
 */
export function observeInstalled(
  root: string,
  name: string,
): InstalledObservation {
  const segments = name.split("/").filter((segment) => segment !== "");
  if (
    segments.length === 0 ||
    segments.some((segment) => segment === ".." || segment === ".")
  ) {
    return { kind: "malformed" };
  }
  let current = path.resolve(root);
  for (;;) {
    const observation = readJsonObject(
      path.join(current, "node_modules", ...segments, "package.json"),
    );
    if (observation.kind === "value") {
      const manifest = observation.value;
      const version = manifest["version"];
      const manifestName = manifest["name"];
      if (typeof manifestName !== "string" || manifestName !== name) {
        return { kind: "malformed" };
      }
      if (typeof version !== "string" || valid(version) === null) {
        return { kind: "malformed" };
      }
      return { kind: "value", version, manifest };
    }
    if (observation.kind !== "absent") return observation;
    const parent = path.dirname(current);
    if (parent === current) return { kind: "absent" };
    current = parent;
  }
}

/** The installed version found in the resolution context, if any. */
export function installedVersion(root: string, name: string): string | null {
  const observation = observeInstalled(root, name);
  return observation.kind === "value" ? observation.version : null;
}

interface Declaration {
  readonly range: string | null;
  readonly field: DeclarationField | null;
  readonly malformed: boolean;
}

/** Read the selected package's declared range for `name`, with its field. */
function declaredRange(
  manifest: Record<string, unknown> | null,
  name: string,
): Declaration {
  if (manifest) {
    for (const field of DECLARATION_FIELDS) {
      const record = manifest[field];
      if (!isRecord(record)) continue;
      if (!(name in record)) continue;
      const value = record[name];
      if (typeof value !== "string") {
        return { range: null, field, malformed: true };
      }
      return { range: value, field, malformed: false };
    }
  }
  return { range: null, field: null, malformed: false };
}

/**
 * Inspect declared/installed state for every requirement. Readiness needs an
 * explicit declaration, a compatible declared/required intersection and an
 * installed version inside that intersection. Invalid required/declared ranges
 * and invalid installed metadata are typed issues.
 */
export function inspectDependencyState(
  root: string,
  requirements: readonly DependencyRequirement[],
): ModelResult<readonly DependencyStateEntry[]> {
  const manifestObservation = readJsonObject(path.join(root, "package.json"));
  const issues: ModelIssue[] = [];
  if (manifestObservation.kind === "unreadable") {
    return fail([
      issue(
        "DEPENDENCY_MANIFEST_UNREADABLE",
        `package.json could not be read (${manifestObservation.code})`,
        "package.json",
      ),
    ]);
  }
  if (manifestObservation.kind === "unsafe") {
    return fail([
      issue(
        "DEPENDENCY_MANIFEST_UNSAFE",
        "package.json is not a regular file; refusing to read a symlink or nonregular manifest",
        "package.json",
      ),
    ]);
  }
  if (manifestObservation.kind === "malformed") {
    return fail([
      issue(
        "DEPENDENCY_MANIFEST_INVALID",
        "package.json is not valid JSON or is not an object",
        "package.json",
      ),
    ]);
  }
  if (manifestObservation.kind === "absent") {
    return fail([
      issue(
        "DEPENDENCY_MANIFEST_MISSING",
        "no package.json was found in the selected package",
        "package.json",
      ),
    ]);
  }
  const manifest = manifestObservation.value;
  const entries: DependencyStateEntry[] = [];

  for (const requirement of requirements) {
    if (typeof requirement.name !== "string" || requirement.name.length === 0) {
      issues.push(
        issue(
          "DEPENDENCY_NAME_INVALID",
          `requirement name ${JSON.stringify(requirement.name)} is not a valid package name`,
          "package.json",
        ),
      );
      continue;
    }
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
    if (declared.malformed) {
      issues.push(
        issue(
          "DEPENDENCY_DECLARED_INVALID",
          `declared ${declared.field} entry for ${JSON.stringify(requirement.name)} is not a string range`,
          "package.json",
        ),
      );
      continue;
    }
    if (declared.range !== null && validRange(declared.range) === null) {
      issues.push(
        issue(
          "DEPENDENCY_DECLARED_INVALID",
          `declared range ${JSON.stringify(declared.range)} for ${JSON.stringify(requirement.name)} is not a valid npm SemVer range`,
          "package.json",
        ),
      );
      continue;
    }

    const installed = observeInstalled(root, requirement.name);
    if (installed.kind === "unreadable") {
      issues.push(
        issue(
          "DEPENDENCY_INSTALLED_UNREADABLE",
          `installed metadata for ${JSON.stringify(requirement.name)} could not be read (${installed.code})`,
          "package.json",
        ),
      );
      continue;
    }
    if (installed.kind === "unsafe") {
      issues.push(
        issue(
          "DEPENDENCY_INSTALLED_INVALID",
          `installed metadata for ${JSON.stringify(requirement.name)} is not a regular file`,
          "package.json",
        ),
      );
      continue;
    }
    if (installed.kind === "malformed") {
      issues.push(
        issue(
          "DEPENDENCY_INSTALLED_INVALID",
          `installed metadata for ${JSON.stringify(requirement.name)} is malformed or names the wrong package`,
          "package.json",
        ),
      );
      continue;
    }
    const installedVersion =
      installed.kind === "value" ? installed.version : null;

    let status: DependencyStatus;
    if (declared.range === null) {
      status = "missing_declaration";
    } else {
      const joint = intersectRangesDetailed([
        requirement.range,
        declared.range,
      ]);
      if (joint.kind === "unable") {
        issues.push(
          issue(
            "DEPENDENCY_RANGE_UNSUPPORTED",
            `could not evaluate the joint range for ${JSON.stringify(requirement.name)}: ${joint.reason}`,
            "package.json",
          ),
        );
        continue;
      }
      if (joint.kind === "empty") {
        status = "declaration_incompatible";
      } else if (installedVersion === null) {
        status = "missing_install";
      } else if (!satisfies(installedVersion, joint.range)) {
        status = "install_incompatible";
      } else {
        status = "ready";
      }
    }

    entries.push({
      name: requirement.name,
      requiredRange: requirement.range,
      declaredRange: declared.range,
      declaredField: declared.field,
      installedVersion,
      status,
    });
  }

  if (issues.length > 0) return fail(issues);
  return ok(entries);
}

/** Unique peer (name, range) requirements from a resolved dependency plan. */
export function peerRequirementsFromPlan(
  plan: DependencyPlan,
): readonly DependencyRequirement[] {
  const seen = new Map<string, string>();
  for (const entry of plan.entries) {
    if (!entry.roles.includes("peer")) continue;
    if (!seen.has(entry.name)) seen.set(entry.name, entry.range);
  }
  return [...seen.entries()]
    .sort((left, right) =>
      left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0,
    )
    .map(([name, range]) => ({ name, range }));
}

interface PeerConstraint {
  readonly name: string;
  readonly ranges: readonly string[];
  readonly requiredBy: readonly string[];
  /**
   * Registry runtime ranges for the same package. They are not peer ranges, but
   * they constrain the same package and must hold alongside the peer evidence.
   */
  readonly runtimeRanges: readonly string[];
}

/**
 * Combine registry peer requirements with the actual installed upstream
 * `peerDependencies`. A selected runtime dependency such as `bits-ui` supplies
 * its own required peers even though those names are absent from the registry
 * plan. Optional upstream peers are skipped unless the registry independently
 * requires that name.
 */
function collectPeerConstraints(
  root: string,
  plan: DependencyPlan,
  issues: ModelIssue[],
): readonly PeerConstraint[] {
  const byName = new Map<
    string,
    {
      ranges: string[];
      requiredBy: Set<string>;
      optional: boolean;
      required: boolean;
    }
  >();
  const ensure = (name: string) => {
    const existing = byName.get(name);
    if (existing) return existing;
    const created = {
      ranges: [] as string[],
      requiredBy: new Set<string>(),
      optional: false,
      required: false,
    };
    byName.set(name, created);
    return created;
  };

  for (const entry of plan.entries) {
    if (!entry.roles.includes("peer")) continue;
    const constraint = ensure(entry.name);
    constraint.ranges.push(entry.range);
    constraint.required = true;
    for (const owner of entry.requiredBy) constraint.requiredBy.add(owner);
  }

  // A registry runtime requirement on the same package still constrains the
  // joint audit, so it is retained per name and verified with the peer ranges.
  const runtimeRanges = new Map<string, string[]>();
  for (const entry of plan.entries) {
    if (!entry.roles.includes("runtime")) continue;
    const ranges = runtimeRanges.get(entry.name) ?? [];
    if (!ranges.includes(entry.range)) ranges.push(entry.range);
    runtimeRanges.set(entry.name, ranges);
  }

  // Any registry requirement the consumer needs at runtime or as a peer makes
  // that package independently required, so an upstream *optional* peer on it
  // is promoted to mandatory. CLI/tooling-only requirements stay separate.
  const independentlyRequired = new Set<string>();
  for (const entry of plan.entries) {
    if (entry.roles.includes("peer") || entry.roles.includes("runtime")) {
      independentlyRequired.add(entry.name);
    }
  }

  for (const entry of plan.entries) {
    const observation = observeInstalled(root, entry.name);
    if (observation.kind === "absent") {
      if (!entry.roles.includes("peer")) {
        issues.push(
          issue(
            "PEER_UPSTREAM_NOT_INSTALLED",
            `${entry.name} is not installed, so its required peer metadata cannot be verified`,
            "package.json",
          ),
        );
      }
      continue;
    }
    if (observation.kind === "unreadable") {
      issues.push(
        issue(
          "PEER_UPSTREAM_UNREADABLE",
          `installed metadata for ${entry.name} could not be read (${observation.code})`,
          "package.json",
        ),
      );
      continue;
    }
    if (observation.kind !== "value") {
      issues.push(
        issue(
          "PEER_UPSTREAM_INVALID",
          `installed metadata for ${entry.name} is malformed or is not a regular file`,
          "package.json",
        ),
      );
      continue;
    }
    const peerDependenciesRaw = observation.manifest["peerDependencies"];
    if (peerDependenciesRaw !== undefined && !isRecord(peerDependenciesRaw)) {
      issues.push(
        issue(
          "PEER_UPSTREAM_INVALID",
          `${entry.name} declares a malformed peerDependencies map`,
          "package.json",
        ),
      );
      continue;
    }
    if (peerDependenciesRaw === undefined) continue;
    const metaRaw = observation.manifest["peerDependenciesMeta"];
    if (metaRaw !== undefined && !isRecord(metaRaw)) {
      issues.push(
        issue(
          "PEER_UPSTREAM_INVALID",
          `${entry.name} declares a malformed peerDependenciesMeta map`,
          "package.json",
        ),
      );
      continue;
    }
    const meta = metaRaw;
    for (const peerName of Object.keys(peerDependenciesRaw).sort()) {
      const range = peerDependenciesRaw[peerName];
      if (typeof range !== "string" || validRange(range) === null) {
        issues.push(
          issue(
            "PEER_UPSTREAM_INVALID",
            `${entry.name} declares invalid peer range ${JSON.stringify(range)} for ${peerName}`,
            "package.json",
          ),
        );
        continue;
      }
      const metaEntry = isRecord(meta) ? meta[peerName] : undefined;
      if (metaEntry !== undefined && !isRecord(metaEntry)) {
        issues.push(
          issue(
            "PEER_UPSTREAM_INVALID",
            `${entry.name} declares malformed peer metadata for ${peerName}`,
            "package.json",
          ),
        );
        continue;
      }
      const optional = isRecord(metaEntry) && metaEntry["optional"] === true;
      const constraint = ensure(peerName);
      const isIndependentlyRequired =
        independentlyRequired.has(peerName) || constraint.required;
      if (optional && !isIndependentlyRequired) {
        constraint.optional = true;
        continue;
      }
      constraint.ranges.push(range);
      constraint.requiredBy.add(entry.name);
    }
  }
  return [...byName.entries()]
    .filter(([, value]) => value.ranges.length > 0)
    .map(([name, value]) => ({
      name,
      ranges: [...new Set(value.ranges)],
      requiredBy: [...value.requiredBy].sort(),
      runtimeRanges: [...new Set(runtimeRanges.get(name) ?? [])],
    }))
    .sort((left, right) =>
      left.name < right.name ? -1 : left.name > right.name ? 1 : 0,
    );
}

/**
 * Validate every resolved peer requirement against the selected package's
 * actual declared/installed metadata and the actual installed upstream
 * `peerDependencies`. All peers are assessed, so a peer that one wrapper does
 * not itself import is not silently ignored. A conflict never adds a
 * dependency; it reports a typed diagnostic for the developer to resolve.
 */
export function validatePeerDependencies(
  root: string,
  plan: DependencyPlan,
): ModelResult<readonly DependencyStateEntry[]> {
  const issues: ModelIssue[] = [];
  const constraints = collectPeerConstraints(root, plan, issues);
  if (issues.length > 0) return fail(issues);
  if (constraints.length === 0) return ok([]);

  const results: DependencyStateEntry[] = [];
  for (const constraint of constraints) {
    const joint = intersectRangesDetailed(constraint.ranges);
    if (joint.kind === "unable") {
      issues.push(
        issue(
          "PEER_RANGE_UNSUPPORTED",
          `could not evaluate the joint peer range for ${constraint.name}: ${joint.reason}`,
          "package.json",
        ),
      );
      continue;
    }
    if (joint.kind === "empty") {
      issues.push(
        issue(
          "PEER_RANGE_CONFLICT",
          `incompatible peer ranges for ${constraint.name}: ${constraint.ranges.join(", ")} (required by ${constraint.requiredBy.join(", ")})`,
          "package.json",
        ),
      );
      continue;
    }
    const inspected = inspectDependencyState(root, [
      { name: constraint.name, range: joint.range },
    ]);
    if (!inspected.ok) {
      for (const entry of inspected.issues) issues.push(entry);
      continue;
    }
    const entry = inspected.value[0] as DependencyStateEntry;
    results.push(entry);
    if (entry.status !== "ready") {
      const code =
        entry.status === "install_incompatible" ||
        entry.status === "declaration_incompatible"
          ? "PEER_INCOMPATIBLE"
          : entry.status === "missing_install"
            ? "PEER_NOT_INSTALLED"
            : "PEER_MISSING";
      const detail =
        entry.status === "install_incompatible"
          ? `installed ${entry.installedVersion} does not satisfy ${joint.range}`
          : entry.status === "declaration_incompatible"
            ? `declared ${entry.declaredRange} is disjoint from the required ${joint.range}`
            : entry.status === "missing_install"
              ? `declared ${entry.declaredRange} but not installed`
              : "neither declared nor installed";
      issues.push(
        issue(
          code,
          `peer ${entry.name} is not satisfied: ${detail}`,
          "package.json",
        ),
      );
      continue;
    }
    // Combined audit: a registry runtime requirement on the same package is
    // part of the joint constraint set. A standalone peer result must not be
    // reported as overall readiness when the runtime range cannot also hold.
    for (const range of constraint.runtimeRanges) {
      if (constraint.ranges.includes(range)) continue;
      const runtimeInspection = inspectDependencyState(root, [
        { name: constraint.name, range },
      ]);
      if (!runtimeInspection.ok) {
        for (const runtimeIssue of runtimeInspection.issues) {
          issues.push(runtimeIssue);
        }
        continue;
      }
      const runtimeEntry = runtimeInspection.value[0] as DependencyStateEntry;
      results.push(runtimeEntry);
      if (runtimeEntry.status === "ready") continue;
      const code =
        runtimeEntry.status === "install_incompatible" ||
        runtimeEntry.status === "declaration_incompatible"
          ? "PEER_INCOMPATIBLE"
          : runtimeEntry.status === "missing_install"
            ? "PEER_NOT_INSTALLED"
            : "PEER_MISSING";
      const detail =
        runtimeEntry.status === "install_incompatible"
          ? `installed ${runtimeEntry.installedVersion} does not satisfy runtime range ${range}`
          : runtimeEntry.status === "declaration_incompatible"
            ? `declared ${runtimeEntry.declaredRange} is disjoint from the runtime range ${range}`
            : runtimeEntry.status === "missing_install"
              ? `declared ${runtimeEntry.declaredRange} but not installed`
              : "neither declared nor installed";
      issues.push(
        issue(
          code,
          `runtime dependency ${entry.name} is not satisfied: ${detail}`,
          "package.json",
        ),
      );
    }
  }
  if (issues.length > 0) return fail(issues);
  return ok(results);
}
