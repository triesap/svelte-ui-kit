import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { sha256Hex } from "../../src/codegen/digest.js";
let cli: ReturnType<typeof installIndependentCli>;
before(() => {
  cli = installIndependentCli();
});
after(() => cli?.cleanup());

for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  test(`${target}: installed canonical lifecycle and real prepared recovery preserve target authority`, () => {
    const app = cli.prepareConsumer(false, "adoption", target);
    const root = app.root,
      state = app.paths.stateDir;
    const config = app.config;
    const configPath = path.join(root, state, "kit.json");
    if (target === "sveltekit")
      app.write(`${state}/kit.json`, JSON.stringify(config));
    const original = snapshotTree(root);
    const module = (name: string) =>
      pathToFileURL(path.join(cli.packageRoot, "dist", name)).href;
    // This worker loads only installed production modules. Source planner objects
    // never cross into the installed module's sealed authority registry.
    const worker = path.join(cli.root, `${target}-worker.mjs`);
    writeFileSync(
      worker,
      `
import fs from 'node:fs';import path from 'node:path';
const root=${JSON.stringify(root)}, pkg=${JSON.stringify(cli.packageRoot)}, config=${JSON.stringify(config)};
const {deriveKitPaths,generationInputPaths,initializationFields,integrationMapping}=await import(${JSON.stringify(module("project/config.js"))});
const {captureSnapshot,observedText}=await import(${JSON.stringify(module("codegen/snapshot.js"))});
const {planInit}=await import(${JSON.stringify(module("codegen/plan-init.js"))});
const {composeApplyPlan}=await import(${JSON.stringify(module("codegen/compose.js"))});
const {applyPlan,validateApplyPlan}=await import(${JSON.stringify(module("transactions/apply.js"))});
const {createAssetProvider}=await import(${JSON.stringify(module("registry/assets.js"))});
const {loadRegistrySnapshot}=await import(${JSON.stringify(module("registry/load.js"))});
const {sha256Hex}=await import(${JSON.stringify(module("codegen/digest.js"))});
const {recoverTransactions}=await import(${JSON.stringify(module("transactions/recovery.js"))});
const p=deriveKitPaths(config),integration=integrationMapping(config);
const roots={uiDir:config.uiDir,stylesDir:config.stylesDir,configSchema:1,target:config.target,...(config.target==='svelte-library'?{styleEntry:config.styleEntry}:{layoutFile:config.layoutFile})};
if(process.argv[2]==='recover'){console.log(JSON.stringify(recoverTransactions(root,p.stateDir,roots)));}
else {
const snapshot=captureSnapshot(root,[...generationInputPaths(),p.stateDir+'/kit.json',p.stateDir+'/kit.lock.json',p.rootExports,p.kitCss,p.themesCss,p.appCss,integration.path,'.gitignore']);
if(!snapshot.ok)throw Error(JSON.stringify(snapshot));
const registry=loadRegistrySnapshot(createAssetProvider(pkg));if(!registry.ok)throw Error(JSON.stringify(registry));
const planned=planInit({...initializationFields(config,observedText(snapshot.value.entries.get(integration.path))??''),snapshot:snapshot.value,registry:registry.value,configHash:sha256Hex(fs.readFileSync(path.join(root,p.stateDir,'kit.json')))});
if(!planned.ok)throw Error(JSON.stringify(planned));
const composed=composeApplyPlan({root,config,snapshot:snapshot.value,writes:planned.value.writes,exportAuthority:planned.value.exportAuthority});if(!composed.ok)throw Error(JSON.stringify(composed));
const sealed=validateApplyPlan(composed.value);if(!sealed.ok)throw Error(JSON.stringify(sealed));
const applied=applyPlan(sealed.value,{after(boundary){if(boundary!=='journal:fsync')return;const base=path.join(root,p.stateDir,'.svelte-ui-kit/transactions');for(const id of fs.readdirSync(base)){const j=JSON.parse(fs.readFileSync(path.join(base,id,'journal.json'),'utf8'));if(j.phase==='prepared'){fs.writeSync(1,JSON.stringify({pid:process.pid,id,target:j.target,phase:j.phase})+'\\n');process.kill(process.pid,'SIGKILL');}}}});
throw Error('prepared interruption not reached: '+JSON.stringify(applied));
}
`,
    );
    const killed = cli.runNode(
      [worker],
      root,
      `${target}-real-prepared-kill`,
      30_000,
      "SIGKILL",
    );
    assert.equal(killed.status, null);
    assert.equal(killed.stderr, "");
    assert.deepEqual(killed.guardEvents, []);
    const witness = JSON.parse(killed.stdout.trim());
    assert.equal(witness.pid, killed.pid);
    assert.equal(witness.target, target);
    assert.throws(() => process.kill(killed.pid, 0), { code: "ESRCH" });
    const pending = snapshotTree(root);
    const refused = cli.run(["init"], root);
    assert.notEqual(refused.status, 0);
    assert.equal(refused.stderr, "");
    assert.deepEqual(refused.guardEvents, []);
    assert.ok(
      JSON.parse(refused.stdout).diagnostics.some(
        (row: { code: string }) => row.code === "WRITER_BUSY",
      ),
    );
    assert.deepEqual(snapshotTree(root), pending);
    const writer = path.join(root, state, ".svelte-ui-kit/writer.lock");
    const owner = JSON.parse(
      readFileSync(path.join(writer, "owner.json"), "utf8"),
    );
    assert.equal(owner.pid, killed.pid);
    assert.equal(owner.transactionId, witness.id);
    const backup = path.join(cli.root, `${target}-interrupted-evidence`);
    cpSync(path.join(root, state), backup, { recursive: true });
    writeFileSync(
      path.join(cli.root, `${target}-interrupted-tree.json`),
      JSON.stringify(pending),
    );
    renameSync(writer, path.join(cli.root, `${target}-verified-dead-writer`));
    const recovered = cli.runNode(
      [worker, "recover"],
      root,
      `${target}-matching-target-recovery`,
    );
    assert.equal(recovered.status, 0, recovered.stderr);
    assert.equal(recovered.stderr, "");
    assert.deepEqual(recovered.guardEvents, []);
    assert.deepEqual(
      JSON.parse(recovered.stdout).map(
        (row: { status: string; issues: unknown[] }) => ({
          status: row.status,
          issues: row.issues,
        }),
      ),
      [{ status: "rolled_back", issues: [] }],
      recovered.stdout,
    );
    assert.deepEqual(snapshotTree(root), original);
    const run = (args: string[], expected = 0) => {
      const result = cli.run(args, root);
      assert.equal(result.status, expected, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      return JSON.parse(result.stdout);
    };
    for (const args of [
      ["info"],
      ["view", "button", "--source"],
      ["init", "--dry-run"],
    ]) {
      run(args);
      assert.deepEqual(snapshotTree(root), original);
    }
    run(["init"]);
    run(["add", "button"]);
    const lockPath = path.join(root, state, "kit.lock.json");
    const lock = () => JSON.parse(readFileSync(lockPath, "utf8"));
    assert.equal(lock().target, target);
    assert.equal(lock().schemaVersion, 1);
    assert.equal(lock().configHash, sha256Hex(readFileSync(configPath)));
    assert.equal(lock().integrations.length, 3);
    assert.deepEqual(
      lock()
        .integrations.map((row: { kind: string }) => row.kind)
        .sort(),
      [
        "exports",
        target === "svelte-library" ? "stylesheet-entry" : "layout",
        "stylesheet",
      ].sort(),
    );
    assert.deepEqual(lock().requested, ["button"]);
    let before = snapshotTree(root);
    for (const args of [
      ["doctor", "--strict"],
      ["sync", "--dry-run"],
      ["sync"],
      ["init"],
    ]) {
      run(args);
      assert.deepEqual(snapshotTree(root), before);
    }
    const button = `${config.uiDir}/button.svelte`;
    const customized =
      readFileSync(path.join(root, button), "utf8") +
      "\n<!-- application customization -->\n";
    app.write(button, customized);
    run(["sync"]);
    assert.notEqual(
      lock().files.find((f: { path: string }) => f.path === button).baseHash,
      sha256Hex(customized),
    );
    const desired = JSON.parse(readFileSync(configPath, "utf8"));
    desired.requested = [];
    writeFileSync(configPath, JSON.stringify(desired));
    before = snapshotTree(root);
    run(["sync", "--dry-run"]);
    assert.deepEqual(snapshotTree(root), before);
    run(["sync"]);
    assert.deepEqual(lock().requested, []);
    assert.equal(
      lock().files.some((f: { path: string }) => f.path === button),
      false,
    );
    assert.equal(readFileSync(path.join(root, button), "utf8"), customized);
    before = snapshotTree(root);
    run(["add", "button"], 10);
    assert.deepEqual(snapshotTree(root), before);
    const evidence = path.resolve(".artifacts/verification/canonical-v1");
    mkdirSync(evidence, { recursive: true });
    writeFileSync(
      path.join(evidence, `scv-11-${target}-${process.pid}.json`),
      JSON.stringify(
        {
          target,
          archive: cli.evidence,
          witness,
          recovery: JSON.parse(recovered.stdout),
          remainingTransactions: readdirSync(path.join(root, state)),
          status: "PASS",
        },
        null,
        2,
      ),
    );
  });
