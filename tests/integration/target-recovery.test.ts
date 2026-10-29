import assert from "node:assert/strict";
import { spawn, spawnSync, type SpawnSyncReturns } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, test } from "node:test";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { inspectTransactions } from "../../src/codegen/recovery.js";
import { copyIntegrationFields } from "../../src/project/integration-fields.js";
import { readWriterLock } from "../../src/codegen/write-lock.js";
import {
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import { generationFixture } from "../helpers/generation-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { sha256Hex } from "../../src/codegen/digest.js";

type Fixture = ReturnType<typeof generationFixture>;
const records: unknown[] = [];
const report = path.join(
  process.cwd(),
  ".artifacts/verification",
  `target-recovery-${randomUUID()}.json`,
);
after(() => {
  mkdirSync(path.dirname(report), { recursive: true });
  writeFileSync(report, JSON.stringify({ records }, null, 2) + "\n");
});
const worker = `
import fs from 'node:fs'; import path from 'node:path';
import {composeGenerationFoundation} from ${JSON.stringify(new URL("../helpers/generation-project.js", import.meta.url).href)};
import {applyPlan,validateApplyPlan} from ${JSON.stringify(new URL("../../src/codegen/apply.js", import.meta.url).href)};
import {recoverTransactions} from ${JSON.stringify(new URL("../../src/codegen/recovery.js", import.meta.url).href)};
const o=JSON.parse(process.env.OWNED_GENERATION_OPTIONS), config=o.config;
const base=path.join(o.root,o.stateDir,'.svelte-ui-kit','transactions');
function journals(){return fs.existsSync(base)?fs.readdirSync(base).map(id=>{const p=path.join(base,id,'journal.json');return fs.existsSync(p)?JSON.parse(fs.readFileSync(p,'utf8')):null}):[]}
const hooks={[o.event]:(boundary,detail)=>{
 if(boundary!==o.boundary || (o.primaryOnly && detail!==o.primary))return;
 const captured=journals();if(o.phase && !captured.some(j=>j?.phase===o.phase))return;
 console.log('OWNED_GENERATION '+JSON.stringify({pid:process.pid,boundary,event:o.event,detail,journals:captured}));
 if(o.hold)Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,30000);else process.kill(process.pid,'SIGKILL');
}};
if(o.recovery){console.log(JSON.stringify(recoverTransactions(o.root,o.stateDir,o.roots,hooks)));}
else {const p=composeGenerationFoundation(o.root,o.owner,config);const s=validateApplyPlan(p.composed);if(!s.ok)throw Error(JSON.stringify(s));console.log(JSON.stringify(applyPlan(s.value,hooks)));}
process.exit(9);
`;
function roots(f: Fixture) {
  return {
    uiDir: f.config.uiDir,
    stylesDir: f.config.stylesDir,
    ...copyIntegrationFields(f.composed),
  };
}
function options(f: Fixture, boundary: string, extra: object = {}) {
  return {
    root: f.project.root,
    owner: f.owner,
    config: f.config,
    stateDir: f.paths.stateDir,
    primary: f.integration.path,
    roots: roots(f),
    boundary,
    event: "after",
    ...extra,
  };
}
function env(options: object) {
  const e: NodeJS.ProcessEnv = {
    ...process.env,
    OWNED_GENERATION_OPTIONS: JSON.stringify(options),
  };
  for (const name of ["NODE_OPTIONS", "NODE_TEST_CONTEXT", "NODE_V8_COVERAGE"])
    delete e[name as keyof typeof e];
  return e;
}
function kill(f: Fixture, boundary: string, extra: object = {}) {
  const child = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", worker],
    { env: env(options(f, boundary, extra)), encoding: "utf8", timeout: 30000 },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.signal, "SIGKILL", child.stdout + child.stderr);
  assert.equal(child.status, null);
  const row = child.stdout
    .split("\n")
    .find((line) => line.startsWith("OWNED_GENERATION "));
  assert.ok(row, child.stdout + child.stderr);
  const witness = JSON.parse(row.slice("OWNED_GENERATION ".length));
  assert.equal(witness.pid, child.pid);
  assert.notEqual(child.pid, process.pid);
  assert.throws(() => process.kill(child.pid, 0), { code: "ESRCH" });
  records.push({ target: f.config.target, ...witness });
  return child;
}
function quarantine(
  t: { after(fn: () => void): void },
  f: Fixture,
  child: Pick<SpawnSyncReturns<string>, "pid">,
) {
  const writer = readWriterLock(f.project.root, f.paths.stateDir);
  assert.equal(writer.kind, "held");
  assert.equal(writer.owner?.pid, child.pid);
  assert.throws(() => process.kill(child.pid, 0), { code: "ESRCH" });
  const destination = mkdtempSync(
    path.join(os.tmpdir(), "suik-confirmed-writer-"),
  );
  t.after(() => rmSync(destination, { recursive: true, force: true }));
  // Only this confirmed dead owned writer is moved. Every transaction survives.
  renameSync(
    path.join(f.project.root, writerLockDir(f.paths.stateDir)),
    path.join(destination, "writer.lock"),
  );
}
function sealed(f: Fixture) {
  const result = validateApplyPlan(f.composed);
  assert.ok(result.ok, JSON.stringify(result));
  return result.value;
}
function cli(f: Fixture, args: string[]) {
  const child = spawnSync(
    process.execPath,
    [path.join(f.owner, "dist/cli/main.js"), "--cwd", f.project.root, ...args],
    { encoding: "utf8", timeout: 30000 },
  );
  assert.equal(child.error, undefined);
  assert.equal(child.signal, null);
  return child;
}
const phases = [
  { boundary: "durability:stage", category: "unprepared" },
  { boundary: "journal:fsync", phase: "prepared", category: "rollback" },
  { boundary: "backup:move", primaryOnly: true, category: "rollback" },
  { boundary: "durability:backup", primaryOnly: true, category: "rollback" },
  { boundary: "replace:apply", primaryOnly: true, category: "rollback" },
  { boundary: "durability:replace", primaryOnly: true, category: "rollback" },
  { boundary: "progress:persist", primaryOnly: true, category: "rollback" },
  { boundary: "journal:fsync", phase: "applied", category: "rollback" },
  { boundary: "lock:stage", category: "ambiguous" },
  { boundary: "durability:lock-stage", category: "ambiguous" },
  { boundary: "lock:publish", event: "before", category: "rollback" },
  { boundary: "lock:publish", category: "committed" },
  { boundary: "durability:lock-publish", category: "committed" },
  { boundary: "journal:fsync", phase: "published", category: "committed" },
  { boundary: "cleanup:journal", event: "before", category: "committed" },
  { boundary: "cleanup:journal", category: "committed" },
] as const;
for (const target of ["astro", "svelte-library"] as const) {
  for (const phase of phases)
    test(`${target}: real ${"event" in phase ? phase.event : "after"} ${phase.boundary} ${"phase" in phase ? phase.phase : ""} preserves original-plan recovery`, (t) => {
      const f = generationFixture(t, target),
        plan = sealed(f);
      const originalPrimary = readFileSync(
        path.join(f.project.root, f.integration.path),
      );
      const originalStat = statSync(
        path.join(f.project.root, f.integration.path),
      );
      const child = kill(f, phase.boundary, phase);
      const interrupted = snapshotTree(f.project.root);
      const busy = applyPlan(plan);
      assert.equal(busy.kind, "refused");
      assert.ok(busy.issues.some((i) => i.code === "WRITER_BUSY"));
      assert.deepEqual(snapshotTree(f.project.root), interrupted);
      quarantine(t, f, child);
      const lockPath = path.join(
        f.project.root,
        f.paths.stateDir,
        "kit.lock.json",
      );
      const published = phase.category === "committed";
      assert.equal(existsSync(lockPath), published, "semantic lock is last");
      const beforeRetry = snapshotTree(f.project.root);
      if (published && phase.boundary === "lock:publish") {
        for (const args of [
          ["info"],
          ["doctor"],
          ["init", "--dry-run"],
          ["sync", "--dry-run"],
          ["init"],
          ["sync"],
        ]) {
          const result = cli(f, args);
          if (args.length === 1 && (args[0] === "init" || args[0] === "sync")) {
            assert.notEqual(result.status, 0);
            assert.match(result.stdout + result.stderr, /RECOVERY_PENDING/);
          }
          assert.deepEqual(
            snapshotTree(f.project.root),
            beforeRetry,
            args.join(" "),
          );
        }
      }
      let restored = false;
      const outcome = applyPlan(plan, {
        before(boundary) {
          if (
            phase.category === "rollback" &&
            boundary === "stage:write" &&
            !restored
          ) {
            assert.deepEqual(
              readFileSync(path.join(f.project.root, f.integration.path)),
              originalPrimary,
            );
            const stat = statSync(
              path.join(f.project.root, f.integration.path),
            );
            assert.equal(stat.mode, originalStat.mode);
            assert.equal(stat.ino, originalStat.ino);
            restored = true;
          }
        },
      });
      if (phase.category === "unprepared" || phase.category === "ambiguous") {
        assert.equal(outcome.kind, "refused");
        assert.deepEqual(snapshotTree(f.project.root), beforeRetry);
        if (phase.category === "ambiguous")
          assert.ok(
            outcome.issues.some(
              (i) => i.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
            ),
          );
        for (const args of [
          ["info"],
          ["doctor"],
          ["init", "--dry-run"],
          ["sync", "--dry-run"],
          ["init"],
        ]) {
          cli(f, args);
          assert.deepEqual(
            snapshotTree(f.project.root),
            beforeRetry,
            args.join(" "),
          );
        }
      } else if (published) {
        assert.ok(
          outcome.kind === "refused" || outcome.kind === "no_change",
          JSON.stringify(outcome),
        );
        if (outcome.kind === "refused")
          assert.ok(
            outcome.issues.some((i) => i.code === "STALE_PLAN"),
            JSON.stringify(outcome),
          );
        assert.equal(
          sha256Hex(readFileSync(lockPath)),
          sha256Hex(plan.lock.bytes),
        );
        assert.notDeepEqual(
          readFileSync(path.join(f.project.root, f.integration.path)),
          originalPrimary,
        );
        assert.deepEqual(
          inspectTransactions(f.project.root, f.paths.stateDir, roots(f)),
          [],
        );
        assert.equal(cli(f, ["sync"]).status, 0);
      } else {
        assert.equal(outcome.kind, "applied", JSON.stringify(outcome));
        assert.equal(restored, true);
        assert.equal(
          sha256Hex(readFileSync(lockPath)),
          sha256Hex(plan.lock.bytes),
        );
      }
      records.push({
        target,
        phase,
        outcome: outcome.kind,
        issues: outcome.issues,
        restored,
        primarySha256: sha256Hex(
          readFileSync(path.join(f.project.root, f.integration.path)),
        ),
        lockLast: true,
      });
    });
  for (const edit of [
    "bytes",
    "mode",
    "corrupt-journal",
    "foreign-target",
  ] as const)
    test(`${target}: ${edit} after real crash refuses without changing any evidence`, (t) => {
      const f = generationFixture(t, target, true),
        plan = sealed(f);
      const child = kill(f, "replace:apply", { primaryOnly: true });
      quarantine(t, f, child);
      const primary = path.join(f.project.root, f.integration.path);
      const journalRoot = path.join(
        f.project.root,
        transactionsDir(f.paths.stateDir),
      );
      const journal = path.join(
        journalRoot,
        readdirSync(journalRoot)[0]!,
        "journal.json",
      );
      if (edit === "bytes")
        writeFileSync(primary, "operator post-crash edits\n");
      if (edit === "mode") chmodSync(primary, 0o600);
      if (edit === "corrupt-journal") writeFileSync(journal, "{incomplete");
      if (edit === "foreign-target") {
        const data = JSON.parse(readFileSync(journal, "utf8"));
        data.target = target === "astro" ? "svelte-library" : "astro";
        writeFileSync(journal, JSON.stringify(data));
      }
      const before = snapshotTree(f.project.root);
      const result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.deepEqual(snapshotTree(f.project.root), before);
      for (const args of [
        ["info"],
        ["doctor"],
        ["init", "--dry-run"],
        ["sync", "--dry-run"],
        ["init"],
      ]) {
        cli(f, args);
        assert.deepEqual(snapshotTree(f.project.root), before, args.join(" "));
      }
    });
  for (const committed of [false, true])
    test(`${target}: a second real kill during ${committed ? "committed cleanup" : "rollback restore"} retains safe restart`, (t) => {
      const f = generationFixture(t, target),
        plan = sealed(f);
      const first = kill(f, committed ? "lock:publish" : "replace:apply", {
        primaryOnly: !committed,
      });
      quarantine(t, f, first);
      const second = kill(
        f,
        committed ? "recovery:cleanup" : "recovery:restore",
        {
          recovery: true,
          event: committed ? "before" : "after",
          primaryOnly: !committed,
        },
      );
      quarantine(t, f, second);
      const result = applyPlan(plan);
      assert.equal(
        result.kind,
        committed ? "refused" : "applied",
        JSON.stringify(result),
      );
      assert.equal(
        sha256Hex(
          readFileSync(
            path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
          ),
        ),
        sha256Hex(plan.lock.bytes),
      );
    });
  test(`${target}: an actual live writer remains exclusive and is never reclaimed`, async (t) => {
    const f = generationFixture(t, target),
      plan = sealed(f);
    const child = spawn(
      process.execPath,
      ["--input-type=module", "--eval", worker],
      {
        env: env(
          options(f, "journal:fsync", { phase: "prepared", hold: true }),
        ),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    const exited = new Promise((resolve) =>
      child.once("close", (code, signal) => resolve({ code, signal })),
    );
    t.after(async () => {
      if (child.exitCode === null && child.signalCode === null)
        child.kill("SIGKILL");
      await exited;
    });
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(
        () => reject(new Error("owned writer did not reach prepared")),
        15000,
      );
      child.stdout.on("data", (data) => {
        if (String(data).includes("OWNED_GENERATION ")) {
          clearTimeout(timeout);
          resolve();
        }
      });
      child.once("error", reject);
    });
    assert.ok(child.pid);
    assert.doesNotThrow(() => process.kill(child.pid!, 0));
    const before = snapshotTree(f.project.root),
      result = applyPlan(plan);
    assert.equal(result.kind, "refused");
    assert.ok(result.issues.some((i) => i.code === "WRITER_BUSY"));
    assert.deepEqual(snapshotTree(f.project.root), before);
    child.kill("SIGKILL");
    await exited;
    assert.throws(() => process.kill(child.pid!, 0), { code: "ESRCH" });
    quarantine(t, f, { pid: child.pid });
    assert.equal(applyPlan(plan).kind, "applied");
  });
  for (const input of [
    "manifest",
    "target-config",
    "framework-config",
    "catalog",
    "native-archive",
    "installed-manifest",
    "primary-bytes",
    "primary-mode",
    "primary-inode",
    "primary-symlink",
  ] as const)
    test(`${target}: changed ${input} cannot reuse captured write authority`, (t) => {
      const f = generationFixture(t, target),
        plan = sealed(f);
      const append = (p: string) =>
        writeFileSync(
          path.join(f.project.root, p),
          readFileSync(path.join(f.project.root, p)).toString() + "\n",
        );
      if (input === "manifest") append("package.json");
      if (input === "target-config") append(`${f.paths.stateDir}/kit.json`);
      if (input === "framework-config")
        f.project.writeFile(
          target === "astro" ? "astro.config.ts" : "svelte.config.ts",
          "export default {};\n",
        );
      if (input === "catalog") append("pnpm-workspace.yaml");
      if (input === "native-archive") append("vendor/native.tgz");
      if (input === "installed-manifest")
        append("node_modules/svelte/package.json");
      if (input === "primary-bytes") append(f.integration.path);
      if (input === "primary-mode")
        chmodSync(path.join(f.project.root, f.integration.path), 0o600);
      if (input === "primary-inode" || input === "primary-symlink") {
        const primary = path.join(f.project.root, f.integration.path),
          retained = primary + ".operator-original";
        renameSync(primary, retained);
        if (input === "primary-inode")
          writeFileSync(primary, readFileSync(retained));
        else symlinkSync(path.basename(retained), primary);
      }
      const before = snapshotTree(f.project.root),
        result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.deepEqual(snapshotTree(f.project.root), before);
    });
  for (const boundary of ["durability:stage", "lock:publish"] as const)
    for (const input of [
      "package.json",
      "pnpm-workspace.yaml",
      "vendor/native.tgz",
    ] as const)
      test(`${target}: late ${input} drift at ${boundary} preserves the edit and refuses publication`, (t) => {
        const f = generationFixture(t, target),
          plan = sealed(f),
          before = snapshotTree(f.project.root);
        const bytes = Buffer.concat([
          readFileSync(path.join(f.project.root, input)),
          Buffer.from("\n"),
        ]);
        let changed = false;
        const mutate = (candidate: string) => {
          if (candidate === boundary && !changed) {
            writeFileSync(path.join(f.project.root, input), bytes);
            changed = true;
          }
        };
        const result = applyPlan(
          plan,
          boundary === "lock:publish" ? { before: mutate } : { after: mutate },
        );
        assert.equal(changed, true);
        assert.equal(result.kind, "refused", JSON.stringify(result));
        assert.equal(
          existsSync(
            path.join(f.project.root, f.paths.stateDir, "kit.lock.json"),
          ),
          false,
        );
        const expected = before.map((entry) =>
          entry.path === input
            ? { ...entry, size: bytes.length, sha256: sha256Hex(bytes) }
            : entry,
        );
        assert.deepEqual(snapshotTree(f.project.root), expected);
      });
  test(`${target}: customized retirement stays detached and every clean read/dry/no-change preserves hidden bytes modes and links`, (t) => {
    const f = generationFixture(t, target, true);
    assert.equal(applyPlan(sealed(f)).kind, "applied");
    assert.equal(cli(f, ["add", "button"]).status, 0);
    const source = `${f.config.uiDir}/button.svelte`;
    const original = readFileSync(path.join(f.project.root, source), "utf8");
    f.project.writeFile(
      source,
      original + "\n<!-- application customization -->\n",
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
      const result = cli(f, args);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(snapshotTree(f.project.root), before, args.join(" "));
    }
    const intent = JSON.parse(
      readFileSync(
        path.join(f.project.root, f.paths.stateDir, "kit.json"),
        "utf8",
      ),
    );
    intent.requested = [];
    f.project.writeFile(
      `${f.paths.stateDir}/kit.json`,
      JSON.stringify(intent, null, 2) + "\n",
    );
    const retired = cli(f, ["sync"]);
    assert.equal(retired.status, 0, retired.stdout + retired.stderr);
    assert.equal(
      readFileSync(path.join(f.project.root, source), "utf8"),
      original + "\n<!-- application customization -->\n",
    );
    const detached = snapshotTree(f.project.root);
    const reacquire = cli(f, ["add", "button"]);
    assert.notEqual(reacquire.status, 0);
    assert.deepEqual(snapshotTree(f.project.root), detached);
  });
}
