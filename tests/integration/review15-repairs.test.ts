import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyPlanInput,
  type ApplyTarget,
} from "../../src/codegen/apply.js";
import {
  captureReadset,
  identityDigest,
  type PlanInstalledRead,
} from "../../src/codegen/authority.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { planInit } from "../../src/codegen/plan-init.js";
import {
  capturePreimage,
  revalidatePreimages,
} from "../../src/codegen/revalidate.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { recoverTransaction } from "../../src/codegen/recovery.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import {
  journalPath,
  lockPath,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  acquireWriterLock,
  holdsWriterLock,
} from "../../src/codegen/write-lock.js";
import {
  captureEnvironment,
  type CapturedEnvironment,
} from "../../src/project/environment.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { runWorker } from "../helpers/fault-process.js";
import { validKitConfigBytes } from "../helpers/kit-config.js";
import { clearOrphanedWriterLock } from "../helpers/transactions.js";

/**
 * RCLD04 review-15 regression coverage. Each case reproduces one independently
 * observed defect with repository-owned deterministic input: contradictory live
 * coordination authority, release durability and stale in-process authority,
 * independently rooted generated ancestry, owned-creation flush accounting,
 * declared-absent dependency enumeration, unsafe-resolution preservation, final
 * layout mapping coherence, malformed ignore authority, and truthful exported
 * recovery cleanup outcomes.
 */

const PKG_ROOT = process.cwd();
const UI = "src/lib/components/ui";
const STYLES = "src/styles";
const LAYOUT = "src/routes/+layout.svelte";
const STATE = `${UI}/_kit`;
const ROOTS = { uiDir: UI, stylesDir: STYLES, layoutFile: LAYOUT };

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

const enc = (value: string): Uint8Array => new TextEncoder().encode(value);

function write(root: string, logical: string, data: string | Uint8Array): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-review15-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function lockBytes(
  configHash: string,
  integrations: unknown[] = [],
): Uint8Array {
  return enc(
    `${JSON.stringify({
      schemaVersion: 1,
      toolVersion: "0.1.0",
      registryVersion: "0.1.0",
      registryHash: "a".repeat(64),
      configHash,
      requested: [],
      items: [],
      files: [],
      cssBlocks: [],
      integrations,
    })}\n`,
  );
}

function installedReads(environment: CapturedEnvironment): PlanInstalledRead[] {
  return environment.installedResolution.map((entry) => ({
    name: entry.name,
    kind: entry.kind,
    path: entry.path,
    realPath: entry.realPath,
    digest: entry.digest,
    mode: entry.mode,
    device: entry.device,
    inode: entry.inode,
    code:
      entry.kind === "unsafe" || entry.kind === "unreadable"
        ? entry.code
        : null,
  }));
}

function seedPackage(root: string): void {
  write(
    root,
    "package.json",
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
}

function makePlan(root: string): ApplyPlanInput {
  write(root, `${STATE}/kit.json`, "old config");
  write(
    root,
    lockPath(STATE),
    Buffer.from(lockBytes("c".repeat(64))).toString(),
  );
  const configBytes = validKitConfigBytes(ROOTS);
  const targets: ApplyTarget[] = [
    {
      path: `${STATE}/kit.json`,
      operation: "update",
      bytes: configBytes,
      mode: 0o644,
      preimage: capturePreimage(root, `${STATE}/kit.json`),
    },
  ];
  const readset = captureReadset(
    root,
    [...targets.map((target) => target.path), lockPath(STATE)],
    [],
  );
  assert.equal(readset.ok, true);
  if (!readset.ok) throw new Error("readset capture failed");
  return {
    root,
    stateDir: STATE,
    uiDir: UI,
    stylesDir: STYLES,
    layoutFile: LAYOUT,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets,
    lock: {
      bytes: lockBytes(sha256Hex(configBytes)),
      preimage: capturePreimage(root, lockPath(STATE)),
    },
  };
}

function validatedPlan(root: string) {
  const result = validateApplyPlan(makePlan(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

/** A metadata-only plan whose lock alone carries integrations. */
function metadataOnlyPlan(root: string): ApplyPlanInput {
  const configBytes = validKitConfigBytes(ROOTS);
  const configPath = `${STATE}/kit.json`;
  write(root, configPath, configBytes);
  write(
    root,
    lockPath(STATE),
    Buffer.from(lockBytes(sha256Hex(configBytes))).toString(),
  );
  const readset = captureReadset(root, [lockPath(STATE)], [configPath]);
  assert.equal(readset.ok, true);
  if (!readset.ok) throw new Error("readset capture failed");
  return {
    root,
    stateDir: STATE,
    uiDir: UI,
    stylesDir: STYLES,
    layoutFile: LAYOUT,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets: [],
    lock: {
      bytes: lockBytes(sha256Hex(configBytes)),
      preimage: capturePreimage(root, lockPath(STATE)),
    },
  };
}

function customMapping(): typeof DEFAULT_KIT_CONFIG {
  return { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui", stylesDir: "assets/styles" };
}

function plannedCustomInit(root: string) {
  const config = customMapping();
  const derived = deriveKitPaths(config);
  seedPackage(root);
  const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
  assert.equal(registry.ok, true, JSON.stringify(registry));
  if (!registry.ok) throw new Error("registry load failed");
  const paths = [
    `${derived.stateDir}/kit.json`,
    lockPath(derived.stateDir),
    derived.rootExports,
    derived.kitCss,
    derived.themesCss,
    derived.appCss,
    config.layoutFile,
    ".gitignore",
  ];
  const snapshot = captureSnapshot(root, paths);
  assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
  if (!snapshot.ok) throw new Error("snapshot failed");
  const planned = planInit({
    config,
    layoutFile: config.layoutFile,
    layoutSource: "",
    snapshot: snapshot.value,
    registry: registry.value,
    configHash: "b".repeat(64),
  });
  assert.equal(planned.ok, true, JSON.stringify(planned));
  if (!planned.ok) throw new Error("planInit failed");
  return { config, snapshot: snapshot.value, writes: planned.value.writes };
}

test("a registered acquisition cannot bypass a contradictory live owner", () => {
  withRoot((root) => {
    const readset = captureReadset(root, [], []);
    assert.equal(readset.ok, true);
    if (!readset.ok) return;
    const tid = "44444444-4444-4444-8444-444444444444";
    write(
      root,
      journalPath(STATE, tid),
      JSON.stringify({
        schemaVersion: 1,
        transactionId: tid,
        rootIdentity: identityDigest(readset.value.root),
        planDigest: "b".repeat(64),
        phase: "planned",
        operations: [],
        lock: null,
      }),
    );
    const acquired = acquireWriterLock(
      root,
      STATE,
      "55555555-5555-4555-8555-555555555555",
    );
    assert.equal(acquired.ok, true, JSON.stringify(acquired));
    // The live owner record is replaced by a contradictory transaction while
    // this process still believes it holds the lock.
    write(
      root,
      `${writerLockDir(STATE)}/owner.json`,
      JSON.stringify({
        schemaVersion: 1,
        transactionId: "66666666-6666-4666-8666-666666666666",
        pid: process.pid + 1,
      }),
    );
    const result = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.ok(
      result.issues.some((entry) => entry.code === "WRITER_LOCK_CONTRADICTED"),
      JSON.stringify(result.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);
  });
});

test("a failed release drops in-process authority and retains owner evidence", () => {
  withRoot((root) => {
    const plan = validatedPlan(root);
    let fired = false;
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "durability:release" && !fired) {
          fired = true;
          throw new Error("review actual release fsync EIO");
        }
      },
    });
    assert.equal(fired, true);
    assert.equal(holdsWriterLock(root, STATE), false);
    assert.equal(
      existsSync(abs(root, `${writerLockDir(STATE)}/owner.json`)),
      true,
    );
    assert.ok(
      outcome.issues.some(
        (entry) => entry.code === "WRITER_LOCK_RELEASE_FAILED",
      ),
      JSON.stringify(outcome.issues),
    );
  });
});

test("rollback supports an ancestor above an independently rooted styles directory", () => {
  withRoot((root) => {
    const { config, snapshot, writes } = plannedCustomInit(root);
    const composed = composeApplyPlan({
      root,
      config,
      writes,
      snapshot,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(
      validated.value,
      faultAt("replace:apply", "review interrupt replacement"),
    );
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.equal(
      outcome.issues.some(
        (entry) => entry.code === "RECOVERY_CREATED_DIR_UNAPPROVED",
      ),
      false,
      JSON.stringify(outcome.issues),
    );
    assert.equal(existsSync(abs(root, "assets")), false);
    assert.equal(existsSync(abs(root, "assets/styles")), false);
  });
});

test("an owned-creation flush failure accounts for and cleans only owned state", () => {
  withRoot((root) => {
    const { config, snapshot, writes } = plannedCustomInit(root);
    const composed = composeApplyPlan({ root, config, writes, snapshot });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    let fired = false;
    const outcome = applyPlan(validated.value, {
      before: (boundary, detail) => {
        if (
          boundary === "durability:owned-create" &&
          detail === "assets" &&
          !fired
        ) {
          fired = true;
          throw new Error("review actual owned-create fsync EIO");
        }
      },
    });
    assert.equal(fired, true);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (entry) => entry.code === "OWNED_ANCESTRY_FLUSH_FAILED",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.equal(existsSync(abs(root, "assets")), false);
    assert.equal(existsSync(abs(root, "app")), false);
  });
});

test("a declared dependency captured absent is refused when it appears", () => {
  withRoot((root) => {
    seedPackage(root);
    const derived = deriveKitPaths(DEFAULT_KIT_CONFIG);
    const paths = [
      `${derived.stateDir}/kit.json`,
      lockPath(derived.stateDir),
      derived.rootExports,
      derived.kitCss,
      derived.themesCss,
      derived.appCss,
      DEFAULT_KIT_CONFIG.layoutFile,
      ".gitignore",
    ];
    const snapshot = captureSnapshot(root, paths);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const registry = loadRegistrySnapshot(createAssetProvider(PKG_ROOT));
    assert.equal(registry.ok, true, JSON.stringify(registry));
    if (!registry.ok) return;
    const planned = planInit({
      config: DEFAULT_KIT_CONFIG,
      layoutFile: DEFAULT_KIT_CONFIG.layoutFile,
      layoutSource: "",
      snapshot: snapshot.value,
      registry: registry.value,
      configHash: "b".repeat(64),
    });
    assert.equal(planned.ok, true, JSON.stringify(planned));
    if (!planned.ok) return;
    // A newly appearing incompatible dependency appears after capture.
    write(
      root,
      "node_modules/svelte/package.json",
      JSON.stringify({ name: "svelte", version: "4.2.0" }),
    );
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes: planned.value.writes,
      snapshot: snapshot.value,
    });
    assert.equal(composed.ok, true, JSON.stringify(composed));
    if (!composed.ok) return;
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(validated.value);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (entry) => entry.code === "AUTHORITY_INSTALLED_CHANGED",
      ),
      JSON.stringify(outcome.issues),
    );
  });
});

test("an unsafe installed resolution is preserved, never captured as absence", () => {
  withRoot((root) => {
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "consumer",
        type: "module",
        dependencies: { svelte: "5.57.1" },
      }),
    );
    write(
      root,
      "store/package.json",
      JSON.stringify({ name: "svelte", version: "5.57.1" }),
    );
    mkdirSync(abs(root, "node_modules/svelte"), { recursive: true });
    symlinkSync(
      "../../store/package.json",
      abs(root, "node_modules/svelte/package.json"),
    );
    const environment = captureEnvironment(root);
    const entry = environment.installedResolution.find(
      (candidate) => candidate.name === "svelte",
    );
    assert.ok(entry, "svelte resolution was captured");
    assert.equal(entry?.kind, "unsafe");
    const issues = revalidatePreimages(root, [], {
      installed: installedReads(environment),
    });
    assert.equal(issues.ok, false, JSON.stringify(issues));
    if (!issues.ok) {
      assert.ok(
        issues.issues.some(
          (candidate) => candidate.code === "AUTHORITY_INSTALLED_CHANGED",
        ),
        JSON.stringify(issues.issues),
      );
    }
  });
});

test("a final layout integration must match the approved layout mapping", () => {
  withRoot((root) => {
    const plan = metadataOnlyPlan(root);
    const parsed = JSON.parse(Buffer.from(plan.lock.bytes).toString("utf8"));
    parsed.integrations = [
      {
        kind: "layout",
        path: "notes.svelte",
        baseline: "a".repeat(64),
        contract: "layout-v1",
      },
    ];
    const result = validateApplyPlan({
      ...plan,
      lock: { ...plan.lock, bytes: enc(`${JSON.stringify(parsed)}\n`) },
    });
    assert.equal(result.ok, false, JSON.stringify(result));
    if (!result.ok) {
      assert.ok(
        result.issues.some((entry) => entry.code === "LOCK_LAYOUT_CONTEXT"),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("malformed ignore authority is a typed refusal, never a caught throw", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    let result: ReturnType<typeof validateApplyPlan> | undefined;
    assert.doesNotThrow(() => {
      result = validateApplyPlan({
        ...plan,
        ignoreFiles: {} as unknown as readonly string[],
      });
    });
    assert.ok(result);
    assert.equal(result?.ok, false);
    if (result && !result.ok) {
      assert.ok(
        result.issues.some((entry) => entry.code === "PLAN_IGNORE_INVALID"),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("an exported recovery cleanup-directory failure is a typed partial outcome", () => {
  withRoot((root) => {
    const readset = captureReadset(root, [], []);
    assert.equal(readset.ok, true);
    if (!readset.ok) return;
    const tid = "77777777-7777-4777-8777-777777777777";
    write(
      root,
      journalPath(STATE, tid),
      JSON.stringify({
        schemaVersion: 1,
        transactionId: tid,
        rootIdentity: identityDigest(readset.value.root),
        planDigest: "b".repeat(64),
        phase: "planned",
        operations: [],
        lock: null,
      }),
    );
    const result = recoverTransaction(
      root,
      STATE,
      tid,
      ROOTS,
      faultAt("recovery:cleanup-dir", "review actual recovery rmdir EIO"),
    );
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.ok(
      result.issues.some((entry) => entry.code === "RECOVERY_CLEANUP_FAILED"),
      JSON.stringify(result.issues),
    );
  });
});

test("guarded apply refuses a dead writer and restarts after operator resolution", () => {
  withRoot((root) => {
    // A prior writer is killed after staging but before its replacement, so it
    // leaves a prepared journal and staged bytes behind.
    const killed = runWorker({
      mode: "kill",
      root,
      stateDir: STATE,
      transactionId: "1616161616161616",
      boundary: "replace:apply",
    });
    assert.equal(killed.signal, "SIGKILL", killed.stderr);
    // A dead coordinator left its writer lock behind.
    mkdirSync(abs(root, writerLockDir(STATE)), { recursive: true });
    writeFileSync(
      abs(root, `${writerLockDir(STATE)}/owner.json`),
      JSON.stringify({
        schemaVersion: 1,
        transactionId: "1717171717171717",
        pid: 2147483646,
      }),
    );
    const first = validateApplyPlan(makePlan(root));
    assert.equal(first.ok, true, JSON.stringify(first));
    if (!first.ok) return;
    const busy = applyPlan(first.value);
    assert.equal(busy.kind, "refused", JSON.stringify(busy.issues));
    assert.ok(
      busy.issues.some((entry) => entry.code === "WRITER_BUSY"),
      JSON.stringify(busy.issues),
    );
    assert.equal(
      existsSync(abs(root, journalPath(STATE, "1616161616161616"))),
      true,
    );

    // The documented bounded operator step removes only the orphaned lock; a
    // fresh observation/planning pass then restarts through the guarded core,
    // which recovers the killed writer's transaction before applying.
    clearOrphanedWriterLock(root, STATE);
    const restart = validateApplyPlan(makePlan(root));
    assert.equal(restart.ok, true, JSON.stringify(restart));
    if (!restart.ok) return;
    const outcome = applyPlan(restart.value);
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.equal(
      existsSync(abs(root, journalPath(STATE, "1616161616161616"))),
      false,
    );
  });
});
