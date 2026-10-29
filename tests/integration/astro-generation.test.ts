import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { spawnSync } from "node:child_process";
import { clearOrphanedWriterLock } from "../helpers/transactions.js";
import { appLockContext } from "../../src/project/app-config.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import { validateLockForPublication } from "../../src/codegen/publish-lock.js";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parseAppConfig } from "../../src/project/app-config.js";
import { deriveKitPaths } from "../../src/project/config.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { inspectAstroLayout } from "../../src/codegen/astro.js";
import {
  parseJournal,
  validateJournalTargets,
} from "../../src/codegen/transaction-journal.js";
import { inspectTargetEvidence } from "../../src/codegen/target-evidence.js";
import { linkQualifiedFixtureRuntime } from "../helpers/qualified-runtime.js";

function fixture(
  t: { after(fn: () => void): void },
  target: "astro" | "sveltekit" = "astro",
) {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({
      name: `${target}-app`,
      type: "module",
      private: true,
      packageManager: "pnpm@12.16.1",
      dependencies: {
        ...(target === "astro"
          ? { astro: "7.4.4", "@astrojs/svelte": "9.1.2" }
          : { "@sveltejs/kit": "2.70.3" }),
        svelte: "5.57.3",
      },
    }),
  );
  linkQualifiedFixtureRuntime(project, "dependencies");
  if (target === "astro")
    project.writeFile(
      "astro.config.ts",
      'import {defineConfig} from "astro/config";\nimport svelte from "@astrojs/svelte";\nexport default defineConfig({integrations:[svelte()]});\n',
    );
  const config = parseAppConfig(
    target === "astro"
      ? {
          schemaVersion: 2,
          target: "astro",
          layoutFile: "src/layouts/Layout.astro",
        }
      : { schemaVersion: 1 },
  );
  assert.ok(config.ok);
  const paths = deriveKitPaths(config.value);
  project.writeFile(`${paths.stateDir}/kit.json`, JSON.stringify(config.value));
  return {
    project,
    ...composeGenerationFoundation(project.root, process.cwd(), config.value),
  };
}

test("Astro generates a genuine native layout and target-bound v2 semantic lock without Kit", (t) => {
  const f = fixture(t);
  const valid = validateApplyPlan(f.composed);
  assert.ok(valid.ok, JSON.stringify(valid));
  const outcome = applyPlan(valid.value);
  assert.equal(outcome.kind, "applied", JSON.stringify(outcome));
  const layout = readFileSync(
    path.join(f.project.root, f.config.layoutFile),
    "utf8",
  );
  const parsed = inspectAstroLayout(layout);
  assert.ok(parsed.ok);
  assert.equal(parsed.value.rendersContent, true);
  assert.equal(parsed.value.imports.length, 3);
  const lock = JSON.parse(
    readFileSync(
      path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
      "utf8",
    ),
  );
  assert.equal(lock.schemaVersion, 2);
  assert.equal(lock.target, "astro");
  assert.equal(
    lock.integrations.find((entry: { kind: string }) => entry.kind === "layout")
      .contract,
    "astro-layout-v1",
  );
  const manifest = JSON.parse(
    readFileSync(path.join(f.project.root, "package.json"), "utf8"),
  );
  assert.equal(manifest.dependencies["@sveltejs/kit"], undefined);
});

test("a new competing Astro config after original planning refuses before coordination and preserves every entry", (t) => {
  const f = fixture(t);
  const valid = validateApplyPlan(f.composed);
  assert.ok(valid.ok);
  f.project.writeFile(
    "astro.config.mjs",
    "throw new Error('never execute');\n",
  );
  const before = snapshotTree(f.project.root);
  const outcome = applyPlan(valid.value);
  assert.equal(outcome.kind, "refused");
  assert.equal(outcome.transactionId, null);
  assert.deepEqual(snapshotTree(f.project.root), before);
});

test("target decisions remain attached to original bytes and cannot be reinterpreted through a changed target marker", (t) => {
  const f = fixture(t);
  f.project.writeFile("astro.config.ts", "export default dynamic();\n");
  assert.ok(inspectTargetEvidence(f.snapshot, f.config).ok);
  const before = snapshotTree(f.project.root);
  assert.equal(
    validateApplyPlan({ ...f.composed, target: "sveltekit" }).ok,
    false,
  );
  assert.equal(
    validateApplyPlan({
      ...f.composed,
      configSchema: undefined,
      target: undefined,
    }).ok,
    false,
  );
  assert.deepEqual(snapshotTree(f.project.root), before);
});

test("Astro recovery requires a v2 journal with the same explicit target and exact file role", () => {
  const base = {
    schemaVersion: 2,
    target: "astro",
    transactionId: "11111111-1111-4111-8111-111111111111",
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [],
    lock: null,
  };
  const parsed = parseJournal(JSON.stringify(base));
  assert.ok(parsed.ok, JSON.stringify(parsed));
  const roots = {
    uiDir: "src/ui",
    stylesDir: "src/styles",
    layoutFile: "src/Layout.astro",
    stateDir: "src/ui/_kit",
    configSchema: 2 as const,
    target: "astro" as const,
  };
  assert.ok(validateJournalTargets(parsed.value, roots).ok);
  assert.equal(
    validateJournalTargets(parsed.value, { ...roots, target: "sveltekit" }).ok,
    false,
  );
  const legacy = parseJournal(JSON.stringify({ ...base, schemaVersion: 1 }));
  assert.equal(legacy.ok, false);
  const { target: unused, ...old } = base;
  assert.equal(unused, "astro");
  const oldJournal = parseJournal(JSON.stringify({ ...old, schemaVersion: 1 }));
  assert.ok(oldJournal.ok);
  assert.equal(validateJournalTargets(oldJournal.value, roots).ok, false);
});

test("mapped locks cannot silently adopt or downgrade configuration schemas and publication checks the journal target", (t) => {
  const f = fixture(t),
    lock = JSON.parse(new TextDecoder().decode(f.composed.lock.bytes));
  const context = {
    ...f.config,
    stateDir: f.paths.stateDir,
    ...appLockContext(f.config),
  };
  assert.ok(parseKitLock(lock, "kit.lock.json", context).ok);
  const kit = {
    ...lock,
    target: "sveltekit",
    integrations: lock.integrations.map((entry: { kind: string }) =>
      entry.kind === "layout"
        ? { ...entry, path: "src/routes/+layout.svelte", contract: "layout-v1" }
        : entry,
    ),
  };
  assert.ok(parseKitLock(kit).ok);
  assert.equal(
    parseKitLock(kit, "kit.lock.json", {
      stateDir: f.paths.stateDir,
      configSchema: 1,
      target: "sveltekit",
    }).ok,
    false,
  );
  const { target: ignored, ...v1 } = kit;
  assert.equal(ignored, "sveltekit");
  v1.schemaVersion = 1;
  assert.ok(parseKitLock(v1).ok);
  assert.equal(
    parseKitLock(v1, "kit.lock.json", {
      stateDir: f.paths.stateDir,
      configSchema: 2,
      target: "sveltekit",
    }).ok,
    false,
  );
  const parsed = parseJournal(
    JSON.stringify({
      schemaVersion: 2,
      target: "astro",
      transactionId: "11111111-1111-4111-8111-111111111111",
      rootIdentity: "a".repeat(64),
      planDigest: "b".repeat(64),
      phase: "applied",
      operations: [],
      lock: null,
    }),
  );
  assert.ok(parsed.ok);
  assert.equal(
    validateLockForPublication(
      parsed.value,
      f.composed.lock.bytes,
      f.paths.stateDir,
      context,
    ).ok,
    true,
  );
  const { target: removed, ...old } = parsed.value;
  assert.equal(removed, "astro");
  const mismatched = validateLockForPublication(
    { ...old, schemaVersion: 1 },
    f.composed.lock.bytes,
    f.paths.stateDir,
    context,
  );
  assert.equal(mismatched.ok, false);
  assert.ok(
    mismatched.issues.some(
      (issue) => issue.code === "LOCK_JOURNAL_TARGET_MISMATCH",
    ),
  );
});

for (const target of ["astro", "sveltekit"] as const)
  test(`original ${target} apply safely recovers genuine SIGKILL target and ancestor changes before preimage checks`, (t) => {
    const f = fixture(t, target),
      sealed = validateApplyPlan(f.composed);
    assert.ok(sealed.ok);
    const helper = new URL("../helpers/generation-project.js", import.meta.url)
      .href;
    const apply = new URL("../../src/codegen/apply.js", import.meta.url).href;
    const childEnvironment = { ...process.env };
    for (const key of ["NODE_TEST_CONTEXT", "NODE_OPTIONS", "NODE_V8_COVERAGE"])
      delete childEnvironment[key];
    const script = `import {composeGenerationFoundation} from ${JSON.stringify(helper)}; import {validateApplyPlan,applyPlan} from ${JSON.stringify(apply)}; const prepared=composeGenerationFoundation(process.env.OWNED_APP_ROOT,process.env.OWNED_REGISTRY_ROOT,JSON.parse(process.env.OWNED_APP_CONFIG)); const validated=validateApplyPlan(prepared.composed); if(!validated.ok)throw new Error(JSON.stringify(validated)); applyPlan(validated.value,{after:(boundary,detail)=>{if(boundary==='replace:apply' && detail===prepared.integration.path){console.log('owned interrupted pid '+process.pid);process.kill(process.pid,'SIGKILL');}}});process.exit(9);`;
    const killed = spawnSync(
      process.execPath,
      ["--input-type=module", "--eval", script],
      {
        cwd: process.cwd(),
        env: {
          ...childEnvironment,
          OWNED_APP_ROOT: f.project.root,
          OWNED_REGISTRY_ROOT: process.cwd(),
          OWNED_APP_CONFIG: JSON.stringify(f.config),
        },
        encoding: "utf8",
        timeout: 30000,
      },
    );
    assert.equal(killed.error, undefined);
    assert.equal(killed.signal, "SIGKILL", killed.stdout + killed.stderr);
    assert.equal(killed.status, null);
    assert.ok(killed.pid > 0);
    assert.notEqual(killed.pid, process.pid);
    assert.ok(
      readFileSync(
        path.join(f.project.root, f.config.layoutFile),
        "utf8",
      ).includes(target === "astro" ? "<slot />" : "{@render children()}"),
    );
    // Explicit fixture-operator release follows confirmed death of its owned PID;
    // journal/backups/stages remain intact for the production recovery path.
    clearOrphanedWriterLock(f.project.root, f.paths.stateDir);
    const resumed = applyPlan(sealed.value);
    assert.equal(resumed.kind, "applied", JSON.stringify(resumed));
    const lock = JSON.parse(
      readFileSync(
        path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
        "utf8",
      ),
    );
    assert.equal(lock.target, target === "astro" ? "astro" : undefined);
    assert.equal(lock.schemaVersion, target === "astro" ? 2 : 1);
  });
