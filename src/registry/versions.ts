/**
 * Independent version identities (S013).
 *
 * The generator deliberately keeps several version axes apart, mirroring the
 * reference behaviour it replaces:
 *
 * - `schemaVersion`, `protocolVersion` and `contractVersion` are small positive
 *   integers for local draft-07 schema identities, the CLI envelope protocol
 *   and the token/customization CSS contracts respectively. They are never
 *   borrowed from a framework release.
 * - `toolVersion`, `registryVersion` and `itemVersion` are strict SemVer
 *   releases for the published CLI package, the bundled registry release and an
 *   individual registry item.
 * - `compatibility` is a separate npm range describing which Svelte/Bits UI
 *   releases an item was qualified against. It is not a schema version: a
 *   framework bump is not automatically a schema migration.
 * - `contentHash` is an exact-byte SHA-256 identity over file bytes, named
 *   distinctly from the semantic/canonical hashes in `src/codegen/digest.ts`.
 *
 * Only the comparison/validation helpers actually used by later checkpoints
 * live here; these constants record technical initial choices, not
 * user-provided configuration.
 */
import { createRequire } from "node:module";
import { NATIVE_BASELINE } from "../project/native-dependency.js";

import { fail, issue, ok, ModelError, type ModelResult } from "./errors.js";

/**
 * `semver` is loaded on first use. The bootstrap CLI surface (help, version,
 * usage and unsupported outcomes) never evaluates a range, so a
 * dependency-free built copy still runs those paths.
 */
type SemverModule = typeof import("semver");
const nodeRequire = createRequire(import.meta.url);
let semverModule: SemverModule | null = null;
function semver(): SemverModule {
  if (semverModule === null) {
    semverModule = nodeRequire("semver") as SemverModule;
  }
  return semverModule;
}

/** Positive integer identity for a local schema (draft-07) revision. */
export type SchemaVersion = number;
/** Positive integer identity for the CLI result-envelope protocol. */
export type ProtocolVersion = number;
/** Positive integer identity for a CSS token/customization contract. */
export type ContractVersion = number;
/** Strict SemVer 2.0.0 release string. */
export type SemVer = string;
/** npm-compatible dependency range (never a schema version). */
export type CompatibilityRange = string;
/** Exact-byte SHA-256 digest, lowercase 64-hex. */
export type ContentHash = string;

export const INITIAL_SCHEMA_VERSION: SchemaVersion = 1;
export const INITIAL_PROTOCOL_VERSION: ProtocolVersion = 1;
export const INITIAL_CONTRACT_VERSION: ContractVersion = 1;
export const INITIAL_TOOL_VERSION: SemVer = "0.1.0";
export const INITIAL_REGISTRY_VERSION: SemVer = "0.1.0";
export const INITIAL_ITEM_VERSION: SemVer = "0.1.0";

/**
 * Bits UI's own non-optional peer requirements, recorded separately from the
 * tested-support claim below. The qualified Bits source retains Svelte `^5.33.0` and
 * `@internationalized/date` `^3.8.1`; these are the primitive's real peers,
 * not the kit's advertised/qualified baseline.
 */
export const BITS_UI_PEER_REQUIREMENTS = {
  svelte: "^5.33.0",
  date: "^3.8.1",
} as const;

/**
 * Initial advertised frame compatibility: the exact qualified baseline Svelte
 * `5.57.1` and the authenticated local Bits build (exact versions). The `date`
 * range is Bits UI's real peer requirement for `@internationalized/date`. This
 * support claim is deliberately narrower than Bits UI's own `^5.33.0` Svelte
 * peer recorded above.
 */
export const INITIAL_COMPATIBILITY: CompatibilityPolicy = {
  svelte: "5.57.1",
  bits: NATIVE_BASELINE.version,
  date: BITS_UI_PEER_REQUIREMENTS.date,
};

/** Exact-byte content digest format. */
export const CONTENT_HASH_PATTERN = /^[0-9a-f]{64}$/;

/**
 * Requirement prefixes that name a mutable/out-of-registry source rather than a
 * registry SemVer range. They are typed errors, never guessed into a range.
 */
const SOURCE_REQUIREMENT_PREFIXES = [
  "git+",
  "git:",
  "file:",
  "link:",
  "workspace:",
  "npm:",
  "http:",
  "https:",
  "github:",
  "git@",
];

export interface CompatibilityPolicy {
  readonly svelte: CompatibilityRange;
  readonly bits: CompatibilityRange;
  readonly date: CompatibilityRange;
}

/** The complete independent identity of a tool/registry projection. */
export interface VersionIdentities {
  readonly schemaVersion: SchemaVersion;
  readonly protocolVersion: ProtocolVersion;
  readonly contractVersion: ContractVersion;
  readonly toolVersion: SemVer;
  readonly registryVersion: SemVer;
  readonly itemVersion: SemVer;
  readonly compatibility: CompatibilityPolicy;
}

export const INITIAL_IDENTITIES: VersionIdentities = {
  schemaVersion: INITIAL_SCHEMA_VERSION,
  protocolVersion: INITIAL_PROTOCOL_VERSION,
  contractVersion: INITIAL_CONTRACT_VERSION,
  toolVersion: INITIAL_TOOL_VERSION,
  registryVersion: INITIAL_REGISTRY_VERSION,
  itemVersion: INITIAL_ITEM_VERSION,
  compatibility: INITIAL_COMPATIBILITY,
};

/** Axes that `changedVersionAxes` can report independently. */
export type VersionAxis =
  | "schemaVersion"
  | "protocolVersion"
  | "contractVersion"
  | "toolVersion"
  | "registryVersion"
  | "itemVersion"
  | "compatibility";

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return Array.isArray(value) ? "an array" : typeof value;
}

/** True for a positive, safe integer (schema/protocol/contract revision). */
export function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 1;
}

export function isSchemaVersion(value: unknown): value is SchemaVersion {
  return isPositiveInteger(value);
}

export function isProtocolVersion(value: unknown): value is ProtocolVersion {
  return isPositiveInteger(value);
}

export function isContractVersion(value: unknown): value is ContractVersion {
  return isPositiveInteger(value);
}

/**
 * Strict SemVer 2.0.0. `semver.valid` is deliberately lenient (it trims
 * whitespace, accepts a leading `v` and drops build metadata), so the official
 * grammar is checked directly. `semver` remains the authority for the npm
 * *range* and intersection semantics used by later checkpoints.
 */
const SEMVER_RE =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+(?:[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function isSemVer(value: unknown): value is SemVer {
  return (
    typeof value === "string" &&
    SEMVER_RE.test(value) &&
    semver().valid(value) !== null
  );
}

/** Exact-byte SHA-256 identity: lowercase 64-hex only. */
export function isContentHash(value: unknown): value is ContentHash {
  return typeof value === "string" && CONTENT_HASH_PATTERN.test(value);
}

/** True when `value` is an npm range and not a mutable source requirement. */
export function isCompatibilityRange(
  value: unknown,
): value is CompatibilityRange {
  if (typeof value !== "string") return false;
  const trimmed = value.trim();
  if (trimmed === "") return false;
  if (trimmed !== value) return false;
  const lowered = trimmed.toLowerCase();
  if (
    SOURCE_REQUIREMENT_PREFIXES.some((prefix) => lowered.startsWith(prefix))
  ) {
    return false;
  }
  if (/^[./]/.test(trimmed) || /^[A-Za-z]:[\\/]/.test(trimmed)) return false;
  return semver().validRange(trimmed) !== null;
}

function validatePositiveInteger(
  value: unknown,
  code: string,
  label: string,
  locator?: string,
): ModelResult<number> {
  if (isPositiveInteger(value)) return ok(value);
  return fail([
    issue(
      code,
      `${label} must be a positive safe integer, received ${describe(value)}`,
      locator,
    ),
  ]);
}

export function validateSchemaVersion(
  value: unknown,
  locator?: string,
): ModelResult<SchemaVersion> {
  return validatePositiveInteger(
    value,
    "SCHEMA_VERSION_INVALID",
    "schema version",
    locator,
  );
}

export function validateProtocolVersion(
  value: unknown,
  locator?: string,
): ModelResult<ProtocolVersion> {
  return validatePositiveInteger(
    value,
    "PROTOCOL_VERSION_INVALID",
    "protocol version",
    locator,
  );
}

export function validateContractVersion(
  value: unknown,
  locator?: string,
): ModelResult<ContractVersion> {
  return validatePositiveInteger(
    value,
    "CONTRACT_VERSION_INVALID",
    "contract version",
    locator,
  );
}

export function validateSemVer(
  value: unknown,
  label: string,
  locator?: string,
): ModelResult<SemVer> {
  if (isSemVer(value)) return ok(value);
  return fail([
    issue(
      "SEMVER_INVALID",
      `${label} must be a strict SemVer 2.0.0 release, received ${describe(value)}`,
      locator,
    ),
  ]);
}

export function validateCompatibilityRange(
  value: unknown,
  label: string,
  locator?: string,
): ModelResult<CompatibilityRange> {
  if (isCompatibilityRange(value)) return ok(value);
  return fail([
    issue(
      "COMPATIBILITY_RANGE_INVALID",
      `${label} must be a registry npm range (not a git/file/url source), received ${describe(value)}`,
      locator,
    ),
  ]);
}

export function validateContentHash(
  value: unknown,
  locator?: string,
): ModelResult<ContentHash> {
  if (isContentHash(value)) return ok(value);
  return fail([
    issue(
      "CONTENT_HASH_INVALID",
      `content hash must be lowercase 64-hex SHA-256, received ${describe(value)}`,
      locator,
    ),
  ]);
}

/** Validate every field of a `VersionIdentities` object in one pass. */
export function validateVersionIdentities(
  value: unknown,
): ModelResult<VersionIdentities> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return fail([
      issue(
        "VERSION_IDENTITIES_INVALID",
        "version identities must be an object",
      ),
    ]);
  }
  const record = value as Record<string, unknown>;
  const issues = [];
  const push = <T>(result: ModelResult<T>): T | undefined => {
    if (result.ok) return result.value;
    issues.push(...result.issues);
    return undefined;
  };
  const schemaVersion = push(
    validateSchemaVersion(record["schemaVersion"], "schemaVersion"),
  );
  const protocolVersion = push(
    validateProtocolVersion(record["protocolVersion"], "protocolVersion"),
  );
  const contractVersion = push(
    validateContractVersion(record["contractVersion"], "contractVersion"),
  );
  const toolVersion = push(
    validateSemVer(record["toolVersion"], "tool version", "toolVersion"),
  );
  const registryVersion = push(
    validateSemVer(
      record["registryVersion"],
      "registry version",
      "registryVersion",
    ),
  );
  const itemVersion = push(
    validateSemVer(record["itemVersion"], "item version", "itemVersion"),
  );
  const compatibilityRecord = record["compatibility"];
  let compatibility: CompatibilityPolicy | undefined;
  if (
    typeof compatibilityRecord !== "object" ||
    compatibilityRecord === null ||
    Array.isArray(compatibilityRecord)
  ) {
    issues.push(
      issue(
        "COMPATIBILITY_INVALID",
        "compatibility must be an object",
        "compatibility",
      ),
    );
  } else {
    const ranges = compatibilityRecord as Record<string, unknown>;
    const svelte = push(
      validateCompatibilityRange(
        ranges["svelte"],
        "svelte compatibility",
        "compatibility.svelte",
      ),
    );
    const bits = push(
      validateCompatibilityRange(
        ranges["bits"],
        "bits compatibility",
        "compatibility.bits",
      ),
    );
    const date = push(
      validateCompatibilityRange(
        ranges["date"],
        "date compatibility",
        "compatibility.date",
      ),
    );
    if (svelte && bits && date) compatibility = { svelte, bits, date };
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    schemaVersion: schemaVersion as SchemaVersion,
    protocolVersion: protocolVersion as ProtocolVersion,
    contractVersion: contractVersion as ContractVersion,
    toolVersion: toolVersion as SemVer,
    registryVersion: registryVersion as SemVer,
    itemVersion: itemVersion as SemVer,
    compatibility: compatibility as CompatibilityPolicy,
  });
}

/**
 * Report exactly which independent axes differ between two identities. A
 * compatibility-range change reports only `compatibility`; it never implies a
 * schema migration.
 */
export function changedVersionAxes(
  before: VersionIdentities,
  after: VersionIdentities,
): readonly VersionAxis[] {
  const changed: VersionAxis[] = [];
  if (before.schemaVersion !== after.schemaVersion)
    changed.push("schemaVersion");
  if (before.protocolVersion !== after.protocolVersion)
    changed.push("protocolVersion");
  if (before.contractVersion !== after.contractVersion)
    changed.push("contractVersion");
  if (before.toolVersion !== after.toolVersion) changed.push("toolVersion");
  if (before.registryVersion !== after.registryVersion)
    changed.push("registryVersion");
  if (before.itemVersion !== after.itemVersion) changed.push("itemVersion");
  if (
    before.compatibility.svelte !== after.compatibility.svelte ||
    before.compatibility.bits !== after.compatibility.bits ||
    before.compatibility.date !== after.compatibility.date
  ) {
    changed.push("compatibility");
  }
  return changed;
}

/** Throw a typed `ModelError` unless `value` is a complete identity. */
export function assertVersionIdentities(value: unknown): VersionIdentities {
  const result = validateVersionIdentities(value);
  if (!result.ok) throw new ModelError(result.issues);
  return result.value;
}

/** Throw a typed `ModelError` unless `value` is a lowercase 64-hex digest. */
export function assertContentHash(
  value: unknown,
  locator?: string,
): ContentHash {
  const result = validateContentHash(value, locator);
  if (!result.ok) throw new ModelError(result.issues);
  return result.value;
}
