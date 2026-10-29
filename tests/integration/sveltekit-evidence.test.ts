import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createTempProject } from "../helpers/project.js";
import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { parseAppConfig } from "../../src/project/app-config.js";
import { captureEnvironment } from "../../src/project/environment.js";
import { initializationFields } from "../../src/project/generation-config.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { planInit } from "../../src/codegen/plan-init.js";
const vite =
  'import {defineConfig} from "vite";import {sveltekit} from "@sveltejs/kit/vite";export default defineConfig({plugins:[sveltekit()]});\n';
function setup(
  t: { after(fn: () => void): void },
  v2 = false,
  installed = true,
) {
  const p = createTempProject();
  t.after(() => p.cleanup());
  p.writeFile(
    "package.json",
    JSON.stringify({
      name: "mapping-consumer",
      type: "module",
      private: true,
      packageManager: "pnpm@12.16.1",
      dependencies: { svelte: "5.57.3", "@sveltejs/kit": "^2.70.3" },
    }),
  );
  p.writeFile(
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "svelte", version: "5.57.3" }),
  );
  if (installed)
    p.writeFile(
      "node_modules/@sveltejs/kit/package.json",
      JSON.stringify({ name: "@sveltejs/kit", version: "2.70.3" }),
    );
  const parsed = parseAppConfig(
    v2
      ? {
          schemaVersion: 2,
          target: "sveltekit",
          layoutFile: "src/routes/+layout.svelte",
        }
      : DEFAULT_KIT_CONFIG,
  );
  assert.ok(parsed.ok);
  const config = parsed.value,
    paths = deriveKitPaths(config);
  p.writeFile(
    paths.stateDir + "/kit.json",
    JSON.stringify(config, null, 2) + "\n",
  );
  return { p, config, paths };
}
for (const v2 of [false, true]) {
  test(`Kit ${v2 ? "v2" : "v1"} rejects new Vite candidate appearance before coordination`, (t) => {
    const f = setup(t, v2),
      prepared = composeGenerationFoundation(f.p.root, process.cwd(), f.config),
      sealed = validateApplyPlan(prepared.composed);
    assert.ok(sealed.ok);
    f.p.writeFile("vite.config.ts", vite);
    const before = snapshotTree(f.p.root),
      out = applyPlan(sealed.value);
    assert.equal(out.kind, "refused");
    assert.equal(out.transactionId, null);
    assert.deepEqual(snapshotTree(f.p.root), before);
  });
  test(`Kit ${v2 ? "v2" : "v1"} uses original Vite bytes for planning and refuses changed write-time evidence`, (t) => {
    const f = setup(t, v2);
    f.p.writeFile("vite.config.ts", vite);
    const prepared = composeGenerationFoundation(
        f.p.root,
        process.cwd(),
        f.config,
      ),
      sealed = validateApplyPlan(prepared.composed);
    assert.ok(sealed.ok);
    f.p.writeFile(
      "vite.config.ts",
      vite.replace("sveltekit()", "sveltekit({})"),
    );
    const repeated = planInit({
      ...initializationFields(f.config, ""),
      snapshot: prepared.snapshot,
      registry: prepared.registry,
      configHash: prepared.snapshot.entries.get(f.paths.stateDir + "/kit.json")!
        .hash!,
    });
    assert.ok(repeated.ok, JSON.stringify(repeated));
    assert.equal(captureEnvironment(f.p.root).project.ok, false);
    const before = snapshotTree(f.p.root),
      out = applyPlan(sealed.value);
    assert.equal(out.kind, "refused");
    assert.equal(out.transactionId, null);
    assert.deepEqual(snapshotTree(f.p.root), before);
  });
}
test("installed Kit replacement and absent-to-Kit3 appearance invalidate original sealed authority", (t) => {
  for (const installed of [false, true]) {
    const f = setup(t, false, installed),
      prepared = composeGenerationFoundation(f.p.root, process.cwd(), f.config),
      sealed = validateApplyPlan(prepared.composed);
    assert.ok(sealed.ok);
    f.p.writeFile(
      "node_modules/@sveltejs/kit/package.json",
      JSON.stringify({ name: "@sveltejs/kit", version: "3.1.0" }),
    );
    const before = snapshotTree(f.p.root),
      out = applyPlan(sealed.value);
    assert.equal(out.kind, "refused");
    assert.equal(out.transactionId, null);
    assert.deepEqual(snapshotTree(f.p.root), before);
  }
});
test("Vite options, ambiguity, unsupported extensions and symlinks refuse real CLI dry runs without writes", (t) => {
  for (const variant of [
    "options",
    "ambiguous",
    "cjs",
    "symlink",
    "dynamic",
  ] as const) {
    const f = setup(t);
    f.p.writeFile(
      "vite.config.ts",
      variant === "options"
        ? vite.replace("sveltekit()", "sveltekit({})")
        : variant === "dynamic"
          ? vite.replace(
              "defineConfig({plugins:[sveltekit()]})",
              "defineConfig(()=>({plugins:[sveltekit()]}))",
            )
          : vite,
    );
    if (variant === "ambiguous") f.p.writeFile("vite.config.mts", vite);
    if (variant === "cjs") f.p.writeFile("vite.config.cjs", vite);
    if (variant === "symlink") f.p.symlink("vite.config.ts", "vite.config.mts");
    const before = snapshotTree(f.p.root);
    const result = spawnSync(
      process.execPath,
      [
        path.resolve("dist/cli/main.js"),
        "--cwd",
        f.p.root,
        "init",
        "--dry-run",
        "--json",
      ],
      { encoding: "utf8", timeout: 30000 },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /PROJECT_SVELTEKIT_VITE_UNSUPPORTED/);
    assert.deepEqual(snapshotTree(f.p.root), before);
  }
});
test("normalized catalogs and captured installed metadata independently establish supported Kit2", (t) => {
  const f = setup(t);
  const manifest = JSON.parse(
    readFileSync(path.join(f.p.root, "package.json"), "utf8"),
  );
  manifest.dependencies["@sveltejs/kit"] = "catalog:";
  f.p.writeFile("package.json", JSON.stringify(manifest));
  f.p.writeFile(
    "pnpm-workspace.yaml",
    'packages: [.]\ncatalog:\n  "@sveltejs/kit": 2.70.3\n',
  );
  assert.ok(captureEnvironment(f.p.root).project.ok);
  f.p.writeFile(
    "node_modules/@sveltejs/kit/package.json",
    JSON.stringify({ name: "@sveltejs/kit", version: "3.1.0" }),
  );
  const before = snapshotTree(f.p.root),
    observed = captureEnvironment(f.p.root);
  assert.equal(observed.project.ok, false);
  assert.deepEqual(snapshotTree(f.p.root), before);
});
test("broad Kit3-permitting declarations and malformed installed metadata remain closed", (t) => {
  for (const variant of ["range", "installed"] as const) {
    const f = setup(t, true);
    if (variant === "range") {
      const m = JSON.parse(
        readFileSync(path.join(f.p.root, "package.json"), "utf8"),
      );
      m.dependencies["@sveltejs/kit"] = ">=2";
      f.p.writeFile("package.json", JSON.stringify(m));
    } else f.p.writeFile("node_modules/@sveltejs/kit/package.json", "{");
    const before = snapshotTree(f.p.root);
    const observed = captureEnvironment(f.p.root);
    assert.equal(observed.project.ok, false);
    assert.deepEqual(snapshotTree(f.p.root), before);
  }
});

test("impossible absent-install declarations and incomplete captured inputs refuse as typed evidence", (t) => {
  const f = setup(t, false, false);
  const manifest = JSON.parse(
    readFileSync(path.join(f.p.root, "package.json"), "utf8"),
  );
  manifest.dependencies["@sveltejs/kit"] = ">=3 <2";
  f.p.writeFile("package.json", JSON.stringify(manifest));
  const before = snapshotTree(f.p.root),
    observed = captureEnvironment(f.p.root);
  assert.equal(observed.project.ok, false);
  assert.deepEqual(snapshotTree(f.p.root), before);
});

test("native filenames and route extensions cannot be waived by explicit v1 or v2 intent", (t) => {
  for (const v2 of [false, true])
    for (const variant of [
      "mjs",
      "cjs",
      "custom",
      "additional",
      "dynamic",
    ] as const) {
      const f = setup(t, v2);
      const source =
        variant === "custom"
          ? 'export default {extensions:[".svx"]};'
          : variant === "additional"
            ? 'export default {extensions:[".svelte",".svx"]};'
            : variant === "dynamic"
              ? "export default {extensions:process.env.EXTENSIONS};"
              : 'export default {kit:{files:{routes:"ignored"}}};';
      f.p.writeFile(
        `svelte.config.${variant === "mjs" || variant === "cjs" ? variant : "ts"}`,
        source,
      );
      const before = snapshotTree(f.p.root),
        result = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            "--cwd",
            f.p.root,
            "init",
            "--dry-run",
            "--json",
          ],
          { encoding: "utf8", timeout: 30000 },
        );
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      assert.equal(result.status, 1, result.stdout + result.stderr);
      assert.match(
        result.stdout,
        /PROJECT_SVELTEKIT_(FILENAME|EXTENSIONS)_UNSUPPORTED/,
      );
      assert.deepEqual(snapshotTree(f.p.root), before);
    }
});

test("files.src follows real native defaults and preserves partial explicit overrides", (t) => {
  for (const files of [
    { src: "app" },
    { src: "app", routes: "routes" },
    { src: "app", lib: "library" },
  ]) {
    const f = setup(t);
    f.p.writeFile(
      "svelte.config.ts",
      `export default {extensions:[".svelte"],kit:{files:${JSON.stringify(files)}}} satisfies object;`,
    );
    const observed = captureEnvironment(f.p.root);
    assert.ok(observed.project.ok, JSON.stringify(observed.project));
    assert.equal(
      observed.project.value.routesDir,
      "routes" in files ? files.routes : "app/routes",
    );
    assert.equal(
      observed.project.value.libDir,
      "lib" in files ? files.lib : "app/lib",
    );
  }
});

test("native feature floors require actual compatible installed metadata or wholly compatible declarations", (t) => {
  for (const feature of ["typescript", "source"] as const)
    for (const mode of [
      "old",
      "absent-broad",
      "absent-current",
      "installed-current",
    ] as const) {
      const f = setup(
        t,
        false,
        mode !== "absent-broad" && mode !== "absent-current",
      );
      const manifest = JSON.parse(
        readFileSync(path.join(f.p.root, "package.json"), "utf8"),
      );
      manifest.dependencies["@sveltejs/kit"] =
        mode === "absent-current" ? "^2.70.3" : "^2.0.0";
      f.p.writeFile("package.json", JSON.stringify(manifest));
      if (mode === "old")
        f.p.writeFile(
          "node_modules/@sveltejs/kit/package.json",
          JSON.stringify({
            name: "@sveltejs/kit",
            version: feature === "typescript" ? "2.22.0" : "2.28.0",
          }),
        );
      f.p.writeFile(
        feature === "typescript" ? "svelte.config.ts" : "svelte.config.js",
        feature === "source"
          ? 'export default {kit:{files:{src:"app"}}};'
          : "export default {};",
      );
      const before = snapshotTree(f.p.root),
        result = captureEnvironment(f.p.root).project;
      assert.equal(
        result.ok,
        mode === "absent-current" || mode === "installed-current",
        feature + mode + JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(f.p.root), before);
    }
});

test("mapping failure cannot discard source-directory feature requirements in either property order", (t) => {
  for (const files of [
    'src:"app",routes:process.env.ROUTES',
    'routes:process.env.ROUTES,src:"app"',
  ])
    for (const supported of [false, true]) {
      const f = setup(t);
      const m = JSON.parse(
        readFileSync(path.join(f.p.root, "package.json"), "utf8"),
      );
      m.dependencies["@sveltejs/kit"] = "^2.0.0";
      f.p.writeFile("package.json", JSON.stringify(m));
      f.p.writeFile(
        "node_modules/@sveltejs/kit/package.json",
        JSON.stringify({
          name: "@sveltejs/kit",
          version: supported ? "2.70.3" : "2.28.0",
        }),
      );
      f.p.writeFile(
        "svelte.config.js",
        `export default {kit:{files:{${files}}}};`,
      );
      const before = snapshotTree(f.p.root),
        r = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            "--cwd",
            f.p.root,
            "init",
            "--dry-run",
            "--json",
          ],
          { encoding: "utf8", timeout: 30000 },
        );
      assert.equal(r.error, undefined);
      assert.equal(r.signal, null);
      assert.equal(r.status, supported ? 0 : 1, r.stdout + r.stderr);
      if (!supported)
        assert.match(r.stdout, /PROJECT_SVELTEKIT_FEATURE_UNSUPPORTED/);
      assert.deepEqual(snapshotTree(f.p.root), before);
    }
});

test("genuine native Kit uses inherited configuration, while both generation schemas refuse literal prototypes", async (t) => {
  const { createRequire } = await import("node:module"),
    { pathToFileURL } = await import("node:url");
  const req = createRequire(path.resolve("package.json"));
  const native = await import(
    pathToFileURL(
      path.join(
        path.dirname(req.resolve("@sveltejs/kit/package.json")),
        "src/core/config/index.js",
      ),
    ).href
  );
  const inheritedExtensions = { __proto__: { extensions: [".svx"] } };
  assert.deepEqual(native.validate_config(inheritedExtensions).extensions, [
    ".svx",
  ]);
  for (const value of [
    { __proto__: { kit: { files: { src: "app" } } } },
    { kit: { __proto__: { files: { src: "app" } } } },
    { kit: { files: { __proto__: { src: "app" } } } },
  ]) {
    const actual = native.validate_config(value);
    assert.equal(actual.kit.files.routes, "app/routes");
    assert.equal(actual.kit.files.lib, "app/lib");
  }
  const sources = [
    'export default {__proto__:{extensions:[".svx"]}};',
    'export default {"__proto__":{kit:{files:{src:"app"}}}};',
    'export default {kit:{__proto__:{files:{src:"app"}}}};',
    'export default {kit:{files:{"__proto__":{src:"app"}}}};',
  ];
  for (const v2 of [false, true])
    for (const source of sources) {
      const f = setup(t, v2);
      f.p.writeFile("svelte.config.js", source);
      const before = snapshotTree(f.p.root),
        r = spawnSync(
          process.execPath,
          [
            path.resolve("dist/cli/main.js"),
            "--cwd",
            f.p.root,
            "init",
            "--dry-run",
            "--json",
          ],
          { encoding: "utf8", timeout: 30000 },
        );
      assert.equal(r.error, undefined);
      assert.equal(r.signal, null);
      assert.equal(r.status, 1, r.stdout + r.stderr);
      assert.match(r.stdout, /PROJECT_SVELTEKIT_PROTOTYPE_UNSUPPORTED/);
      assert.deepEqual(snapshotTree(f.p.root), before);
    }
});
