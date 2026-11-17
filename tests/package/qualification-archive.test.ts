import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { runtimeGuard, selectedArchive } from "../helpers/packaged-cli.js";
import { sha256Hex } from "../../src/codegen/digest.js";

test("qualification selection requires an absolute archive and its exact digest", (t) => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-archive-selection-"));
  t.after(() => rmSync(root, { recursive: true }));
  const archive = path.join(root, "candidate.tgz");
  const bytes = Buffer.from("owned archive selection fixture");
  writeFileSync(archive, bytes);
  const digest = sha256Hex(bytes);
  assert.equal(selectedArchive({}), null);
  assert.throws(() => selectedArchive({ SUIK_QUALIFICATION_ARCHIVE: archive }));
  assert.throws(() => selectedArchive({ SUIK_QUALIFICATION_SHA256: digest }));
  assert.throws(() =>
    selectedArchive({
      SUIK_QUALIFICATION_ARCHIVE: "relative.tgz",
      SUIK_QUALIFICATION_SHA256: digest,
    }),
  );
  assert.throws(
    () =>
      selectedArchive({
        SUIK_QUALIFICATION_ARCHIVE: archive,
        SUIK_QUALIFICATION_SHA256: "0".repeat(64),
      }),
    /digest mismatch/,
  );
  assert.deepEqual(
    selectedArchive({
      SUIK_QUALIFICATION_ARCHIVE: archive,
      SUIK_QUALIFICATION_SHA256: digest,
    }),
    { path: archive, sha256: digest },
  );
  writeFileSync(archive, "replacement");
  assert.throws(
    () =>
      selectedArchive({
        SUIK_QUALIFICATION_ARCHIVE: archive,
        SUIK_QUALIFICATION_SHA256: digest,
      }),
    /digest mismatch/,
  );
});

test("external framework metadata is absent while source bytes, network and subprocesses remain denied", (t) => {
  const root = mkdtempSync(
    path.join(os.tmpdir(), "suik-external-source-guard-"),
  );
  t.after(() => rmSync(root, { recursive: true }));
  const audit = path.join(root, "audit.jsonl"),
    guard = path.join(root, "guard.cjs");
  const actual = JSON.stringify(path.resolve("package.json"));
  writeFileSync(audit, "");
  writeFileSync(
    guard,
    runtimeGuard(process.cwd(), audit, null, false, [], true),
  );
  const code = `import fs from 'node:fs';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';
assert.throws(()=>fs.statSync(${actual}),{code:'ENOENT'});
let returned=false;await new Promise((resolve,reject)=>{fs.stat(${actual},e=>{try{assert.equal(returned,true);assert.equal(e.code,'ENOENT');resolve()}catch(failure){reject(failure)}});returned=true});
await assert.rejects(fs.promises.stat(${actual}),{code:'ENOENT'});
assert.equal(fs.existsSync(${actual}),false);
assert.equal(await new Promise(resolve=>fs.exists(${actual},resolve)),false);
assert.equal(fs.lstatSync(${actual},{throwIfNoEntry:false}),undefined);
assert.throws(()=>fs.readFileSync(${actual}),{code:'OWNED_AUTHORING_UNAVAILABLE'});
await assert.rejects(import(${JSON.stringify(path.resolve("dist/project/config.js"))}),{code:'OWNED_AUTHORING_UNAVAILABLE'});
assert.throws(()=>fetch('https://example.invalid/'),{code:'OWNED_NETWORK_DISABLED'});
assert.throws(()=>spawnSync(process.execPath,['--version']),{code:'OWNED_SUBPROCESS_DISABLED'});
console.log('six metadata absences; source/network/subprocess denied');`;
  const result = spawnSync(
    process.execPath,
    ["--require", guard, "--input-type=module", "--eval", code],
    { cwd: root, encoding: "utf8", timeout: 30_000, killSignal: "SIGKILL" },
  );
  assert.equal(result.error, undefined);
  assert.equal(result.signal, null);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.equal(result.stderr, "");
  const events = readFileSync(audit, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));
  assert.equal(events.length, 10);
  assert.ok(
    events
      .slice(0, 6)
      .every(
        (row) => row.kind === "unavailable-metadata" && row.code === "ENOENT",
      ),
  );
  assert.deepEqual(
    events.slice(6).map((row) => row.code),
    [
      "OWNED_AUTHORING_UNAVAILABLE",
      "OWNED_AUTHORING_UNAVAILABLE",
      "OWNED_NETWORK_DISABLED",
      "OWNED_SUBPROCESS_DISABLED",
    ],
  );
});
