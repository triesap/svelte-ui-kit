/**
 * Complete immutable apply authority and physical read set (RCLD04-R1-1).
 *
 * A validated plan is only a proposal until the physical facts it was planned
 * from are re-proven under exclusive coordination. This module carries that
 * authority — the root device/inode identity, the observed non-final ancestor
 * chain, and the relevant read-only evidence (config, manifest, mapping and
 * lock bytes) — and verifies it against the live filesystem with non-following
 * metadata immediately before a semantic write.
 *
 * The authority is deliberately physical, not lexical. Two directories that
 * look identical by path but differ by device/inode are different roots; an
 * equal-byte lock or an equal-byte target does not authorize a replacement that
 * was planned against a different physical identity. Absence is represented
 * explicitly so a fresh initialization can create a legitimate missing ancestor
 * through recorded, owned creation rather than being misread as an unsafe stale
 * plan. Transient transaction ancestry is verified before the first write so a
 * symlinked coordination directory can never redirect owned state outside the
 * project.
 *
 * The trusted-local threat model applies: this detects stale plans, replaced
 * identities and accidental symlinks, not hostile concurrent filesystem races.
 */
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import path from "node:path";

import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import { observeEntry } from "../project/io.js";
import { resolveInstalledManifestCandidate } from "../project/dependencies.js";
import { sha256Hex } from "./digest.js";
import { TRANSIENT_NAMESPACE } from "./transaction-types.js";

/** Stable physical identity of a directory or root. */
export interface PhysicalIdentity {
  readonly device: number;
  readonly inode: number;
}

/** Observation of one non-final path component. */
export interface PlanAncestor {
  readonly path: string;
  readonly kind: "directory" | "absent";
  readonly device: number | null;
  readonly inode: number | null;
}

/**
 * A relevant read-only evidence entry captured at planning time. Evidence is
 * either an exact regular file or a proven absence, so a manifest, lockfile or
 * dependency observation that did not exist at planning time is carried as
 * explicit absence rather than being silently omitted.
 */
export interface PlanReadFile {
  readonly path: string;
  readonly kind: "file" | "absent";
  readonly digest: string | null;
  readonly mode: number | null;
}

/** The complete physical authority a plan depends on. */
export interface PlanReadset {
  readonly root: PhysicalIdentity;
  readonly ancestors: readonly PlanAncestor[];
  readonly files: readonly PlanReadFile[];
  /**
   * Read-only installed resolution evidence captured at planning time. A
   * resolved manifest may live outside the selected root (hoisted/ancestor
   * installs) or behind a dependency link; these are captured as *read* evidence
   * so the guarded apply re-proves the same resolution without ever granting
   * write authority outside the selected root.
   */
  readonly installed?: readonly PlanInstalledRead[];
}

/**
 * One captured dependency resolution decision input. `path` is the resolved
 * absolute manifest path (or null when the name was proven absent); `realPath`
 * and the physical identity distinguish a retargeted dependency link whose
 * manifest bytes are otherwise equal.
 */
export interface PlanInstalledRead {
  readonly name: string;
  readonly kind: "absent" | "file" | "unsafe" | "unreadable";
  readonly path: string | null;
  readonly realPath: string | null;
  readonly digest: string | null;
  readonly mode: number | null;
  readonly device: number | null;
  readonly inode: number | null;
  readonly code: string | null;
}

function codeOf(error: unknown): string {
  const code = (error as NodeJS.ErrnoException | null)?.code;
  return typeof code === "string" ? code : "EIO";
}

function absOf(root: string, logical: string): string {
  return path.join(root, ...logical.split("/"));
}

/** Canonical digest of a physical identity, used as the journal root identity. */
export function identityDigest(identity: PhysicalIdentity): string {
  return sha256Hex(`${identity.device}:${identity.inode}`);
}

/** Observe the identity of an existing real directory without following links. */
export function observeRootIdentity(
  root: string,
): ModelResult<PhysicalIdentity> {
  let stats;
  try {
    stats = lstatSync(root);
  } catch (error) {
    return fail([
      issue(
        "AUTHORITY_ROOT_UNREADABLE",
        `the project root is unreadable (${codeOf(error)})`,
      ),
    ]);
  }
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    return fail([
      issue(
        "AUTHORITY_ROOT_UNSAFE",
        "the project root is not a real directory",
      ),
    ]);
  }
  let real;
  try {
    real = statSync(root);
  } catch (error) {
    return fail([
      issue(
        "AUTHORITY_ROOT_UNREADABLE",
        `the project root is unreadable (${codeOf(error)})`,
      ),
    ]);
  }
  return ok({ device: real.dev, inode: real.ino });
}

/**
 * Capture the non-final ancestor chain of a logical target. A missing component
 * is recorded as `absent` (no identity); every existing component must be a
 * real directory. An existing symlink or non-directory is represented as a
 * typed issue so the caller can refuse the plan instead of following it.
 */
export function captureAncestors(
  root: string,
  logicalPath: string,
): ModelResult<readonly PlanAncestor[]> {
  if (!isSafeLogicalRelativePath(logicalPath)) {
    return fail([
      issue(
        "AUTHORITY_PATH_UNSAFE",
        `${JSON.stringify(logicalPath)} is not a safe logical relative path`,
      ),
    ]);
  }
  const segments = logicalPath.split("/");
  const ancestors: PlanAncestor[] = [];
  let current = root;
  for (let index = 0; index < segments.length - 1; index += 1) {
    current = path.join(current, segments[index] as string);
    const logical = segments.slice(0, index + 1).join("/");
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      if (codeOf(error) === "ENOENT") {
        ancestors.push({
          path: logical,
          kind: "absent",
          device: null,
          inode: null,
        });
        return ok(ancestors);
      }
      return fail([
        issue(
          "AUTHORITY_ANCESTOR_UNREADABLE",
          `ancestor ${logical} is unreadable (${codeOf(error)})`,
          logical,
        ),
      ]);
    }
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      return fail([
        issue(
          "AUTHORITY_ANCESTOR_UNSAFE",
          `ancestor ${logical} is not a real directory`,
          logical,
        ),
      ]);
    }
    ancestors.push({
      path: logical,
      kind: "directory",
      device: stats.dev,
      inode: stats.ino,
    });
  }
  return ok(ancestors);
}

/**
 * Capture one relevant evidence entry, recording absence explicitly rather than
 * collapsing a missing file into an omitted entry.
 */
export function captureReadFile(
  root: string,
  logicalPath: string,
): ModelResult<PlanReadFile> {
  if (!isSafeLogicalRelativePath(logicalPath)) {
    return fail([
      issue(
        "AUTHORITY_PATH_UNSAFE",
        `${JSON.stringify(logicalPath)} is not a safe logical relative path`,
      ),
    ]);
  }
  const abs = absOf(root, logicalPath);
  let stats;
  try {
    stats = lstatSync(abs);
  } catch (error) {
    if (codeOf(error) === "ENOENT") {
      return ok({
        path: logicalPath,
        kind: "absent",
        digest: null,
        mode: null,
      });
    }
    return fail([
      issue(
        "AUTHORITY_READ_UNREADABLE",
        `evidence ${logicalPath} is unreadable (${codeOf(error)})`,
        logicalPath,
      ),
    ]);
  }
  if (stats.isSymbolicLink() || !stats.isFile()) {
    return fail([
      issue(
        "AUTHORITY_READ_UNSAFE",
        `evidence ${logicalPath} is not a regular file`,
        logicalPath,
      ),
    ]);
  }
  let bytes: Buffer;
  try {
    bytes = readFileSync(abs);
  } catch (error) {
    return fail([
      issue(
        "AUTHORITY_READ_UNREADABLE",
        `evidence ${logicalPath} is unreadable (${codeOf(error)})`,
        logicalPath,
      ),
    ]);
  }
  return ok({
    path: logicalPath,
    kind: "file",
    digest: sha256Hex(bytes),
    mode: stats.mode & 0o777,
  });
}

/**
 * Capture the complete readset for a plan: root identity, the union of every
 * target's ancestor chain, and the requested evidence files. Ancestors are
 * de-duplicated by logical path and kept in observation order.
 */
export function captureReadset(
  root: string,
  targetPaths: readonly string[],
  readFiles: readonly string[] = [],
): ModelResult<PlanReadset> {
  const identity = observeRootIdentity(root);
  if (!identity.ok) return identity;
  const ancestors: PlanAncestor[] = [];
  const seen = new Set<string>();
  for (const targetPath of targetPaths) {
    const captured = captureAncestors(root, targetPath);
    if (!captured.ok) return captured;
    for (const ancestor of captured.value) {
      if (!seen.has(ancestor.path)) {
        seen.add(ancestor.path);
        ancestors.push(ancestor);
      }
    }
  }
  const files: PlanReadFile[] = [];
  for (const readFile of readFiles) {
    const captured = captureReadFile(root, readFile);
    if (!captured.ok) return captured;
    files.push(captured.value);
  }
  return ok({
    root: identity.value,
    ancestors: Object.freeze(ancestors),
    files: Object.freeze(files),
  });
}

/** Structural validation of a readset supplied by a caller. */
export function validateReadset(readset: unknown): ModelIssue[] {
  const problems: ModelIssue[] = [];
  if (typeof readset !== "object" || readset === null) {
    return [
      issue("PLAN_READSET_INVALID", "plan.readset is required", "readset"),
    ];
  }
  const value = readset as Partial<PlanReadset>;
  if (
    typeof value.root !== "object" ||
    value.root === null ||
    !Number.isInteger((value.root as PhysicalIdentity).device) ||
    !Number.isInteger((value.root as PhysicalIdentity).inode)
  ) {
    problems.push(
      issue(
        "PLAN_READSET_INVALID",
        "plan.readset.root must carry integer device/inode",
        "readset.root",
      ),
    );
  }
  if (!Array.isArray(value.ancestors)) {
    problems.push(
      issue(
        "PLAN_READSET_INVALID",
        "plan.readset.ancestors must be an array",
        "readset.ancestors",
      ),
    );
  } else {
    for (const [index, ancestor] of value.ancestors.entries()) {
      const label = `readset.ancestors[${index}]`;
      if (
        typeof ancestor !== "object" ||
        ancestor === null ||
        !isSafeLogicalRelativePath((ancestor as PlanAncestor).path)
      ) {
        problems.push(
          issue(
            "PLAN_READSET_INVALID",
            `${label} must name a safe logical path`,
            label,
          ),
        );
        continue;
      }
      const record = ancestor as PlanAncestor;
      if (record.kind !== "directory" && record.kind !== "absent") {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} kind is unknown`, label),
        );
        continue;
      }
      if (
        record.kind === "directory" &&
        (!Number.isInteger(record.device) || !Number.isInteger(record.inode))
      ) {
        problems.push(
          issue(
            "PLAN_READSET_INVALID",
            `${label} must carry a device/inode identity`,
            label,
          ),
        );
      }
      if (
        record.kind === "absent" &&
        (record.device !== null || record.inode !== null)
      ) {
        problems.push(
          issue(
            "PLAN_READSET_INVALID",
            `${label} must not carry an identity for an absent component`,
            label,
          ),
        );
      }
    }
  }
  if (!Array.isArray(value.files)) {
    problems.push(
      issue(
        "PLAN_READSET_INVALID",
        "plan.readset.files must be an array",
        "readset.files",
      ),
    );
  } else {
    for (const [index, file] of value.files.entries()) {
      const label = `readset.files[${index}]`;
      if (
        typeof file !== "object" ||
        file === null ||
        !isSafeLogicalRelativePath((file as PlanReadFile).path)
      ) {
        problems.push(
          issue(
            "PLAN_READSET_INVALID",
            `${label} must name a safe logical path`,
            label,
          ),
        );
        continue;
      }
      const record = file as PlanReadFile;
      if (record.kind !== "file" && record.kind !== "absent") {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} kind is unknown`, label),
        );
        continue;
      }
      if (record.kind === "absent") {
        if (record.digest !== null || record.mode !== null) {
          problems.push(
            issue(
              "PLAN_READSET_INVALID",
              `${label} must not carry a digest or mode for an absent entry`,
              label,
            ),
          );
        }
        continue;
      }
      if (!/^[0-9a-f]{64}$/.test(String(record.digest))) {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} digest is invalid`, label),
        );
      }
      if (
        !Number.isInteger(record.mode) ||
        (record.mode as number) < 0 ||
        (record.mode as number) > 0o777
      ) {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} mode is invalid`, label),
        );
      }
    }
  }
  const installed = value.installed;
  if (installed !== undefined && !Array.isArray(installed)) {
    problems.push(
      issue(
        "PLAN_READSET_INVALID",
        "plan.readset.installed must be an array when present",
        "readset.installed",
      ),
    );
  }
  if (Array.isArray(installed)) {
    for (const [index, entry] of installed.entries()) {
      const label = `readset.installed[${index}]`;
      if (
        typeof entry !== "object" ||
        entry === null ||
        typeof (entry as PlanInstalledRead).name !== "string" ||
        (entry as PlanInstalledRead).name.length === 0
      ) {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} name is invalid`, label),
        );
        continue;
      }
      const record = entry as PlanInstalledRead;
      if (
        record.kind !== "file" &&
        record.kind !== "absent" &&
        record.kind !== "unsafe" &&
        record.kind !== "unreadable"
      ) {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} kind is unknown`, label),
        );
        continue;
      }
      if (record.kind === "absent") {
        if (record.path !== null || record.realPath !== null) {
          problems.push(
            issue(
              "PLAN_READSET_INVALID",
              `${label} must not carry a path for an absent resolution`,
              label,
            ),
          );
        }
        continue;
      }
      if (typeof record.path !== "string" || record.path.length === 0) {
        problems.push(
          issue("PLAN_READSET_INVALID", `${label} path is invalid`, label),
        );
      }
      if (record.kind === "file") {
        if (!/^[0-9a-f]{64}$/.test(String(record.digest))) {
          problems.push(
            issue("PLAN_READSET_INVALID", `${label} digest is invalid`, label),
          );
        }
        if (
          !Number.isInteger(record.mode) ||
          (record.mode as number) < 0 ||
          (record.mode as number) > 0o777
        ) {
          problems.push(
            issue("PLAN_READSET_INVALID", `${label} mode is invalid`, label),
          );
        }
      }
    }
  }
  return problems;
}

/** Verify the live project root still has the captured identity. */
export function verifyRootIdentity(
  root: string,
  expected: PhysicalIdentity,
): ModelIssue[] {
  const observed = observeRootIdentity(root);
  if (!observed.ok) return [...observed.issues];
  if (
    observed.value.device !== expected.device ||
    observed.value.inode !== expected.inode
  ) {
    return [
      issue(
        "AUTHORITY_ROOT_REPLACED",
        "the project root was replaced since planning; refusing to write",
      ),
    ];
  }
  return [];
}

/**
 * Verify the captured ancestor chain. A recorded `directory` must still be the
 * same device/inode; a recorded `absent` must still be absent. An absent
 * ancestor is legitimate: the guarded batch may create it (recorded, owned)
 * and recovery removes it only when it created it.
 */
export function verifyAncestors(
  root: string,
  ancestors: readonly PlanAncestor[],
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const ancestor of ancestors) {
    const abs = absOf(root, ancestor.path);
    let stats;
    try {
      stats = lstatSync(abs);
    } catch (error) {
      if (codeOf(error) === "ENOENT") {
        if (ancestor.kind === "directory") {
          issues.push(
            issue(
              "AUTHORITY_ANCESTOR_REPLACED",
              `ancestor ${ancestor.path} disappeared since planning`,
              ancestor.path,
            ),
          );
        }
        continue;
      }
      issues.push(
        issue(
          "AUTHORITY_ANCESTOR_UNREADABLE",
          `ancestor ${ancestor.path} is unreadable (${codeOf(error)})`,
          ancestor.path,
        ),
      );
      continue;
    }
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      issues.push(
        issue(
          "AUTHORITY_ANCESTOR_UNSAFE",
          `ancestor ${ancestor.path} is not a real directory`,
          ancestor.path,
        ),
      );
      continue;
    }
    if (ancestor.kind === "absent") {
      // A recorded-absent ancestor may legitimately have been created by the
      // guarded batch's own owned coordination/staging (fresh init or custom
      // mapping). A real directory is accepted; a symlink or non-directory is
      // still refused.
      continue;
    }
    if (stats.dev !== ancestor.device || stats.ino !== ancestor.inode) {
      issues.push(
        issue(
          "AUTHORITY_ANCESTOR_REPLACED",
          `ancestor ${ancestor.path} was replaced since planning`,
          ancestor.path,
        ),
      );
    }
  }
  return issues;
}

/** Verify captured read-only evidence still has the same kind/digest/mode. */
export function verifyReadFiles(
  root: string,
  files: readonly PlanReadFile[],
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const file of files) {
    const observed = captureReadFile(root, file.path);
    if (!observed.ok) {
      issues.push(...observed.issues);
      continue;
    }
    if (file.kind === "absent") {
      if (observed.value.kind !== "absent") {
        issues.push(
          issue(
            "AUTHORITY_READ_CHANGED",
            `evidence ${file.path} appeared since planning`,
            file.path,
          ),
        );
      }
      continue;
    }
    if (observed.value.kind === "absent") {
      issues.push(
        issue(
          "AUTHORITY_READ_CHANGED",
          `evidence ${file.path} disappeared since planning`,
          file.path,
        ),
      );
      continue;
    }
    if (observed.value.digest !== file.digest) {
      issues.push(
        issue(
          "AUTHORITY_READ_CHANGED",
          `evidence ${file.path} changed since planning`,
          file.path,
        ),
      );
      continue;
    }
    if (observed.value.mode !== file.mode) {
      issues.push(
        issue(
          "AUTHORITY_READ_CHANGED",
          `evidence ${file.path} mode changed since planning`,
          file.path,
        ),
      );
    }
  }
  return issues;
}

/**
 * Re-prove the captured installed resolution evidence against the live
 * filesystem. The same nearest-`node_modules`-then-ancestors lookup is re-run
 * from the selected root, so a nearer incompatible package that appeared after
 * planning is a resolution change; a retargeted dependency link is a real-path
 * change even when the manifest bytes are equal; and a changed hoisted manifest
 * is a digest change. An absent capture that now resolves is an appearance, and
 * an unsafe/unreadable capture is never treated as absence.
 */
export function verifyInstalledReads(
  root: string,
  installed: readonly PlanInstalledRead[],
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  for (const entry of installed) {
    const resolved = resolveInstalledManifestCandidate(root, entry.name);
    if (entry.kind === "absent") {
      if (resolved !== null) {
        issues.push(
          issue(
            "AUTHORITY_INSTALLED_CHANGED",
            `dependency ${entry.name} was captured absent but now resolves; refusing a stale plan`,
            entry.name,
          ),
        );
      }
      continue;
    }
    if (resolved === null) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} no longer resolves to its captured manifest`,
          entry.name,
        ),
      );
      continue;
    }
    if (entry.path === null || resolved !== entry.path) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} now resolves through a nearer or different install than planned`,
          entry.name,
        ),
      );
      continue;
    }
    // A captured unsafe/unreadable resolution is never silently accepted as
    // absence or as authority: it must be re-observed as a clean regular file,
    // otherwise the plan is stale and a fresh snapshot is required.
    if (entry.kind === "unsafe" || entry.kind === "unreadable") {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} was captured ${entry.kind} and cannot authorize mutation; request a fresh snapshot`,
          entry.name,
        ),
      );
      continue;
    }
    const current = observeEntry(resolved);
    if (current.kind !== "file") {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} is no longer a regular file (${current.kind})`,
          entry.name,
        ),
      );
      continue;
    }
    let realPath: string | null;
    try {
      realPath = realpathSync(resolved);
    } catch {
      realPath = null;
    }
    if (realPath !== entry.realPath) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} link target changed since planning`,
          entry.name,
        ),
      );
      continue;
    }
    let stats;
    try {
      stats = realPath === null ? lstatSync(resolved) : statSync(realPath);
    } catch (error) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_UNREADABLE",
          `dependency ${entry.name} is unreadable (${codeOf(error)})`,
          entry.name,
        ),
      );
      continue;
    }
    if (!stats.isFile()) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} is no longer a regular file`,
          entry.name,
        ),
      );
      continue;
    }
    if (
      entry.device !== null &&
      entry.inode !== null &&
      (stats.dev !== entry.device || stats.ino !== entry.inode)
    ) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} physical identity changed since planning`,
          entry.name,
        ),
      );
      continue;
    }
    let digest: string;
    try {
      digest = sha256Hex(readFileSync(resolved));
    } catch (error) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_UNREADABLE",
          `dependency ${entry.name} is unreadable (${codeOf(error)})`,
          entry.name,
        ),
      );
      continue;
    }
    if (digest !== entry.digest) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} manifest changed since planning`,
          entry.name,
        ),
      );
      continue;
    }
    if (entry.mode !== null && (stats.mode & 0o777) !== entry.mode) {
      issues.push(
        issue(
          "AUTHORITY_INSTALLED_CHANGED",
          `dependency ${entry.name} manifest mode changed since planning`,
          entry.name,
        ),
      );
    }
  }
  return issues;
}

/**
 * Verify the transient namespace ancestry before the first coordination write.
 * Every existing component from the state directory down to the transient root
 * must be a real directory, and the transient root itself must not be a
 * symlink. A missing component is legitimate and will be created as owned state.
 */
export function verifyTransientAncestry(
  root: string,
  stateDir: string,
): ModelIssue[] {
  const issues: ModelIssue[] = [];
  const segments = `${stateDir}/${TRANSIENT_NAMESPACE}`.split("/");
  let current = root;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index] as string);
    const logical = segments.slice(0, index + 1).join("/");
    let stats;
    try {
      stats = lstatSync(current);
    } catch (error) {
      if (codeOf(error) === "ENOENT") return issues;
      issues.push(
        issue(
          "AUTHORITY_TRANSIENT_UNREADABLE",
          `transient namespace ${logical} is unreadable (${codeOf(error)})`,
          logical,
        ),
      );
      return issues;
    }
    if (stats.isSymbolicLink() || !stats.isDirectory()) {
      issues.push(
        issue(
          "AUTHORITY_TRANSIENT_UNSAFE",
          `transient namespace ${logical} is not a real directory`,
          logical,
        ),
      );
      return issues;
    }
  }
  return issues;
}
