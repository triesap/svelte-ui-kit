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
import { lte as semverLte } from "semver";
import { compareItemIds, isItemId } from "../project/requests.js";
import {
  asciiFold,
  isSafeLogicalRelativePath,
  isSameOrBelow,
} from "../project/paths.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "../registry/errors.js";
import {
  validateWithSchema,
  type SchemaAuthority,
} from "../registry/schema.js";
import {
  INITIAL_SCHEMA_VERSION,
  isSemVer,
  validateSemVer,
} from "../registry/versions.js";
import { KIT_CSS_NAME, ROOT_EXPORTS_NAME } from "../project/config.js";

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

export interface LockCssBlock {
  readonly path: string;
  readonly owner: string;
  readonly blockId: string;
  readonly baseHash: string;
  readonly itemVersion: string;
  readonly cohort: string;
}

export type IntegrationKind = "layout" | "stylesheet" | "exports";

export interface LockIntegration {
  readonly kind: IntegrationKind;
  readonly path: string;
  readonly baseline: string;
  readonly contract: string;
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
  readonly cssBlocks: readonly LockCssBlock[];
  readonly integrations: readonly LockIntegration[];
}

/** Interim safe logical path check (S033 centralizes lexical validation). */
export function isSafeLockPath(value: unknown): value is string {
  return isSafeLogicalRelativePath(value);
}

/**
 * Explicit validated mapping context. When supplied (from a parsed `kit.json`),
 * lock records are additionally checked against the reserved state directory and
 * their declared UI/styles namespaces. Omitting it keeps the purely structural
 * checks.
 */
export interface LockValidationContext {
  readonly stateDir?: string;
  readonly uiDir?: string;
  readonly stylesDir?: string;
  /**
   * The approved layout file. When supplied, a layout integration must name
   * exactly this mapped layout path so a final projected integration can never
   * be published outside the configured layout mapping.
   */
  readonly layoutFile?: string;
  /**
   * The approved aggregate stylesheet. When omitted it is derived from
   * `stylesDir`; a stylesheet integration must then name exactly this path.
   */
  readonly stylesheetPath?: string;
  /**
   * The approved root exports barrel. When omitted it is derived from `uiDir`;
   * an exports integration must then name exactly this path.
   */
  readonly exportsPath?: string;
}

/** The fixed aggregate stylesheet path for one styles root. */
function derivedStylesheetPath(
  stylesDir: string | undefined,
): string | undefined {
  return stylesDir === undefined
    ? undefined
    : `${stylesDir.replace(/\/+$/, "")}/${KIT_CSS_NAME}`;
}

/** The fixed root exports barrel path for one UI root. */
function derivedExportsPath(uiDir: string | undefined): string | undefined {
  return uiDir === undefined
    ? undefined
    : `${uiDir.replace(/\/+$/, "")}/${ROOT_EXPORTS_NAME}`;
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((id, index) => id === right[index]);
}

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/**
 * One normalized logical claim in the complete lock ownership set. Every
 * managed source file, CSS block and integration record contributes a claim.
 * Paths already share one project-relative coordinate system, so the whole set
 * is compared together rather than as separate per-category subsets.
 */
interface LockClaim {
  readonly path: string;
  readonly role: "file" | "css-block" | "integration";
  readonly kind?: IntegrationKind;
  readonly label: string;
  readonly locator: string;
}

/**
 * Whether two claims that are spelled identically down to case may share one
 * exact path. Only distinct CSS blocks and a compatible stylesheet integration
 * may share an aggregate target; every other pair is an incompatible role
 * overlap. Duplicate diagnostics for identical block/integration identities
 * are emitted separately and are not repeated here.
 */
function exactSharingAllowed(left: LockClaim, right: LockClaim): boolean {
  if (left.role === "file" || right.role === "file") return false;
  if (left.role === "css-block" && right.role === "css-block") return true;
  if (left.role === "css-block") return right.kind === "stylesheet";
  if (right.role === "css-block") return left.kind === "stylesheet";
  // Two integrations: identical kinds are a duplicate (handled elsewhere);
  // differing kinds are an incompatible overlap of one exact path.
  return left.kind === right.kind;
}

interface RequiredDirectory {
  readonly directory: string | undefined;
  readonly code: string;
  readonly role: string;
}

/**
 * Compare the complete normalized ownership inventory. Differently spelled
 * ASCII case aliases always fail; a strict, segment-aware ancestor relationship
 * always fails in either input order across every role pair; and an exact path
 * shared by two claims must be explicitly compatible. Every file claim is also
 * checked against every required UI/styles/state directory in the validated
 * mapping context: a managed file cannot itself be, or be an ancestor of, a
 * required directory.
 */
function checkLockClaims(
  entries: readonly LockClaim[],
  issues: ModelIssue[],
  context: LockValidationContext,
): void {
  const sorted = [...entries].sort(
    (left, right) =>
      compareCodeUnit(asciiFold(left.path), asciiFold(right.path)) ||
      compareCodeUnit(left.path, right.path) ||
      compareCodeUnit(left.label, right.label),
  );
  for (let i = 0; i < sorted.length; i += 1) {
    const left = sorted[i] as LockClaim;
    const leftFold = asciiFold(left.path);
    for (let j = i + 1; j < sorted.length; j += 1) {
      const right = sorted[j] as LockClaim;
      const rightFold = asciiFold(right.path);
      if (leftFold === rightFold) {
        if (left.path !== right.path) {
          issues.push(
            issue(
              "LOCK_CASE_ALIAS",
              `${left.label} path ${JSON.stringify(left.path)} and ${right.label} path ${JSON.stringify(right.path)} are ASCII case aliases`,
              left.path,
            ),
          );
        } else if (!exactSharingAllowed(left, right)) {
          issues.push(
            issue(
              "LOCK_PATH_OVERLAP",
              `${left.label} and ${right.label} share path ${JSON.stringify(left.path)} with incompatible ownership roles`,
              left.path,
            ),
          );
        }
        continue;
      }
      if (rightFold.startsWith(`${leftFold}/`)) {
        issues.push(
          issue(
            "LOCK_PATH_OVERLAP",
            `${left.label} ${JSON.stringify(left.path)} cannot also be a directory containing ${right.label} ${JSON.stringify(right.path)}`,
            left.path,
          ),
        );
      }
    }
  }

  const requiredDirectories: readonly RequiredDirectory[] = [
    { directory: context.uiDir, code: "LOCK_NAMESPACE", role: "UI" },
    { directory: context.stylesDir, code: "LOCK_NAMESPACE", role: "styles" },
    {
      directory: context.stateDir,
      code: "LOCK_RESERVED_STATE",
      role: "reserved state",
    },
  ];

  const seen = new Set<string>();
  for (const claim of entries) {
    if (seen.has(claim.path)) continue;
    seen.add(claim.path);
    const folded = asciiFold(claim.path);
    for (const required of requiredDirectories) {
      if (required.directory === undefined) continue;
      const foldedDirectory = asciiFold(required.directory);
      if (folded === foldedDirectory) {
        issues.push(
          issue(
            required.code,
            `${claim.locator} ${JSON.stringify(claim.path)} must not claim the required ${required.role} directory`,
            claim.locator,
          ),
        );
      } else if (foldedDirectory.startsWith(`${folded}/`)) {
        issues.push(
          issue(
            required.code,
            `${claim.locator} ${JSON.stringify(claim.path)} must not be an ancestor of the required ${required.role} directory ${JSON.stringify(required.directory)}`,
            claim.locator,
          ),
        );
      }
    }
  }
}

/**
 * Validate a lock: identity/version provenance, unique owners/paths, valid
 * hashes/versions/cohorts and requested-vs-explicit origin agreement.
 */
export function parseKitLock(
  value: unknown,
  locator = ".kit/kit.lock.json",
  context: LockValidationContext = {},
  authority?: SchemaAuthority,
): ModelResult<KitLock> {
  const schemaResult = validateWithSchema(
    KIT_LOCK_SCHEMA,
    value,
    locator,
    authority,
  );
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues: ModelIssue[] = [];

  for (const field of ["toolVersion", "registryVersion"] as const) {
    const result = validateSemVer(record[field], field, field);
    if (!result.ok) issues.push(...result.issues);
  }

  const inReservedState = (path: string): boolean =>
    context.stateDir !== undefined &&
    isSafeLockPath(path) &&
    isSameOrBelow(path, context.stateDir);

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
      if (inReservedState(path)) {
        issues.push(
          issue(
            "LOCK_RESERVED_STATE",
            `files[${index}].path ${JSON.stringify(path)} must not live inside the reserved state directory ${JSON.stringify(context.stateDir)}`,
            `files[${index}].path`,
          ),
        );
      }
      if (
        context.uiDir !== undefined &&
        isSafeLockPath(path) &&
        !isSameOrBelow(path, context.uiDir)
      ) {
        issues.push(
          issue(
            "LOCK_NAMESPACE",
            `files[${index}].path ${JSON.stringify(path)} must live under the UI root ${JSON.stringify(context.uiDir)}`,
            `files[${index}].path`,
          ),
        );
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
    } else if (typeof owner === "string" && itemIndex.has(owner)) {
      const ownerVersion = rawItems[itemIndex.get(owner) as number]["version"];
      if (
        isSemVer(ownerVersion) &&
        !semverLte(file["itemVersion"] as string, ownerVersion)
      ) {
        issues.push(
          issue(
            "LOCK_LINEAGE_CONTRADICTION",
            `files[${index}].itemVersion ${String(file["itemVersion"])} is newer than its owner ${owner} version ${ownerVersion}`,
            `files[${index}].itemVersion`,
          ),
        );
      }
    }
  }

  // The complete ownership claim set is compared once, after every source,
  // block and integration record has been collected below.

  const blockIds = new Map<string, number>();
  const rawBlocks = record["cssBlocks"] as readonly Record<string, unknown>[];
  for (const [index, block] of rawBlocks.entries()) {
    const blockId = block["blockId"];
    if (typeof blockId === "string") {
      if (blockIds.has(blockId)) {
        issues.push(
          issue(
            "LOCK_DUPLICATE_BLOCK",
            `CSS block ${JSON.stringify(blockId)} is owned more than once (cssBlocks[${index}] and cssBlocks[${blockIds.get(blockId)}])`,
            locator,
          ),
        );
      } else {
        blockIds.set(blockId, index);
      }
    }
    const owner = block["owner"];
    if (typeof owner === "string" && !itemIds.has(owner)) {
      issues.push(
        issue(
          "LOCK_OWNER_UNKNOWN",
          `cssBlocks[${index}].owner ${JSON.stringify(owner)} is not a lock item`,
          `cssBlocks[${index}].owner`,
        ),
      );
    }
    if (
      !isSafeLockPath(block["path"]) ||
      !String(block["path"]).endsWith(".css")
    ) {
      issues.push(
        issue(
          "LOCK_PATH_INVALID",
          `cssBlocks[${index}].path must be a safe logical .css path`,
          `cssBlocks[${index}].path`,
        ),
      );
    } else {
      if (inReservedState(block["path"] as string)) {
        issues.push(
          issue(
            "LOCK_RESERVED_STATE",
            `cssBlocks[${index}].path ${JSON.stringify(block["path"])} must not live inside the reserved state directory ${JSON.stringify(context.stateDir)}`,
            `cssBlocks[${index}].path`,
          ),
        );
      }
      if (
        context.stylesDir !== undefined &&
        !isSameOrBelow(block["path"] as string, context.stylesDir)
      ) {
        issues.push(
          issue(
            "LOCK_NAMESPACE",
            `cssBlocks[${index}].path ${JSON.stringify(block["path"])} must live under the styles root ${JSON.stringify(context.stylesDir)}`,
            `cssBlocks[${index}].path`,
          ),
        );
      }
    }
    if (!isSemVer(block["itemVersion"])) {
      issues.push(
        issue(
          "LOCK_ITEM_VERSION_INVALID",
          `cssBlocks[${index}].itemVersion must be strict SemVer`,
          `cssBlocks[${index}].itemVersion`,
        ),
      );
    } else if (typeof owner === "string" && itemIndex.has(owner)) {
      const ownerVersion = rawItems[itemIndex.get(owner) as number]["version"];
      if (
        isSemVer(ownerVersion) &&
        !semverLte(block["itemVersion"] as string, ownerVersion)
      ) {
        issues.push(
          issue(
            "LOCK_LINEAGE_CONTRADICTION",
            `cssBlocks[${index}].itemVersion ${String(block["itemVersion"])} is newer than its owner ${owner} version ${ownerVersion}`,
            `cssBlocks[${index}].itemVersion`,
          ),
        );
      }
    }
  }

  const integrationKeys = new Map<string, number>();
  const rawIntegrations = record["integrations"] as readonly Record<
    string,
    unknown
  >[];
  for (const [index, integration] of rawIntegrations.entries()) {
    const kind = integration["kind"];
    const path = integration["path"];
    if (typeof kind === "string" && typeof path === "string") {
      const key = `${kind}:${path}`;
      if (integrationKeys.has(key)) {
        issues.push(
          issue(
            "LOCK_DUPLICATE_INTEGRATION",
            `integration ${key} is recorded more than once (integrations[${index}] and integrations[${integrationKeys.get(key)}])`,
            locator,
          ),
        );
      } else {
        integrationKeys.set(key, index);
      }
    }
    if (!isSafeLockPath(path)) {
      issues.push(
        issue(
          "LOCK_PATH_INVALID",
          `integrations[${index}].path must be a safe logical relative path`,
          `integrations[${index}].path`,
        ),
      );
    } else if (inReservedState(path)) {
      issues.push(
        issue(
          "LOCK_RESERVED_STATE",
          `integrations[${index}].path ${JSON.stringify(path)} must not live inside the reserved state directory ${JSON.stringify(context.stateDir)}`,
          `integrations[${index}].path`,
        ),
      );
    }
    if (
      kind === "layout" &&
      context.layoutFile !== undefined &&
      (typeof path !== "string" ||
        asciiFold(path) !== asciiFold(context.layoutFile))
    ) {
      issues.push(
        issue(
          "LOCK_LAYOUT_CONTEXT",
          `integrations[${index}].path ${JSON.stringify(path)} must be the approved layout file ${JSON.stringify(context.layoutFile)}`,
          `integrations[${index}].path`,
        ),
      );
    }
    const stylesheetPath =
      context.stylesheetPath ?? derivedStylesheetPath(context.stylesDir);
    if (
      kind === "stylesheet" &&
      stylesheetPath !== undefined &&
      (typeof path !== "string" ||
        asciiFold(path) !== asciiFold(stylesheetPath))
    ) {
      issues.push(
        issue(
          "LOCK_STYLESHEET_CONTEXT",
          `integrations[${index}].path ${JSON.stringify(path)} must be the approved aggregate stylesheet ${JSON.stringify(stylesheetPath)}`,
          `integrations[${index}].path`,
        ),
      );
    }
    const exportsPath =
      context.exportsPath ?? derivedExportsPath(context.uiDir);
    if (
      kind === "exports" &&
      exportsPath !== undefined &&
      (typeof path !== "string" || asciiFold(path) !== asciiFold(exportsPath))
    ) {
      issues.push(
        issue(
          "LOCK_EXPORTS_CONTEXT",
          `integrations[${index}].path ${JSON.stringify(path)} must be the approved root exports barrel ${JSON.stringify(exportsPath)}`,
          `integrations[${index}].path`,
        ),
      );
    }
  }

  const claims: LockClaim[] = [
    ...[...paths.entries()].map(([path, index]): LockClaim => ({
      path,
      role: "file",
      label: "managed file",
      locator: `files[${index}].path`,
    })),
    ...[...rawBlocks.entries()].flatMap(([index, block]): LockClaim[] => {
      const path = block["path"];
      if (
        typeof path !== "string" ||
        !isSafeLockPath(path) ||
        !path.endsWith(".css")
      ) {
        return [];
      }
      return [
        {
          path,
          role: "css-block",
          label: "managed CSS block",
          locator: `cssBlocks[${index}].path`,
        },
      ];
    }),
    ...[...rawIntegrations.entries()].flatMap(
      ([index, integration]): LockClaim[] => {
        const path = integration["path"];
        const kind = integration["kind"];
        if (typeof path !== "string" || !isSafeLockPath(path)) return [];
        if (kind !== "layout" && kind !== "stylesheet" && kind !== "exports") {
          return [];
        }
        return [
          {
            path,
            role: "integration",
            kind,
            label: `${kind} integration`,
            locator: `integrations[${index}].path`,
          },
        ];
      },
    ),
  ];
  checkLockClaims(claims, issues, context);

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
    cssBlocks: rawBlocks.map((block) => ({
      path: block["path"] as string,
      owner: block["owner"] as string,
      blockId: block["blockId"] as string,
      baseHash: block["baseHash"] as string,
      itemVersion: block["itemVersion"] as string,
      cohort: block["cohort"] as string,
    })),
    integrations: rawIntegrations.map((integration) => ({
      kind: integration["kind"] as IntegrationKind,
      path: integration["path"] as string,
      baseline: integration["baseline"] as string,
      contract: integration["contract"] as string,
    })),
  });
}

/** CSS blocks owned by one item, in deterministic path/block order. */
export function blocksOwnedBy(
  lock: KitLock,
  itemId: string,
): readonly LockCssBlock[] {
  return lock.cssBlocks
    .filter((block) => block.owner === itemId)
    .sort((left, right) => {
      if (left.path !== right.path) return left.path < right.path ? -1 : 1;
      return left.blockId < right.blockId
        ? -1
        : left.blockId > right.blockId
          ? 1
          : 0;
    });
}

/** Integration records of one kind, in deterministic path order. */
export function integrationsOfKind(
  lock: KitLock,
  kind: IntegrationKind,
): readonly LockIntegration[] {
  return lock.integrations
    .filter((integration) => integration.kind === kind)
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );
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
