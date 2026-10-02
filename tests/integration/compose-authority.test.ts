import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import type { PlanWrite } from "../../src/codegen/plan.js";

/**
 * RCLD04-R2-1: composition carries the original immutable planning authority.
 *
 * A real bundled-registry init plan is composed from the captured snapshot, not
 * from a live recapture. A post-planning user edit to the layout therefore
 * makes the plan stale and the guarded apply refuses it, preserving the edit.
 */

const PKG_ROOT = process.cwd();
const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function write(root: string, rel: string, data: string): void {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, data);
}

function planRealInit(root: string, layoutSource: string) {
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry invalid");
  const paths = [
    ...Object.values(derived).filter(
      (value): value is string => typeof value === "string",
    ),
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    DEFAULT_KIT_CONFIG.layoutFile,
  ];
  const snapshot = captureSnapshot(root, paths);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
    layoutSource,
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("plan failed");
  return { snapshot: snapshot.value, writes: planned.value.writes };
}

test("a post-planning layout edit is refused rather than blessed as a preimage", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-authority-"));
  try {
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "consumer",
        type: "module",
        dependencies: {
          svelte: "5.57.1",
          "@sveltejs/kit": "2.70.3",
          "bits-ui": "2.19.3",
          "@internationalized/date": "3.12.4",
        },
      }),
    );
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    const edited = "<h1>USER EDIT AFTER PLAN</h1>\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, edited);

    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "STALE_PLAN"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(path.join(root, DEFAULT_KIT_CONFIG.layoutFile), "utf8"),
      edited,
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("composing without the original snapshot is a typed refusal", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-nosnap-"));
  try {
    const writes: PlanWrite[] = [
      {
        path: `${derived.stateDir}/kit.lock.json`,
        operation: "update",
        bytes: utf8("{}"),
      },
    ];
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot: undefined as never,
    });
    assert.equal(composed.ok, false);
    if (!composed.ok) {
      assert.equal(composed.issues[0].code, "COMPOSE_SNAPSHOT_REQUIRED");
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
