import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmodSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import {
  compoundRegistry,
  CUSTOM_MULTI_ITEM_CONFIG,
} from "../helpers/multi-item-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import {
  transactionsDir,
  transientRoot,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";

const commands = [["init"], ["add", "button"], ["sync"]];
const id = "11111111-1111-4111-8111-111111111111";

function fixture(custom: boolean) {
  const f = cliPackage();
  const config = custom ? CUSTOM_MULTI_ITEM_CONFIG : DEFAULT_KIT_CONFIG;
  const paths = deriveKitPaths(config);
  if (custom)
    write(f.root, `${paths.stateDir}/kit.json`, JSON.stringify(config));
  write(f.root, "unrelated/keep.txt", "retain application work\n");
  for (const command of [["init"], ["add", "button"], ["sync"]]) {
    const result = f.run(command);
    assert.equal(result.status, 0, result.stdout + result.stderr);
  }
  for (const command of commands) {
    const result = f.run(command);
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(JSON.parse(result.stdout).status, "no_change", result.stdout);
  }
  return {
    ...f,
    run: (args: readonly string[]) =>
      spawnSync(
        process.execPath,
        [
          path.join(f.pkg, "dist/cli/main.js"),
          ...args,
          "--json",
          "--cwd",
          f.root,
        ],
        {
          cwd: f.root,
          encoding: "utf8",
          timeout: 30000,
          killSignal: "SIGKILL",
        },
      ),
    config,
    paths,
    namespace: transientRoot(paths.stateDir),
    tx: transactionsDir(paths.stateDir),
    writer: writerLockDir(paths.stateDir),
  };
}

function expect(
  f: ReturnType<typeof fixture>,
  code: string | null,
  status = code === null ? 0 : 1,
) {
  const before = snapshotTree(f.root);
  for (const command of commands)
    for (const dry of [false, true]) {
      const result = f.run([...command, ...(dry ? ["--dry-run"] : [])]);
      assert.equal(result.error, undefined);
      assert.equal(result.signal, null);
      assert.equal(result.status, status, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.status, code === null ? "no_change" : "error");
      assert.deepEqual(envelope.changes, []);
      if (code !== null) {
        const diagnostic = envelope.diagnostics.find(
          (d: { code: string }) => d.code === code,
        );
        assert.ok(diagnostic, result.stdout);
        assert.ok(diagnostic.guidance);
      }
      assert.equal(result.stdout.includes(f.root), false, result.stdout);
      assert.equal(result.stdout.includes(id), false, result.stdout);
      assert.deepEqual(snapshotTree(f.root), before);
    }
}

for (const custom of [false, true]) {
  test(`unchanged unreadable owner ${custom ? "custom" : "default"}`, (t) => {
    assert.notEqual(
      process.getuid?.(),
      0,
      "Run this permission qualification as an unprivileged user.",
    );
    const f = fixture(custom);
    t.after(f.cleanup);
    const owner = `${f.writer}/owner.json`;
    write(
      f.root,
      owner,
      JSON.stringify({ schemaVersion: 1, transactionId: id, pid: 999999999 }),
    );
    const before = snapshotTree(f.root);
    const absolute = path.join(f.root, owner);
    const originalMode = lstatSync(absolute).mode & 0o7777;
    chmodSync(absolute, 0);
    assert.throws(() => readFileSync(absolute), { code: "EACCES" });
    for (const command of commands)
      for (const dry of [false, true]) {
        const result = f.run([...command, ...(dry ? ["--dry-run"] : [])]);
        assert.equal(result.error, undefined);
        assert.equal(result.signal, null);
        assert.equal(result.status, 1, result.stdout + result.stderr);
        assert.equal(result.stderr, "");
        const envelope = JSON.parse(result.stdout);
        assert.equal(envelope.status, "error");
        assert.deepEqual(envelope.changes, []);
        assert.ok(
          envelope.diagnostics.some(
            (entry: { code: string }) =>
              entry.code === "WRITER_LOCK_UNAVAILABLE",
          ),
        );
        assert.equal(lstatSync(absolute).mode & 0o7777, 0);
        // Only the test owner temporarily restores read access to compare the
        // complete byte/mode/link tree. The CLI leaves the mode at zero.
        chmodSync(absolute, originalMode);
        try {
          assert.deepEqual(snapshotTree(f.root), before);
        } finally {
          chmodSync(absolute, 0);
        }
      }
  });
  for (const scenario of [
    "absent",
    "empty-namespace",
    "empty-transactions",
    "empty-transaction",
    "unknown-namespace",
    "unknown-id",
    "missing-journal-backup",
    "malformed-journal",
    "ambiguous-writer",
    "valid-writer",
    "unknown-writer-file",
    "linked-owner",
    "fifo-journal",
    "regular-transaction",
    "nested-symlink",
    "pending-before-corrupt",
  ] as const)
    test(`unchanged ${custom ? "custom" : "default"}: ${scenario}`, (t) => {
      const f = fixture(custom);
      t.after(f.cleanup);
      const tx = `${f.tx}/${id}`;
      let code: string | null = null;
      let status = 1;
      switch (scenario) {
        case "absent":
          break;
        case "empty-namespace":
          mkdirSync(path.join(f.root, f.namespace), { recursive: true });
          break;
        case "empty-transactions":
          mkdirSync(path.join(f.root, f.tx), { recursive: true });
          break;
        case "empty-transaction":
          mkdirSync(path.join(f.root, tx), { recursive: true });
          code = "RECOVERY_PENDING";
          break;
        case "unknown-namespace":
          write(f.root, `${f.namespace}/operator-notes`, "preserve");
          code = "RECOVERY_UNEXPECTED_ENTRY";
          break;
        case "unknown-id":
          write(f.root, `${f.tx}/operator-notes`, "preserve");
          code = "RECOVERY_UNEXPECTED_ENTRY";
          break;
        case "missing-journal-backup":
          write(f.root, `${tx}/backups/0`, "preimage");
          code = "RECOVERY_AMBIGUOUS_JOURNAL";
          break;
        case "malformed-journal":
          write(f.root, `${tx}/journal.json`, "{bad");
          code = "JOURNAL_MALFORMED";
          break;
        case "ambiguous-writer":
          mkdirSync(path.join(f.root, f.writer), { recursive: true });
          code = "WRITER_LOCK_UNAVAILABLE";
          break;
        case "valid-writer":
        case "unknown-writer-file":
          write(
            f.root,
            `${f.writer}/owner.json`,
            JSON.stringify({
              schemaVersion: 1,
              transactionId: id,
              pid: 999999999,
            }),
          );
          write(f.root, `${tx}/journal.json`, "{bad");
          if (scenario === "unknown-writer-file")
            write(f.root, `${f.writer}/notes`, "preserve");
          code =
            scenario === "valid-writer"
              ? "WRITER_BUSY"
              : "WRITER_LOCK_UNAVAILABLE";
          break;
        case "linked-owner":
          write(f.root, "unrelated/owner.json", "must not read");
          mkdirSync(path.join(f.root, f.writer), { recursive: true });
          symlinkSync(
            path.join(f.root, "unrelated/owner.json"),
            path.join(f.root, f.writer, "owner.json"),
          );
          code = "RECOVERY_UNSAFE_TARGET";
          status = 11;
          break;
        case "fifo-journal":
          mkdirSync(path.join(f.root, tx), { recursive: true });
          assert.equal(
            spawnSync("mkfifo", [path.join(f.root, tx, "journal.json")]).status,
            0,
          );
          code = "RECOVERY_UNSAFE_TARGET";
          status = 11;
          break;
        case "regular-transaction":
          write(f.root, tx, "not a directory");
          code = "RECOVERY_UNSAFE_TARGET";
          status = 11;
          break;
        case "nested-symlink":
          write(
            f.root,
            `${f.writer}/owner.json`,
            JSON.stringify({
              schemaVersion: 1,
              transactionId: id,
              pid: process.pid,
            }),
          );
          mkdirSync(path.join(f.root, tx, "unexpected"), { recursive: true });
          symlinkSync(f.base, path.join(f.root, tx, "unexpected", "link"));
          code = "RECOVERY_UNSAFE_TARGET";
          status = 11;
          break;
        case "pending-before-corrupt":
          mkdirSync(path.join(f.root, tx), { recursive: true });
          write(
            f.root,
            `${f.tx}/ffffffff-ffff-4fff-8fff-ffffffffffff/journal.json`,
            "{bad",
          );
          code = "JOURNAL_MALFORMED";
          break;
      }
      expect(f, code, code === null ? 0 : status);
      if (scenario === "valid-writer") {
        const before = snapshotTree(f.root);
        for (const args of commands) {
          const human = spawnSync(
            process.execPath,
            [path.join(f.pkg, "dist/cli/main.js"), ...args, "--cwd", f.root],
            {
              cwd: f.root,
              encoding: "utf8",
              timeout: 30000,
              killSignal: "SIGKILL",
            },
          );
          assert.equal(human.error, undefined);
          assert.equal(human.signal, null);
          assert.equal(human.status, 1);
          assert.equal(human.stdout, "");
          assert.match(human.stderr, /WRITER_BUSY/);
          assert.equal(human.stderr.includes(f.root), false);
          assert.deepEqual(snapshotTree(f.root), before);
        }
      }
    });

  for (const scenario of [
    "held",
    "committed",
    "corrupt",
    "foreign-root",
    "foreign-mapping",
    "unknown-inventory",
    "foreign-witness",
    "publication-mode",
  ] as const)
    test(`unchanged real interrupted ${custom ? "custom" : "default"}: ${scenario}`, (t) => {
      const f = fixture(custom);
      t.after(f.cleanup);
      // A genuine registry revision produces a real metadata-only sync write.
      const incoming = compoundRegistry(f.pkg, { version: "0.2.0" });
      assert.ok(incoming.ok, JSON.stringify(incoming));
      const script = String.raw`
        const base = process.env.SUIK_CORE;
        const {captureCommandContext} = await import(base + "cli/commands/context.js");
        const {planSync} = await import(base + "codegen/plan-sync.js");
        const {composeApplyPlan} = await import(base + "codegen/compose.js");
        const {validateApplyPlan,applyPlan} = await import(base + "codegen/apply.js");
        const request = {kind:"command",command:"sync",item:null,json:true,cwd:process.env.SUIK_APP,dryRun:false,source:false,strict:false};
        const captured = captureCommandContext(request,process.env.SUIK_PKG);
        if (!captured.ok) throw Error(JSON.stringify(captured));
        const context = captured.value;
        const planned = planSync({...context,registryVersion:context.registry.root.registryVersion,registryHash:context.registry.root.contentHash});
        if (!planned.ok || !planned.value.executable || planned.value.writes.length !== 1 || !planned.value.writes[0].path.endsWith("/kit.lock.json")) throw Error(JSON.stringify(planned));
        const composed = composeApplyPlan({root:context.snapshot.root,config:planned.value.effectiveConfig,snapshot:context.snapshot,writes:planned.value.writes,exportAuthority:planned.value.exportAuthority});
        if (!composed.ok) throw Error(JSON.stringify(composed));
        const validated = validateApplyPlan(composed.value);
        if (!validated.ok) throw Error(JSON.stringify(validated));
        applyPlan(validated.value, {
          before: b => {if (b === "cleanup:staged") throw Error("owned cleanup interruption");},
          after: b => {if (b === (process.env.SUIK_HELD === "1" ? "lock:publish" : "durability:release")) process.kill(process.pid,"SIGKILL");}
        });
        throw Error("expected actual process interruption");
      `;
      const child = spawnSync(
        process.execPath,
        ["--input-type=module", "-e", script],
        {
          encoding: "utf8",
          timeout: 30000,
          killSignal: "SIGKILL",
          env: {
            ...process.env,
            SUIK_CORE: new URL("../../src/", import.meta.url).href,
            SUIK_APP: f.root,
            SUIK_PKG: f.pkg,
            SUIK_HELD: scenario === "held" ? "1" : "0",
          },
        },
      );
      assert.equal(child.error, undefined, child.stderr);
      assert.equal(child.signal, "SIGKILL", child.stderr);
      const [transaction] = readdirSync(path.join(f.root, f.tx));
      assert.ok(transaction);
      const tx = `${f.tx}/${transaction}`;
      const journalPath = path.join(f.root, tx, "journal.json");
      const journal = JSON.parse(readFileSync(journalPath, "utf8"));
      if (scenario === "held") {
        const owner = JSON.parse(
          readFileSync(path.join(f.root, f.writer, "owner.json"), "utf8"),
        );
        assert.equal(owner.pid, child.pid);
      } else
        assert.equal(
          readdirSync(path.join(f.root, f.namespace)).includes("writer.lock"),
          false,
        );
      let code = "RECOVERY_PENDING";
      if (scenario === "held") code = "WRITER_BUSY";
      if (scenario === "corrupt") {
        writeFileSync(journalPath, "{bad");
        code = "JOURNAL_MALFORMED";
      }
      if (scenario === "foreign-root") {
        journal.rootIdentity = "0".repeat(64);
        writeFileSync(journalPath, JSON.stringify(journal));
        code = "RECOVERY_ROOT_MISMATCH";
      }
      if (scenario === "foreign-mapping") {
        journal.lock.path = "unrelated/kit.lock.json";
        writeFileSync(journalPath, JSON.stringify(journal));
        code = "JOURNAL_LOCK_UNAPPROVED";
      }
      if (scenario === "unknown-inventory") {
        write(f.root, `${tx}/staged/unrecorded`, "preserve");
        code = "RECOVERY_UNEXPECTED_ENTRY";
      }
      if (scenario === "foreign-witness") {
        const witnessPath = path.join(f.root, tx, "publication.json");
        const witness = JSON.parse(readFileSync(witnessPath, "utf8"));
        witness.planDigest = "0".repeat(64);
        writeFileSync(witnessPath, JSON.stringify(witness));
        code = "RECOVERY_AMBIGUOUS_PUBLICATION";
      }
      if (scenario === "publication-mode") {
        chmodSync(path.join(f.root, f.paths.stateDir, "kit.lock.json"), 0o600);
        code = "RECOVERY_AMBIGUOUS_PUBLICATION";
      }
      if (scenario === "committed")
        write(
          f.root,
          `${f.config.stylesDir}/kit.css`,
          readFileSync(
            path.join(f.root, f.config.stylesDir, "kit.css"),
            "utf8",
          ) + "\n/* preserve post-crash edit */\n",
        );
      expect(f, code);
      if (scenario === "held" || scenario === "committed") {
        // Remove only the inspection in this owned executable copy. Its old
        // silent success must return for all three genuinely unchanged plans.
        const module = path.join(f.pkg, "dist/codegen/recovery.js");
        const source = readFileSync(module, "utf8");
        const start = source.indexOf("export function inspectUnchangedState(");
        const end = source.indexOf(
          "export function inspectTransactions(",
          start,
        );
        assert.ok(start >= 0 && end > start);
        writeFileSync(
          module,
          source.slice(0, start) +
            "export function inspectUnchangedState() { return []; }\n" +
            source.slice(end),
        );
        expect(f, null);
        writeFileSync(module, source);
        expect(f, code);
      }
      // An owner-proven quarantine is test setup, never product takeover.
      if (scenario === "held") {
        renameSync(
          path.join(f.root, f.writer),
          path.join(f.base, "quarantined-writer"),
        );
        expect(f, "RECOVERY_PENDING");
      }
    });
}
