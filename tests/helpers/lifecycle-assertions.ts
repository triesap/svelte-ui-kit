/**
 * Shared whole-tree and ownership assertions for the RCLD-04 multi-item
 * lifecycle qualification. Extracted from the accepted
 * `multi-item-lifecycle.test.ts` coverage so the Q2 disposition matrix asserts
 * the same exact outcomes without restating the model.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyOutcome,
  type ValidatedApplyPlan,
} from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import type { PlanWrite } from "../../src/codegen/plan.js";
import type { KitLock } from "../../src/codegen/lock.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import {
  deriveKitPaths,
  type KitConfig,
  type KitDerivedPaths,
} from "../../src/project/config.js";
import {
  assertTreeAfterMutations,
  snapshotTree,
  type TreeMutation,
} from "./tree-snapshot.js";

function abs(root: string, rel: string): string {
  return path.join(root, ...rel.split("/"));
}

export interface GuardedApply {
  readonly plan: ValidatedApplyPlan;
  readonly outcome: ApplyOutcome;
}

/** Compose, validate and apply a planned write set through the guarded core. */
export function applyGuarded(
  root: string,
  config: KitConfig,
  snapshot: ProjectSnapshot,
  writes: readonly PlanWrite[],
): GuardedApply {
  const composed = composeApplyPlan({ root, config, writes, snapshot });
  assert.equal(composed.ok, true, JSON.stringify(composed));
  if (!composed.ok) throw new Error("compose failed");
  const validated = validateApplyPlan(composed.value);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) throw new Error("validation failed");
  return { plan: validated.value, outcome: applyPlan(validated.value) };
}

/**
 * Every write the guarded plan will perform: each composed target plus the
 * canonical lock publication. This is the exact mutation set the expected tree
 * is built from; the resulting tree is never consulted to derive it.
 */
export function planMutations(
  plan: ValidatedApplyPlan,
  derived: KitDerivedPaths,
): TreeMutation[] {
  const mutations: TreeMutation[] = plan.targets.map((target) => ({
    path: target.path,
    operation: target.operation,
    bytes: target.bytes,
    mode: target.mode,
  }));
  mutations.push({
    path: `${derived.stateDir}/kit.lock.json`,
    operation: plan.lock.preimage.kind === "file" ? "update" : "create",
    bytes: plan.lock.bytes,
    mode: plan.lock.preimage.mode ?? 0o644,
  });
  return mutations;
}

/** Assert an applied outcome and its exact resulting tree. */
export function assertApplied(
  label: string,
  consumer: string,
  config: KitConfig,
  before: ReturnType<typeof snapshotTree>,
  guarded: GuardedApply,
): void {
  assert.equal(
    guarded.outcome.kind,
    "applied",
    `${label}: ${JSON.stringify(guarded.outcome.issues)}`,
  );
  assertTreeAfterMutations(
    consumer,
    before,
    planMutations(guarded.plan, deriveKitPaths(config)),
  );
}

export interface OwnershipSpec {
  readonly requested: readonly string[];
  readonly items: readonly string[];
  readonly files: readonly {
    readonly target: string;
    readonly owner: string;
    readonly cohort: string;
  }[];
  readonly blocks: readonly {
    readonly blockId: string;
    readonly owner: string;
    readonly cohort: string;
  }[];
}

/** Whole-lock ownership and cohort comparison against an explicit expectation. */
export function assertLockOwnership(
  lock: KitLock,
  config: KitConfig,
  spec: OwnershipSpec,
): void {
  const derived = deriveKitPaths(config);
  assert.deepEqual([...lock.requested].sort(), [...spec.requested].sort());
  assert.deepEqual(
    lock.items.map((item) => `${item.id}:${item.origin}`).sort(),
    [...spec.items].sort(),
  );
  assert.deepEqual(
    lock.files
      .map((file) => `${file.path}:${file.owner}:${file.cohort}`)
      .sort(),
    spec.files
      .map(
        (file) =>
          `${derived.rootExportsDir}/${file.target}:${file.owner}:${file.cohort}`,
      )
      .sort(),
    JSON.stringify(lock.files),
  );
  assert.deepEqual(
    lock.cssBlocks
      .map(
        (block) =>
          `${block.path}:${block.blockId}:${block.owner}:${block.cohort}`,
      )
      .sort(),
    spec.blocks
      .map(
        (block) =>
          `${derived.kitCss}:${block.blockId}:${block.owner}:${block.cohort}`,
      )
      .sort(),
    JSON.stringify(lock.cssBlocks),
  );
  const integration = (
    kind: "layout" | "stylesheet" | "exports",
  ): string | undefined =>
    lock.integrations.find((entry) => entry.kind === kind)?.path;
  assert.equal(integration("layout"), config.layoutFile);
  assert.equal(integration("stylesheet"), derived.kitCss);
  assert.equal(integration("exports"), derived.rootExports);
}

/** Read the canonical lock from an owned consumer. */
export function currentLock(root: string, derived: KitDerivedPaths): KitLock {
  return JSON.parse(
    readFileSync(abs(root, `${derived.stateDir}/kit.lock.json`), "utf8"),
  ) as KitLock;
}

export const ADDED_OWNERSHIP: OwnershipSpec = {
  requested: ["card"],
  items: ["button:transitive", "card:explicit"],
  files: [
    { target: "button.svelte", owner: "button", cohort: "core" },
    { target: "card.svelte", owner: "card", cohort: "core" },
    { target: "card.types.ts", owner: "card", cohort: "types" },
  ],
  blocks: [
    { blockId: "button", owner: "button", cohort: "core" },
    { blockId: "card", owner: "card", cohort: "core" },
    { blockId: "card-extra", owner: "card", cohort: "extra" },
  ],
};

export const RETAINED_OWNERSHIP: OwnershipSpec = {
  requested: ["button"],
  items: ["button:explicit"],
  files: [{ target: "button.svelte", owner: "button", cohort: "core" }],
  blocks: [{ blockId: "button", owner: "button", cohort: "core" }],
};
