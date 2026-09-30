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
import { fail, ok, type ModelIssue, type ModelResult } from "./errors.js";
import { loadRegistrySnapshot, type RegistrySnapshot } from "./load.js";
import { planDependencies, type DependencyPlan } from "./dependency-plan.js";
import { resolveClosure } from "./resolve.js";
import {
  validateResolvedTargets,
  type ResolvedTargets,
} from "./validate-targets.js";
import { validateCompatibility } from "./compatibility.js";
import { createSchemaAuthority, SHIPPED_SCHEMAS } from "./schema.js";

/** Fixed local schema identities the parser compiles. */
export const SCHEMA_IDENTITIES: Readonly<Record<string, string>> =
  Object.freeze(
    Object.fromEntries(
      Object.entries(SHIPPED_SCHEMAS).map(([file, id]) => [
        `schema/v1/${file}`,
        id,
      ]),
    ),
  );

/** The `schema/v1/...` logical paths of every shipped schema. */
export const SCHEMA_PATHS: readonly string[] = Object.freeze(
  Object.keys(SHIPPED_SCHEMAS).map((file) => `schema/v1/${file}`),
);

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
  const authority = createSchemaAuthority(provider);
  if (!authority.ok) return fail(authority.issues);
  return ok([...SCHEMA_PATHS]);
}

/** Validated resolved inventory for one registry operation. */
export interface ResolvedInventoryValidation {
  readonly targets: ResolvedTargets;
  readonly plan: DependencyPlan;
}

/**
 * Compose the production validation path for a resolved closure: target/block/
 * export ownership, the joint npm dependency plan, and the joint framework
 * compatibility of the root and every selected item. Planning must not proceed
 * when any of these fail.
 */
export function validateResolvedInventory(
  snapshot: RegistrySnapshot,
  closure: readonly string[],
): ModelResult<ResolvedInventoryValidation> {
  const issues: ModelIssue[] = [];
  const targets = validateResolvedTargets(snapshot, closure);
  const plan = planDependencies(snapshot, closure);
  const compatibility = validateCompatibility(snapshot, closure);
  if (!targets.ok) issues.push(...targets.issues);
  if (!plan.ok) issues.push(...plan.issues);
  if (!compatibility.ok) issues.push(...compatibility.issues);
  if (!targets.ok || !plan.ok || issues.length > 0) return fail(issues);
  return ok({ targets: targets.value, plan: plan.value });
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

  // Compose the same production validation the planner relies on: the
  // advertised inventory must resolve without missing items or cycles, its
  // resolved targets/blocks/exports must have unambiguous ownership, every
  // joint npm requirement must be evaluable, and every item must be jointly
  // compatible with the qualified root support before anything is installable.
  const advertised = snapshot.items.map((item) => item.id);
  const closure = resolveClosure(snapshot, advertised);
  if (!closure.ok) return fail(closure.issues);
  const resolved = validateResolvedInventory(snapshot, closure.value.items);
  if (!resolved.ok) issues.push(...resolved.issues);
  if (issues.length > 0) return fail(issues);

  return ok({
    snapshot,
    advertised,
    candidates,
  });
}

/** True when `id` is a registered, installable item. */
export function isInstallable(health: RegistryHealth, id: string): boolean {
  return health.advertised.includes(id);
}
