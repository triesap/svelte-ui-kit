import assert from "node:assert/strict";
import {
  cpSync,
  chmodSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  mkdirSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { runCli } from "../helpers/cli.js";
import { runGuardedWorker } from "../helpers/guarded-process.js";
import { write } from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import {
  journalPath,
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";

const runbook = readFileSync("implementation/OPERATIONS_RUNBOOK.md", "utf8");
const diagnosis = runbook
  .split("<!-- documented-recovery-diagnosis:start -->")[1]!
  .split("<!-- documented-recovery-diagnosis:end -->")[0]!
  .split("\n")
  .filter((line) => line.startsWith("node "))
  .map((line) => {
    const match = /^node "\$CLI" --cwd "\$APP" ([-a-z ]+)$/.exec(line);
    assert.ok(match, line);
    return match[1]!.split(" ");
  });
assert.equal(diagnosis.length, 2);

for (const custom of [false, true])
  for (const scenario of [
    "prepared",
    "postcrash-edit",
    "committed-cleanup",
    "corrupt-journal",
  ] as const)
    test(`documented recovery ${scenario} ${custom ? "custom" : "default"}`, (t) => {
      const owned = mkdtempSync(path.join(os.tmpdir(), "suik-doc-recovery-"));
      t.after(() => rmSync(owned, { recursive: true, force: true }));
      const root = path.join(owned, "application");
      const config = custom
        ? {
            ...DEFAULT_KIT_CONFIG,
            uiDir: "src/lib/widgets",
            stylesDir: "src/theme",
          }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      write(root, "unrelated/keep.txt", "preserve application work\n");
      // This physical consumer uses the genuine installed native distribution,
      // so retain its explicit application-owned source before capture/apply.
      for (const file of ["package.json", ".native-build"])
        cpSync(
          path.join("tests/fixtures/consumer", file),
          path.join(root, file),
          {
            recursive: true,
          },
        );
      mkdirSync(path.join(root, "node_modules"));
      for (const dependency of [
        "svelte",
        "bits-ui",
        "@internationalized/date",
      ]) {
        const target = path.join(root, "node_modules", dependency);
        mkdirSync(path.dirname(target), { recursive: true });
        symlinkSync(path.resolve("node_modules", dependency), target);
      }
      const boundary =
        scenario === "committed-cleanup" || scenario === "corrupt-journal"
          ? "lock:publish"
          : scenario === "prepared"
            ? "journal:write"
            : "progress:persist";
      const killed = runGuardedWorker({
        root,
        ...config,
        stateDir: paths.stateDir,
        boundary,
      });
      assert.equal(killed.signal, "SIGKILL", killed.stderr);
      const coordination = path.join(root, writerLockDir(paths.stateDir));
      const ownerBytes = readFileSync(path.join(coordination, "owner.json"));
      const owner = JSON.parse(ownerBytes.toString());
      // This fixture owns the only writer and waits for its actual SIGKILL exit;
      // a guessed PID/age is never substituted for that lifecycle evidence.
      assert.equal(owner.pid, killed.pid);
      assert.equal(owner.schemaVersion, 1);
      const transaction = readdirSync(
        path.join(root, transactionsDir(paths.stateDir)),
      );
      assert.deepEqual(transaction, [owner.transactionId]);
      const journal = path.join(
        root,
        journalPath(paths.stateDir, owner.transactionId),
      );
      const css = path.join(root, config.stylesDir, "kit.css");
      let editedCss = "";
      if (scenario === "postcrash-edit" || scenario === "committed-cleanup") {
        editedCss =
          readFileSync(css, "utf8") +
          "\n/* preserved post-crash application edit */\n";
        write(root, `${config.stylesDir}/kit.css`, editedCss);
      }
      if (scenario === "corrupt-journal")
        write(root, path.relative(root, journal), "{broken journal");
      const initial = snapshotTree(root);
      const backup = path.join(owned, "external-backup");
      cpSync(root, backup, { recursive: true, verbatimSymlinks: true });
      // Node's recursive copy does not preserve directory permissions. Restore
      // each recorded regular-file/directory mode before verifying the backup.
      for (const entry of initial)
        if (entry.kind === "directory" || entry.kind === "file")
          chmodSync(path.join(backup, entry.path), entry.mode);
      assert.deepEqual(snapshotTree(backup), initial);
      const run = (args: string[]) => {
        const result = runCli(["--cwd", root, ...args, "--json"]);
        assert.equal(result.signal, null);
        assert.equal(result.timedOut, false);
        assert.equal(result.stderr, "");
        return { result, envelope: JSON.parse(result.stdout) };
      };
      for (const command of diagnosis) {
        run(command);
        assert.deepEqual(snapshotTree(root), initial);
      }
      const busy = run(["init"]);
      if (scenario === "committed-cleanup" || scenario === "corrupt-journal") {
        assert.equal(busy.result.status, 1);
        assert.equal(busy.envelope.status, "error");
        assert.ok(
          busy.envelope.diagnostics.some(
            (d: { code: string }) => d.code === "WRITER_BUSY",
          ),
        );
      } else {
        assert.notEqual(busy.result.status, 0);
        assert.ok(
          busy.envelope.diagnostics.some(
            (d: { code: string }) =>
              d.code ===
              (scenario === "postcrash-edit"
                ? "INIT_OWNERSHIP_CONFLICT"
                : "WRITER_BUSY"),
          ),
          JSON.stringify(busy.envelope),
        );
      }
      assert.deepEqual(snapshotTree(root), initial);
      // Exact known owned path, fresh sibling destination, same filesystem.
      const quarantine = path.join(owned, "quarantined-writer.lock");
      assert.equal(existsSync(quarantine), false);
      const beforeTransactions = snapshotTree(path.dirname(journal));
      renameSync(coordination, quarantine);
      assert.deepEqual(
        readFileSync(path.join(quarantine, "owner.json")),
        ownerBytes,
      );
      assert.deepEqual(snapshotTree(path.dirname(journal)), beforeTransactions);
      const quarantined = snapshotTree(root);
      const replay = run(["init"]);
      if (scenario === "committed-cleanup" || scenario === "corrupt-journal") {
        assert.equal(replay.result.status, 1);
        assert.equal(replay.envelope.status, "error");
        assert.ok(
          replay.envelope.diagnostics.some(
            (d: { code: string }) =>
              d.code ===
              (scenario === "corrupt-journal"
                ? "JOURNAL_MALFORMED"
                : "RECOVERY_PENDING"),
          ),
          replay.result.stdout,
        );
        assert.deepEqual(snapshotTree(root), quarantined);
      }
      // A separate intentional component request supplies a genuine write;
      // Unchanged inspection is never mislabeled as cleanup or forced repair.
      const recovered =
        scenario === "committed-cleanup" || scenario === "corrupt-journal"
          ? run(["add", "button"])
          : replay;
      if (scenario !== "committed-cleanup") {
        assert.notEqual(recovered.result.status, 0);
        assert.deepEqual(snapshotTree(root), quarantined);
        assert.ok(existsSync(path.dirname(journal)));
        const code =
          scenario === "postcrash-edit"
            ? "INIT_OWNERSHIP_CONFLICT"
            : scenario === "prepared"
              ? "RECOVERY_AMBIGUOUS_JOURNAL"
              : "JOURNAL_MALFORMED";
        assert.ok(
          recovered.envelope.diagnostics.some(
            (d: { code: string }) => d.code === code,
          ),
          JSON.stringify(recovered.envelope),
        );
      } else {
        assert.equal(
          recovered.result.status,
          0,
          JSON.stringify(recovered.envelope),
        );
        assert.equal(existsSync(journal), false);
        const finalCss = readFileSync(css, "utf8");
        // The intentional button request expands owned token/component blocks.
        // Both pre-existing unmanaged regions, including the post-crash edit,
        // must survive verbatim; that request is distinct from recovery cleanup.
        assert.ok(finalCss.startsWith("old css"));
        assert.equal(
          finalCss.split("\n/* preserved post-crash application edit */\n")
            .length,
          2,
        );
        assert.ok(
          editedCss.endsWith("\n/* preserved post-crash application edit */\n"),
        );
      }
      assert.equal(
        readFileSync(path.join(root, "unrelated/keep.txt"), "utf8"),
        "preserve application work\n",
      );
      assert.deepEqual(snapshotTree(backup), initial);
      assert.deepEqual(
        readFileSync(path.join(quarantine, "owner.json")),
        ownerBytes,
      );
      const final = snapshotTree(root);
      run(["doctor", "--strict"]);
      assert.deepEqual(snapshotTree(root), final);
    });
