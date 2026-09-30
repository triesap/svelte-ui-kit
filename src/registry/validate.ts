/**
 * Registry asset health validation (S027).
 *
 * Health has two jobs:
 *
 * 1. validate the packaged schema identities against the parser expectations;
 * 2. validate the advertised inventory and distinguish *unregistered candidate*
 *    authoring manifests (files present under `registry/ui/` but not registered
 *    in the root) from complete, installable items.
 *
 * A candidate is authoring work in progress: it is visible in the qualification
 * inventory but must never be installable until the root registers it. The
 * advertised root never references a missing file or invalid block because
 * `loadRegistrySnapshot` already enforces that.
 */
import type { AssetProvider } from "./assets.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import { loadRegistrySnapshot, type RegistrySnapshot } from "./load.js";

/** Fixed local schema identities the parser compiles. */
export const SCHEMA_IDENTITIES: Readonly<Record<string, string>> = {
  "schema/v1/kit.schema.json": "urn:svelte-ui-kit:schema:v1:kit",
  "schema/v1/kit-lock.schema.json": "urn:svelte-ui-kit:schema:v1:kit-lock",
  "schema/v1/registry.schema.json": "urn:svelte-ui-kit:schema:v1:registry",
  "schema/v1/registry-item.schema.json":
    "urn:svelte-ui-kit:schema:v1:registry-item",
  "schema/v1/token-contract.schema.json":
    "urn:svelte-ui-kit:schema:v1:token-contract",
  "schema/v1/component-customization.schema.json":
    "urn:svelte-ui-kit:schema:v1:component-customization",
  "schema/v1/theme-integration.schema.json":
    "urn:svelte-ui-kit:schema:v1:theme-integration",
  "schema/v1/command-envelope.schema.json":
    "urn:svelte-ui-kit:schema:v1:command-envelope",
};

export interface RegistryHealth {
  readonly snapshot: RegistrySnapshot;
  /** Registered, installable item ids. */
  readonly advertised: readonly string[];
  /** Unregistered authoring manifests (registry-relative paths). */
  readonly candidates: readonly string[];
}

/** Validate that each packaged schema document keeps its expected identity. */
export function validateSchemaIdentities(
  provider: AssetProvider,
): ModelResult<readonly string[]> {
  const issues: ModelIssue[] = [];
  const checked: string[] = [];
  for (const [path, expectedId] of Object.entries(SCHEMA_IDENTITIES)) {
    const text = provider.readText(path);
    if (!text.ok) {
      issues.push(...text.issues);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.value);
    } catch (error) {
      issues.push(
        issue(
          "SCHEMA_IDENTITY_MISMATCH",
          `${path} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
          path,
        ),
      );
      continue;
    }
    const record = parsed as { $id?: unknown; $schema?: unknown };
    if (record.$id !== expectedId) {
      issues.push(
        issue(
          "SCHEMA_IDENTITY_MISMATCH",
          `${path} must declare $id ${JSON.stringify(expectedId)}, found ${JSON.stringify(record.$id)}`,
          path,
        ),
      );
    }
    if (
      typeof record.$schema !== "string" ||
      !record.$schema.includes("draft-07")
    ) {
      issues.push(
        issue(
          "SCHEMA_IDENTITY_MISMATCH",
          `${path} must declare the local draft-07 meta-schema`,
          path,
        ),
      );
    }
    checked.push(path);
  }
  if (issues.length > 0) return fail(issues);
  return ok(checked);
}

/**
 * Validate the full registry health: schema identities, the advertised
 * snapshot, and the candidate authoring inventory.
 */
export function validateRegistryHealth(
  provider: AssetProvider,
): ModelResult<RegistryHealth> {
  const issues: ModelIssue[] = [];
  const schemas = validateSchemaIdentities(provider);
  if (!schemas.ok) issues.push(...schemas.issues);

  const snapshotResult = loadRegistrySnapshot(provider);
  if (!snapshotResult.ok) {
    issues.push(...snapshotResult.issues);
    return fail(issues);
  }
  const snapshot = snapshotResult.value;

  const listed = provider.list("registry");
  if (!listed.ok) {
    issues.push(...listed.issues);
    return fail(issues);
  }
  const registered = new Set(snapshot.items.map((item) => item.manifestPath));
  const candidates = listed.value.filter(
    (path) =>
      path.startsWith("registry/ui/") &&
      path.endsWith(".json") &&
      !registered.has(path),
  );
  if (issues.length > 0) return fail(issues);

  return ok({
    snapshot,
    advertised: snapshot.items.map((item) => item.id),
    candidates,
  });
}

/** True when `id` is a registered, installable item. */
export function isInstallable(health: RegistryHealth, id: string): boolean {
  return health.advertised.includes(id);
}
