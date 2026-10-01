import assert from "node:assert/strict";
import { test } from "node:test";

import { detectDefaultProject } from "../../src/project/detect.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S035 tests: a default SvelteKit application package is detected from static
 * metadata only, non-target projects fail with typed diagnostics, and detection
 * never writes to the tree.
 */

function issueCodes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

test("default SvelteKit consumer is detected without writing", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "detect-default-fixture",
      dependencies: { svelte: "5.57.1" },
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile("svelte.config.js", "export default {};\n");
  project.writeDir("src/lib/components/ui");
  project.writeFile("src/routes/+layout.svelte", "<slot />\n");

  const before = snapshotTree(project.root);
  const result = detectDefaultProject(project.root);
  const after = snapshotTree(project.root);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "default");
  assert.equal(result.value.packageName, "detect-default-fixture");
  assert.equal(result.value.hasSvelteKitDependency, true);
  assert.equal(result.value.svelteConfigFile, "svelte.config.js");
  assert.equal(result.value.uiDir, "src/lib/components/ui");
  assert.equal(result.value.stylesDir, "src/styles");
  assert.equal(result.value.layoutFile, "src/routes/+layout.svelte");
  assert.equal(result.value.libDirPresent, true);
  assert.equal(result.value.routesDirPresent, true);
  assert.equal(result.value.layoutPresent, true);
  assert.deepEqual(after, before, "detection must not mutate the tree");
});

test("a missing manifest fails clearly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeDir("src/routes");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(issueCodes(result), ["PROJECT_MANIFEST_MISSING"]);
});

test("a non-SvelteKit project fails clearly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "plain", dependencies: { svelte: "5.57.1" } }),
  );

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(issueCodes(result), ["PROJECT_NOT_SVELTEKIT"]);
});

test("an invalid manifest fails clearly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", "{ not json");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(issueCodes(result), ["PROJECT_MANIFEST_INVALID"]);
});

test("a symlinked manifest is rejected instead of followed", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("real.json", JSON.stringify({ name: "linked" }));
  project.symlink("real.json", "package.json");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(issueCodes(result), ["PROJECT_MANIFEST_UNSAFE"]);
});

test("a SvelteKit package without a layout is still a supported target", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "fresh",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeDir("src/lib");
  project.writeDir("src/routes");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.layoutPresent, false);
  // A later initialization checkpoint may create the missing integration.
  assert.equal(result.value.layoutFile, "src/routes/+layout.svelte");
});
