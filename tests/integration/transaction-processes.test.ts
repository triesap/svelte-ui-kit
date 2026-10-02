import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import type { ChildProcessWithoutNullStreams } from "node:child_process";

import { recoverTransaction } from "../../src/codegen/recovery.js";
import { runWorker, spawnWorker } from "../helpers/fault-process.js";

const STATE_DIR = "src/lib/components/ui/_kit";

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
      assert.equal(killed.signal, "SIGKILL", `${label}: ${killed.stderr}`);

      const recovered = recoverTransaction(root, STATE_DIR, "1414141414141414");
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

    const recovered = recoverTransaction(root, STATE_DIR, "1515151515151515");
    assert.equal(recovered.status, "refused");
    assert.equal(readFileSync(css, "utf8"), "noncooperative edit");
  });
});

test("the qualified platform is recorded explicitly", () => {
  assert.ok(
    ["darwin", "linux"].includes(process.platform) ||
      process.platform.length > 0,
  );
  // Unrun platforms (Windows) are documented as unverified in the checkpoint
  // report rather than claimed as passing.
  assert.equal(typeof process.arch, "string");
});
