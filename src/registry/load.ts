/**
 * Immutable validated registry snapshot (S026).
 *
 * `loadRegistrySnapshot` reads the registry root, every advertised manifest and
 * every referenced source/style asset through one `AssetProvider`, validates
 * identity and paths, computes the asset digest list, verifies the root content
 * identity, and returns a frozen snapshot with copied bytes. Later mutation of
 * the provider's files cannot change an already-built snapshot, and all missing
 * assets are surfaced together before any planning.
 */
import { sha256Hex } from "../codegen/digest.js";
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
import { validateWithSchema } from "./schema.js";

/** One resolved source/style asset with frozen bytes. */
export interface RegistrySnapshotFile {
  readonly logicalSource: string;
  readonly target: string;
  readonly owner: string;
  readonly cohort: string;
  readonly blockId: string | null;
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

/** Registry-relative asset reference to a package-root logical path. */
export function registryAssetPath(relativePath: string): string {
  return `registry/${relativePath}`;
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

  const rootRaw = readJson(provider, locator, "REGISTRY_ROOT_INVALID", issues);
  if (rootRaw === undefined) return fail(issues);
  const rootSchema = validateWithSchema(REGISTRY_ROOT_SCHEMA, rootRaw, locator);
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
    const itemResult = parseRegistryItem(manifestRaw, manifestLogical);
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
      const digest = sha256Hex(bytes.value);
      assetDigests.set(logicalSource, digest);
      files.push({
        logicalSource,
        target: declaration.target,
        owner: item.id,
        cohort: declaration.cohort,
        blockId: declaration.blockId,
        bytes: new Uint8Array(bytes.value),
        digest,
      });
    }
    items.push({
      id: entry.id,
      manifestPath: manifestLogical,
      manifest: item,
      files,
    });
  }

  if (issues.length > 0) return fail(issues);

  const assets: RegistryAssetDigest[] = [...assetDigests.entries()]
    .map(([path, digest]) => ({ path, digest }))
    .sort((left, right) =>
      left.path < right.path ? -1 : left.path > right.path ? 1 : 0,
    );

  const rootResult = parseRegistryRoot(rootRaw, locator, { assets });
  if (!rootResult.ok) return fail(rootResult.issues);

  const snapshot: RegistrySnapshot = {
    root: rootResult.value,
    items: Object.freeze(items.map((item) => Object.freeze(item))),
    assets: Object.freeze(assets),
  };
  return ok(Object.freeze(snapshot));
}
