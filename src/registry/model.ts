/**
 * Bundled registry-root model (S016).
 *
 * The root advertises which items the packaged registry can actually install.
 * It is deliberately explicit: `items` is an array of `{id, manifest}` records
 * so a duplicate ID is a structural error, and each manifest is a logical
 * registry-relative path. The bundled development root advertises no item until
 * that item is genuinely complete, so `view`/`add` never promise absent
 * components.
 *
 * Registry content identity hashes the canonical root *without* its own
 * `contentHash`, plus a sorted list of logical asset paths and exact-byte
 * digests. Host paths and timestamps never enter the identity.
 */
import { canonicalContentHash } from "../codegen/digest.js";
import { isItemId } from "../project/requests.js";
import { fail, issue, ok, type ModelResult } from "./errors.js";
import { validateWithSchema } from "./schema.js";
import {
  INITIAL_REGISTRY_VERSION,
  INITIAL_SCHEMA_VERSION,
  validateCompatibilityRange,
  validateSemVer,
} from "./versions.js";

/** Schema document that owns the registry-root shape. */
export const REGISTRY_ROOT_SCHEMA = "registry.schema.json";

export interface RegistryCompatibility {
  readonly svelte: string;
  readonly bits: string;
  readonly date: string;
}

export interface RegistryItemEntry {
  readonly id: string;
  readonly manifest: string;
}

export interface RegistryRoot {
  readonly schemaVersion: number;
  readonly registryVersion: string;
  readonly contentHash: string;
  readonly compatibility: RegistryCompatibility;
  readonly items: readonly RegistryItemEntry[];
}

/** Root identity inputs (everything except the derived `contentHash`). */
export type RegistryRootBasis = Omit<RegistryRoot, "contentHash">;

/** One logical asset path with its exact-byte digest. */
export interface RegistryAssetDigest {
  readonly path: string;
  readonly digest: string;
}

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

/** True for a safe, logical, registry-relative `.json` manifest path. */
export function isManifestPath(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*\.json$/.test(value)) return false;
  if (value.startsWith("/") || value.includes("\\")) return false;
  const segments = value.split("/");
  return segments.every(
    (segment) => segment !== "" && segment !== "." && segment !== "..",
  );
}

/**
 * Compute the canonical registry content identity. The preimage excludes the
 * field's own value and includes the sorted asset-path/digest list.
 */
export function computeRegistryContentHash(
  basis: RegistryRootBasis,
  assets: readonly RegistryAssetDigest[] = [],
): string {
  const sortedAssets = [...assets]
    .map((asset) => ({ path: asset.path, digest: asset.digest }))
    .sort((left, right) => compareCodeUnit(left.path, right.path));
  return canonicalContentHash({
    schemaVersion: basis.schemaVersion,
    registryVersion: basis.registryVersion,
    compatibility: {
      svelte: basis.compatibility.svelte,
      bits: basis.compatibility.bits,
      date: basis.compatibility.date,
    },
    items: basis.items.map((entry) => ({
      id: entry.id,
      manifest: entry.manifest,
    })),
    assets: sortedAssets,
  });
}

/** The honest empty development registry (no unimplemented item advertised). */
export function buildEmptyDevelopmentRegistry(
  compatibility: RegistryCompatibility,
  registryVersion: string = INITIAL_REGISTRY_VERSION,
): RegistryRoot {
  const basis: RegistryRootBasis = {
    schemaVersion: INITIAL_SCHEMA_VERSION,
    registryVersion,
    compatibility: {
      svelte: compatibility.svelte,
      bits: compatibility.bits,
      date: compatibility.date,
    },
    items: [],
  };
  return { ...basis, contentHash: computeRegistryContentHash(basis) };
}

/**
 * Validate a registry root against the local schema, then enforce the semantic
 * rules the schema cannot express: unique item IDs/manifest paths, safe logical
 * manifest paths, valid compatibility ranges and a matching content identity.
 */
export function parseRegistryRoot(
  value: unknown,
  locator = "registry/registry.json",
  options: { readonly assets?: readonly RegistryAssetDigest[] } = {},
): ModelResult<RegistryRoot> {
  const schemaResult = validateWithSchema(REGISTRY_ROOT_SCHEMA, value, locator);
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues = [];

  const compatibilityRecord = record["compatibility"] as Record<
    string,
    unknown
  >;
  for (const key of ["svelte", "bits", "date"] as const) {
    const result = validateCompatibilityRange(
      compatibilityRecord[key],
      `${key} compatibility`,
      `compatibility.${key}`,
    );
    if (!result.ok) issues.push(...result.issues);
  }

  const registryVersion = validateSemVer(
    record["registryVersion"],
    "registry version",
    "registryVersion",
  );
  if (!registryVersion.ok) issues.push(...registryVersion.issues);

  const rawItems = record["items"] as readonly Record<string, unknown>[];
  const seenIds = new Map<string, number>();
  const seenManifests = new Map<string, number>();
  for (const [index, entry] of rawItems.entries()) {
    const id = entry["id"];
    const manifest = entry["manifest"];
    if (typeof id === "string") {
      if (!isItemId(id)) {
        issues.push(
          issue(
            "REGISTRY_ITEM_ID_INVALID",
            `items[${index}].id is not a lowercase kebab-case item id`,
            `items[${index}].id`,
          ),
        );
      } else if (seenIds.has(id)) {
        issues.push(
          issue(
            "REGISTRY_DUPLICATE_ITEM",
            `duplicate registry item id ${JSON.stringify(id)} at items[${index}] and items[${seenIds.get(id)}]`,
            locator,
          ),
        );
      } else {
        seenIds.set(id, index);
      }
    }
    if (typeof manifest === "string") {
      if (!isManifestPath(manifest)) {
        issues.push(
          issue(
            "REGISTRY_MANIFEST_PATH_INVALID",
            `items[${index}].manifest must be a safe logical .json path, received ${JSON.stringify(manifest)}`,
            `items[${index}].manifest`,
          ),
        );
      } else if (seenManifests.has(manifest)) {
        issues.push(
          issue(
            "REGISTRY_DUPLICATE_MANIFEST",
            `duplicate manifest path ${JSON.stringify(manifest)} at items[${index}] and items[${seenManifests.get(manifest)}]`,
            locator,
          ),
        );
      } else {
        seenManifests.set(manifest, index);
      }
    }
  }

  if (issues.length > 0) return fail(issues);

  const root: RegistryRoot = {
    schemaVersion: record["schemaVersion"] as number,
    registryVersion: record["registryVersion"] as string,
    contentHash: record["contentHash"] as string,
    compatibility: {
      svelte: compatibilityRecord["svelte"] as string,
      bits: compatibilityRecord["bits"] as string,
      date: compatibilityRecord["date"] as string,
    },
    items: rawItems.map((entry) => ({
      id: entry["id"] as string,
      manifest: entry["manifest"] as string,
    })),
  };

  const { contentHash, ...basis } = root;
  const expected = computeRegistryContentHash(basis, options.assets);
  if (contentHash !== expected) {
    return fail([
      issue(
        "REGISTRY_HASH_MISMATCH",
        `registry contentHash ${contentHash} does not match the canonical identity ${expected}`,
        locator,
      ),
    ]);
  }
  return ok(root);
}
