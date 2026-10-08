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
import { createHash } from "node:crypto";
import {
  lstatSync,
  readdirSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import path from "node:path";

import type { ModelIssue, ModelResult } from "../registry/errors.js";
import {
  detectPackageManager,
  LOCKFILE_MANAGERS,
  type ManagerEvidence,
} from "./dependency-instructions.js";
import {
  DECLARATION_FIELDS,
  observeInstalled,
  resolveInstalledManifestCandidate,
  resolveInstalledManifestPath,
  type InstalledObservation,
} from "./dependencies.js";
import {
  detectDefaultProject,
  discoverKitConfig,
  type DetectedProject,
  type DiscoveredKitConfig,
} from "./detect.js";
import { deepFreeze, FrozenMap } from "./immutable.js";
import { readJsonObject, type JsonObservation } from "./io.js";
import {
  observeNativeFile,
  type NativeFileObservation,
} from "./native-dependency.js";

/**
 * Physical evidence of one environment file captured with the snapshot: an
 * exact regular file (digest and mode) or a proven absence. Carrying absence
 * explicitly prevents a later-appearing manifest or lockfile from being
 * silently ignored at apply time.
 */
export interface EnvironmentEvidence {
  readonly path: string;
  readonly kind: "file" | "absent";
  readonly digest: string | null;
  readonly mode: number | null;
}

/**
 * Physical, read-only evidence of one dependency's resolution-context lookup.
 * A resolved manifest may legitimately live in an ancestor `node_modules`
 * outside the selected root; it is captured here as *read* evidence so the
 * guarded apply can re-prove the same resolution, link target and bytes without
 * ever granting write authority outside the selected root. A name proven absent
 * is recorded explicitly so a near-appearing package (a nearer incompatible
 * install shadowing a hoisted one) is a typed change, not a silent new lookup.
 */
export type InstalledResolutionEvidence =
  | {
      readonly name: string;
      readonly kind: "absent";
      readonly path: null;
      readonly realPath: null;
      readonly digest: null;
      readonly mode: null;
      readonly device: null;
      readonly inode: null;
    }
  | {
      readonly name: string;
      readonly kind: "file";
      readonly path: string;
      readonly realPath: string | null;
      readonly digest: string;
      readonly mode: number;
      readonly device: number | null;
      readonly inode: number | null;
    }
  | {
      readonly name: string;
      readonly kind: "unsafe" | "unreadable";
      readonly path: string;
      readonly realPath: null;
      readonly digest: null;
      readonly mode: null;
      readonly device: null;
      readonly inode: null;
      readonly code: string;
    };

export interface CapturedEnvironment {
  /** Typed observation of the selected package's `package.json`. */
  readonly manifest: JsonObservation;
  /** Authenticated app-owned native file declaration; never a live planning read. */
  readonly nativeFile: NativeFileObservation;
  /**
   * Exact physical evidence of the manifest and every recognized package-manager
   * lockfile, including absence. Carried into the guarded apply read set so a
   * captured dependency/manifest change is refused rather than omitted.
   */
  readonly evidence: readonly EnvironmentEvidence[];
  /** Resolved installed metadata keyed by package name. */
  readonly installed: ReadonlyMap<string, InstalledObservation>;
  /**
   * True when every `node_modules` directory in the resolution context was
   * listed successfully, so a name that is not in `installed` is genuinely
   * absent rather than unobserved.
   */
  readonly enumerationComplete: boolean;
  /**
   * Per-name installed resolution evidence captured at the same instant as the
   * target bytes. Carried into the guarded apply read set so a near-appearing
   * package, a retargeted dependency link or a changed hoisted manifest is a
   * refusal rather than a silently stale plan.
   */
  readonly installedResolution: readonly InstalledResolutionEvidence[];
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
  /**
   * Captured bounded `_kit/kit.json` discovery (S037). Composed with the
   * selected-project evidence into one effective mapping before planning, so a
   * custom observed installation is never missed and a later disk edit cannot
   * change the resolved mapping.
   */
  readonly kitConfig: ModelResult<DiscoveredKitConfig>;
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

/** Capture exact physical evidence of the manifest and manager lockfiles. */
function captureEvidence(
  root: string,
  extraLogicalPaths: readonly string[] = [],
): EnvironmentEvidence[] {
  const logicalPaths = [
    "package.json",
    ...LOCKFILE_MANAGERS.map((entry) => entry.file),
    ...extraLogicalPaths,
  ];
  const evidence: EnvironmentEvidence[] = [];
  for (const logicalPath of logicalPaths) {
    const abs = path.join(root, ...logicalPath.split("/"));
    let stats;
    try {
      stats = lstatSync(abs);
    } catch {
      evidence.push({
        path: logicalPath,
        kind: "absent",
        digest: null,
        mode: null,
      });
      continue;
    }
    if (!stats.isFile() || stats.isSymbolicLink()) {
      // A nonregular manifest/lockfile is represented as absence so a plan never
      // claims authority over a kind it cannot verify byte-for-byte.
      evidence.push({
        path: logicalPath,
        kind: "absent",
        digest: null,
        mode: null,
      });
      continue;
    }
    let bytes: Buffer;
    try {
      bytes = readFileSync(abs);
    } catch {
      evidence.push({
        path: logicalPath,
        kind: "absent",
        digest: null,
        mode: null,
      });
      continue;
    }
    evidence.push({
      path: logicalPath,
      kind: "file",
      digest: createHash("sha256").update(bytes).digest("hex"),
      mode: stats.mode & 0o777,
    });
  }
  return evidence;
}

/**
 * Logical paths of the installed manifests resolved under the selected root.
 * A resolved manifest that lives in an ancestor `node_modules` outside the root
 * has no root-relative logical path and is not duplicated here; it is carried
 * by the per-name `installedResolution` evidence instead. The guarded apply
 * re-proves that resolution context, link target and bytes as read-only
 * evidence without granting any write authority outside the selected root.
 */
function installedManifestPaths(
  root: string,
  names: readonly string[],
): string[] {
  const resolvedRoot = path.resolve(root);
  const paths: string[] = [];
  for (const name of names) {
    const abs = resolveInstalledManifestPath(resolvedRoot, name);
    if (abs === null) continue;
    const relative = path.relative(resolvedRoot, abs);
    if (
      relative === "" ||
      relative.startsWith("..") ||
      path.isAbsolute(relative)
    ) {
      continue;
    }
    paths.push(relative.split(path.sep).join("/"));
  }
  return paths;
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

/**
 * Declared dependency names from the selected package manifest, in a
 * deterministic order. These are decision-relevant lookups even when no
 * installation exists: a name proven absent must stay captured as absent so a
 * later-appearing incompatible package is a change, not a silent new lookup.
 */
function declaredDependencyNames(manifest: JsonObservation): string[] {
  if (manifest.kind !== "value") return [];
  const names = new Set<string>();
  for (const field of DECLARATION_FIELDS) {
    const record = manifest.value[field];
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record)
    ) {
      continue;
    }
    for (const name of Object.keys(record)) names.add(name);
  }
  return [...names];
}

/** Capture read-only resolution, link-target and byte evidence for one name. */
function captureInstalledResolution(
  root: string,
  name: string,
): InstalledResolutionEvidence {
  const resolved = resolveInstalledManifestCandidate(root, name);
  if (resolved === null) {
    return {
      name,
      kind: "absent",
      path: null,
      realPath: null,
      digest: null,
      mode: null,
      device: null,
      inode: null,
    };
  }
  let stats;
  try {
    stats = lstatSync(resolved);
  } catch (error) {
    return {
      name,
      kind: "unreadable",
      path: resolved,
      realPath: null,
      digest: null,
      mode: null,
      device: null,
      inode: null,
      code: codeOf(error),
    };
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    return {
      name,
      kind: "unsafe",
      path: resolved,
      realPath: null,
      digest: null,
      mode: null,
      device: null,
      inode: null,
      code: "NOT_REGULAR_FILE",
    };
  }
  let bytes: Buffer;
  try {
    bytes = readFileSync(resolved);
  } catch (error) {
    return {
      name,
      kind: "unreadable",
      path: resolved,
      realPath: null,
      digest: null,
      mode: null,
      device: null,
      inode: null,
      code: codeOf(error),
    };
  }
  let realPath: string | null;
  try {
    realPath = realpathSync(resolved);
  } catch {
    realPath = null;
  }
  let physical: { device: number; inode: number } | null = null;
  if (realPath !== null) {
    try {
      const real = statSync(realPath);
      physical = { device: real.dev, inode: real.ino };
    } catch {
      physical = null;
    }
  }
  return {
    name,
    kind: "file",
    path: resolved,
    realPath,
    digest: createHash("sha256").update(bytes).digest("hex"),
    mode: stats.mode & 0o777,
    device: physical?.device ?? null,
    inode: physical?.inode ?? null,
  };
}

/**
 * Capture the complete read-only dependency/manager/project evidence for one
 * selected package root. The result is plain deeply-immutable data; no closure
 * or handle is retained, and no captured value can be mutated through a lookup,
 * iterator or nested reference.
 */
export function captureEnvironment(root: string): CapturedEnvironment {
  const manifest = readJsonObject(path.join(root, "package.json"));
  const nativeFile = observeNativeFile(
    root,
    manifest.kind === "value" ? manifest.value : null,
  );
  const enumerated = enumerateInstalledNames(root);
  // Decision-relevant names are the union of enumerated installed names and the
  // selected package's declared dependency names. A declared-but-absent name is
  // captured explicitly as absent rather than being omitted, so a later-appearing
  // install is a typed change instead of a silent new lookup.
  const names = [
    ...new Set([...enumerated.names, ...declaredDependencyNames(manifest)]),
  ].sort();
  const installed = new FrozenMap<InstalledObservation>(
    names.map(
      (name) => [name, deepFreeze(observeInstalled(root, name))] as const,
    ),
  );
  const installedResolution = names.map((name) =>
    captureInstalledResolution(root, name),
  );
  const managerResult = detectPackageManager(root);
  const project = deepFreeze(detectDefaultProject(root));
  const kitConfig = deepFreeze(discoverKitConfig(root));
  return deepFreeze({
    manifest,
    nativeFile,
    evidence: [
      ...captureEvidence(root, installedManifestPaths(root, names)),
      ...(nativeFile.kind === "value"
        ? [
            {
              path: nativeFile.path,
              kind: "file" as const,
              digest: nativeFile.digest,
              mode: nativeFile.mode,
            },
          ]
        : []),
    ],
    installed,
    installedResolution,
    enumerationComplete: enumerated.complete,
    manager: managerResult.ok
      ? managerResult.value
      : ({
          manager: null,
          source: "unsupported",
          reason: null,
        } satisfies ManagerEvidence),
    managerIssues: managerResult.ok ? [] : managerResult.issues,
    project,
    kitConfig,
  });
}
