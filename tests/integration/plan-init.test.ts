import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { planInit } from "../../src/codegen/plan-init.js";
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
