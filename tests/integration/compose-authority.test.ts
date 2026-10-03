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

test("a post-planning manifest dependency change is refused from captured environment evidence", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-env-"));
  try {
    const manifest = {
      name: "consumer",
      type: "module",
      dependencies: {
        svelte: "5.57.1",
        "@sveltejs/kit": "2.70.3",
        "bits-ui": "2.19.3",
        "@internationalized/date": "3.12.4",
      },
    };
    write(root, "package.json", JSON.stringify(manifest));
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    // A dependency declaration change after planning must be carried as stale
    // manifest evidence, not silently omitted from the apply read set.
    write(
      root,
      "package.json",
      JSON.stringify({
        ...manifest,
        dependencies: { ...manifest.dependencies, svelte: "4.2.0" },
      }),
    );

    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    assert.ok(
      composed.value.readset.files.some(
        (file) => file.path === "package.json" && file.kind === "file",
      ),
      "the manifest must be carried into the read set",
    );
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "AUTHORITY_READ_CHANGED"),
      JSON.stringify(outcome.issues),
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

const INSTALLED_MANIFEST = {
  name: "consumer",
  type: "module",
  dependencies: {
    svelte: "5.57.1",
    "@sveltejs/kit": "2.70.3",
    "bits-ui": "2.19.3",
    "@internationalized/date": "3.12.4",
  },
};

function writeInstalledDependencies(root: string): void {
  write(root, "package.json", JSON.stringify(INSTALLED_MANIFEST));
  for (const [name, version] of Object.entries(
    INSTALLED_MANIFEST.dependencies,
  )) {
    write(
      root,
      `node_modules/${name}/package.json`,
      JSON.stringify({ name, version }),
    );
  }
}

test("a post-planning installed-package metadata change is refused", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-compose-installed-"));
  try {
    writeInstalledDependencies(root);
    const original =
      "<script>let original = 1;</script>\n{@render children()}\n";
    write(root, DEFAULT_KIT_CONFIG.layoutFile, original);

    const { snapshot, writes } = planRealInit(root, original);
    // The resolved installed manifest is captured as physical integrity
    // evidence alongside the selected manifest and manager lockfiles.
    assert.ok(
      snapshot.environment.evidence.some(
        (entry) =>
          entry.path === "node_modules/svelte/package.json" &&
          entry.kind === "file",
      ),
      "the resolved installed manifest must be captured as evidence",
    );

    // A post-planning installed metadata change (Svelte downgraded) must be a
    // stale-authority refusal, never silently applied.
    write(
      root,
      "node_modules/svelte/package.json",
      JSON.stringify({ name: "svelte", version: "4.2.0" }),
    );

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
      outcome.issues.some((issue) => issue.code === "AUTHORITY_READ_CHANGED"),
      JSON.stringify(outcome.issues),
    );
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
