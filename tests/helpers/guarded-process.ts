/**
 * Real-subprocess fixture for the full guarded apply boundary (RCLD04-R1-5).
 *
 * The spawned worker constructs one complete `ApplyPlanInput` (with a physical
 * readset) and applies it through the *production* `validateApplyPlan`/
 * `applyPlan` boundary. Two modes are supported:
 *
 * - `kill`: the process SIGKILLs itself immediately after a named boundary, so
 *   the parent can prove crash-window recovery against durable state.
 * - `hold`: the process prints `held:<boundary>` and sleeps while still holding
 *   the writer lock, so the parent can prove that a second composed writer is
 *   refused busy rather than recovering the live owner.
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

export interface GuardedWorkerOptions {
  readonly root: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly stateDir: string;
  readonly boundary: string;
  readonly mode?: "kill" | "hold";
  readonly holdMs?: number;
}

const WORKER = String.raw`
const base = process.env.SUIK_CODEGEN;
const root = process.env.SUIK_ROOT;
const stateDir = process.env.SUIK_STATE_DIR;
const uiDir = process.env.SUIK_UI;
const stylesDir = process.env.SUIK_STYLES;
const layoutFile = process.env.SUIK_LAYOUT;
const boundary = process.env.SUIK_BOUNDARY;
const mode = process.env.SUIK_MODE || "kill";
const holdMs = Number(process.env.SUIK_HOLD_MS || "0");
const load = (name) => import(base + name);
const { applyPlan, validateApplyPlan } = await load("apply.js");
const { capturePreimage } = await load("revalidate.js");
const { captureReadset } = await load("authority.js");
const { lockPath } = await load("transaction-types.js");
const fs = await import("node:fs");
const path = await import("node:path");
const abs = (p) => path.join(root, ...p.split("/"));
const css = abs(stylesDir + "/kit.css");
fs.mkdirSync(path.dirname(css), { recursive: true });
fs.writeFileSync(css, "old css");
const lockp = lockPath(stateDir);
const lockBytes = new TextEncoder().encode(JSON.stringify({
  schemaVersion: 1, toolVersion: "0.1.0", registryVersion: "0.1.0",
  registryHash: "a".repeat(64), configHash: "d".repeat(64),
  requested: [], items: [], files: [], cssBlocks: [], integrations: [],
}, null, 2) + "\n");
const target = {
  path: stylesDir + "/kit.css",
  operation: "update",
  bytes: new TextEncoder().encode("new css"),
  mode: 0o644,
  preimage: capturePreimage(root, stylesDir + "/kit.css"),
};
const readset = captureReadset(root, [target.path, lockp], []);
if (!readset.ok) throw new Error(JSON.stringify(readset));
const plan = {
  root, stateDir, uiDir, stylesDir, layoutFile,
  rootIdentity: "a".repeat(64), planDigest: "b".repeat(64),
  readset: readset.value, targets: [target],
  lock: { bytes: lockBytes, preimage: capturePreimage(root, lockp) },
};
const validated = validateApplyPlan(plan);
if (!validated.ok) throw new Error(JSON.stringify(validated));
applyPlan(validated.value, {
  after: (b) => {
    if (b !== boundary) return;
    if (mode === "hold") {
      console.log("held:" + b);
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, holdMs);
    } else {
      process.kill(process.pid, "SIGKILL");
    }
  },
});
console.log("done");
`;

function workerEnv(options: GuardedWorkerOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SUIK_CODEGEN: codegenBaseUrl(),
    SUIK_ROOT: options.root,
    SUIK_UI: options.uiDir,
    SUIK_STYLES: options.stylesDir,
    SUIK_LAYOUT: options.layoutFile,
    SUIK_STATE_DIR: options.stateDir,
    SUIK_BOUNDARY: options.boundary,
    SUIK_MODE: options.mode ?? "kill",
    SUIK_HOLD_MS: String(options.holdMs ?? 0),
  };
}

export function runGuardedWorker(
  options: GuardedWorkerOptions,
): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ["--input-type=module", "-e", WORKER], {
    encoding: "utf8",
    env: workerEnv(options),
  });
}

export function spawnGuardedWorker(
  options: GuardedWorkerOptions,
): ChildProcessWithoutNullStreams {
  return spawn(process.execPath, ["--input-type=module", "-e", WORKER], {
    stdio: "pipe",
    env: workerEnv(options),
  });
}

/** Wait until the holder reports that it is holding the lock at a boundary. */
export function waitForHeld(
  child: ChildProcessWithoutNullStreams,
  timeoutMs = 8000,
): Promise<string> {
  return new Promise((resolve, reject) => {
    let buffer = "";
    const timer = setTimeout(
      () => reject(new Error(`timed out waiting for held marker: ${buffer}`)),
      timeoutMs,
    );
    child.stdout.on("data", (chunk: Buffer) => {
      buffer += chunk.toString();
      if (buffer.includes("held:")) {
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

export function waitForExit(
  child: ChildProcessWithoutNullStreams,
): Promise<void> {
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    child.on("exit", () => resolve());
  });
}
