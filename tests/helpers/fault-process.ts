/**
 * Real-subprocess fixtures for transaction concurrency/interruption (S076).
 *
 * These helpers spawn genuine Node processes so the guarded transaction
 * protocol is exercised by real contention, real SIGKILL interruption and real
 * restart recovery, not only by in-process fault hooks. The spawned worker
 * imports the compiled codegen modules from the running test's output tree, so
 * it observes exactly the code under test.
 */
import {
  spawn,
  spawnSync,
  type ChildProcessWithoutNullStreams,
  type SpawnSyncReturns,
} from "node:child_process";

/** Base file URL of the compiled `src/codegen` directory. */
export function codegenBaseUrl(): string {
  return new URL("../../src/codegen/", import.meta.url).href;
}

export interface WorkerOptions {
  readonly mode: "lock" | "apply" | "kill";
  readonly root: string;
  readonly stateDir: string;
  readonly transactionId: string;
  readonly boundary?: string;
  readonly holdMs?: number;
}

const WORKER = String.raw`
const base = process.env.SUIK_CODEGEN;
const root = process.env.SUIK_ROOT;
const stateDir = process.env.SUIK_STATE_DIR;
const id = process.env.SUIK_TXN_ID;
const mode = process.env.SUIK_MODE;
const boundary = process.env.SUIK_BOUNDARY || "";
const holdMs = Number(process.env.SUIK_HOLD_MS || "0");
const { pathToFileURL } = await import("node:url");
const load = (name) => import(base + name);
const fs = await import("node:fs");
const path = await import("node:path");

if (mode === "lock") {
  const { acquireWriterLock, releaseWriterLock } = await load("write-lock.js");
  const acquired = acquireWriterLock(root, stateDir, id);
  console.log(acquired.ok ? "acquired" : "busy:" + acquired.issues[0].code);
  if (acquired.ok && holdMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, holdMs));
    releaseWriterLock(acquired.value);
  }
  process.exit(acquired.ok ? 0 : 3);
}

const { sha256Hex } = await load("digest.js");
const { stageOperations } = await load("stage.js");
const { prepareJournal, persistJournal } = await load("transaction-journal.js");
const { applyReplacements } = await load("replace.js");
const { faultAt } = await load("transaction-hooks.js");
const { journalPath } = await load("transaction-types.js");

const css = path.join(root, ..."src/styles/kit.css".split("/"));
fs.mkdirSync(path.dirname(css), { recursive: true });
fs.writeFileSync(css, "old css");

const journal = {
  schemaVersion: 1,
  transactionId: id,
  rootIdentity: "a".repeat(64),
  planDigest: "b".repeat(64),
  phase: "planned",
  operations: [{
    path: "src/styles/kit.css",
    operation: "update",
    preimage: { kind: "file", digest: sha256Hex("old css"), mode: 0o644 },
    resultDigest: sha256Hex("new css"),
    resultMode: 0o644,
    backupId: null,
    stagedId: null,
    applied: false,
  }],
  lock: null,
};

const staged = stageOperations(root, stateDir, id, [{
  path: "src/styles/kit.css",
  operation: "update",
  bytes: new TextEncoder().encode("new css"),
  mode: 0o644,
}]);
if (!staged.ok) { console.log("stage-failed"); process.exit(4); }
const prepared = prepareJournal(journal, staged.value.records);
persistJournal(root, journalPath(stateDir, id), prepared);

const hooks = mode === "kill"
  ? { before: (b) => { if (b === boundary) process.kill(process.pid, "SIGKILL"); } }
  : faultAt(boundary);
const result = applyReplacements(root, stateDir, prepared, staged.value, hooks);
console.log(result.ok ? "applied" : "failed:" + result.issues[0].code);
process.exit(result.ok ? 0 : 5);
`;

/** Spawn one worker process and capture its outcome. */
export function runWorker(options: WorkerOptions): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ["--input-type=module", "-e", WORKER], {
    encoding: "utf8",
    env: workerEnv(options),
  });
}

/** Spawn one worker process without waiting, for real contention. */
export function spawnWorker(
  options: WorkerOptions,
): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, ["--input-type=module", "-e", WORKER], {
    env: workerEnv(options),
    stdio: "pipe",
  });
}

function workerEnv(options: WorkerOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SUIK_CODEGEN: codegenBaseUrl(),
    SUIK_ROOT: options.root,
    SUIK_STATE_DIR: options.stateDir,
    SUIK_TXN_ID: options.transactionId,
    SUIK_MODE: options.mode,
    SUIK_BOUNDARY: options.boundary ?? "",
    SUIK_HOLD_MS: String(options.holdMs ?? 0),
  };
}
