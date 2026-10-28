import assert from "node:assert/strict";
import { rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { test } from "node:test";
import { parseKitConfig } from "../../src/project/config.js";
import {
  parseTargetConfig,
  integrationFor,
} from "../../src/project/target-config.js";
import { captureTargetEvidence } from "../../src/codegen/target-evidence.js";
import {
  svelteKitIntegration,
  targetIntegrationAdapter,
} from "../../src/codegen/target-integration.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const astro = {
  schemaVersion: 2,
  target: "astro",
  layoutFile: "src/layouts/Layout.astro",
};
const library = {
  schemaVersion: 2,
  target: "svelte-library",
  styleEntry: "src/styles/index.css",
};
const astroSource =
  'import { defineConfig } from "astro/config";\nimport svelte from "@astrojs/svelte";\nexport default defineConfig({ integrations: [svelte()] });\n';
function fixture(
  t: { after(fn: () => void): void },
  target: "astro" | "svelte-library",
) {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const manifest =
    target === "astro"
      ? {
          name: "astro-consumer",
          type: "module",
          dependencies: {
            astro: "7.4.4",
            "@astrojs/svelte": "9.1.2",
            svelte: "5.57.1",
          },
        }
      : {
          name: "component-library",
          type: "module",
          peerDependencies: { svelte: "^5.57.1" },
          exports: {
            ".": {
              types: "./dist/index.d.ts",
              svelte: "./dist/index.js",
              default: "./dist/index.js",
            },
            "./styles.css": "./src/styles/index.css",
          },
        };
  project.writeFile("package.json", JSON.stringify(manifest));
  if (target === "astro") project.writeFile("astro.config.ts", astroSource);
  return project;
}

test("v2 target union is strict and v1 schema and defaults remain unchanged", () => {
  const legacy = parseKitConfig({ schemaVersion: 1 });
  assert.ok(legacy.ok);
  assert.equal(legacy.value.layoutFile, "src/routes/+layout.svelte");
  for (const valid of [
    astro,
    library,
    { schemaVersion: 2, target: "sveltekit", layoutFile: "app/+layout.svelte" },
  ])
    assert.ok(parseTargetConfig(valid).ok);
  for (const value of [
    { ...astro, schemaVersion: 1 },
    { ...astro, styleEntry: "x.css" },
    { ...library, layoutFile: "fake.svelte" },
    { ...astro, layoutFile: "a.svelte" },
    { ...library, styleEntry: "../styles.css" },
    { ...astro, uiDir: "src/styles/kit.css" },
    { ...astro, future: true },
    { ...astro, requested: ["button", "button"] },
  ])
    assert.equal(parseTargetConfig(value).ok, false, JSON.stringify(value));
  assert.equal(parseKitConfig({ schemaVersion: 1, target: "astro" }).ok, false);
  assert.equal(parseKitConfig(astro).ok, false);
});

test("Astro requires genuine declared framework and statically captured integration without Kit", (t) => {
  const project = fixture(t, "astro"),
    before = snapshotTree(project.root);
  const captured = captureTargetEvidence(project.root, astro);
  assert.ok(captured.ok, JSON.stringify(captured));
  assert.equal(captured.value.integration.contract, "astro-layout-v1");
  assert.deepEqual(snapshotTree(project.root), before);
  project.writeFile(
    "package.json",
    JSON.stringify({
      dependencies: { svelte: "5.57.1", "@sveltejs/kit": "2.70.3" },
    }),
  );
  assert.equal(captureTargetEvidence(project.root, astro).ok, false);
});

test("ambiguous, dynamic, malformed and symlink configuration refuses without writes", (t) => {
  for (const source of [
    astroSource + "\nprocess.exit(1);",
    astroSource.replace("[svelte()]", "configuredIntegrations"),
    astroSource.replace("integrations:", "...other, integrations:"),
    astroSource.replace("svelte()", "svelte(dynamic)"),
    astroSource.replace("defineConfig({", "defineConfig({ root: '../foreign',"),
  ]) {
    const project = fixture(t, "astro");
    project.writeFile("astro.config.ts", source);
    const before = snapshotTree(project.root);
    assert.equal(captureTargetEvidence(project.root, astro).ok, false);
    assert.deepEqual(snapshotTree(project.root), before);
  }
  const project = fixture(t, "astro");
  project.writeFile("astro.config.mjs", astroSource);
  let before = snapshotTree(project.root);
  assert.equal(captureTargetEvidence(project.root, astro).ok, false);
  assert.deepEqual(snapshotTree(project.root), before);
  const symlink = fixture(t, "astro");
  symlink.symlink("astro.config.ts", "astro.config.js");
  before = snapshotTree(symlink.root);
  assert.equal(captureTargetEvidence(symlink.root, astro).ok, false);
  assert.deepEqual(snapshotTree(symlink.root), before);
});

test("library identity requires explicit typed exports and authorizes no application layout", (t) => {
  const project = fixture(t, "svelte-library");
  const before = snapshotTree(project.root);
  const captured = captureTargetEvidence(project.root, library);
  assert.ok(captured.ok, JSON.stringify(captured));
  assert.deepEqual(captured.value.integration, {
    kind: "stylesheet-entry",
    path: "src/styles/index.css",
    contract: "library-styles-v1",
  });
  assert.equal(
    captured.value.snapshot.paths.some(
      (file) => file.endsWith(".svelte") || file.endsWith(".astro"),
    ),
    false,
  );
  assert.deepEqual(snapshotTree(project.root), before);
  for (const extra of [
    { devDependencies: { "@sveltejs/kit": "2.70.3" } },
    { svelte: "./other.js" },
    {
      exports: {
        ".": { svelte: "../../foreign.js", types: "./dist/index.d.ts" },
      },
    },
  ]) {
    const manifest = {
      name: "library",
      type: "module",
      peerDependencies: { svelte: "^5" },
      exports: {
        ".": { types: "./dist/index.d.ts", svelte: "./dist/index.js" },
        "./styles.css": "./src/styles/index.css",
      },
      ...extra,
    };
    project.writeFile("package.json", JSON.stringify(manifest));
    assert.equal(captureTargetEvidence(project.root, library).ok, false);
  }
});

test("Astro refuses an ignored CommonJS default configuration without writes", (t) => {
  const project = fixture(t, "astro");
  rmSync(path.join(project.root, "astro.config.ts"));
  project.writeFile("astro.config.cjs", astroSource);
  const before = snapshotTree(project.root);
  assert.equal(captureTargetEvidence(project.root, astro).ok, false);
  assert.deepEqual(snapshotTree(project.root), before);
});

test("library export subpaths and normalized Svelte peer ranges are actual package evidence", (t) => {
  const base = {
    name: "library",
    type: "module",
    devDependencies: { svelte: "5.57.1" },
    peerDependencies: { svelte: "^5.57.1" },
    exports: {
      ".": { svelte: "./dist/index.js", types: "./dist/index.d.ts" },
      "./styles.css": "./src/styles/index.css",
    },
  };
  for (const patch of [
    { exports: { ".": base.exports["."], default: "./src/styles/index.css" } },
    {
      exports: {
        ".": base.exports["."],
        "./../styles.css": "./src/styles/index.css",
      },
    },
    ...["", " ", "invalid-peer", "file:./svelte"].map((svelte) => ({
      peerDependencies: { svelte },
    })),
  ]) {
    const project = fixture(t, "svelte-library");
    project.writeFile("package.json", JSON.stringify({ ...base, ...patch }));
    const before = snapshotTree(project.root);
    assert.equal(
      captureTargetEvidence(project.root, library).ok,
      false,
      JSON.stringify(patch),
    );
    assert.deepEqual(snapshotTree(project.root), before);
  }
  const project = fixture(t, "svelte-library");
  project.writeFile(
    "package.json",
    JSON.stringify({
      ...base,
      peerDependencies: { svelte: "catalog:compatible" },
    }),
  );
  project.writeFile(
    "pnpm-workspace.yaml",
    "packages:\n  - .\ncatalogs:\n  compatible:\n    svelte: ^5.57.1\n",
  );
  const before = snapshotTree(project.root);
  assert.ok(captureTargetEvidence(project.root, library).ok);
  assert.deepEqual(snapshotTree(project.root), before);
});

test("captured target bytes, identity and candidate absence cannot change through caller or disk mutation", (t) => {
  const project = fixture(t, "astro");
  const captured = captureTargetEvidence(project.root, astro);
  assert.ok(captured.ok);
  const input = captured.value.snapshot.entries.get("astro.config.ts")!;
  const original = input.bytes!;
  original.fill(0);
  assert.notEqual(input.bytes?.[0], 0);
  project.writeFile("astro.config.ts", "export default dynamic();");
  assert.equal(new TextDecoder().decode(input.bytes!), astroSource);
  assert.equal(
    captured.value.snapshot.entries.get("astro.config.mjs")?.kind,
    "absent",
  );
  assert.throws(() => {
    (captured.value.config as { target: string }).target = "sveltekit";
  }, TypeError);
});

test("target adapters preserve native Svelte structure and explicitly refuse unfinished generation", () => {
  const generated = svelteKitIntegration.materialize([
    { specifier: "./kit.css" },
  ]);
  const inspected = svelteKitIntegration.inspect(generated);
  assert.ok(inspected.ok);
  assert.deepEqual(inspected.value, {
    imports: ["./kit.css"],
    rendersContent: true,
  });
  assert.ok(targetIntegrationAdapter("sveltekit").ok);
  for (const target of ["astro", "svelte-library"] as const) {
    const adapter = targetIntegrationAdapter(target);
    assert.equal(adapter.ok, false);
    if (!adapter.ok)
      assert.equal(adapter.issues[0]?.code, "TARGET_GENERATION_UNAVAILABLE");
  }
  const parsed = parseTargetConfig(library);
  assert.ok(parsed.ok);
  assert.equal(integrationFor(parsed.value).kind, "stylesheet-entry");
});

test("legacy CLI refuses v2 configuration without fallback or any hidden writes", (t) => {
  const project = fixture(t, "astro");
  project.writeFile(
    "src/lib/components/ui/_kit/kit.json",
    JSON.stringify(astro),
  );
  const before = snapshotTree(project.root);
  const result = spawnSync(
    process.execPath,
    [path.resolve("dist/cli/main.js"), "init", "--cwd", project.root, "--json"],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.notEqual(result.status, 0);
  assert.equal(result.stderr, "");
  assert.equal(JSON.parse(result.stdout).status, "error");
  assert.deepEqual(snapshotTree(project.root), before);
});
