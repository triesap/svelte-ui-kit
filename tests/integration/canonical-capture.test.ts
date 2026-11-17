import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import path from "node:path";
import { createTempProject } from "../helpers/project.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { CONFIGURATION_MAX_BYTES } from "../../src/project/configuration-inputs.js";

test("automatic configuration capture refuses oversized bytes before opening and bounds a growing file", (t) => {
  const project = createTempProject();
  t.after(() => project.cleanup());
  project.writeFile(
    "package.json",
    JSON.stringify({ name: "bounded-capture", type: "module", private: true }),
  );
  project.writeFile(
    "svelte.config.ts",
    "x".repeat(2 * CONFIGURATION_MAX_BYTES),
  );
  const before = snapshotTree(project.root);
  const snapshotUrl = new URL("../../src/codegen/snapshot.js", import.meta.url)
    .href;
  const configurationUrl = new URL(
    "../../src/project/configuration-inputs.js",
    import.meta.url,
  ).href;
  const file = path.join(project.root, "svelte.config.ts");
  const script = `
    import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module';
    const file=${JSON.stringify(file)}, root=${JSON.stringify(project.root)};
    const originals={readFileSync:fs.readFileSync,openSync:fs.openSync,fstatSync:fs.fstatSync,readSync:fs.readSync};
    const watched=new Set(); let opens=0,fullReads=0,boundedBytes=0,spoofSize=false;
    fs.readFileSync=function(input,...args){if(input===file)fullReads++;return originals.readFileSync.call(this,input,...args)};
    fs.openSync=function(input,...args){const fd=originals.openSync.call(this,input,...args);if(input===file){opens++;watched.add(fd)}return fd};
    fs.fstatSync=function(fd,...args){const stats=originals.fstatSync.call(this,fd,...args);if(spoofSize&&watched.has(fd)){const changed=Object.create(stats);Object.defineProperty(changed,'size',{value:0});return changed}return stats};
    fs.readSync=function(fd,...args){const count=originals.readSync.call(this,fd,...args);if(watched.has(fd))boundedBytes+=count;return count};
    syncBuiltinESMExports();
    const {captureSnapshot}=await import(${JSON.stringify(snapshotUrl)});
    const result=captureSnapshot(root,[]),snapshotOpens=opens,snapshotReads=fullReads;
    const {readConfigurationBytes}=await import(${JSON.stringify(configurationUrl)});
    spoofSize=true; let growingCode=null;
    try{readConfigurationBytes(file)}catch(error){growingCode=error.code}
    console.log(JSON.stringify({result,snapshotOpens,snapshotReads,fullReads,boundedBytes,growingCode}));
  `;
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", script],
    {
      encoding: "utf8",
      timeout: 30000,
      killSignal: "SIGKILL",
    },
  );
  assert.equal(child.error, undefined, child.stdout + child.stderr);
  assert.equal(child.signal, null);
  assert.equal(child.status, 0, child.stdout + child.stderr);
  assert.equal(child.stderr, "");
  const proof = JSON.parse(child.stdout);
  assert.equal(proof.result.ok, false);
  assert.equal(proof.result.issues[0].code, "SNAPSHOT_CONFIGURATION_TOO_LARGE");
  assert.equal(proof.snapshotOpens, 0);
  assert.equal(proof.snapshotReads, 0);
  assert.equal(proof.fullReads, 0);
  assert.equal(proof.growingCode, "CONFIGURATION_TOO_LARGE");
  assert.equal(proof.boundedBytes, CONFIGURATION_MAX_BYTES + 1);
  assert.deepEqual(snapshotTree(project.root), before);
});
