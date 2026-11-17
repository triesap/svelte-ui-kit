import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { validateApplyPlan } from "../../src/transactions/apply.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { recoverTransactions } from "../../src/transactions/recovery.js";
import { writerLockDir } from "../../src/transactions/types.js";
import { readWriterLock } from "../../src/transactions/write-lock.js";
import { serializeKitConfig } from "../../src/project/config.js";
import { copyIntegrationFields } from "../../src/project/integration-fields.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import { composeGenerationFoundation } from "../helpers/generation-project.js";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
const directory = path.resolve(".artifacts/verification/canonical-v1");
mkdirSync(directory, { recursive: true });
const reportPath = path.join(
  directory,
  `scv-07-config-process-${process.pid}-${Date.now()}.json`,
);
const records: Record<string, unknown>[] = [];
const save = () =>
  writeFileSync(
    reportPath,
    JSON.stringify({ node: process.versions.node, records }, null, 2) + "\n",
  );
const worker = `
import fs from 'node:fs'; import path from 'node:path';
import {composeGenerationFoundation} from ${JSON.stringify(new URL("../helpers/generation-project.js", import.meta.url).href)};
import {applyPlan,validateApplyPlan} from ${JSON.stringify(new URL("../../src/transactions/apply.js", import.meta.url).href)};
import {recoverTransactions} from ${JSON.stringify(new URL("../../src/transactions/recovery.js", import.meta.url).href)};
const o=JSON.parse(process.env.OWNED_CONFIG_OPTIONS);
if(o.recovery){console.log(JSON.stringify({pid:process.pid,results:recoverTransactions(o.root,o.stateDir,o.roots)}));}
else {
 const p=composeGenerationFoundation(o.root,o.owner,o.config);
 const configTarget=p.composed.targets.find(row=>row.path===o.configPath);
 if(configTarget?.operation!=='update')throw Error('Expected real config update');
 const checked=validateApplyPlan(p.composed);if(!checked.ok)throw Error(JSON.stringify(checked));
 const hooks={[o.event]:(boundary,detail)=>{
  if(boundary!==o.boundary || (boundary==='replace:apply' && detail!==o.configPath))return;
  const configFile=path.join(o.root,o.configPath),lockFile=path.join(o.root,o.stateDir,'kit.lock.json');
  console.log(JSON.stringify({pid:process.pid,boundary,event:o.event,detail,configTarget:configTarget.operation,config:fs.existsSync(configFile)?fs.readFileSync(configFile,'utf8'):null,lock:fs.existsSync(lockFile)?JSON.parse(fs.readFileSync(lockFile,'utf8')):null}));
  process.kill(process.pid,'SIGKILL');
 }};
 console.log(JSON.stringify(applyPlan(checked.value,hooks)));process.exitCode=9;
}
`;
for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const phase of [
    { event: "before", boundary: "replace:apply" },
    { event: "after", boundary: "replace:apply" },
    { event: "after", boundary: "lock:publish" },
  ] as const)
    test(`${target}: actual config update ${phase.event} ${phase.boundary} survives independent restart`, (t) => {
      let passed = false;
      const base = generationFixture(t, target, true, () => passed),
        quarantine = createTempProject();
      t.after(() => {
        if (passed) quarantine.cleanup();
        else
          console.error(
            `Retained owned dead writer quarantine: ${quarantine.root}`,
          );
      });
      const configPath = `${base.paths.stateDir}/kit.json`,
        absolute = path.join(base.project.root, configPath);
      const canonical = serializeKitConfig(base.config),
        original = `\n  ${canonical}\n`;
      writeFileSync(absolute, original);
      const f = {
        ...base,
        ...composeGenerationFoundation(
          base.project.root,
          base.owner,
          base.config,
        ),
      };
      const checked = validateApplyPlan(f.composed);
      assert.ok(checked.ok, JSON.stringify(checked));
      const update = f.composed.targets.find((row) => row.path === configPath);
      assert.equal(update?.operation, "update");
      assert.equal(new TextDecoder().decode(update!.bytes), canonical);
      const originalIdentity = statSync(absolute),
        before = snapshotTree(f.project.root);
      const roots = {
        uiDir: f.config.uiDir,
        stylesDir: f.config.stylesDir,
        ...copyIntegrationFields(f.composed),
      };
      const options = {
        root: f.project.root,
        owner: f.owner,
        config: f.config,
        stateDir: f.paths.stateDir,
        configPath,
        roots,
        ...phase,
      };
      const entry: Record<string, unknown> = {
        target,
        phase,
        root: f.project.root,
        before,
        status: "running",
        commands: [],
      };
      records.push(entry);
      save();
      const run = (recovery: boolean) => {
        const env: NodeJS.ProcessEnv = {
          ...process.env,
          OWNED_CONFIG_OPTIONS: JSON.stringify({ ...options, recovery }),
        };
        for (const name of [
          "NODE_OPTIONS",
          "NODE_TEST_CONTEXT",
          "NODE_V8_COVERAGE",
        ])
          delete env[name];
        const started = Date.now(),
          child = spawnSync(
            process.execPath,
            ["--input-type=module", "--eval", worker],
            { env, encoding: "utf8", timeout: 30000, killSignal: "SIGKILL" },
          );
        (entry.commands as unknown[]).push({
          recovery,
          pid: child.pid,
          elapsedMs: Date.now() - started,
          deadlineMs: 30000,
          status: child.status,
          signal: child.signal,
          error: child.error
            ? {
                message: child.error.message,
                code: (child.error as NodeJS.ErrnoException).code,
              }
            : null,
          stdout: child.stdout,
          stderr: child.stderr,
        });
        save();
        assert.equal(child.error, undefined);
        assert.equal(child.stderr, "");
        return child;
      };
      try {
        const killed = run(false);
        assert.equal(killed.signal, "SIGKILL");
        assert.equal(killed.status, null);
        assert.throws(() => process.kill(killed.pid, 0), { code: "ESRCH" });
        const witness = JSON.parse(killed.stdout.trim());
        assert.equal(witness.pid, killed.pid);
        assert.equal(witness.configTarget, "update");
        assert.equal(witness.boundary, phase.boundary);
        assert.equal(witness.event, phase.event);
        const published = phase.boundary === "lock:publish";
        assert.equal(
          existsSync(
            path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
          ),
          published,
        );
        if (published) {
          assert.equal(witness.config, canonical);
          assert.equal(witness.lock.configHash, sha256Hex(canonical));
        }
        const interrupted = snapshotTree(f.project.root),
          busy = recoverTransactions(f.project.root, f.paths.stateDir, roots);
        assert.ok(busy.every((row) => row.status === "refused"));
        assert.ok(
          busy.some((row) => row.issues.some((i) => i.code === "WRITER_BUSY")),
        );
        assert.deepEqual(snapshotTree(f.project.root), interrupted);
        const writer = readWriterLock(f.project.root, f.paths.stateDir);
        assert.equal(writer.kind, "held");
        assert.equal(writer.owner?.pid, killed.pid);
        renameSync(
          path.join(f.project.root, writerLockDir(f.paths.stateDir)),
          path.join(quarantine.root, "writer.lock"),
        );
        const restarted = run(true);
        assert.equal(restarted.status, 0);
        assert.equal(restarted.signal, null);
        const recovered = JSON.parse(restarted.stdout.trim());
        assert.equal(recovered.pid, restarted.pid);
        assert.notEqual(recovered.pid, killed.pid);
        assert.notEqual(recovered.pid, process.pid);
        assert.equal(recovered.results.length, 1);
        assert.equal(
          recovered.results[0].status,
          published ? "committed" : "rolled_back",
          restarted.stdout,
        );
        if (published) {
          assert.equal(readFileSync(absolute, "utf8"), canonical);
          const lock = JSON.parse(
            readFileSync(
              path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
              "utf8",
            ),
          );
          assert.equal(lock.configHash, sha256Hex(readFileSync(absolute)));
          assert.equal(
            readFileSync(path.join(f.project.root, ".operator-note"), "utf8"),
            "preserve hidden unrelated bytes\n",
          );
        } else {
          assert.deepEqual(snapshotTree(f.project.root), before);
          const restored = statSync(absolute);
          assert.equal(restored.dev, originalIdentity.dev);
          assert.equal(restored.ino, originalIdentity.ino);
          assert.equal(restored.mode, originalIdentity.mode);
          assert.equal(readFileSync(absolute, "utf8"), original);
        }
        passed = true;
      } finally {
        entry.status = passed ? "passed" : "failed";
        entry.after = snapshotTree(f.project.root);
        save();
      }
    });
