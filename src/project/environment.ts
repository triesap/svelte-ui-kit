/**
 * Captured invocation environment evidence (S038–S040 evidence boundary).
 *
 * A planning pass must reason about one immutable observation. Reading the
 * selected package manifest, the installed dependency metadata and the package
 * manager again *after* the target snapshot was captured silently mixes two
 * observations: the same supplied snapshot can change from executable to a
 * conflict because an unrelated file changed on disk.
 *
 * This module captures the complete dependency/manager evidence once, read
 * only, so a planner can derive readiness from the captured values. Installed
 * lookup follows the real resolution context (nearest `node_modules`, then
 * ancestors), exactly like `observeInstalled`, but the resolved observations
 * are stored rather than re-read. Dependency symlink/hoisting reads are kept
 * separate from the generated-target ancestry permissions owned by
 * `snapshot.ts`.
 *
 * No writer or package manager is executed.
 */
import { readdirSync } from "node:fs";
import path from "node:path";

import type { ModelIssue, ModelResult } from "../registry/errors.js";
import {
  detectPackageManager,
  type ManagerEvidence,
} from "./dependency-instructions.js";
import { observeInstalled, type InstalledObservation } from "./dependencies.js";
import { detectDefaultProject, type DetectedProject } from "./detect.js";
import { deepFreeze, FrozenMap } from "./immutable.js";
import { readJsonObject, type JsonObservation } from "./io.js";

export interface CapturedEnvironment {
  /** Typed observation of the selected package's `package.json`. */
  readonly manifest: JsonObservation;
  /** Resolved installed metadata keyed by package name. */
  readonly installed: ReadonlyMap<string, InstalledObservation>;
  /**
   * True when every `node_modules` directory in the resolution context was
   * listed successfully, so a name that is not in `installed` is genuinely
   * absent rather than unobserved.
   */
  readonly enumerationComplete: boolean;
  /** Package-manager evidence resolved from the captured manifest/lockfiles. */
  readonly manager: ManagerEvidence;
  /** Typed manager conflict that blocks planning (for example two lockfiles). */
  readonly managerIssues: readonly ModelIssue[];
  /**
   * Captured static project-selection evidence (S035). It was observed at the
   * same instant as the target bytes, so a later disk edit cannot change an
   * invocation decision derived from the snapshot.
   */
  readonly project: ModelResult<DetectedProject>;
}

/**
 * Enumerate every resolvable package name in the selected package's
 * `node_modules` resolution context. A `node_modules` directory may itself be a
 * symlink (pnpm/npm layouts) and is followed read-only.
 */
function enumerateInstalledNames(root: string): {
  readonly names: ReadonlySet<string>;
  readonly complete: boolean;
} {
  const names = new Set<string>();
  let complete = true;
  let current = path.resolve(root);
  for (;;) {
    const nodeModules = path.join(current, "node_modules");
    let entries: string[];
    try {
      entries = readdirSync(nodeModules);
    } catch (error) {
      const code = (error as NodeJS.ErrnoException | null)?.code;
      if (code !== "ENOENT") complete = false;
      entries = [];
    }
    for (const entry of entries) {
      if (entry === ".bin" || entry === ".cache" || entry.startsWith(".")) {
        continue;
      }
      if (entry.startsWith("@")) {
        try {
          for (const scoped of readdirSync(path.join(nodeModules, entry))) {
            names.add(`${entry}/${scoped}`);
          }
        } catch {
          complete = false;
        }
        continue;
      }
      names.add(entry);
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return { names, complete };
}

/**
 * Capture the complete read-only dependency/manager/project evidence for one
 * selected package root. The result is plain deeply-immutable data; no closure
 * or handle is retained, and no captured value can be mutated through a lookup,
 * iterator or nested reference.
 */
export function captureEnvironment(root: string): CapturedEnvironment {
  const manifest = readJsonObject(path.join(root, "package.json"));
  const { names, complete } = enumerateInstalledNames(root);
  const installed = new FrozenMap<InstalledObservation>(
    [...names]
      .sort()
      .map((name) => [name, deepFreeze(observeInstalled(root, name))] as const),
  );
  const managerResult = detectPackageManager(root);
  const project = deepFreeze(detectDefaultProject(root));
  return deepFreeze({
    manifest,
    installed,
    enumerationComplete: complete,
    manager: managerResult.ok
      ? managerResult.value
      : ({
          manager: null,
          source: "unsupported",
          reason: null,
        } satisfies ManagerEvidence),
    managerIssues: managerResult.ok ? [] : managerResult.issues,
    project,
  });
}
