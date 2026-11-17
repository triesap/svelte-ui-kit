import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { stageOperations } from "../../src/codegen/stage.js";
import { persistJournal } from "../../src/codegen/transaction-journal.js";
import { journalPath } from "../../src/codegen/transaction-types.js";
import {
  DEFAULT_KIT_CONFIG,
  serializeKitConfig,
} from "../../src/project/config.js";
import { GUARDED_STATE, makeGuardedPlan } from "../helpers/guarded-plan.js";
import {
  createSupportedProject,
  createTempProject,
} from "../helpers/project.js";
import { liveRootIdentity } from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

function cli(root: string, args: string[], preload?: string) {
  const child = spawnSync(
    process.execPath,
    [
      ...(preload
        ? [
            "--import",
            `data:text/javascript;base64,${Buffer.from(preload).toString("base64")}`,
          ]
        : []),
      path.resolve("dist/cli/main.js"),
      ...args,
      "--json",
      "--cwd",
      root,
    ],
    { cwd: root, encoding: "utf8", timeout: 30000, killSignal: "SIGKILL" },
  );
  assert.equal(child.error, undefined, child.stdout + child.stderr);
  assert.equal(child.signal, null, child.stdout + child.stderr);
  assert.equal(child.stderr, "");
  return { ...child, envelope: JSON.parse(child.stdout) };
}
for (const shape of [
  "fresh",
  "empty-kit",
  "app-source",
  "custom-routes",
] as const)
  test(`${shape}: actual info has truthful default provenance without creating ownership`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    if (shape === "empty-kit") p.writeDir("src/lib/components/ui/_kit");
    if (shape === "app-source")
      p.writeFile(
        "src/lib/components/ui/owned-by-app.svelte",
        "<p>Application source</p>\n",
      );
    if (shape === "custom-routes")
      p.writeFile(
        "svelte.config.ts",
        'export default {kit:{files:{routes:"app/routes"}}};\n',
      );
    const before = snapshotTree(p.root),
      result = cli(p.root, ["info"]);
    assert.equal(result.status, 0, result.stdout);
    assert.equal(result.envelope.data.config.kind, "default");
    assert.equal(result.envelope.data.config.path, null);
    assert.equal(result.envelope.data.paths.target, "sveltekit");
    assert.equal(result.envelope.data.paths.configSchema, 1);
    assert.equal(
      result.envelope.data.paths.layoutFile,
      shape === "custom-routes"
        ? "app/routes/+layout.svelte"
        : "src/routes/+layout.svelte",
    );
    assert.equal(
      Object.hasOwn(result.envelope.data.paths, "styleEntry"),
      false,
    );
    assert.equal(result.envelope.data.ready, false);
    assert.deepEqual(snapshotTree(p.root), before);
  });
for (const state of ["lock", "writer", "transaction"] as const)
  test(`orphan ${state} in a custom mapping prevents every actual command from adopting a fresh default`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    const dir = "custom/design/_kit";
    if (state === "lock")
      p.writeFile(`${dir}/kit.lock.json`, '{"untrusted":"retained"}\n');
    else if (state === "writer")
      p.writeFile(
        `${dir}/.svelte-ui-kit/writer.lock/owner.json`,
        '{"untrusted":"retained"}\n',
      );
    else
      p.writeFile(
        `${dir}/.svelte-ui-kit/transactions/abababababababab/journal.json`,
        '{"untrusted":"retained"}\n',
      );
    const before = snapshotTree(p.root),
      code =
        state === "lock"
          ? "KIT_INSTALLATION_INCOMPLETE"
          : state === "writer"
            ? "KIT_WRITER_PRESENT"
            : "KIT_RECOVERY_PENDING";
    for (const args of [
      ["info"],
      ["init", "--dry-run"],
      ["add", "button", "--dry-run"],
      ["sync", "--dry-run"],
      ["doctor", "--strict"],
    ]) {
      const result = cli(p.root, args);
      assert.equal(result.status, args[0] === "doctor" ? 3 : 1, result.stdout);
      assert.ok(
        result.envelope.diagnostics.some(
          (d: { code: string }) => d.code === code,
        ),
        result.stdout,
      );
      assert.deepEqual(snapshotTree(p.root), before);
    }
  });
test("nested independent package retained state is excluded from selected-package discovery", (t) => {
  const p = createSupportedProject();
  t.after(() => p.cleanup());
  p.writeFile("nested/package.json", '{"name":"independent"}');
  p.writeFile("nested/ui/_kit/kit.lock.json", "untrusted");
  const before = snapshotTree(p.root);
  assert.equal(cli(p.root, ["info"]).status, 0);
  assert.deepEqual(snapshotTree(p.root), before);
});
for (const target of ["astro", "svelte-library"] as const)
  test(`${target}: configured intent retains custom provenance and one actual role without a lock`, (t) => {
    const p = createTempProject();
    t.after(() => p.cleanup());
    const library = target === "svelte-library";
    p.writeFile(
      "package.json",
      JSON.stringify({
        name: `owned-${target}`,
        private: true,
        type: "module",
        packageManager: "pnpm@12.16.1",
        ...(library
          ? {
              peerDependencies: { svelte: "5.57.3" },
              svelte: "./dist/index.js",
              types: "./dist/index.d.ts",
              exports: {
                ".": {
                  types: "./dist/index.d.ts",
                  svelte: "./dist/index.js",
                  default: "./dist/index.js",
                },
                "./styles.css": "./theme/index.css",
              },
            }
          : {
              dependencies: {
                svelte: "5.57.3",
                astro: "7.4.4",
                "@astrojs/svelte": "9.1.2",
              },
            }),
      }),
    );
    if (!library)
      p.writeFile(
        "astro.config.ts",
        'import {defineConfig} from "astro/config";import svelte from "@astrojs/svelte";export default defineConfig({integrations:[svelte()]});\n',
      );
    p.writeFile(
      "design/ui/_kit/kit.json",
      JSON.stringify({
        schemaVersion: 1,
        target,
        uiDir: "design/ui",
        stylesDir: "theme",
        ...(library
          ? { styleEntry: "theme/index.css" }
          : { layoutFile: "app/Shell.astro" }),
      }),
    );
    const before = snapshotTree(p.root),
      result = cli(p.root, ["info"]);
    assert.equal(result.status, 0, result.stdout);
    const data = result.envelope.data;
    assert.equal(data.config.kind, "custom");
    assert.equal(data.config.path, "design/ui/_kit/kit.json");
    assert.equal(data.paths.target, target);
    assert.equal(data.paths.configSchema, 1);
    assert.equal(
      data.paths[library ? "styleEntry" : "layoutFile"],
      library ? "theme/index.css" : "app/Shell.astro",
    );
    assert.equal(
      Object.hasOwn(data.paths, library ? "layoutFile" : "styleEntry"),
      false,
    );
    assert.deepEqual(snapshotTree(p.root), before);
  });
test("doctor diagnoses actual canonical prepared first-init evidence even before a lock exists", (t) => {
  const p = createSupportedProject();
  t.after(() => p.cleanup());
  const state = "src/lib/components/ui/_kit",
    id = "abababababababab";
  p.writeFile(`${state}/kit.json`, serializeKitConfig(DEFAULT_KIT_CONFIG));
  const staged = stageOperations(p.root, state, id, []);
  assert.ok(staged.ok, JSON.stringify(staged));
  persistJournal(p.root, journalPath(state, id), {
    schemaVersion: 3,
    target: "sveltekit",
    transactionId: id,
    rootIdentity: liveRootIdentity(p.root),
    planDigest: "a".repeat(64),
    phase: "prepared",
    operations: [],
    lock: null,
    createdDirs: [],
    ignoreFiles: [],
  });
  const before = snapshotTree(p.root),
    result = cli(p.root, ["doctor", "--strict"]);
  assert.equal(result.status, 3, result.stdout);
  assert.ok(
    result.envelope.diagnostics.some(
      (d: { code: string }) => d.code === "DOCTOR_RECOVERY_PENDING",
    ),
    result.stdout,
  );
  assert.ok(
    result.envelope.diagnostics.some(
      (d: { code: string }) => d.code === "DOCTOR_NOT_INITIALIZED",
    ),
    result.stdout,
  );
  assert.deepEqual(snapshotTree(p.root), before);
});
for (const timing of ["scan-read", "after-preliminary"] as const)
  for (const command of ["info", "init", "add", "sync", "doctor"])
    test(`${command}: disappearing ${timing} candidate is a typed refusal with no silent default`, (t) => {
      const p = createSupportedProject();
      t.after(() => p.cleanup());
      const logical = "custom/ui/_kit/kit.json";
      p.writeFile(
        logical,
        serializeKitConfig({ ...DEFAULT_KIT_CONFIG, uiDir: "custom/ui" }),
      );
      const file = path.join(p.root, logical),
        before = snapshotTree(p.root);
      const preload = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const file=${JSON.stringify(file)},read=fs.readFileSync;let fired=false;fs.readFileSync=function(input,...args){if(input===file&&!fired){fired=true;${timing === "scan-read" ? "fs.unlinkSync(file);return read.call(this,input,...args);" : "const bytes=read.call(this,input,...args);fs.unlinkSync(file);return bytes;"}}return read.call(this,input,...args)};syncBuiltinESMExports();`;
      const args =
        command === "add"
          ? [command, "button", "--dry-run"]
          : command === "doctor"
            ? [command, "--strict"]
            : command === "info"
              ? [command]
              : [command, "--dry-run"];
      const result = cli(p.root, args, preload);
      assert.equal(existsSync(file), false, "fault must actually run");
      assert.equal(result.status, command === "doctor" ? 3 : 1, result.stdout);
      assert.ok(
        result.envelope.diagnostics.some(
          (d: { code: string }) =>
            d.code === "KIT_CONFIG_CHANGED" ||
            d.code === "SNAPSHOT_INSTALLATION_CHANGED",
        ),
        result.stdout,
      );
      assert.deepEqual(
        snapshotTree(p.root),
        before.filter((entry) => entry.path !== logical),
      );
    });

test("explicit custom mapping does not inspect irrelevant prospective default UI ancestry", (t) => {
  const p = createSupportedProject();
  t.after(() => p.cleanup());
  p.writeDir("application-owned");
  p.symlink(path.join(p.root, "application-owned"), "src/lib/components/ui");
  p.writeFile(
    "design/ui/_kit/kit.json",
    serializeKitConfig({ ...DEFAULT_KIT_CONFIG, uiDir: "design/ui" }),
  );
  const before = snapshotTree(p.root),
    result = cli(p.root, ["info"]);
  assert.equal(result.status, 0, result.stdout);
  assert.equal(result.envelope.data.config.kind, "custom");
  assert.equal(result.envelope.data.paths.uiDir, "design/ui");
  assert.deepEqual(snapshotTree(p.root), before);
});
for (const role of [
  "kit.lock.json",
  ".svelte-ui-kit/writer.lock",
  ".svelte-ui-kit/transactions",
])
  test(`orphan ${role} link is an unsafe role, never followed or adopted`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    p.writeDir("operator-owned");
    p.symlink(path.join(p.root, "operator-owned"), `custom/ui/_kit/${role}`);
    const before = snapshotTree(p.root);
    for (const args of [
      ["info"],
      ["init", "--dry-run"],
      ["add", "button", "--dry-run"],
      ["sync", "--dry-run"],
      ["doctor", "--strict"],
    ]) {
      const result = cli(p.root, args);
      assert.equal(result.status, args[0] === "doctor" ? 3 : 11, result.stdout);
      assert.ok(
        result.envelope.diagnostics.some(
          (d: { code: string }) => d.code === "KIT_STATE_UNSAFE",
        ),
        result.stdout,
      );
      assert.deepEqual(snapshotTree(p.root), before);
    }
  });
for (const mutation of ["target", "schema", "mapping", "json"])
  test(`info refuses ${mutation} lock evidence instead of reporting dependency readiness`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    const sealed = validateApplyPlan(makeGuardedPlan(p.root));
    assert.ok(sealed.ok, JSON.stringify(sealed));
    assert.equal(applyPlan(sealed.value).kind, "applied");
    const file = path.join(p.root, GUARDED_STATE, "kit.lock.json"),
      lock = JSON.parse(readFileSync(file, "utf8"));
    if (mutation === "target") {
      lock.target = "astro";
      lock.integrations.find(
        (i: { kind: string }) => i.kind === "layout",
      ).contract = "astro-layout-v1";
    }
    if (mutation === "schema") lock.schemaVersion = 2;
    if (mutation === "mapping")
      lock.integrations.find(
        (i: { kind: string }) => i.kind === "layout",
      ).path = "other/+layout.svelte";
    writeFileSync(
      file,
      mutation === "json" ? "{not json" : JSON.stringify(lock),
    );
    const before = snapshotTree(p.root),
      result = cli(p.root, ["info"]);
    assert.equal(result.status, 1, result.stdout);
    const expected =
      mutation === "target"
        ? "LOCK_TARGET_CONTEXT"
        : mutation === "schema"
          ? "SCHEMA_INVALID"
          : mutation === "mapping"
            ? "LOCK_LAYOUT_CONTEXT"
            : "COMMAND_LOCK_INVALID";
    assert.ok(
      result.envelope.diagnostics.some(
        (d: { code: string }) => d.code === expected,
      ),
      result.stdout,
    );
    assert.deepEqual(snapshotTree(p.root), before);
  });
for (const role of ["writer.lock", "transactions"])
  test(`a foreign ${role} appearing after discovery is observed as capture drift`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    const foreign = "foreign/ui/_kit/.svelte-ui-kit";
    p.writeDir("foreign/ui/_kit");
    p.writeFile("src/routes/+layout.svelte", "<main><slot /></main>");
    const before = snapshotTree(p.root),
      file = path.join(p.root, "src/routes/+layout.svelte"),
      target = path.join(p.root, foreign, role),
      snapshotUrl = new URL("../../src/codegen/snapshot.js", import.meta.url)
        .href;
    const script = `import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const original=fs.readFileSync,file=${JSON.stringify(file)},target=${JSON.stringify(target)};let fired=false;fs.readFileSync=function(input,...args){if(input===file&&!fired){fired=true;fs.mkdirSync(target,{recursive:true,mode:0o700});fs.writeFileSync(target+'/operator-note','preserve');}return original.call(this,input,...args)};syncBuiltinESMExports();const {captureSnapshot}=await import(${JSON.stringify(snapshotUrl)});const result=captureSnapshot(${JSON.stringify(p.root)},['src/routes/+layout.svelte']);console.log(JSON.stringify({fired,result}));`;
    const child = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      { encoding: "utf8", timeout: 30000, killSignal: "SIGKILL" },
    );
    assert.equal(child.error, undefined);
    assert.equal(child.signal, null);
    assert.equal(child.status, 0, child.stdout + child.stderr);
    assert.equal(child.stderr, "");
    const proof = JSON.parse(child.stdout);
    assert.equal(proof.fired, true);
    assert.equal(proof.result.ok, false);
    assert.equal(proof.result.issues[0].code, "SNAPSHOT_INSTALLATION_CHANGED");
    assert.equal(
      readFileSync(path.join(target, "operator-note"), "utf8"),
      "preserve",
    );
    assert.deepEqual(
      snapshotTree(p.root).filter((e) => !e.path.startsWith(foreign)),
      before,
    );
  });
for (const role of ["writer.lock", "transactions"])
  test(`a foreign ${role} appearing after staging invalidates the actual guarded batch`, (t) => {
    const p = createSupportedProject();
    t.after(() => p.cleanup());
    const foreign = "foreign/ui/_kit/.svelte-ui-kit";
    p.writeDir("foreign/ui/_kit");
    const sealed = validateApplyPlan(makeGuardedPlan(p.root));
    assert.ok(sealed.ok, JSON.stringify(sealed));
    assert.ok(
      sealed.value.readset.files.some(
        (f) => f.path === `${foreign}/${role}` && f.kind === "absent",
      ),
    );
    const before = snapshotTree(p.root);
    let fired = false;
    const outcome = applyPlan(sealed.value, {
      after(boundary) {
        if (boundary === "stage:write" && !fired) {
          fired = true;
          mkdirSync(path.join(p.root, foreign, role), {
            recursive: true,
            mode: 0o700,
          });
          writeFileSync(
            path.join(p.root, foreign, role, "operator-note"),
            "preserve",
          );
        }
      },
    });
    assert.equal(fired, true);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome));
    assert.ok(
      outcome.issues.some((i) => i.code.startsWith("AUTHORITY_")),
      JSON.stringify(outcome),
    );
    assert.equal(
      readFileSync(path.join(p.root, foreign, role, "operator-note"), "utf8"),
      "preserve",
    );
    assert.deepEqual(
      snapshotTree(p.root).filter((e) => !e.path.startsWith(foreign)),
      before,
    );
  });

test("workspace selection ignores an ordinary library and requires explicit cwd for a second opted-in target", (t) => {
  const p = createTempProject();
  t.after(() => p.cleanup());
  p.writeFile(
    "package.json",
    JSON.stringify({
      name: "owned-workspace",
      private: true,
      type: "module",
      packageManager: "pnpm@12.16.1",
      workspaces: ["packages/*"],
    }),
  );
  p.writeFile(
    "packages/app/package.json",
    JSON.stringify({
      name: "owned-app",
      private: true,
      type: "module",
      dependencies: { "@sveltejs/kit": "2.70.3", svelte: "5.57.3" },
    }),
  );
  p.writeFile(
    "packages/ui/package.json",
    JSON.stringify({
      name: "@owned/ui",
      private: true,
      type: "module",
      peerDependencies: { svelte: "5.57.3" },
      svelte: "./dist/index.js",
      types: "./dist/index.d.ts",
      exports: {
        ".": {
          types: "./dist/index.d.ts",
          svelte: "./dist/index.js",
          default: "./dist/index.js",
        },
        "./styles.css": "./src/styles.css",
      },
    }),
  );
  let before = snapshotTree(p.root);
  const app = cli(p.root, ["info"]);
  assert.equal(app.status, 0, app.stdout);
  assert.equal(app.envelope.data.project.packageName, "owned-app");
  assert.deepEqual(snapshotTree(p.root), before);
  p.writeFile(
    "packages/ui/src/lib/_kit/kit.json",
    JSON.stringify({
      schemaVersion: 1,
      target: "svelte-library",
      uiDir: "src/lib",
      stylesDir: "src/styles",
      styleEntry: "src/styles.css",
    }),
  );
  before = snapshotTree(p.root);
  const ambiguous = cli(p.root, ["info"]);
  assert.equal(ambiguous.status, 1, ambiguous.stdout);
  assert.ok(
    ambiguous.envelope.diagnostics.some(
      (d: { code: string }) => d.code === "PROJECT_AMBIGUOUS_WORKSPACE",
    ),
    ambiguous.stdout,
  );
  assert.equal(cli(path.join(p.root, "packages/app"), ["info"]).status, 0);
  const library = cli(path.join(p.root, "packages/ui"), ["info"]);
  assert.equal(library.status, 0, library.stdout);
  assert.equal(library.envelope.data.paths.target, "svelte-library");
  assert.deepEqual(snapshotTree(p.root), before);
});
