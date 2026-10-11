import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

import { recoverTransaction } from "../../src/codegen/recovery.js";
import { runWorker, spawnWorker } from "../helpers/fault-process.js";
import {
  RECOVERY_ROOTS,
  clearOrphanedWriterLock,
  liveRootIdentity,
} from "../helpers/transactions.js";
import {
  backupsDir,
  journalPath,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { write } from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const STATE_DIR = "src/lib/components/ui/_kit";

for (const operation of ["create", "update", "retire"] as const) {
  test(`a SIGKILL around ${operation} recovery retains restartable physical evidence`, () => {
    for (const event of ["before", "after"] as const) {
      withRoot((root) => {
        const id = "0404040404040404";
        const target = "src/styles/boundary.css";
        write(root, "src/styles/.operator-note", "preserve hidden source");
        if (operation !== "retire") write(root, target, "result bytes");
        if (operation !== "create")
          write(
            root,
            `${backupsDir(STATE_DIR, id)}/backup-0`,
            "original bytes",
          );
        write(
          root,
          journalPath(STATE_DIR, id),
          JSON.stringify({
            schemaVersion: 1,
            transactionId: id,
            rootIdentity: liveRootIdentity(root),
            planDigest: "b".repeat(64),
            phase: "applied",
            lock: null,
            operations: [
              {
                path: target,
                operation,
                preimage:
                  operation === "create"
                    ? { kind: "absent", digest: null, mode: null }
                    : {
                        kind: "file",
                        digest: sha256Hex("original bytes"),
                        mode: 0o644,
                      },
                resultDigest: sha256Hex(
                  operation === "retire" ? "" : "result bytes",
                ),
                resultMode: 0o644,
                backupId: operation === "create" ? null : "backup-0",
                stagedId: operation === "retire" ? null : "stage-0",
                applied: true,
              },
            ],
          }),
        );
        const killed = runWorker({
          mode: "recover-kill",
          root,
          stateDir: STATE_DIR,
          transactionId: id,
          boundary:
            operation === "create" ? "recovery:remove" : "recovery:restore",
          event,
        });
        assert.equal(
          killed.error,
          undefined,
          `${event}: ${String(killed.error)}`,
        );
        assert.equal(
          killed.signal,
          "SIGKILL",
          `${event}: ${killed.stdout} ${killed.stderr}`,
        );
        const before = snapshotTree(root);
        const blocked = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
        assert.equal(blocked.status, "refused");
        assert.ok(blocked.issues.some((entry) => entry.code === "WRITER_BUSY"));
        assert.deepEqual(snapshotTree(root), before);
        const owner = JSON.parse(
          readFileSync(
            abs(root, `${writerLockDir(STATE_DIR)}/owner.json`),
            "utf8",
          ),
        );
        assert.equal(owner.pid, killed.pid);
        // Resolve only this matching owner after the exact child is confirmed
        // terminated. Production never infers takeover from PID or age.
        clearOrphanedWriterLock(root, STATE_DIR);
        const result = recoverTransaction(root, STATE_DIR, id, RECOVERY_ROOTS);
        assert.equal(result.status, "rolled_back", JSON.stringify(result));
        if (operation === "create")
          assert.equal(existsSync(abs(root, target)), false);
        else
          assert.equal(
            readFileSync(abs(root, target), "utf8"),
            "original bytes",
          );
      });
    }
  });
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-process-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function waitForOutput(
  child: ChildProcessWithoutNullStreams,
  needle: string,
  timeoutMs = 8000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for ${needle}: ${buffer}`)),
      timeoutMs,
    );
    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      if (buffer.includes(needle)) {
        clearTimeout(timer);
        resolve(buffer);
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`worker exited early (${code}): ${buffer}`));
    });
  });
}

function waitForExit(child: ChildProcessWithoutNullStreams): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    child.on("exit", () => resolve());
  });
}

test("two cooperative writers cannot interleave an accepted batch", async () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-process-"));
  try {
    const holder = spawnWorker({
      mode: "lock",
      root,
      stateDir: STATE_DIR,
      transactionId: "1212121212121212",
      holdMs: 1200,
    });
    await waitForOutput(holder, "acquired");

    const contender = runWorker({
      mode: "lock",
      root,
      stateDir: STATE_DIR,
      transactionId: "1313131313131313",
    });
    assert.equal(contender.status, 3, contender.stderr);
    assert.match(contender.stdout, /busy:WRITER_BUSY/);

    await waitForExit(holder);

    const later = runWorker({
      mode: "lock",
      root,
      stateDir: STATE_DIR,
      transactionId: "1313131313131313",
    });
    assert.equal(later.status, 0, later.stderr);
    assert.match(later.stdout, /acquired/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a SIGKILLed process leaves recoverable state", () => {
  for (const [label, boundary] of [
    ["before-replace", "replace:apply"],
    ["after-apply", "progress:persist"],
  ] as const) {
    withRoot((root) => {
      const killed = runWorker({
        mode: "kill",
        root,
        stateDir: STATE_DIR,
        transactionId: "1414141414141414",
        boundary,
      });
      assert.equal(killed.error, undefined, String(killed.error));
      assert.equal(killed.signal, "SIGKILL", `${label}: ${killed.stderr}`);

      const before = snapshotTree(root);
      const blocked = recoverTransaction(
        root,
        STATE_DIR,
        "1414141414141414",
        RECOVERY_ROOTS,
      );
      assert.equal(blocked.status, "refused", JSON.stringify(blocked));
      assert.ok(blocked.issues.some((entry) => entry.code === "WRITER_BUSY"));
      assert.deepEqual(snapshotTree(root), before);
      const owner = JSON.parse(
        readFileSync(
          abs(root, `${writerLockDir(STATE_DIR)}/owner.json`),
          "utf8",
        ),
      );
      assert.equal(owner.transactionId, "1414141414141414");
      // This exact child has terminated by SIGKILL; resolve only its matching
      // orphaned coordination before acquiring a fresh recovery writer.
      clearOrphanedWriterLock(root, STATE_DIR);

      const recovered = recoverTransaction(
        root,
        STATE_DIR,
        "1414141414141414",
        RECOVERY_ROOTS,
      );
      assert.equal(recovered.status, "rolled_back", label);
      assert.equal(
        readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
        "old css",
        label,
      );
    });
  }
});

test("noncooperative edits are not overwritten after a crash", () => {
  withRoot((root) => {
    const applied = runWorker({
      mode: "apply",
      root,
      stateDir: STATE_DIR,
      transactionId: "1515151515151515",
    });
    assert.equal(applied.status, 0, applied.stderr);

    const css = abs(root, "src/styles/kit.css");
    assert.equal(readFileSync(css, "utf8"), "new css");
    writeFileSync(css, "noncooperative edit");

    const recovered = recoverTransaction(
      root,
      STATE_DIR,
      "1515151515151515",
      RECOVERY_ROOTS,
    );
    assert.equal(recovered.status, "refused");
    assert.equal(readFileSync(css, "utf8"), "noncooperative edit");
  });
});

test("the qualified platform is recorded explicitly", () => {
  assert.ok(
    ["darwin", "linux"].includes(process.platform),
    `unqualified platform ${process.platform}`,
  );
  // Unrun platforms (Windows) are documented as unverified in the checkpoint
  // report rather than claimed as passing.
  assert.equal(typeof process.arch, "string");
});
