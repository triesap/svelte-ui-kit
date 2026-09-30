/**
 * Cross-item target, CSS block and public export uniqueness (S032).
 *
 * Validates ownership across the resolved (advertised) inventory before any
 * consumer is touched:
 *
 * - a UI target has exactly one owning item;
 * - a managed CSS block id has exactly one owner;
 * - a public export name has exactly one owning item.
 *
 * Distinct uniquely owned component blocks may share one aggregate stylesheet
 * (for example `kit.css`): block ownership is unique, but the aggregate file is
 * not wholly owned by one item. Collisions are detected with ASCII case folding
 * as well, so a collision that would only appear on a case-insensitive
 * filesystem is caught even on a case-sensitive development machine.
 * Unregistered candidate items are not part of the resolved inventory and
 * therefore make no public collision claim.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import type { RegistrySnapshot } from "./load.js";

export interface ResolvedTargetOwner {
  readonly namespace: "ui" | "styles";
  readonly path: string;
  readonly owner: string;
}

export interface ResolvedBlockOwner {
  readonly blockId: string;
  readonly path: string;
  readonly owner: string;
}

export interface ResolvedExportOwner {
  readonly name: string;
  readonly target: string;
  readonly owner: string;
}

export interface ResolvedTargets {
  readonly files: readonly ResolvedTargetOwner[];
  readonly blocks: readonly ResolvedBlockOwner[];
  readonly exports: readonly ResolvedExportOwner[];
}

function asciiFold(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
}

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

interface Claim {
  readonly exact: string;
  readonly owner: string;
  readonly label: string;
}

function checkClaims(
  claims: readonly Claim[],
  code: string,
  foldedCode: string,
  issues: ModelIssue[],
): void {
  const byFolded = new Map<string, Claim[]>();
  for (const claim of claims) {
    const key = asciiFold(claim.exact);
    const list = byFolded.get(key) ?? [];
    list.push(claim);
    byFolded.set(key, list);
  }
  for (const [, list] of [...byFolded.entries()].sort((left, right) =>
    compareCodeUnit(left[0], right[0]),
  )) {
    if (list.length < 2) continue;
    const exactMatch = list.every((claim) => claim.exact === list[0]?.exact);
    const owners = [...new Set(list.map((claim) => claim.owner))].sort(
      compareCodeUnit,
    );
    const unique = owners.length > 1;
    if (exactMatch) {
      if (unique) {
        issues.push(
          issue(
            code,
            `${list[0]?.label} ${JSON.stringify(list[0]?.exact)} is owned by multiple items: ${owners.join(", ")}`,
            list[0]?.exact,
          ),
        );
      }
    } else {
      issues.push(
        issue(
          foldedCode,
          `case-colliding ${list[0]?.label}s ${list.map((claim) => JSON.stringify(claim.exact)).join(", ")} are owned by ${owners.join(", ")}`,
          list[0]?.exact,
        ),
      );
    }
  }
}

/**
 * Validate uniqueness across the resolved inventory. `closure` is the resolved
 * item id set; only those items are considered.
 */
export function validateResolvedTargets(
  snapshot: RegistrySnapshot,
  closure: readonly string[],
): ModelResult<ResolvedTargets> {
  const closureSet = new Set(closure);
  const files: ResolvedTargetOwner[] = [];
  const blocks: ResolvedBlockOwner[] = [];
  const exports: ResolvedExportOwner[] = [];
  const fileClaims: Claim[] = [];
  const blockClaims: Claim[] = [];
  const exportClaims: Claim[] = [];

  for (const item of [...snapshot.items]
    .filter((entry) => closureSet.has(entry.id))
    .sort((left, right) => compareCodeUnit(left.id, right.id))) {
    for (const file of item.manifest.files) {
      files.push({ namespace: "ui", path: file.target, owner: item.id });
      fileClaims.push({
        exact: `ui:${file.target}`,
        owner: item.id,
        label: "UI target",
      });
    }
    for (const style of item.manifest.styles) {
      blocks.push({
        blockId: style.blockId,
        path: style.target,
        owner: item.id,
      });
      blockClaims.push({
        exact: style.blockId,
        owner: item.id,
        label: "CSS block id",
      });
    }
    for (const entry of item.manifest.exports) {
      exports.push({ name: entry.name, target: entry.target, owner: item.id });
      exportClaims.push({
        exact: entry.name,
        owner: item.id,
        label: "public export",
      });
    }
  }

  const issues: ModelIssue[] = [];
  checkClaims(fileClaims, "COLLISION_TARGET", "COLLISION_TARGET_CASE", issues);
  checkClaims(blockClaims, "COLLISION_BLOCK", "COLLISION_BLOCK_CASE", issues);
  checkClaims(
    exportClaims,
    "COLLISION_EXPORT",
    "COLLISION_EXPORT_CASE",
    issues,
  );
  if (issues.length > 0) return fail(issues);

  return ok({
    files: [...files].sort((left, right) =>
      compareCodeUnit(
        `${left.namespace}:${left.path}`,
        `${right.namespace}:${right.path}`,
      ),
    ),
    blocks: [...blocks].sort(
      (left, right) =>
        compareCodeUnit(left.blockId, right.blockId) ||
        compareCodeUnit(left.owner, right.owner),
    ),
    exports: [...exports].sort(
      (left, right) =>
        compareCodeUnit(left.name, right.name) ||
        compareCodeUnit(left.owner, right.owner),
    ),
  });
}
