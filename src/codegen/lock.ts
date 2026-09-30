/**
 * Source-file ownership lock records (S019).
 *
 * `kit.lock.json` is the observed installed lineage. It stores canonical owner
 * records — one record per managed target — rather than a redundant reverse
 * index, so a target has exactly one owner and a derived owner index can never
 * disagree with the canonical records.
 *
 * Each file record keeps the logical path, its owning item, the upstream
 * `baseHash` last accepted from the registry, the *effective* `itemVersion`
 * that base corresponds to, and its compatibility cohort. A local observation
 * is computed per plan and is deliberately not stored: a current local byte
 * sequence must never be relabeled as the base. `adoptBaseOnClean` advances the
 * base only for a clean target; `preserveBaseOnCustomized` keeps the base
 * unchanged when local customization must be preserved.
 *
 * Managed CSS blocks and integration records are S020.
 */
import { compareItemIds, isItemId } from "../project/requests.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import { validateWithSchema } from "../registry/schema.js";
import { INITIAL_SCHEMA_VERSION, isSemVer } from "../registry/versions.js";

/** Schema document that owns the lock shape. */
export const KIT_LOCK_SCHEMA = "kit-lock.schema.json";

export type LockOrigin = "explicit" | "transitive";

export interface LockItem {
  readonly id: string;
  readonly version: string;
  readonly digest: string;
  readonly origin: LockOrigin;
}

export interface LockFileRecord {
  readonly path: string;
  readonly owner: string;
  readonly baseHash: string;
  readonly itemVersion: string;
  readonly cohort: string;
}

export interface KitLock {
  readonly schemaVersion: number;
  readonly toolVersion: string;
  readonly registryVersion: string;
  readonly registryHash: string;
  readonly configHash: string;
  readonly requested: readonly string[];
  readonly items: readonly LockItem[];
  readonly files: readonly LockFileRecord[];
}

/** Interim safe logical path check (S033 centralizes lexical validation). */
export function isSafeLockPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || value.includes("\\") || value.endsWith("/")) {
    return false;
  }
  if (/^[A-Za-z]:/.test(value)) return false;
  return value
    .split("/")
    .every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

/**
 * Validate a lock: identity/version provenance, unique owners/paths, valid
 * hashes/versions/cohorts and requested-vs-explicit origin agreement.
 */
export function parseKitLock(
  value: unknown,
  locator = ".kit/kit.lock.json",
): ModelResult<KitLock> {
  const schemaResult = validateWithSchema(KIT_LOCK_SCHEMA, value, locator);
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues: ModelIssue[] = [];

  const requested = (record["requested"] as string[])
    .slice()
    .sort(compareItemIds);
  if (!sameIds(requested, record["requested"] as string[])) {
    issues.push(
      issue(
        "LOCK_REQUESTED_UNSORTED",
        "requested must be sorted by code unit",
        "requested",
      ),
    );
  }

  const rawItems = record["items"] as readonly Record<string, unknown>[];
  const itemIds = new Set<string>();
  const itemIndex = new Map<string, number>();
  for (const [index, item] of rawItems.entries()) {
    const id = item["id"];
    if (typeof id === "string") {
      if (itemIds.has(id)) {
        issues.push(
          issue(
            "LOCK_DUPLICATE_ITEM",
            `duplicate lock item ${JSON.stringify(id)} at items[${index}]`,
            locator,
          ),
        );
      }
      itemIds.add(id);
      itemIndex.set(id, index);
    }
    if (!isSemVer(item["version"])) {
      issues.push(
        issue(
          "LOCK_ITEM_VERSION_INVALID",
          `items[${index}].version must be strict SemVer`,
          `items[${index}].version`,
        ),
      );
    }
  }

  const explicitIds = rawItems
    .filter((item) => item["origin"] === "explicit")
    .map((item) => item["id"] as string)
    .sort(compareItemIds);
  if (!sameIds(requested, explicitIds)) {
    issues.push(
      issue(
        "LOCK_ORIGIN_MISMATCH",
        "requested roots must exactly equal the items recorded with explicit origin",
        "requested",
      ),
    );
  }

  const paths = new Map<string, number>();
  const rawFiles = record["files"] as readonly Record<string, unknown>[];
  for (const [index, file] of rawFiles.entries()) {
    const path = file["path"];
    if (typeof path === "string") {
      if (!isSafeLockPath(path)) {
        issues.push(
          issue(
            "LOCK_PATH_INVALID",
            `files[${index}].path must be a safe logical relative path`,
            `files[${index}].path`,
          ),
        );
      } else if (paths.has(path)) {
        issues.push(
          issue(
            "LOCK_DUPLICATE_OWNERSHIP",
            `file ${JSON.stringify(path)} has multiple owners at files[${index}] and files[${paths.get(path)}]`,
            locator,
          ),
        );
      } else {
        paths.set(path, index);
      }
    }
    const owner = file["owner"];
    if (typeof owner === "string" && !itemIds.has(owner)) {
      issues.push(
        issue(
          "LOCK_OWNER_UNKNOWN",
          `files[${index}].owner ${JSON.stringify(owner)} is not a lock item`,
          `files[${index}].owner`,
        ),
      );
    }
    if (!isSemVer(file["itemVersion"])) {
      issues.push(
        issue(
          "LOCK_ITEM_VERSION_INVALID",
          `files[${index}].itemVersion must be strict SemVer`,
          `files[${index}].itemVersion`,
        ),
      );
    }
  }

  if (issues.length > 0) return fail(issues);
  return ok({
    schemaVersion: INITIAL_SCHEMA_VERSION,
    toolVersion: record["toolVersion"] as string,
    registryVersion: record["registryVersion"] as string,
    registryHash: record["registryHash"] as string,
    configHash: record["configHash"] as string,
    requested,
    items: rawItems.map((item) => ({
      id: item["id"] as string,
      version: item["version"] as string,
      digest: item["digest"] as string,
      origin: item["origin"] as LockOrigin,
    })),
    files: rawFiles.map((file) => ({
      path: file["path"] as string,
      owner: file["owner"] as string,
      baseHash: file["baseHash"] as string,
      itemVersion: file["itemVersion"] as string,
      cohort: file["cohort"] as string,
    })),
  });
}

/** Canonical owner index derived from the records (never independently stored). */
export function ownerIndex(lock: KitLock): ReadonlyMap<string, string> {
  const index = new Map<string, string>();
  for (const file of lock.files) index.set(file.path, file.owner);
  return index;
}

/** Files owned by one item, in deterministic path order. */
export function filesOwnedBy(
  lock: KitLock,
  itemId: string,
): readonly LockFileRecord[] {
  return lock.files
    .filter((file) => file.owner === itemId)
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
}

/** Advance the base only for a clean (not customized) target. */
export function adoptBaseOnClean(
  record: LockFileRecord,
  incoming: { readonly version: string; readonly hash: string },
): LockFileRecord {
  return {
    ...record,
    baseHash: incoming.hash,
    itemVersion: incoming.version,
  };
}

/**
 * Preserve a customized target's legitimate upstream base. Incoming content is
 * deliberately not accepted, so a preserved base can never silently become the
 * current local content or the newest incoming version.
 */
export function preserveBaseOnCustomized(
  record: LockFileRecord,
): LockFileRecord {
  return { ...record };
}

/** True when `value` is a valid item id usable as a lock owner. */
export function isLockOwnerId(value: unknown): value is string {
  return isItemId(value);
}
