import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
  type Stats,
} from "node:fs";
import fsDefault from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyPlanInput,
} from "../../src/codegen/apply.js";
import { captureReadset, identityDigest } from "../../src/codegen/authority.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import {
  recoverTransaction,
  type RecoveryResult,
  type RecoveryRoots,
} from "../../src/codegen/recovery.js";
import {
  journalPath,
  lockPath,
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  acquireWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { validKitConfigBytes } from "../helpers/kit-config.js";

/**
 * RCLD-04 review-16 regression coverage. Each case reproduces one independently
 * observed original-criteria defect with repository-owned deterministic input:
 *
 * 1. same bytes/id at a new physical owner is not acquired authority;
 * 2. planned recovery propagates created-directory identity contradictions;
 * 3. planned recovery propagates post-removal durability faults;
 * 4. recovery cleanup flushes the transaction/journal/transient parents;
 * 5. partial initial coordination creation accounts for and rolls back ancestry;
 * 6/7. stylesheet and exports integrations must match their mapped roles;
 * 8. an actual restore rename failure is a typed partial outcome;
 * 9. failed-release restoration never overwrites a new unrelated owner;
 * 10. malformed nested target-preimage shape is refused before serialization.
 */

const UI = "src/lib/components/ui";
const STYLES = "src/styles";
const LAYOUT = "src/routes/+layout.svelte";
const STATE = `${UI}/_kit`;
const ROOTS: RecoveryRoots = {
  uiDir: UI,
  stylesDir: STYLES,
  layoutFile: LAYOUT,
};

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));
const enc = (value: string): Uint8Array => new TextEncoder().encode(value);

function write(root: string, logical: string, data: string | Uint8Array): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-review16-"));
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

function journalRecord(
  root: string,
  tid: string,
  more: Record<string, unknown> = {},
): string {
  const readset = captureReadset(root, [], []);
  assert.equal(readset.ok, true);
  if (!readset.ok) throw new Error("readset capture failed");
  return JSON.stringify({
    schemaVersion: 1,
    transactionId: tid,
    rootIdentity: identityDigest(readset.value.root),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [],
    lock: null,
    ...more,
  });
}

/** A minimal valid plan with one CSS update. */
function makePlan(root: string): ApplyPlanInput {
  const css = `${STYLES}/kit.css`;
  write(root, css, "old css");
  const configBytes = validKitConfigBytes(ROOTS);
  const configPath = `${STATE}/kit.json`;
  write(root, configPath, configBytes);
  write(
    root,
    lockPath(STATE),
    Buffer.from(lockBytes(sha256Hex(configBytes))).toString(),
  );
  const readset = captureReadset(root, [css, lockPath(STATE)], [configPath]);
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
    targets: [
      {
        path: css,
        operation: "update",
        bytes: enc("new css"),
        mode: 0o644,
        preimage: capturePreimage(root, css),
      },
    ],
    lock: {
      bytes: lockBytes(sha256Hex(configBytes)),
      preimage: capturePreimage(root, lockPath(STATE)),
    },
  };
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

test("same bytes at a new physical owner inode is not acquired authority", () => {
  withRoot((root) => {
    makePlan(root);
    const tid = "44444444-4444-4444-8444-444444444444";
    const acquired = acquireWriterLock(
      root,
      STATE,
      "55555555-5555-4555-8555-555555555555",
    );
    assert.equal(acquired.ok, true, JSON.stringify(acquired));
    if (!acquired.ok) return;
    const owner = abs(root, `${writerLockDir(STATE)}/owner.json`);
    const before = readFileSync(owner);
    const inode = lstatSync(owner).ino;
    // Replace with byte-identical content at a different inode.
    writeFileSync(`${owner}.new`, before);
    fsDefault.renameSync(`${owner}.new`, owner);
    assert.notEqual(lstatSync(owner).ino, inode);
    write(root, journalPath(STATE, tid), journalRecord(root, tid));
    const result = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.ok(
      result.issues.some((entry) => entry.code === "WRITER_LOCK_CONTRADICTED"),
      JSON.stringify(result.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);
    releaseWriterLock(acquired.value);
  });
});

test("planned recovery refuses a created-directory identity contradiction", () => {
  withRoot((root) => {
    makePlan(root);
    const logical = STYLES;
    const stats = lstatSync(abs(root, logical));
    const tid = "44444444-4444-4444-8444-444444444444";
    write(
      root,
      journalPath(STATE, tid),
      journalRecord(root, tid, {
        operations: [
          {
            path: `${logical}/x.css`,
            operation: "create",
            preimage: { kind: "absent", digest: null, mode: null },
            resultDigest: sha256Hex(enc("x")),
            resultMode: 0o644,
            backupId: null,
            stagedId: "x",
            applied: false,
          },
        ],
        createdDirs: [
          { path: logical, device: stats.dev, inode: stats.ino + 999 },
        ],
      }),
    );
    const result = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.ok(
      result.issues.some(
        (entry) => entry.code === "RECOVERY_CREATED_DIR_IDENTITY",
      ),
      JSON.stringify(result.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);
  });
});

test("planned recovery refuses a post-removal ancestry flush fault", () => {
  withRoot((root) => {
    makePlan(root);
    const logical = `${STYLES}/unused`;
    mkdirSync(abs(root, logical));
    const stats = lstatSync(abs(root, logical));
    const tid = "44444444-4444-4444-8444-444444444444";
    write(
      root,
      journalPath(STATE, tid),
      journalRecord(root, tid, {
        operations: [
          {
            path: `${logical}/x.css`,
            operation: "create",
            preimage: { kind: "absent", digest: null, mode: null },
            resultDigest: sha256Hex(enc("x")),
            resultMode: 0o644,
            backupId: null,
            stagedId: "x",
            applied: false,
          },
        ],
        createdDirs: [{ path: logical, device: stats.dev, inode: stats.ino }],
      }),
    );
    let active = false;
    let fired = false;
    const original = fsDefault.fsyncSync;
    fsDefault.fsyncSync = ((fd: number) => {
      if (active && !fired) {
        fired = true;
        throw Object.assign(new Error("review actual ancestry fsync EIO"), {
          code: "EIO",
        });
      }
      return original(fd);
    }) as typeof fsDefault.fsyncSync;
    syncBuiltinESMExports();
    let result: RecoveryResult | undefined;
    try {
      result = recoverTransaction(root, STATE, tid, ROOTS, {
        before: (boundary) => {
          if (boundary === "durability:owned-remove") active = true;
        },
      });
    } finally {
      fsDefault.fsyncSync = original;
      syncBuiltinESMExports();
    }
    assert.equal(fired, true);
    assert.equal(result?.status, "refused", JSON.stringify(result));
    assert.ok(
      result?.issues.some(
        (entry) => entry.code === "RECOVERY_ANCESTRY_FLUSH_FAILED",
      ),
      JSON.stringify(result?.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);
  });
});

test("recovery cleanup flushes the transaction and transient parents", () => {
  withRoot((root) => {
    makePlan(root);
    const tid = "44444444-4444-4444-8444-444444444444";
    write(root, journalPath(STATE, tid), journalRecord(root, tid));
    const seen: string[] = [];
    const originalFsync = fsDefault.fsyncSync;
    const originalOpen = fsDefault.openSync;
    const originalClose = fsDefault.closeSync;
    const fds = new Map<number, string>();
    fsDefault.openSync = ((target: string, ...args: unknown[]) => {
      const fd = (originalOpen as (...inner: unknown[]) => number)(
        target,
        ...args,
      );
      fds.set(fd, String(target));
      return fd;
    }) as typeof fsDefault.openSync;
    fsDefault.closeSync = ((fd: number) => {
      fds.delete(fd);
      return originalClose(fd);
    }) as typeof fsDefault.closeSync;
    fsDefault.fsyncSync = ((fd: number) => {
      seen.push(fds.get(fd) ?? String(fd));
      return originalFsync(fd);
    }) as typeof fsDefault.fsyncSync;
    syncBuiltinESMExports();
    let result: RecoveryResult | undefined;
    try {
      result = recoverTransaction(root, STATE, tid, ROOTS);
    } finally {
      fsDefault.fsyncSync = originalFsync;
      fsDefault.openSync = originalOpen;
      fsDefault.closeSync = originalClose;
      syncBuiltinESMExports();
    }
    assert.equal(result?.status, "cleaned", JSON.stringify(result));
    assert.ok(
      seen.includes(abs(root, transactionsDir(STATE))),
      JSON.stringify(seen.map((entry) => entry.replace(root, ""))),
    );
  });
});

test("partial initial coordination creation rolls back owned empty ancestry", () => {
  withRoot((root) => {
    const config = { ...DEFAULT_KIT_CONFIG, uiDir: "app/ui" };
    const derived = deriveKitPaths(config);
    let active = false;
    let fired = false;
    const original = fsDefault.fsyncSync;
    fsDefault.fsyncSync = ((fd: number) => {
      if (active && !fired) {
        fired = true;
        throw Object.assign(new Error("review actual initial fsync EIO"), {
          code: "EIO",
        });
      }
      return original(fd);
    }) as typeof fsDefault.fsyncSync;
    syncBuiltinESMExports();
    let result: ReturnType<typeof acquireWriterLock>;
    try {
      result = acquireWriterLock(
        root,
        derived.stateDir,
        "55555555-5555-4555-8555-555555555555",
        {
          before: (boundary) => {
            if (boundary === "durability:owned-create") active = true;
          },
        },
      );
    } finally {
      fsDefault.fsyncSync = original;
      syncBuiltinESMExports();
    }
    assert.equal(fired, true);
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.deepEqual(readdirSync(root), []);
  });
});

for (const [kind, code, contract] of [
  ["stylesheet", "LOCK_STYLESHEET_CONTEXT", "stylesheet-v1"],
  ["exports", "LOCK_EXPORTS_CONTEXT", "exports-v1"],
] as const) {
  test(`a ${kind} integration at an unrelated path is refused`, () => {
    withRoot((root) => {
      const plan = metadataOnlyPlan(root);
      const parsed = JSON.parse(Buffer.from(plan.lock.bytes).toString("utf8"));
      parsed.integrations = [
        { kind, path: "notes.txt", baseline: "a".repeat(64), contract },
      ];
      const result = validateApplyPlan({
        ...plan,
        lock: {
          ...plan.lock,
          bytes: lockBytes("d".repeat(64), parsed.integrations),
        },
      });
      assert.equal(result.ok, false, JSON.stringify(result));
      if (!result.ok) {
        assert.ok(
          result.issues.some((entry) => entry.code === code),
          JSON.stringify(result.issues),
        );
      }
    });
  });
}

test("an actual exported restore rename failure is a typed partial outcome", () => {
  withRoot((root) => {
    const validated = validateApplyPlan(makePlan(root));
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    let tid: string | undefined;
    const seed = applyPlan(validated.value, {
      before: (boundary) => {
        if (boundary === "replace:apply") {
          tid = readdirSync(abs(root, transactionsDir(STATE)))[0];
          throw new Error("interrupt before replacement");
        }
        if (boundary === "recovery:restore") {
          throw new Error("retain prepared recovery");
        }
      },
    });
    assert.ok(tid, JSON.stringify(seed));
    if (!tid) return;
    const css = abs(root, `${STYLES}/kit.css`);
    const original = fsDefault.renameSync;
    let fired = false;
    fsDefault.renameSync = ((from: string, to: string) => {
      if (String(to) === css) {
        fired = true;
        throw Object.assign(new Error("review actual restore EIO"), {
          code: "EIO",
        });
      }
      return original(from, to);
    }) as typeof fsDefault.renameSync;
    syncBuiltinESMExports();
    let result: RecoveryResult | undefined;
    assert.doesNotThrow(() => {
      try {
        result = recoverTransaction(root, STATE, tid as string, ROOTS);
      } finally {
        fsDefault.renameSync = original;
        syncBuiltinESMExports();
      }
    });
    assert.equal(fired, true);
    assert.equal(result?.status, "refused", JSON.stringify(result));
    assert.ok(
      result?.issues.some((entry) => entry.code === "RECOVERY_RESTORE_FAILED"),
      JSON.stringify(result?.issues),
    );
  });
});

test("failed-release restoration never overwrites a new unrelated owner", () => {
  withRoot((root) => {
    makePlan(root);
    const acquired = acquireWriterLock(
      root,
      STATE,
      "55555555-5555-4555-8555-555555555555",
    );
    assert.equal(acquired.ok, true, JSON.stringify(acquired));
    if (!acquired.ok) return;
    const owner = abs(root, `${writerLockDir(STATE)}/owner.json`);
    const foreign = `${JSON.stringify({
      schemaVersion: 1,
      transactionId: "66666666-6666-4666-8666-666666666666",
      pid: process.pid + 1,
    })}\n`;
    const result = releaseWriterLock(acquired.value, {
      before: (boundary) => {
        if (boundary === "durability:release") {
          writeFileSync(owner, foreign);
          throw new Error("retain contradictory owner on release failure");
        }
      },
    });
    assert.equal(result.ok, false, JSON.stringify(result));
    assert.equal(readFileSync(owner, "utf8"), foreign);
  });
});

test("guarded apply refuses a cross-device state directory with no semantic writes", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    const readset = {
      ...plan.readset,
      ancestors: plan.readset.ancestors.filter(
        (ancestor) => ancestor.path !== STATE,
      ),
    };
    const validated = validateApplyPlan({ ...plan, readset });
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const cssBefore = readFileSync(abs(root, `${STYLES}/kit.css`), "utf8");
    const lockBefore = readFileSync(abs(root, lockPath(STATE)), "utf8");
    const outcome = withForeignStateDevice(root, () =>
      applyPlan(validated.value),
    );
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((entry) => entry.code === "STAGE_CROSS_DEVICE"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${STYLES}/kit.css`), "utf8"),
      cssBefore,
    );
    assert.equal(readFileSync(abs(root, lockPath(STATE)), "utf8"), lockBefore);
    assert.equal(existsSync(abs(root, transactionsDir(STATE))), false);
  });
});

test("metadata-only guarded apply refuses a cross-device state directory", () => {
  withRoot((root) => {
    const plan = metadataOnlyPlan(root);
    const readset = {
      ...plan.readset,
      ancestors: plan.readset.ancestors.filter(
        (ancestor) => ancestor.path !== STATE,
      ),
    };
    const validated = validateApplyPlan({ ...plan, readset });
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const lockBefore = readFileSync(abs(root, lockPath(STATE)), "utf8");
    const outcome = withForeignStateDevice(root, () =>
      applyPlan(validated.value),
    );
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((entry) => entry.code === "STAGE_CROSS_DEVICE"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(readFileSync(abs(root, lockPath(STATE)), "utf8"), lockBefore);
    assert.equal(existsSync(abs(root, transactionsDir(STATE))), false);
  });
});

/**
 * Run `body` while the state directory observes a foreign device. This is a
 * deterministic, single-volume injection of the same observation the guarded
 * cross-device walk performs; it does not bypass coordination.
 */
function withForeignStateDevice<T>(root: string, body: () => T): T {
  const mutableFs = fsDefault as unknown as {
    lstatSync: typeof fsDefault.lstatSync;
  };
  const original = mutableFs.lstatSync;
  const stateAbs = abs(root, STATE);
  mutableFs.lstatSync = ((...args: Parameters<typeof lstatSync>) => {
    const stats = original(...args) as Stats;
    if (String(args[0]) === stateAbs) {
      Object.defineProperty(stats, "dev", { value: stats.dev + 1 });
    }
    return stats;
  }) as typeof fsDefault.lstatSync;
  syncBuiltinESMExports();
  try {
    return body();
  } finally {
    mutableFs.lstatSync = original;
    syncBuiltinESMExports();
  }
}

test("a malformed nested target preimage is a typed refusal, never a throw", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    const malformed = plan.targets[0];
    assert.ok(malformed);
    if (!malformed) return;
    const preimage = { ...malformed.preimage } as Record<string, unknown>;
    delete preimage["mode"];
    preimage["extra"] = "not approved";
    let result: ReturnType<typeof validateApplyPlan> | undefined;
    assert.doesNotThrow(() => {
      result = validateApplyPlan({
        ...plan,
        targets: [{ ...malformed, preimage: preimage as never }],
      });
    });
    assert.ok(result);
    assert.equal(result?.ok, false);
    if (result && !result.ok) {
      assert.ok(
        result.issues.some((entry) => entry.code === "PLAN_PREIMAGE_MISMATCH"),
        JSON.stringify(result.issues),
      );
    }
  });
});
