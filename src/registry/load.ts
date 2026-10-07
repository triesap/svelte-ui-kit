/**
 * Immutable validated registry snapshot (S026).
 *
 * `loadRegistrySnapshot` reads the registry root, every advertised manifest and
 * every referenced source/style asset through one `AssetProvider`, validates
 * identity, paths and text encoding, computes the asset digest list, verifies
 * the root content identity, and returns a deeply frozen snapshot with copied
 * bytes. Later mutation of the provider's files cannot change an already-built
 * snapshot, mutation of the snapshot itself cannot break its digests or later
 * resolution, and all missing assets are surfaced together before any planning.
 *
 * Schemas are compiled through a provider-scoped `SchemaAuthority`, so the
 * supplied package is the single source of truth for both schemas and assets.
 */
import { sha256Hex } from "../codegen/digest.js";
import { registryStyleBody } from "../codegen/css.js";
import type { AssetProvider } from "./assets.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import { parseRegistryItem, type RegistryItem } from "./item.js";
import {
  parseRegistryRoot,
  REGISTRY_ROOT_SCHEMA,
  type RegistryAssetDigest,
  type RegistryRoot,
} from "./model.js";
import { createSchemaAuthority } from "./schema.js";

/** One resolved source/style asset with read-only bytes. */
export interface RegistrySnapshotFile {
  readonly logicalSource: string;
  readonly target: string;
  readonly owner: string;
  readonly cohort: string;
  readonly blockId: string | null;
  /** A defensive copy; mutating it never changes the snapshot or its digest. */
  readonly bytes: Uint8Array;
  readonly digest: string;
}

export interface RegistrySnapshotItem {
  readonly id: string;
  readonly manifestPath: string;
  readonly manifest: RegistryItem;
  readonly files: readonly RegistrySnapshotFile[];
}

export interface RegistrySnapshot {
  readonly root: RegistryRoot;
  readonly items: readonly RegistrySnapshotItem[];
  readonly assets: readonly RegistryAssetDigest[];
}

const VALIDATED_SNAPSHOTS = new WeakSet<object>();

/** Only the exact immutable instance loaded and integrity-checked here. */
export function isValidatedRegistrySnapshot(
  value: unknown,
): value is RegistrySnapshot {
  return (
    typeof value === "object" &&
    value !== null &&
    VALIDATED_SNAPSHOTS.has(value)
  );
}

/** Registry-relative asset reference to a package-root logical path. */
export function registryAssetPath(relativePath: string): string {
  return `registry/${relativePath}`;
}

/**
 * Recursively freeze plain objects and arrays. Typed arrays are left to the
 * explicit read-only byte accessor below, because `Object.freeze` does not
 * prevent element writes on a `Uint8Array`.
 */
function deepFreeze<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return value;
  if (Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const key of Object.keys(value as Record<string, unknown>)) {
    deepFreeze((value as Record<string, unknown>)[key]);
  }
  return value;
}

function utf8Valid(bytes: Uint8Array): boolean {
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    return true;
  } catch {
    return false;
  }
}

function readJson(
  provider: AssetProvider,
  logicalPath: string,
  code: string,
  issues: ModelIssue[],
): unknown {
  const text = provider.readText(logicalPath);
  if (!text.ok) {
    issues.push(...text.issues);
    return undefined;
  }
  try {
    return JSON.parse(text.value);
  } catch (error) {
    issues.push(
      issue(
        code,
        `${logicalPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        logicalPath,
      ),
    );
    return undefined;
  }
}

/**
 * Read and validate the whole registry into one immutable snapshot. All
 * missing-asset and manifest problems are collected before returning failure.
 */
export function loadRegistrySnapshot(
  provider: AssetProvider,
  locator = "registry/registry.json",
): ModelResult<RegistrySnapshot> {
  const issues: ModelIssue[] = [];

  // The authority is derived internally from the same provider that supplied
  // the assets. A caller cannot hand in another root's authority to load a
  // schema-less package, and every operation re-validates its own schema bytes.
  const createdAuthority = createSchemaAuthority(provider);
  if (!createdAuthority.ok) return fail(createdAuthority.issues);
  const authority = createdAuthority.value;

  const rootRaw = readJson(provider, locator, "REGISTRY_ROOT_INVALID", issues);
  if (rootRaw === undefined) return fail(issues);
  const rootSchema = authority.validate(REGISTRY_ROOT_SCHEMA, rootRaw, locator);
  if (!rootSchema.ok) {
    issues.push(...rootSchema.issues);
    return fail(issues);
  }

  const rootRecord = rootRaw as {
    items: readonly { id: string; manifest: string }[];
  };
  const items: RegistrySnapshotItem[] = [];
  const assetDigests = new Map<string, string>();

  for (const entry of rootRecord.items) {
    const manifestLogical = registryAssetPath(entry.manifest);
    const manifestBytes = provider.readBytes(manifestLogical);
    if (!manifestBytes.ok) {
      issues.push(...manifestBytes.issues);
      continue;
    }
    assetDigests.set(manifestLogical, sha256Hex(manifestBytes.value));
    let manifestRaw: unknown;
    try {
      manifestRaw = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(manifestBytes.value),
      );
    } catch (error) {
      issues.push(
        issue(
          "REGISTRY_MANIFEST_INVALID",
          `${manifestLogical} is not valid UTF-8 JSON: ${error instanceof Error ? error.message : String(error)}`,
          manifestLogical,
        ),
      );
      continue;
    }
    const itemResult = parseRegistryItem(
      manifestRaw,
      manifestLogical,
      authority,
    );
    if (!itemResult.ok) {
      issues.push(...itemResult.issues);
      continue;
    }
    const item = itemResult.value;
    if (item.id !== entry.id) {
      issues.push(
        issue(
          "REGISTRY_MANIFEST_ID_MISMATCH",
          `${manifestLogical} declares id ${JSON.stringify(item.id)} but the root registers ${JSON.stringify(entry.id)}`,
          manifestLogical,
        ),
      );
      continue;
    }

    const files: RegistrySnapshotFile[] = [];
    const declared = [
      ...item.files.map((file) => ({
        source: file.source,
        target: file.target,
        cohort: file.cohort,
        blockId: null as string | null,
      })),
      ...item.styles.map((style) => ({
        source: style.source,
        target: style.target,
        cohort: style.cohort,
        blockId: style.blockId,
      })),
    ];
    for (const declaration of declared) {
      const logicalSource = registryAssetPath(declaration.source);
      const bytes = provider.readBytes(logicalSource);
      if (!bytes.ok) {
        issues.push(...bytes.issues);
        continue;
      }
      if (!utf8Valid(bytes.value)) {
        issues.push(
          issue(
            "ASSET_INVALID_UTF8",
            `${logicalSource} is not valid UTF-8`,
            logicalSource,
          ),
        );
        continue;
      }
      if (declaration.blockId !== null) {
        const style = registryStyleBody(
          new TextDecoder().decode(bytes.value),
          declaration.blockId,
        );
        if (!style.ok) {
          issues.push(
            ...style.issues.map((entry) =>
              issue(
                "REGISTRY_STYLE_BLOCK_INVALID",
                entry.message,
                logicalSource,
              ),
            ),
          );
          continue;
        }
      }
      const digest = sha256Hex(bytes.value);
      assetDigests.set(logicalSource, digest);
      const stored = new Uint8Array(bytes.value);
      const record: RegistrySnapshotFile = {
        logicalSource,
        target: declaration.target,
        owner: item.id,
        cohort: declaration.cohort,
        blockId: declaration.blockId,
        get bytes(): Uint8Array {
          return new Uint8Array(stored);
        },
        digest,
      };
      files.push(deepFreeze(record));
    }
    items.push(
      deepFreeze({
        id: entry.id,
        manifestPath: manifestLogical,
        manifest: item,
        files: Object.freeze(files),
      }),
    );
  }

  if (issues.length > 0) return fail(issues);

  const assets: RegistryAssetDigest[] = [...assetDigests.entries()]
    .map(([path, digest]) => Object.freeze({ path, digest }))
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );

  const rootResult = parseRegistryRoot(rootRaw, locator, { assets, authority });
  if (!rootResult.ok) return fail(rootResult.issues);

  const snapshot: RegistrySnapshot = deepFreeze({
    root: deepFreeze(rootResult.value),
    items: Object.freeze(items),
    assets: Object.freeze(assets),
  });
  VALIDATED_SNAPSHOTS.add(snapshot);
  return ok(snapshot);
}
