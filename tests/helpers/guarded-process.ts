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
