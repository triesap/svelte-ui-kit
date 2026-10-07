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

/**
 * Options for the captured production worker: it runs the real
 * `captureSnapshot` -> `planInit` -> `composeApplyPlan` -> `validateApplyPlan` ->
 * `applyPlan` boundary rather than a hand-built plan, so a restart after the
 * kill is qualified against the original immutable plan and the exact generated
 * tree.
 */
export interface ProductionWorkerOptions {
  readonly root: string;
  readonly pkgRoot: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly boundary: string;
  readonly mode?: "kill" | "hold";
  readonly holdMs?: number;
}

const WORKER = String.raw`
const base = process.env.SUIK_CODEGEN;
const root = process.env.SUIK_ROOT;
const uiDir = process.env.SUIK_UI;
const stylesDir = process.env.SUIK_STYLES;
const layoutFile = process.env.SUIK_LAYOUT;
const boundary = process.env.SUIK_BOUNDARY;
const mode = process.env.SUIK_MODE || "kill";
const holdMs = Number(process.env.SUIK_HOLD_MS || "0");
const {capturedFixtureInit, write} = await import(base + "../../tests/helpers/guarded-plan.js");
const {DEFAULT_KIT_CONFIG} = await import(base + "../project/config.js");
const {validateApplyPlan, applyPlan} = await import(base + "apply.js");
const config = {...DEFAULT_KIT_CONFIG, uiDir, stylesDir, layoutFile};
write(root, stylesDir + "/kit.css", "old css");
write(root, uiDir + "/_kit/kit.json", JSON.stringify(config, null, 2) + "\n");
const composed = capturedFixtureInit(root, config);
const validated = validateApplyPlan(composed);
if (!validated.ok) throw new Error(JSON.stringify(validated));
const outcome = applyPlan(validated.value, {after: (b) => {
  if (b !== boundary) return;
  if (mode === "hold") { console.log("held:" + b); Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, holdMs); }
  else process.kill(process.pid, "SIGKILL");
}});
console.log(JSON.stringify(outcome));
`;

function workerEnv(options: GuardedWorkerOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SUIK_CODEGEN: codegenBaseUrl(),
    SUIK_PKG: process.cwd(),
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

/**
 * The captured production worker. It replays the real read-only planner and
 * guarded apply boundary for the requested mapping, then kills or holds at the
 * named boundary. The mapping is rebuilt from the package defaults with only
 * the ui/styles/layout overrides, so the composed plan is the original
 * immutable captured plan rather than a synthetic one.
 */
const PRODUCTION_WORKER = String.raw`
const base = process.env.SUIK_CODEGEN;
const root = process.env.SUIK_ROOT;
const pkg = process.env.SUIK_PKG;
const uiDir = process.env.SUIK_UI;
const stylesDir = process.env.SUIK_STYLES;
const layoutFile = process.env.SUIK_LAYOUT;
const boundary = process.env.SUIK_BOUNDARY;
const mode = process.env.SUIK_MODE || "kill";
const holdMs = Number(process.env.SUIK_HOLD_MS || "0");
const load = (name) => import(base + name);
const { applyPlan, validateApplyPlan } = await load("apply.js");
const { composeApplyPlan } = await load("compose.js");
const { planInit } = await load("plan-init.js");
const { captureSnapshot } = await load("snapshot.js");
const { DEFAULT_KIT_CONFIG, deriveKitPaths } = await load("../project/config.js");
const { createAssetProvider } = await load("../registry/assets.js");
const { loadRegistrySnapshot } = await load("../registry/load.js");
const fs = await import("node:fs");
const path = await import("node:path");
const config = { ...DEFAULT_KIT_CONFIG, uiDir, stylesDir, layoutFile };
const derived = deriveKitPaths(config);
const initPaths = [
  derived.stateDir + "/kit.json",
  derived.stateDir + "/kit.lock.json",
  derived.rootExports,
  derived.kitCss,
  derived.themesCss,
  derived.appCss,
  layoutFile,
  ".gitignore",
];
const registry = loadRegistrySnapshot(createAssetProvider(pkg));
if (!registry.ok) throw new Error(JSON.stringify(registry));
const snapshot = captureSnapshot(root, initPaths);
if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));
const layoutAbs = path.join(root, ...layoutFile.split("/"));
const layoutSource = fs.existsSync(layoutAbs) ? fs.readFileSync(layoutAbs, "utf8") : "";
const planned = planInit({
  config, layoutFile, layoutSource, snapshot: snapshot.value,
  registry: registry.value, configHash: "b".repeat(64),
});
if (!planned.ok) throw new Error(JSON.stringify(planned));
const composed = composeApplyPlan({ root, config, writes: planned.value.writes, snapshot: snapshot.value });
if (!composed.ok) throw new Error(JSON.stringify(composed));
const validated = validateApplyPlan(composed.value);
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

export function runGuardedWorker(
  options: GuardedWorkerOptions,
): SpawnSyncReturns<string> {
  return spawnSync(process.execPath, ["--input-type=module", "-e", WORKER], {
    encoding: "utf8",
    env: workerEnv(options),
  });
}

export function runGuardedProductionWorker(
  options: ProductionWorkerOptions,
): SpawnSyncReturns<string> {
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", PRODUCTION_WORKER],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        SUIK_CODEGEN: codegenBaseUrl(),
        SUIK_ROOT: options.root,
        SUIK_PKG: options.pkgRoot,
        SUIK_UI: options.uiDir,
        SUIK_STYLES: options.stylesDir,
        SUIK_LAYOUT: options.layoutFile,
        SUIK_BOUNDARY: options.boundary,
        SUIK_MODE: options.mode ?? "kill",
        SUIK_HOLD_MS: String(options.holdMs ?? 0),
      },
    },
  );
}

/**
 * A separately launched recovery process (RCLD04-R2-4/R2-5).
 *
 * The exported recovery callers must be qualified in a *fresh process*, not by
 * calling them in the parent test while describing that as a separate process.
 * This worker runs the real `recoverTransaction` (single) or
 * `recoverTransactions` (scanned) against the captured state and prints an
 * attributable PID/result envelope, so the parent can assert the child's exact
 * exit, signal, PID and typed results against the whole tree.
 */
export interface RecoveryWorkerOptions {
  readonly root: string;
  readonly stateDir: string;
  readonly uiDir: string;
  readonly stylesDir: string;
  readonly layoutFile: string;
  readonly mode: "scanned" | "single";
  /** Required for `single`; the transaction to recover in the fresh process. */
  readonly transactionId?: string;
  /**
   * Enforceable wall-clock bound for the owned child. On expiry the OS SIGKILLs
   * the child (which cannot be trapped), so a stalled or hung recovery can never
   * pin the parent indefinitely. Defaults to the approved recovery bound.
   */
  readonly timeoutMs?: number;
  /**
   * Test-only controlled stall: the child blocks synchronously for this long
   * *after* printing its envelope, so the parent can prove the bound terminates
   * a genuinely stalled recovery process without weakening the typed result.
   */
  readonly stallMs?: number;
}

/** Approved enforceable bound for one owned recovery child. */
export const DEFAULT_RECOVERY_TIMEOUT_MS = 30_000;

const RECOVERY_WORKER = String.raw`
const base = process.env.SUIK_CODEGEN;
const root = process.env.SUIK_ROOT;
const stateDir = process.env.SUIK_STATE_DIR;
const uiDir = process.env.SUIK_UI;
const stylesDir = process.env.SUIK_STYLES;
const layoutFile = process.env.SUIK_LAYOUT;
const mode = process.env.SUIK_RECOVERY_MODE;
const transactionId = process.env.SUIK_TRANSACTION_ID || "";
const stallMs = Number(process.env.SUIK_RECOVERY_STALL_MS || "0");
const load = (name) => import(base + name);
const { recoverTransaction, recoverTransactions } = await load("recovery.js");
const roots = { uiDir, stylesDir, layoutFile };
let results;
if (mode === "single") {
  results = [recoverTransaction(root, stateDir, transactionId, roots)];
} else {
  results = [...recoverTransactions(root, stateDir, roots)];
}
console.log("SUIK_RECOVERY_PID " + process.pid);
console.log("SUIK_RECOVERY_RESULT " + JSON.stringify(results));
if (stallMs > 0) {
  // A deliberately unresponsive child: only the parent's enforceable bound may
  // terminate it. SIGKILL cannot be trapped, so this proves the bound.
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, stallMs);
}
`;

function recoveryEnv(options: RecoveryWorkerOptions): NodeJS.ProcessEnv {
  return {
    ...process.env,
    SUIK_CODEGEN: codegenBaseUrl(),
    SUIK_ROOT: options.root,
    SUIK_STATE_DIR: options.stateDir,
    SUIK_UI: options.uiDir,
    SUIK_STYLES: options.stylesDir,
    SUIK_LAYOUT: options.layoutFile,
    SUIK_RECOVERY_MODE: options.mode,
    SUIK_TRANSACTION_ID: options.transactionId ?? "",
    SUIK_RECOVERY_STALL_MS: String(options.stallMs ?? 0),
  };
}

export function runRecoveryWorker(
  options: RecoveryWorkerOptions,
): SpawnSyncReturns<string> {
  return spawnSync(
    process.execPath,
    ["--input-type=module", "-e", RECOVERY_WORKER],
    {
      encoding: "utf8",
      env: recoveryEnv(options),
      // A bounded owned-child lifecycle: the OS terminates a stalled child at
      // the deadline with an untrappable SIGKILL, so the parent always regains
      // control with an attributable timeout/signal rather than blocking.
      timeout: options.timeoutMs ?? DEFAULT_RECOVERY_TIMEOUT_MS,
      killSignal: "SIGKILL",
    },
  );
}

/**
 * Parse the child's attributable recovery envelope. A missing or malformed
 * envelope is itself a failure: the parent must never infer success from a
 * zero exit alone.
 */
export interface RecoveryChildOutput {
  readonly pid: number;
  readonly results: readonly {
    readonly status: string;
    readonly transactionId: string | null;
    readonly issues: readonly {
      readonly code: string;
      readonly message: string;
    }[];
  }[];
}

export function parseRecoveryWorkerOutput(stdout: string): RecoveryChildOutput {
  const pidMatch = /^SUIK_RECOVERY_PID (\d+)$/m.exec(stdout);
  const resultMatch = /^SUIK_RECOVERY_RESULT (.+)$/m.exec(stdout);
  if (pidMatch === null || resultMatch === null) {
    throw new Error(`missing recovery envelope: ${stdout}`);
  }
  return {
    pid: Number(pidMatch[1]),
    results: JSON.parse(resultMatch[1] as string),
  };
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
