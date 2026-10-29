import assert from "node:assert/strict";
import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { createTempProject } from "../helpers/project.js";
import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { clearOrphanedWriterLock } from "../helpers/transactions.js";
import { parseTargetConfig } from "../../src/project/target-config.js";
import { generationLockContext } from "../../src/project/generation-config.js";
import {
  applyPlan,
  validateApplyPlan,
  type LibraryApplyPlanInput,
} from "../../src/codegen/apply.js";
import { inspectLibraryStyles } from "../../src/codegen/library-styles.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import {
  parseJournal,
  validateJournalTargets,
} from "../../src/codegen/transaction-journal.js";
import {
  discoverKitConfig,
  discoverGenerationConfig,
} from "../../src/project/detect.js";
const owner = process.cwd();
function fixture(t: { after(fn: () => void): void }, formatted = true) {
  const project = createTempProject();
  t.after(() => project.cleanup());
  const config = parseTargetConfig({
    schemaVersion: 2,
    target: "svelte-library",
    uiDir: "src/lib",
    stylesDir: "src/styles",
    styleEntry: "src/styles.css",
    requested: [],
  });
  assert.ok(config.ok && config.value.target === "svelte-library");
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: "@example/generated-ui-library",
      version: "0.0.0",
      private: true,
      type: "module",
      packageManager: "pnpm@11.22.0",
      peerDependencies: { svelte: "5.57.1" },
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
  // Metadata-only planning fixture; actual native compilation is a separate consumer lane.
  project.writeFile(
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "svelte", version: "5.57.1" }),
  );
  project.writeFile(
    "src/lib/_kit/kit.json",
    JSON.stringify(config.value, null, formatted ? 2 : undefined) +
      (formatted ? "\n" : ""),
  );
  return {
    project,
    ...composeGenerationFoundation(project.root, owner, config.value),
  };
}
function cli(root: string, ...args: string[]) {
  const run = spawnSync(
    process.execPath,
    [path.join(owner, "dist/cli/main.js"), "--cwd", root, ...args],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.equal(run.error, undefined);
  assert.equal(run.signal, null);
  return run;
}
function initialize(f: ReturnType<typeof fixture>) {
  const valid = validateApplyPlan(f.composed);
  assert.ok(valid.ok, JSON.stringify(valid));
  const outcome = applyPlan(valid.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome));
  return valid.value;
}
test("standalone source and CSS entry generation has genuine library ownership and no application layout", (t) => {
  const f = fixture(t),
    manifest = readFileSync(path.join(f.project.root, "package.json"), "utf8");
  assert.equal(Object.hasOwn(f.composed, "layoutFile"), false);
  assert.equal(f.composed.styleEntry, f.config.styleEntry);
  const sealed = initialize(f);
  assert.equal(Object.hasOwn(sealed, "layoutFile"), false);
  assert.equal(existsSync(path.join(f.project.root, "src/routes")), false);
  assert.equal(
    readFileSync(path.join(f.project.root, "package.json"), "utf8"),
    manifest,
  );
  const entry = inspectLibraryStyles(
    readFileSync(path.join(f.project.root, f.config.styleEntry), "utf8"),
  );
  assert.ok(entry.ok);
  assert.deepEqual(entry.value.imports, [
    "./styles/kit.css",
    "./styles/themes.css",
    "./styles/app.css",
  ]);
  const lock = JSON.parse(
    readFileSync(
      path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
      "utf8",
    ),
  );
  assert.equal(lock.target, "svelte-library");
  assert.equal(lock.integrations.length, 3);
  assert.deepEqual(
    lock.integrations.filter((e: { kind: string }) => e.kind === "layout"),
    [],
  );
  const primary = lock.integrations.find(
    (e: { kind: string }) => e.kind === "stylesheet-entry",
  );
  assert.equal(primary.path, f.config.styleEntry);
  assert.equal(primary.contract, "library-styles-v1");
  assert.ok(
    parseKitLock(lock, "kit.lock.json", {
      uiDir: f.config.uiDir,
      stylesDir: f.config.stylesDir,
      stateDir: f.paths.stateDir,
      ...generationLockContext(f.config),
    }).ok,
  );
});
test("legacy application discovery refuses library interpretation while generation discovery preserves the actual role", (t) => {
  const f = fixture(t);
  assert.equal(discoverKitConfig(f.project.root).ok, false);
  const found = discoverGenerationConfig(f.project.root);
  assert.ok(found.ok);
  assert.equal("layoutFile" in found.value.config, false);
});
test("real library CLI add and read/dry/no-change paths preserve full owned trees", (t) => {
  const f = fixture(t);
  initialize(f);
  const added = cli(f.project.root, "add", "button");
  assert.equal(added.status, 0, added.stdout + added.stderr);
  assert.ok(
    readFileSync(
      path.join(f.project.root, "src/lib/index.ts"),
      "utf8",
    ).includes("Button"),
  );
  const before = snapshotTree(f.project.root);
  for (const args of [
    ["info"],
    ["doctor"],
    ["sync", "--dry-run"],
    ["sync"],
    ["init"],
    ["add", "button"],
  ]) {
    const result = cli(f.project.root, ...args);
    assert.equal(
      result.status,
      0,
      args.join(" ") + result.stdout + result.stderr,
    );
    assert.deepEqual(snapshotTree(f.project.root), before, args.join(" "));
  }
});
test("mixed physical-role fields and stale library intent refuse before any coordination writes", (t) => {
  const f = fixture(t),
    before = snapshotTree(f.project.root);
  assert.equal(
    validateApplyPlan({
      ...f.composed,
      layoutFile: "src/unowned.svelte",
    } as unknown as Partial<LibraryApplyPlanInput>).ok,
    false,
  );
  assert.deepEqual(snapshotTree(f.project.root), before);
  const valid = validateApplyPlan(f.composed);
  assert.ok(valid.ok);
  f.project.writeFile(
    "src/lib/_kit/kit.json",
    JSON.stringify({ ...f.config, styleEntry: "src/another.css" }),
  );
  const changed = snapshotTree(f.project.root);
  const outcome = applyPlan(valid.value);
  assert.equal(outcome.kind, "refused");
  assert.equal(outcome.transactionId, null);
  assert.deepEqual(snapshotTree(f.project.root), changed);
});
test("library lock inventory cannot claim an application contract or an extra physical integration", (t) => {
  const f = fixture(t),
    lock = JSON.parse(new TextDecoder().decode(f.composed.lock.bytes));
  assert.ok(parseKitLock(lock).ok);
  const entry = lock.integrations.find(
    (e: { kind: string }) => e.kind === "stylesheet-entry",
  );
  assert.equal(
    parseKitLock({
      ...lock,
      integrations: lock.integrations.map((e: unknown) =>
        e === entry ? { ...entry, kind: "layout", contract: "layout-v1" } : e,
      ),
    }).ok,
    false,
  );
  assert.equal(
    parseKitLock({
      ...lock,
      integrations: [
        ...lock.integrations,
        {
          ...entry,
          kind: "layout",
          contract: "layout-v1",
          path: "src/fake.svelte",
        },
      ],
    }).ok,
    false,
  );
});
test("a real killed standalone-entry write recovers with the original sealed plan and exact target journal", (t) => {
  const f = fixture(t),
    original = validateApplyPlan(f.composed);
  assert.ok(original.ok);
  const helper = new URL("../helpers/generation-project.js", import.meta.url)
      .href,
    apply = new URL("../../src/codegen/apply.js", import.meta.url).href;
  const script = `import {composeGenerationFoundation} from ${JSON.stringify(helper)};import{applyPlan,validateApplyPlan}from ${JSON.stringify(apply)};const f=composeGenerationFoundation(process.env.OWNED_PROJECT,process.env.OWNED_REGISTRY,JSON.parse(process.env.OWNED_CONFIG));const v=validateApplyPlan(f.composed);if(!v.ok)throw Error(JSON.stringify(v));applyPlan(v.value,{after:(phase,detail)=>{if(phase==='replace:apply'&&detail===f.integration.path){console.log('owned killed pid '+process.pid);process.kill(process.pid,'SIGKILL')}}});process.exit(9);`;
  const env = {
    ...process.env,
    OWNED_PROJECT: f.project.root,
    OWNED_REGISTRY: owner,
    OWNED_CONFIG: JSON.stringify(f.config),
  };
  for (const key of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
    delete env[key as keyof typeof env];
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    { env, encoding: "utf8", timeout: 30000 },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.status, null, child.stdout + child.stderr);
  assert.equal(child.signal, "SIGKILL");
  const pid = Number(/owned killed pid (\d+)/.exec(child.stdout)?.[1]);
  assert.ok(pid > 0 && pid !== process.pid);
  const transactions = path.join(
      f.project.root,
      f.paths.stateDir,
      ".svelte-ui-kit/transactions",
    ),
    ids = readdirSync(transactions);
  assert.equal(ids.length, 1);
  const journal = parseJournal(
    readFileSync(path.join(transactions, ids[0], "journal.json"), "utf8"),
  );
  assert.ok(journal.ok);
  assert.equal(journal.value.target, "svelte-library");
  assert.ok(
    validateJournalTargets(journal.value, {
      uiDir: f.config.uiDir,
      stylesDir: f.config.stylesDir,
      stateDir: f.paths.stateDir,
      configSchema: 2,
      target: "svelte-library",
      styleEntry: f.config.styleEntry,
    }).ok,
  );
  assert.equal(
    validateJournalTargets(journal.value, {
      uiDir: f.config.uiDir,
      stylesDir: f.config.stylesDir,
      stateDir: f.paths.stateDir,
      configSchema: 2,
      target: "astro",
      layoutFile: f.config.styleEntry,
    }).ok,
    false,
  );
  // Explicit fixture operator confirms child death before clearing its orphaned writer.
  clearOrphanedWriterLock(f.project.root, f.paths.stateDir);
  const outcome = applyPlan(original.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome));
  assert.equal(
    JSON.parse(
      readFileSync(
        path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
        "utf8",
      ),
    ).target,
    "svelte-library",
  );
});

test("stale planned config refuses ordinary replacements while retaining honest write-attempt coordination", (t) => {
  const f = fixture(t, false);
  assert.ok(
    f.composed.targets.some((entry) => entry.path === "src/lib/_kit/kit.json"),
  );
  const original = validateApplyPlan(f.composed);
  assert.ok(original.ok);
  f.project.writeFile(
    "src/lib/_kit/kit.json",
    JSON.stringify({ ...f.config, styleEntry: "src/changed.css" }),
  );
  const before = snapshotTree(f.project.root);
  const outcome = applyPlan(original.value);
  assert.equal(outcome.kind, "refused");
  assert.ok(outcome.transactionId);
  const coordination = `${f.paths.stateDir}/.svelte-ui-kit`;
  const ordinary = (entries: ReturnType<typeof snapshotTree>) =>
    entries.filter(
      (entry) =>
        entry.path !== coordination &&
        !entry.path.startsWith(coordination + "/"),
    );
  assert.deepEqual(ordinary(snapshotTree(f.project.root)), ordinary(before));
  assert.equal(
    existsSync(path.join(f.project.root, f.paths.stateDir, "kit.lock.json")),
    false,
  );
});
