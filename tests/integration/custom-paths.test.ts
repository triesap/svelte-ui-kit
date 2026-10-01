import assert from "node:assert/strict";
import { test } from "node:test";

import { discoverKitConfig } from "../../src/project/detect.js";
import type { ModelResult } from "../../src/registry/errors.js";
import { createTempProject, type TempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

/**
 * S037 tests: supported explicit custom path mappings resolve relative to the
 * selected package, custom `_kit/kit.json` discovery is deterministic and
 * read-only, and unsupported/ambiguous/malformed configurations fail visibly
 * without executing application configuration.
 */

function codes(result: ModelResult<unknown>): string[] {
  return result.ok ? [] : result.issues.map((issue) => issue.code);
}

function writeKitConfig(
  project: TempProject,
  rel: string,
  value: unknown,
): void {
  project.writeFile(rel, JSON.stringify(value));
}

test("a supported explicit custom mapping resolves relative to the package", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "custom" }));
  writeKitConfig(project, "app/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "app/ui",
    stylesDir: "app/styles",
    layoutFile: "src/routes/+layout.svelte",
  });

  const before = snapshotTree(project.root);
  const result = discoverKitConfig(project.root);
  const after = snapshotTree(project.root);

  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "custom");
  assert.equal(result.value.configPath, "app/ui/_kit/kit.json");
  assert.equal(result.value.config.uiDir, "app/ui");
  assert.equal(result.value.derived.kitCss, "app/styles/kit.css");
  assert.equal(result.value.derived.rootExports, "app/ui/index.ts");
  assert.deepEqual(after, before, "discovery must not write");
});

test("no candidate falls back to the default bootstrap location", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "plain" }));

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "default");
  assert.equal(result.value.configPath, "src/lib/components/ui/_kit/kit.json");
  assert.equal(result.value.config.uiDir, "src/lib/components/ui");
});

test("a candidate whose uiDir disagrees with its location fails", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "mismatch" }));
  writeKitConfig(project, "app/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "other/ui",
  });

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["KIT_CONFIG_LOCATION_MISMATCH"]);
});

test("multiple valid candidates are ambiguous", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "many" }));
  writeKitConfig(project, "a/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "a/ui",
  });
  writeKitConfig(project, "b/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "b/ui",
  });

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false);
  assert.deepEqual(codes(result), ["KIT_CONFIG_AMBIGUOUS"]);
});

test("malformed candidates fail visibly", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "bad" }));
  project.writeFile("app/ui/_kit/kit.json", "{ not json");

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false);
  assert.ok(codes(result).includes("KIT_CONFIG_INVALID_JSON"));
});

test("dependency, build-output, nested package and symlink paths are excluded", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "excluded" }));
  // Only this should be discoverable.
  writeKitConfig(project, "app/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "app/ui",
  });
  // Excluded by directory name.
  writeKitConfig(project, "node_modules/pkg/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "node_modules/pkg",
  });
  writeKitConfig(project, "dist/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "dist",
  });
  // Excluded as a nested package root.
  project.writeFile("nested/package.json", JSON.stringify({ name: "nested" }));
  writeKitConfig(project, "nested/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "nested/ui",
  });
  // Excluded because it is only reachable through a symlink outside the root.
  const external = createTempProject({ prefix: "suik-custom-external-" });
  t.after(() => external.cleanup());
  writeKitConfig(external, "ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "ui",
  });
  project.symlink(external.root, "linked");

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "custom");
  assert.equal(result.value.configPath, "app/ui/_kit/kit.json");
});

test("application configuration is never executed during discovery", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "noexec" }));
  // If this file were imported/evaluated, discovery would throw.
  project.writeFile(
    "svelte.config.js",
    'throw new Error("svelte.config.js must not be executed");\n',
  );
  writeKitConfig(project, "app/ui/_kit/kit.json", {
    schemaVersion: 1,
    uiDir: "app/ui",
  });

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.equal(result.value.kind, "custom");
});

test("a symlinked kit.json candidate is unsafe, not a default bootstrap", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "linked" }));
  writeKitConfig(project, "app/ui/_kit/real.json", {
    schemaVersion: 1,
    uiDir: "app/ui",
  });
  project.symlink("real.json", "app/ui/_kit/kit.json");

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["KIT_CONFIG_UNSAFE"]);
});

test("a directory at kit.json is unsafe, not a default bootstrap", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "dir" }));
  project.writeDir("src/lib/components/ui/_kit/kit.json");

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.deepEqual(codes(result), ["KIT_CONFIG_UNSAFE"]);
});

test("a symlinked _kit directory is observed deliberately", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile("package.json", JSON.stringify({ name: "linked-kit" }));
  const external = createTempProject({ prefix: "suik-kit-external-" });
  t.after(() => external.cleanup());
  writeKitConfig(external, "kit.json", { schemaVersion: 1, uiDir: "app/ui" });
  project.writeDir("app/ui");
  project.symlink(external.root, "app/ui/_kit");

  const result = discoverKitConfig(project.root);
  assert.equal(result.ok, false, JSON.stringify(result));
  assert.ok(codes(result).includes("KIT_CONFIG_UNSAFE"));
});
