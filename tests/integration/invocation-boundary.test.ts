import assert from "node:assert/strict";
import { test } from "node:test";

import { planAdd } from "../../src/codegen/plan-add.js";
import { planInit } from "../../src/codegen/plan-init.js";
import { planSync } from "../../src/codegen/plan-sync.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import type { ProjectSnapshot } from "../../src/codegen/snapshot.js";
import type { RegistrySnapshot } from "../../src/registry/load.js";
import {
  createSupportedProject,
  createTempProject,
} from "../helpers/project.js";
import { componentItem, registryOf } from "../helpers/registry.js";

/**
 * RCLD03-R7-1: one validated invocation boundary shared by init/add/sync.
 *
 * A missing, malformed or non-SvelteKit manifest, and an ambiguous package
 * manager, are logical failures with no executable writes — never a fabricated
 * default plan. A supported SvelteKit application is accepted by all three
 * complete entries.
 */

const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);

function paths(): string[] {
  return [
    `${derived.stateDir}/kit.json`,
    `${derived.stateDir}/kit.lock.json`,
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    DEFAULT_KIT_CONFIG.layoutFile,
    `${derived.rootExportsDir}/button.svelte`,
  ];
}

function snapshotOf(project: ReturnType<typeof createTempProject>) {
  const result = captureSnapshot(project.root, paths());
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("snapshot failed");
  return result.value;
}

function buttonRegistry(): RegistrySnapshot {
  return registryOf([
    componentItem("button", {
      exports: [{ name: "Button", target: "button.svelte", kind: "value" }],
    }),
  ]);
}

function runAll(snapshot: ProjectSnapshot) {
  const registry = buttonRegistry();
  const init = planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
    layoutSource: "",
    snapshot,
    registry,
    configHash: "b".repeat(64),
  });
  const add = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot,
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  const sync = planSync({
    registry,
    config: DEFAULT_KIT_CONFIG,
    snapshot,
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  return { init, add, sync };
}

function codes(result: { ok: boolean; issues?: readonly { code: string }[] }) {
  return result.ok ? [] : (result.issues ?? []).map((entry) => entry.code);
}

test("init/add/sync reject a selected package with no manifest", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const { init, add, sync } = runAll(snapshotOf(project));
  assert.deepEqual(codes(init), ["PROJECT_MANIFEST_MISSING"]);
  assert.deepEqual(codes(add), ["PROJECT_MANIFEST_MISSING"]);
  assert.deepEqual(codes(sync), ["PROJECT_MANIFEST_MISSING"]);
});

test("init/add/sync reject a malformed manifest", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", "{ not json");
  const { init, add, sync } = runAll(snapshotOf(project));
  assert.deepEqual(codes(init), ["PROJECT_MANIFEST_INVALID"]);
  assert.deepEqual(codes(add), ["PROJECT_MANIFEST_INVALID"]);
  assert.deepEqual(codes(sync), ["PROJECT_MANIFEST_INVALID"]);
});

test("init/add/sync reject a package without a SvelteKit dependency", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "consumer" }));
  const { init, add, sync } = runAll(snapshotOf(project));
  assert.deepEqual(codes(init), ["PROJECT_NOT_SVELTEKIT"]);
  assert.deepEqual(codes(add), ["PROJECT_NOT_SVELTEKIT"]);
  assert.deepEqual(codes(sync), ["PROJECT_NOT_SVELTEKIT"]);
});

test("init/add/sync reject ambiguous package-manager evidence", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  // An explicit packageManager would win over lockfiles, so exercise the
  // lockfile-evidence path with a manifest that has none.
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "consumer",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile("package-lock.json", "{}");
  project.writeFile("pnpm-lock.yaml", "lockfileVersion: 9\n");
  const { init, add, sync } = runAll(snapshotOf(project));
  for (const result of [init, add, sync]) {
    assert.deepEqual(codes(result), ["DEPENDENCY_MANAGER_CONFLICTING"]);
  }
});

test("a supported SvelteKit application is accepted by all three complete entries", (t) => {
  const project = createSupportedProject();
  t.after(() => project.cleanup());
  const { init, add, sync } = runAll(snapshotOf(project));
  for (const result of [init, add, sync]) {
    assert.equal(result.ok, true, JSON.stringify(result));
    if (!result.ok) continue;
    assert.equal(
      (result.value as { executable?: boolean }).executable ?? true,
      true,
    );
  }
});

test("a statically mapped routes directory is accepted while an unsupported config fails", (t) => {
  const supported = createSupportedProject();
  t.after(() => supported.cleanup());
  supported.writeFile(
    "svelte.config.js",
    'export default { kit: { files: { routes: "src/views" } } };\n',
  );
  // Capture both the inactive default and the detected layout so the plan is
  // asserted against the actual effective path, not merely `ok`.
  const acceptedSnapshot = captureSnapshot(supported.root, [
    ...paths(),
    "src/views/+layout.svelte",
  ]);
  assert.equal(acceptedSnapshot.ok, true, JSON.stringify(acceptedSnapshot));
  if (!acceptedSnapshot.ok) return;
  const registry = buttonRegistry();
  const accepted = planAdd({
    registry,
    config: DEFAULT_KIT_CONFIG,
    addedRoots: ["button"],
    snapshot: acceptedSnapshot.value,
    lock: null,
    registryVersion: registry.root.registryVersion,
    registryHash: registry.root.contentHash,
  });
  assert.equal(accepted.ok, true, JSON.stringify(accepted));
  if (!accepted.ok) return;
  assert.equal(
    accepted.value.executable,
    true,
    JSON.stringify(accepted.value.diagnostics),
  );
  assert.ok(
    accepted.value.writes.some(
      (write) => write.path === "src/views/+layout.svelte",
    ),
    JSON.stringify(accepted.value.writes.map((write) => write.path)),
  );
  assert.ok(
    !accepted.value.writes.some(
      (write) => write.path === DEFAULT_KIT_CONFIG.layoutFile,
    ),
    "the inactive default layout must never be planned",
  );

  const unsupported = createSupportedProject();
  t.after(() => unsupported.cleanup());
  unsupported.writeFile(
    "svelte.config.js",
    "export default { kit: { files: { routes: process.env.ROUTES } } };\n",
  );
  const rejected = runAll(snapshotOf(unsupported));
  assert.deepEqual(codes(rejected.add), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});
