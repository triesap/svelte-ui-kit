import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { syncBuiltinESMExports } from "node:module";
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

test("a config filename alone is not proof of a SvelteKit application", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "svelte-only", dependencies: { svelte: "5.57.1" } }),
  );
  project.writeFile("svelte.config.js", "export default {};\n");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), ["PROJECT_NOT_SVELTEKIT"]);
});

test("a literal kit.files mapping is honored", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "custom-routes",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile(
    "svelte.config.ts",
    'export default { kit: { files: { routes: "app/routes", lib: "app/lib" } } };\n',
  );
  project.writeDir("app/routes");
  project.writeFile("app/routes/+layout.svelte", "<slot />\n");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.routesDir, "app/routes");
  assert.equal(result.value.libDir, "app/lib");
  assert.equal(result.value.layoutFile, "app/routes/+layout.svelte");
  assert.equal(result.value.layoutPresent, true);
});

test("the existing consumer's const config with adapter calls is static", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "const-config",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile(
    "svelte.config.js",
    [
      'import adapter from "@sveltejs/adapter-node";',
      "const config = {",
      "  preprocess: vitePreprocess(),",
      "  kit: {",
      "    adapter: adapter(),",
      "  },",
      "};",
      "export default config;",
    ].join("\n"),
  );

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.layoutFile, "src/routes/+layout.svelte");
});

test("a dynamic kit.files mapping is a typed manual diagnostic", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "dynamic",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile(
    "svelte.config.js",
    "export default { kit: { files: { routes: process.env.ROUTES } } };\n",
  );

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
  if (result.ok) return;
  assert.match(result.issues[0]?.message ?? "", /literal/);
});

test("multiple configuration files are ambiguous", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "many-configs",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile("svelte.config.js", "export default {};\n");
  project.writeFile("svelte.config.ts", "export default {};\n");

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), ["PROJECT_SVELTEKIT_CONFIG_AMBIGUOUS"]);
});

test("a spread in the exported config is unsupported, not defaulted", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "spread",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile(
    "svelte.config.js",
    "const base = {};\nexport default { ...base, kit: {} };\n",
  );

  const result = detectDefaultProject(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});

function writeConfigFixture(
  t: import("node:test").TestContext,
  source: string,
): string {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "static-config",
      devDependencies: { "@sveltejs/kit": "2.70.3" },
    }),
  );
  project.writeFile("svelte.config.js", source);
  return project.root;
}

/**
 * RCLD03-R2-1: the complete relevant structure is inspected, so a later spread
 * cannot silently override an earlier valid `kit` mapping.
 */
test("a later spread overriding a proven kit mapping is unsupported", (t) => {
  const root = writeConfigFixture(
    t,
    "export default { kit: { files: { routes: 'app/routes' } }, ...dynamic };\n",
  );
  const result = detectDefaultProject(root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});

/**
 * RCLD03-R2-1: a duplicated relevant key is an override that cannot be proven
 * statically.
 */
test("a duplicate kit key is unsupported", (t) => {
  const root = writeConfigFixture(
    t,
    "export default { kit: {}, kit: { files: { routes: 'custom' } } };\n",
  );
  const result = detectDefaultProject(root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});

/**
 * RCLD03-R2-1: a later mutation of a referenced binding changes its effective
 * value, so the recovered mapping cannot be trusted.
 */
test("a later mutation of a referenced config is unsupported", (t) => {
  const root = writeConfigFixture(
    t,
    [
      "const config = { kit: {} };",
      "config.kit.files = { routes: process.env.ROUTES };",
      "export default config;",
    ].join("\n"),
  );
  const result = detectDefaultProject(root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});

/**
 * RCLD03-R2-1: a recovered parse error must not fall back to a proven default.
 */
/**
 * RCLD03-R2-1: a recovered parse error must not fall back to a proven default.
 */
test("a malformed configuration is unsupported", (t) => {
  const root = writeConfigFixture(t, "export default { kit: {\n");
  const result = detectDefaultProject(root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(issueCodes(result), [
    "PROJECT_SVELTEKIT_CONFIG_UNSUPPORTED",
  ]);
});

/**
 * RCLD03-R2-1: a permission error reading the manifest is a typed unreadable
 * cause, not a fabricated invalid-JSON or SvelteKit diagnostic.
 */
test("a manifest read EACCES is unreadable, not invalid JSON", (t) => {
  const root = writeConfigFixture(t, "export default {};\n");
  const original = fs.readFileSync;
  fs.readFileSync = ((file: fs.PathOrFileDescriptor, ...rest: unknown[]) => {
    if (String(file) === path.join(root, "package.json")) {
      const error = new Error("EACCES") as NodeJS.ErrnoException;
      error.code = "EACCES";
      throw error;
    }
    return (original as (...args: unknown[]) => unknown)(file, ...rest);
  }) as typeof fs.readFileSync;
  syncBuiltinESMExports();
  try {
    const result = detectDefaultProject(root);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.deepEqual(issueCodes(result), ["PROJECT_MANIFEST_UNREADABLE"]);
  } finally {
    fs.readFileSync = original;
    syncBuiltinESMExports();
  }
});
