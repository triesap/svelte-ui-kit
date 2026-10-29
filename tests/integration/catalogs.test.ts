import assert from "node:assert/strict";
import { chmodSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  observeCatalogs,
  verifyCatalogDigest,
} from "../../src/project/catalogs.js";
import { inspectDependencyState } from "../../src/project/dependencies.js";
import { captureEnvironment } from "../../src/project/environment.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { capturedFixtureInit } from "../helpers/guarded-plan.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { resolveEffectiveConfig } from "../../src/codegen/effective-config.js";
import { DEFAULT_KIT_CONFIG } from "../../src/project/config.js";

const yaml =
  "packages:\n  - apps/*\ncatalog:\n  runtimefixture: 5.57.3\ncatalogs:\n  compatible:\n    upstream-fixture: 2.19.3\n";

function fixture(t: { after(fn: () => void): void }) {
  const workspace = createTempProject();
  t.after(() => workspace.cleanup());
  workspace.writeFile("pnpm-workspace.yaml", yaml);
  workspace.writeFile(
    "package.json",
    JSON.stringify({ private: true, packageManager: "pnpm@12.16.1" }),
  );
  workspace.writeFile(
    "apps/web/package.json",
    JSON.stringify({
      name: "consumer",
      type: "module",
      private: true,
      dependencies: {
        runtimefixture: "catalog:",
        "upstream-fixture": "catalog:compatible",
      },
      devDependencies: { "@sveltejs/kit": "2.70.3" },
      scripts: { preinstall: "throw new Error('must never execute')" },
    }),
  );
  for (const [name, version] of [
    ["runtimefixture", "5.57.3"],
    ["upstream-fixture", "2.19.3"],
  ])
    workspace.writeFile(
      `apps/web/node_modules/${name}/package.json`,
      JSON.stringify({ name, version }),
    );
  return { workspace, root: path.join(workspace.root, "apps/web") };
}

test("default and named catalogs resolve read-only inside the proven workspace", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile(".hidden/keep", "unchanged");
  const before = snapshotTree(workspace.root);
  const result = inspectDependencyState(root, [
    { name: "runtimefixture", range: "^5" },
    { name: "upstream-fixture", range: "^2" },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (result.ok)
    assert.deepEqual(
      result.value.map((item) => item.status),
      ["ready", "ready"],
    );
  assert.deepEqual(snapshotTree(workspace.root), before);
});

test("catalog declarations retain strict installed version and package identity checks", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile(
    "apps/web/node_modules/runtimefixture/package.json",
    JSON.stringify({ name: "runtimefixture", version: "4.2.0" }),
  );
  const incompatible = inspectDependencyState(root, [
    { name: "runtimefixture", range: "^5" },
  ]);
  assert.equal(incompatible.ok, true);
  if (incompatible.ok)
    assert.equal(incompatible.value[0]?.status, "install_incompatible");
  workspace.writeFile(
    "apps/web/node_modules/runtimefixture/package.json",
    JSON.stringify({ name: "foreign", version: "5.57.3" }),
  );
  assert.equal(
    inspectDependencyState(root, [{ name: "runtimefixture", range: "^5" }]).ok,
    false,
  );
});

test("malformed, duplicate, aliased, missing and foreign catalog declarations refuse without writes", (t) => {
  const { workspace, root } = fixture(t);
  for (const input of [
    yaml.replace(
      "runtimefixture: 5.57.3",
      "runtimefixture: 5.57.3\n  runtimefixture: 5.57.2",
    ),
    yaml.replace(
      "runtimefixture: 5.57.3",
      "runtimefixture: &version 5.57.3\n  other: *version",
    ),
    yaml.replace("runtimefixture: 5.57.3", "runtimefixture: !foreign 5.57.3"),
    yaml.replace("runtimefixture: 5.57.3", "other: 5.57.3"),
    yaml.replace(
      "runtimefixture: 5.57.3",
      "runtimefixture: catalog:compatible",
    ),
    yaml.replace(
      "runtimefixture: 5.57.3",
      "runtimefixture: file:./vendor/foreign.tgz",
    ),
    yaml.replace(
      "  compatible:",
      "  default:\n    runtimefixture: 5.57.3\n  compatible:",
    ),
    yaml + "catalogFile: ./other.yaml\n",
  ]) {
    workspace.writeFile("pnpm-workspace.yaml", input);
    const before = snapshotTree(workspace.root);
    assert.equal(
      observeCatalogs(root).issues[0]?.code,
      "DEPENDENCY_CATALOG_INVALID",
      input,
    );
    assert.deepEqual(snapshotTree(workspace.root), before);
  }
});

test("catalogs cannot cross a Git boundary, an excluded member or a symlink", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile("apps/web/.git", "gitdir: /unused/foreign\n");
  assert.equal(
    observeCatalogs(root).issues[0]?.code,
    "DEPENDENCY_CATALOG_INVALID",
  );
  workspace.writeFile(
    "apps/web/pnpm-workspace.yaml",
    "packages:\n  - .\ncatalog:\n  runtimefixture: 5.57.3\ncatalogs:\n  compatible:\n    upstream-fixture: 2.19.3\n",
  );
  assert.equal(
    observeCatalogs(root).issues.length,
    0,
    "selected owner local workspace is valid",
  );
  const separate = fixture(t);
  separate.workspace.writeFile(
    "pnpm-workspace.yaml",
    yaml.replace("  - apps/*", "  - apps/*\n  - '!apps/web'"),
  );
  assert.equal(
    observeCatalogs(separate.root).issues[0]?.code,
    "DEPENDENCY_CATALOG_INVALID",
  );
  separate.workspace.writeFile("apps/web/catalog-input.yaml", yaml);
  separate.workspace.symlink(
    "catalog-input.yaml",
    "apps/web/pnpm-workspace.yaml",
  );
  assert.equal(
    observeCatalogs(separate.root).issues[0]?.code,
    "DEPENDENCY_CATALOG_INVALID",
  );
});

test("package.json workspaces cannot override the actual pnpm membership exclusion", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile(
    "package.json",
    JSON.stringify({ private: true, workspaces: ["apps/*"] }),
  );
  workspace.writeFile(
    "pnpm-workspace.yaml",
    yaml.replace("  - apps/*", "  - apps/*\n  - '!apps/web'"),
  );
  const before = snapshotTree(workspace.root);
  assert.equal(
    observeCatalogs(root).issues[0]?.code,
    "DEPENDENCY_CATALOG_INVALID",
  );
  assert.deepEqual(snapshotTree(workspace.root), before);
});

test("catalog YAML rejects invalid UTF-8 rather than replacing bytes", (t) => {
  const { workspace, root } = fixture(t);
  writeFileSync(
    path.join(workspace.root, "pnpm-workspace.yaml"),
    Buffer.concat([Buffer.from(yaml), Buffer.from([0xc3, 0x28])]),
  );
  const before = snapshotTree(workspace.root);
  assert.equal(
    observeCatalogs(root).issues[0]?.code,
    "DEPENDENCY_CATALOG_INVALID",
  );
  assert.deepEqual(snapshotTree(workspace.root), before);
});

test("effective mapping refuses captured malformed catalog authority even without item dependencies", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile("pnpm-workspace.yaml", "catalog: [broken\n");
  const before = snapshotTree(workspace.root);
  const snapshot = captureSnapshot(root, []);
  assert.ok(snapshot.ok);
  const effective = resolveEffectiveConfig(snapshot.value, DEFAULT_KIT_CONFIG);
  assert.equal(effective.ok, false);
  if (!effective.ok)
    assert.equal(effective.issues[0]?.code, "DEPENDENCY_CATALOG_INVALID");
  assert.deepEqual(snapshotTree(workspace.root), before);
});

test("captured catalog projection is immutable and later workspace edits invalidate physical proof", (t) => {
  const { workspace, root } = fixture(t);
  const captured = captureEnvironment(root);
  assert.ok(captured.catalogDigest);
  assert.equal(captured.manifest.kind, "value");
  if (captured.manifest.kind === "value") {
    const declared = captured.manifest.value.dependencies as Record<
      string,
      string
    >;
    assert.equal(declared.runtimefixture, "5.57.3");
    assert.throws(() => {
      declared.runtimefixture = "4.2.0";
    }, TypeError);
  }
  workspace.writeFile("pnpm-workspace.yaml", yaml.replace("5.57.3", "5.57.2"));
  assert.equal(
    verifyCatalogDigest(root, captured.catalogDigest)[0]?.code,
    "AUTHORITY_CATALOG_CHANGED",
  );
});

test("catalog edits between original plan and apply refuse before any coordination writes", (t) => {
  const { workspace, root } = fixture(t);
  workspace.writeFile("apps/web/unmanaged.svelte", "<p>owned by the app</p>\n");
  workspace.writeFile("apps/web/.hidden/keep", "do not alter");
  const input = capturedFixtureInit(root);
  const validated = validateApplyPlan(input);
  assert.equal(validated.ok, true, JSON.stringify(validated));
  if (!validated.ok) return;
  workspace.writeFile("pnpm-workspace.yaml", yaml.replace("5.57.3", "5.57.2"));
  chmodSync(path.join(workspace.root, "apps/web/.hidden/keep"), 0o640);
  const before = snapshotTree(workspace.root);
  const result = applyPlan(validated.value);
  assert.equal(result.kind, "refused", JSON.stringify(result));
  assert.equal(result.transactionId, null);
  assert.equal(result.issues[0]?.code, "AUTHORITY_CATALOG_CHANGED");
  assert.deepEqual(snapshotTree(workspace.root), before);
});
