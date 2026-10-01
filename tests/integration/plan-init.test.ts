import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { TOKENS_BODY, planInit } from "../../src/codegen/plan-init.js";
import { renderManagedBlock } from "../../src/codegen/css.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S057 tests: initialization plans the minimal explicit targets without
 * installing components, preserves existing application styles, and writes
 * nothing.
 */

const PATHS = [
  "src/lib/components/ui/_kit/kit.json",
  "src/lib/components/ui/_kit/kit.lock.json",
  "src/lib/components/ui/index.ts",
  "src/styles/kit.css",
  "src/styles/themes.css",
  "src/styles/app.css",
  "src/routes/+layout.svelte",
];

function plan(project: ReturnType<typeof createTempProject>, layout: string) {
  const snapshot = captureSnapshot(project.root, PATHS);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  return planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: "src/routes/+layout.svelte",
    layoutSource: layout,
    snapshot: snapshot.value,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
}

test("an empty supported app plans explicit minimal targets", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const before = snapshotTree(project.root);
  const result = plan(project, "<slot />\n");
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const paths = result.value.writes.map((entry) => entry.path).sort();
  const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
  assert.ok(paths.includes(`${derived.stateDir}/kit.json`));
  assert.ok(paths.includes(derived.rootExports));
  assert.ok(paths.includes(derived.kitCss));
  assert.ok(paths.includes(derived.themesCss));
  assert.ok(paths.includes(derived.appCss));
  assert.ok(paths.includes("src/routes/+layout.svelte"));
  // No unrequested component source is installed.
  assert.ok(!paths.some((entry) => entry.endsWith("button.svelte")));
  assert.deepEqual(result.value.lock.requested, []);
  assert.deepEqual(
    snapshotTree(project.root),
    before,
    "planning must not write",
  );
});

test("existing application styles are preserved", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("src/styles/themes.css", ":root { --app: 1; }\n");
  project.writeFile("src/styles/app.css", "body { margin: 0; }\n");
  const result = plan(project, "<slot />\n");
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const paths = result.value.writes.map((entry) => entry.path);
  assert.ok(!paths.includes("src/styles/themes.css"));
  assert.ok(!paths.includes("src/styles/app.css"));
});

test("a layout already importing the styles is not rewritten", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const layout =
    '<script>\n  import "../styles/kit.css";\n  import "../styles/themes.css";\n  import "../styles/app.css";\n</script>\n<slot />\n';
  project.writeFile("src/routes/+layout.svelte", layout);
  const result = plan(project, layout);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(
    !result.value.writes.some(
      (entry) => entry.path === "src/routes/+layout.svelte",
    ),
  );
});

/**
 * RCLD03-R3-3: an absent layout is created even when the supplied source
 * already contains the imports; a baseline is never claimed for a missing file.
 */
test("an absent layout is created even when its source is pre-integrated", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const layout =
    '<script>import "../styles/kit.css";import "../styles/themes.css";import "../styles/app.css";</script><main/>';
  const result = plan(project, layout);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const write = result.value.writes.find(
    (entry) => entry.path === "src/routes/+layout.svelte",
  );
  assert.ok(write, "the absent layout must be created");
  assert.equal(
    result.value.lock.integrations.some(
      (entry) => entry.kind === "layout" && entry.baseline.length === 64,
    ),
    true,
  );
});

/**
 * RCLD03-R3-3: a layout path that disagrees with the configured layout is a
 * typed mismatch, not a plan against a different file.
 */
test("a layout path disagreeing with the config is rejected", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const snapshot = captureSnapshot(project.root, [
    ...PATHS,
    "other/+layout.svelte",
  ]);
  assert.equal(snapshot.ok, true);
  if (!snapshot.ok) return;
  const result = planInit({
    config: DEFAULT_KIT_CONFIG,
    layoutFile: "other/+layout.svelte",
    layoutSource: "<main />",
    snapshot: snapshot.value,
    registryVersion: "0.1.0",
    registryHash: "a".repeat(64),
    configHash: "b".repeat(64),
  });
  assert.equal(result.ok, false);
  assert.deepEqual(result.ok ? [] : result.issues.map((entry) => entry.code), [
    "INIT_LAYOUT_MISMATCH",
  ]);
});

/**
 * RCLD03-R3-3: applying exactly the planned effects yields a satisfied
 * no_change replay, and the lock publication is part of the plan.
 */
test("the plan includes the lock and replays as no_change", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = plan(project, "<main />");
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok) return;
  const lockPath = `${deriveKitPaths(DEFAULT_KIT_CONFIG).stateDir}/kit.lock.json`;
  assert.ok(
    first.value.writes.some((entry) => entry.path === lockPath),
    "the initial lock publication is part of the plan",
  );
  for (const write of first.value.writes) {
    const abs = path.join(project.root, write.path);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
  const layout = readFileSync(
    path.join(project.root, "src/routes/+layout.svelte"),
    "utf8",
  );
  const replay = plan(project, layout);
  assert.equal(replay.ok, true, JSON.stringify(replay));
  if (!replay.ok) return;
  assert.deepEqual(
    replay.value.writes,
    [],
    "a satisfied replay writes nothing",
  );
});

/**
 * RCLD03-R3-3: an owned, customized managed region is not overwritten by
 * initialization.
 */
test("an owned customized export region is not overwritten", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const first = plan(project, "<main />");
  assert.equal(first.ok, true, JSON.stringify(first));
  if (!first.ok) return;
  for (const write of first.value.writes) {
    const abs = path.join(project.root, write.path);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, write.bytes);
  }
  project.writeFile(
    "src/lib/components/ui/index.ts",
    "// svelte-ui-kit:start exports\nexport const Local = 42;\n// svelte-ui-kit:end exports\n",
  );
  const layout = readFileSync(
    path.join(project.root, "src/routes/+layout.svelte"),
    "utf8",
  );
  const result = plan(project, layout);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(result.ok ? [] : result.issues.map((entry) => entry.code), [
    "INIT_OWNERSHIP_CONFLICT",
  ]);
});

function codes(result: ReturnType<typeof plan>): string[] {
  return result.ok ? [] : result.issues.map((entry) => entry.code);
}

/**
 * RCLD03-R2-4: a nonregular target is a typed conflict, never an assumed
 * absence to overwrite.
 */
test("a directory at a generated target is a typed conflict", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src/styles/themes.css");
  assert.deepEqual(codes(plan(project, "<main />")), ["INIT_TARGET_UNSAFE"]);
});

/**
 * RCLD03-R2-4: managed markers alone do not confer ownership.
 */
test("an unowned managed export region conflicts", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "src/lib/components/ui/index.ts",
    "// svelte-ui-kit:start exports\nexport const AppOwned = 1;\n// svelte-ui-kit:end exports\n",
  );
  assert.deepEqual(codes(plan(project, "<main />")), [
    "INIT_OWNERSHIP_CONFLICT",
  ]);
});

test("an unowned managed css block conflicts", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "src/styles/kit.css",
    renderManagedBlock("tokens", TOKENS_BODY),
  );
  assert.deepEqual(codes(plan(project, "<main />")), [
    "INIT_OWNERSHIP_CONFLICT",
  ]);
});

/**
 * RCLD03-R2-4: a byte-order mark is preserved and invalid UTF-8 is refused.
 */
test("a byte-order mark is preserved and invalid UTF-8 is refused", (t) => {
  const writeBytes = (root: string, rel: string, bytes: Uint8Array): void => {
    const abs = path.join(root, rel);
    mkdirSync(path.dirname(abs), { recursive: true });
    writeFileSync(abs, bytes);
  };
  const bom = createTempProject();
  t.after(() => bom.cleanup());
  writeBytes(
    bom.root,
    "src/lib/components/ui/index.ts",
    new Uint8Array([0xef, 0xbb, 0xbf, 0x2f, 0x2f, 0x41, 0x50, 0x50, 0x0a]),
  );
  const bomResult = plan(bom, "<main />");
  assert.equal(bomResult.ok, true, JSON.stringify(bomResult));
  if (bomResult.ok) {
    const written = bomResult.value.writes.find(
      (entry) => entry.path === "src/lib/components/ui/index.ts",
    );
    assert.deepEqual(
      Array.from(written?.bytes.slice(0, 3) ?? []),
      [0xef, 0xbb, 0xbf],
    );
  }

  const invalid = createTempProject();
  t.after(() => invalid.cleanup());
  writeBytes(
    invalid.root,
    "src/lib/components/ui/index.ts",
    new Uint8Array([0x2f, 0x2f, 0xff, 0x0a]),
  );
  assert.deepEqual(codes(plan(invalid, "<main />")), [
    "INIT_ENCODING_UNSUPPORTED",
  ]);
});

/**
 * RCLD03-R2-4: the initial lock records real integration baselines, a
 * stylesheet record and the canonical config identity.
 */
test("the initial lock records real baselines and a stylesheet record", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const result = plan(project, "<main />");
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  const kinds = result.value.lock.integrations.map((entry) => entry.kind);
  assert.ok(kinds.includes("stylesheet"));
  assert.ok(kinds.includes("layout"));
  assert.ok(kinds.includes("exports"));
  assert.ok(
    result.value.lock.integrations.every(
      (entry) =>
        /^[0-9a-f]{64}$/.test(entry.baseline) &&
        entry.baseline !== "0".repeat(64),
    ),
  );
  assert.notEqual(result.value.lock.configHash, "b".repeat(64));
  assert.match(result.value.lock.configHash, /^[0-9a-f]{64}$/);
});
