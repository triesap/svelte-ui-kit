import assert from "node:assert/strict";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { SpawnSyncReturns } from "node:child_process";

import { parseJournal } from "../../src/codegen/transaction-journal.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import { readWriterLock } from "../../src/codegen/write-lock.js";
import {
  inspectTransactions,
  inspectUnchangedState,
} from "../../src/codegen/recovery.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { runWorker } from "../helpers/fault-process.js";
import {
  runGuardedProductionWorker,
  runRecoveryWorker,
  parseRecoveryWorkerOutput,
} from "../helpers/guarded-process.js";
import {
  clearOrphanedWriterLock,
  RECOVERY_ROOTS,
} from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const config = DEFAULT_KIT_CONFIG;
const stateDir = deriveKitPaths(config).stateDir;
const abs = (root: string, logical: string) =>
  path.join(root, ...logical.split("/"));
const semanticFiles = (root: string) =>
  snapshotTree(root).filter(
    (entry) =>
      entry.kind === "file" && !entry.path.includes("/.svelte-ui-kit/"),
  );

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-phase-process-"));
  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({
        name: "consumer",
        type: "module",
        dependencies: {
          svelte: "5.57.1",
          "@sveltejs/kit": "2.70.3",
          "bits-ui": "2.19.3",
          "@internationalized/date": "3.12.4",
        },
      }),
    );
    writeFileSync(
      path.join(root, ".operator-note"),
      "preserve hidden unrelated bytes",
    );
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function freshRecovery(root: string, transactionId: string) {
  const child = runRecoveryWorker({
    root,
    stateDir,
    ...RECOVERY_ROOTS,
    mode: "single",
    transactionId,
  });
  assert.equal(child.error, undefined, String(child.error));
  assert.equal(child.signal, null, child.stderr);
  assert.equal(child.status, 0, child.stderr);
  const envelope = parseRecoveryWorkerOutput(child.stdout);
  assert.equal(envelope.pid, child.pid);
  assert.notEqual(envelope.pid, process.pid);
  return envelope.results[0]!;
}

function resolveConfirmedChild(
  root: string,
  child: SpawnSyncReturns<string>,
  id: string,
): void {
  assert.equal(child.error, undefined, String(child.error));
  assert.equal(child.signal, "SIGKILL", child.stderr);
  assert.equal(child.status, null);
  assert.match(child.stdout, new RegExp(`SUIK_KILL_PID ${child.pid}\\b`));
  const writer = readWriterLock(root, stateDir);
  assert.equal(writer.kind, "held");
  assert.equal(writer.owner?.pid, child.pid);
  assert.throws(() => process.kill(child.pid, 0), { code: "ESRCH" });
  const before = snapshotTree(root);
  const blocked = freshRecovery(root, id);
  assert.equal(blocked.status, "refused");
  assert.ok(blocked.issues.some((issue) => issue.code === "WRITER_BUSY"));
  assert.deepEqual(snapshotTree(root), before);
  // Test-only explicit operator resolution of this exact confirmed dead owner.
  clearOrphanedWriterLock(root, stateDir);
}

for (const operation of ["create", "update", "retire"] as const) {
  for (const durable of [false, true]) {
    test(`${operation}: a real rename ${durable ? "after" : "before"} durable progress recovers from physical evidence`, () => {
      withRoot((root) => {
        const original = semanticFiles(root);
        const id = "0505050505050505";
        const child = runWorker({
          root,
          stateDir,
          transactionId: id,
          operation,
          mode: "kill",
          boundary: durable
            ? "progress:persist"
            : operation === "retire"
              ? "durability:backup"
              : "durability:replace",
          event: durable ? "after" : "before",
        });
        assert.equal(child.error, undefined, String(child.error));
        assert.equal(child.signal, "SIGKILL", child.stderr + child.stdout);
        const parsed = parseJournal(
          readFileSync(abs(root, journalPath(stateDir, id)), "utf8"),
        );
        assert.equal(parsed.ok, true, JSON.stringify(parsed));
        if (!parsed.ok) return;
        assert.equal(parsed.value.phase, "prepared");
        assert.equal(parsed.value.operations[0]?.applied, durable);
        assert.equal(
          existsSync(abs(root, "src/styles/kit.css")),
          operation !== "retire",
        );
        if (operation !== "retire")
          assert.equal(
            readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
            "new css",
          );
        resolveConfirmedChild(root, child, id);
        assert.equal(freshRecovery(root, id).status, "rolled_back");
        assert.equal(
          existsSync(abs(root, "src/styles/kit.css")),
          operation !== "create",
        );
        if (operation !== "create")
          assert.equal(
            readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
            "old css",
          );
        assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
        assert.deepEqual(
          semanticFiles(root).filter(
            (entry) => entry.path !== "src/styles/kit.css",
          ),
          original,
        );
        assert.equal(
          readFileSync(path.join(root, ".operator-note"), "utf8"),
          "preserve hidden unrelated bytes",
        );
      });
    });
  }
}

for (const operation of ["create", "update", "retire"] as const) {
  for (const operatorCopy of operation === "retire" ? [true] : [false, true]) {
    test(`${operation}: a real pre-installation kill ${operatorCopy ? "preserves an operator copy" : "recovers with the stage still present"}`, () => {
      withRoot((root) => {
        const id = "0505050505050505";
        const child = runWorker({
          root,
          stateDir,
          transactionId: id,
          operation,
          mode: "kill",
          boundary:
            operation === "retire" ? "durability:backup" : "replace:apply",
          event: "before",
        });
        resolveConfirmedChild(root, child, id);
        const parsed = parseJournal(
          readFileSync(abs(root, journalPath(stateDir, id)), "utf8"),
        );
        assert.equal(parsed.ok, true, JSON.stringify(parsed));
        if (!parsed.ok) return;
        assert.equal(parsed.value.phase, "prepared");
        const recorded = parsed.value.operations[0]!;
        assert.equal(recorded.applied, false);
        const target = abs(root, recorded.path);
        assert.equal(existsSync(target), false);
        if (operation === "retire") {
          assert.equal(recorded.stagedId, null);
          writeFileSync(target, "", { mode: 0o644 });
        } else {
          assert.notEqual(recorded.stagedId, null);
          const stage = abs(
            root,
            `${stagedDir(stateDir, id)}/${recorded.stagedId}`,
          );
          assert.equal(readFileSync(stage, "utf8"), "new css");
          if (operatorCopy) {
            copyFileSync(stage, target);
            assert.notEqual(statSync(stage).ino, statSync(target).ino);
            assert.equal(readFileSync(target, "utf8"), "new css");
          }
        }
        const before = snapshotTree(root);
        const inspection = inspectTransactions(
          root,
          stateDir,
          RECOVERY_ROOTS,
        )[0]!;
        assert.equal(inspection.ok, !operatorCopy, JSON.stringify(inspection));
        const unchanged = inspectUnchangedState(root, stateDir, RECOVERY_ROOTS);
        const expected = !operatorCopy
          ? "RECOVERY_PENDING"
          : operation === "retire"
            ? "RECOVERY_USER_EDIT"
            : "RECOVERY_PHASE_CONTRADICTION";
        assert.ok(
          unchanged.some((issue) => issue.code === expected),
          JSON.stringify(unchanged),
        );
        assert.deepEqual(snapshotTree(root), before);
        const result = freshRecovery(root, id);
        assert.equal(
          result.status,
          operatorCopy ? "refused" : "rolled_back",
          JSON.stringify(result),
        );
        if (operatorCopy) {
          assert.ok(
            result.issues.some((issue) => issue.code === expected),
            JSON.stringify(result),
          );
          assert.deepEqual(snapshotTree(root), before);
        } else {
          assert.equal(existsSync(target), operation !== "create");
          if (operation !== "create")
            assert.equal(readFileSync(target, "utf8"), "old css");
          assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
          assert.equal(existsSync(abs(root, writerLockDir(stateDir))), false);
        }
      });
    });
  }
}

for (const [label, boundary, event, journalPhase, expectedPhase, committed] of [
  [
    "in-memory planned setup",
    "transaction:create",
    "before",
    undefined,
    undefined,
    false,
  ],
  ["durable prepared", "journal:fsync", "after", "prepared", "prepared", false],
  ["durable applied", "journal:fsync", "after", "applied", "applied", false],
  ["canonical rename lag", "lock:publish", "after", undefined, "applied", true],
  [
    "durable published",
    "journal:fsync",
    "after",
    "published",
    "published",
    true,
  ],
] as const) {
  test(`captured production ${label} is qualified by actual process termination`, () => {
    withRoot((root) => {
      const original = semanticFiles(root);
      const child = runGuardedProductionWorker({
        root,
        pkgRoot: process.cwd(),
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        boundary,
        event,
        ...(journalPhase === undefined ? {} : { journalPhase }),
      });
      assert.equal(child.error, undefined, String(child.error));
      assert.equal(child.signal, "SIGKILL", child.stderr + child.stdout);
      const ids = readdirSync(abs(root, transactionsDir(stateDir)));
      assert.equal(ids.length, 1);
      const id = ids[0]!;
      if (expectedPhase === undefined)
        assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
      else {
        const parsed = parseJournal(
          readFileSync(abs(root, journalPath(stateDir, id)), "utf8"),
        );
        assert.equal(parsed.ok, true, JSON.stringify(parsed));
        if (parsed.ok) assert.equal(parsed.value.phase, expectedPhase);
      }
      resolveConfirmedChild(root, child, id);
      const semanticBefore = semanticFiles(root);
      const recovered = freshRecovery(root, id);
      assert.equal(
        recovered.status,
        committed
          ? "committed"
          : expectedPhase === undefined
            ? "cleaned"
            : "rolled_back",
        JSON.stringify(recovered),
      );
      assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
      assert.equal(existsSync(abs(root, lockPath(stateDir))), committed);
      if (committed) assert.deepEqual(semanticFiles(root), semanticBefore);
      else assert.deepEqual(semanticFiles(root), original);
      assert.equal(existsSync(abs(root, writerLockDir(stateDir))), false);
      assert.equal(
        readFileSync(path.join(root, ".operator-note"), "utf8"),
        "preserve hidden unrelated bytes",
      );
    });
  });
}

test("a real terminal rollback persistence kill cannot regain restoration authority", () => {
  withRoot((root) => {
    const id = "0505050505050505";
    const forward = runWorker({
      root,
      stateDir,
      transactionId: id,
      mode: "kill",
      boundary: "progress:persist",
    });
    resolveConfirmedChild(root, forward, id);
    const rollback = runWorker({
      root,
      stateDir,
      transactionId: id,
      mode: "recover-kill",
      boundary: "journal:fsync",
      event: "after",
    });
    const parsed = parseJournal(
      readFileSync(abs(root, journalPath(stateDir, id)), "utf8"),
    );
    assert.equal(parsed.ok, true, JSON.stringify(parsed));
    if (parsed.ok) assert.equal(parsed.value.phase, "rolled_back");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "old css",
    );
    resolveConfirmedChild(root, rollback, id);
    writeFileSync(
      abs(root, "src/styles/kit.css"),
      "operator edit after completed rollback",
    );
    const before = snapshotTree(root);
    const refused = freshRecovery(root, id);
    assert.equal(refused.status, "refused");
    assert.deepEqual(snapshotTree(root), before);
  });
});

for (const edit of ["none", "bytes", "mode"] as const) {
  test(`a real journal-removal cleanup tail qualifies ${edit} canonical evidence`, () => {
    withRoot((root) => {
      const child = runGuardedProductionWorker({
        root,
        pkgRoot: process.cwd(),
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        boundary: "cleanup:journal",
        event: "after",
      });
      assert.equal(child.error, undefined, String(child.error));
      assert.equal(child.signal, "SIGKILL", child.stderr + child.stdout);
      const ids = readdirSync(abs(root, transactionsDir(stateDir)));
      assert.equal(ids.length, 1);
      const id = ids[0]!;
      assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
      assert.equal(
        existsSync(abs(root, publicationIntentPath(stateDir, id))),
        true,
      );
      resolveConfirmedChild(root, child, id);
      if (edit === "bytes")
        writeFileSync(abs(root, lockPath(stateDir)), "operator canonical edit");
      if (edit === "mode") chmodSync(abs(root, lockPath(stateDir)), 0o1644);
      const before = snapshotTree(root);
      const files = semanticFiles(root);
      const result = freshRecovery(root, id);
      assert.equal(
        result.status,
        edit === "none" ? "cleaned" : "refused",
        JSON.stringify(result),
      );
      if (edit !== "none") assert.deepEqual(snapshotTree(root), before);
      else {
        assert.deepEqual(semanticFiles(root), files);
        assert.equal(
          existsSync(abs(root, publicationIntentPath(stateDir, id))),
          false,
        );
      }
    });
  });
}

for (const boundary of ["stage:write", "journal:write"] as const) {
  test(`a real ${boundary} interruption preserves incomplete pre-preparation evidence`, () => {
    withRoot((root) => {
      const child = runGuardedProductionWorker({
        root,
        pkgRoot: process.cwd(),
        uiDir: config.uiDir,
        stylesDir: config.stylesDir,
        layoutFile: config.layoutFile,
        boundary,
        event: "after",
      });
      assert.equal(child.error, undefined, String(child.error));
      assert.equal(child.signal, "SIGKILL", child.stderr + child.stdout);
      const ids = readdirSync(abs(root, transactionsDir(stateDir)));
      assert.equal(ids.length, 1);
      const id = ids[0]!;
      assert.equal(existsSync(abs(root, journalPath(stateDir, id))), false);
      resolveConfirmedChild(root, child, id);
      const before = snapshotTree(root);
      const result = freshRecovery(root, id);
      assert.equal(result.status, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some(
          (issue) => issue.code === "RECOVERY_AMBIGUOUS_JOURNAL",
        ),
      );
      assert.deepEqual(snapshotTree(root), before);
      assert.equal(existsSync(abs(root, lockPath(stateDir))), false);
    });
  });
}
