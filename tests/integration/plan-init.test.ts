import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
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
  const result = plan(project, layout);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(
    !result.value.writes.some(
      (entry) => entry.path === "src/routes/+layout.svelte",
    ),
  );
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
