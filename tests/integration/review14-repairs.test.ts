import { capturedFixtureInit } from "../helpers/guarded-plan.js";
import assert from "node:assert/strict";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  validateApplyPlan,
  type ApplyPlanInput,
} from "../../src/codegen/apply.js";
import {
  captureReadset,
  identityDigest,
  type PlanInstalledRead,
} from "../../src/codegen/authority.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { revalidatePreimages } from "../../src/codegen/revalidate.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import {
  recoverTransaction,
  recoverTransactions,
} from "../../src/codegen/recovery.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  transactionsDir,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";
import {
  captureEnvironment,
  type CapturedEnvironment,
} from "../../src/project/environment.js";
import { DEFAULT_KIT_CONFIG } from "../../src/project/config.js";

import type { PlanWrite } from "../../src/codegen/plan.js";
import { validKitConfigBytes } from "../helpers/kit-config.js";

/**
 * RCLD04 review-14 regression coverage. Each case proves a distinct safety
 * property with repository-owned deterministic input: installed resolution
 * authority, captured ignore authority and its recovery role, created-directory
 * scope, acquired-handle coordination, release-failure reporting, full mapping
 * context in guarded lock validation, and witness plan-identity binding.
 */

const UI = "src/lib/components/ui";
const STYLES = "src/styles";
const LAYOUT = "src/routes/+layout.svelte";
const STATE = `${UI}/_kit`;
const ROOTS = { uiDir: UI, stylesDir: STYLES, layoutFile: LAYOUT };

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function write(root: string, logical: string, data: string): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, data);
}

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-review14-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function lockBytes(configHash: string): Uint8Array {
  return new TextEncoder().encode(
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
      integrations: [],
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
      dependencies: { svelte: "5.57.1" },
    }),
  );
}

function writeManifest(targetRoot: string, version: string): void {
  write(
    targetRoot,
    "node_modules/svelte/package.json",
    JSON.stringify({ name: "svelte", version }),
  );
}

function makePlan(root: string): ApplyPlanInput {
  write(
    root,
    STATE + "/kit.json",
    Buffer.from(validKitConfigBytes(ROOTS)).toString("utf8"),
  );
  write(
    root,
    lockPath(STATE),
    Buffer.from(lockBytes("c".repeat(64))).toString("utf8"),
  );
  return capturedFixtureInit(root, { ...DEFAULT_KIT_CONFIG, ...ROOTS });
}

function validatedPlan(root: string) {
  const result = validateApplyPlan(makePlan(root));
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

test("installed resolution drift, nearer shadowing and link retarget are refused", () => {
  withRoot((base) => {
    const root = path.join(base, "consumer");
    mkdirSync(root, { recursive: true });
    seedPackage(root);
    writeManifest(base, "5.57.1");
    const environment = captureEnvironment(root);
    const installed = installedReads(environment);
    assert.equal(
      revalidatePreimages(root, [], { installed }).ok,
      true,
      "an unchanged resolution passes",
    );

    // Hoisted manifest changed bytes after capture.
    writeManifest(base, "4.2.0");
    const drifted = revalidatePreimages(root, [], { installed });
    assert.equal(drifted.ok, false);
    if (!drifted.ok) {
      assert.equal(drifted.issues[0].code, "AUTHORITY_INSTALLED_CHANGED");
    }
  });

  withRoot((base) => {
    const root = path.join(base, "consumer");
    mkdirSync(root, { recursive: true });
    seedPackage(root);
    writeManifest(base, "5.57.1");
    const environment = captureEnvironment(root);
    const installed = installedReads(environment);

    // A nearer incompatible install appears after capture.
    writeManifest(root, "4.2.0");
    const shadowed = revalidatePreimages(root, [], { installed });
    assert.equal(shadowed.ok, false);
    if (!shadowed.ok) {
      assert.equal(shadowed.issues[0].code, "AUTHORITY_INSTALLED_CHANGED");
    }
  });

  withRoot((base) => {
    const root = path.join(base, "consumer");
    mkdirSync(root, { recursive: true });
    seedPackage(root);
    write(
      root,
      "store/a/package.json",
      JSON.stringify({ name: "svelte", version: "5.57.1" }),
    );
    write(
      root,
      "store/b/package.json",
      JSON.stringify({ name: "svelte", version: "5.57.1" }),
    );
    mkdirSync(abs(root, "node_modules"), { recursive: true });
    symlinkSync("../store/a", abs(root, "node_modules/svelte"), "dir");
    const environment = captureEnvironment(root);
    const installed = installedReads(environment);

    // Retarget the dependency link while the manifest bytes stay equal.
    unlinkSync(abs(root, "node_modules/svelte"));
    symlinkSync("../store/b", abs(root, "node_modules/svelte"), "dir");
    const retargeted = revalidatePreimages(root, [], { installed });
    assert.equal(retargeted.ok, false);
    if (!retargeted.ok) {
      assert.equal(retargeted.issues[0].code, "AUTHORITY_INSTALLED_CHANGED");
    }
  });
});

test("an unobserved required ignore file is a typed compose refusal", () => {
  withRoot((root) => {
    seedPackage(root);
    write(root, `${STATE}/kit.json`, "old config");
    const snapshot = captureSnapshot(root, [
      `${STATE}/kit.json`,
      lockPath(STATE),
      "package.json",
    ]);
    assert.equal(snapshot.ok, true, JSON.stringify(snapshot));
    if (!snapshot.ok) return;
    const writes: PlanWrite[] = [
      {
        path: `${STATE}/kit.json`,
        operation: "update",
        bytes: new TextEncoder().encode("new config\n"),
      },
      {
        path: lockPath(STATE),
        operation: "create",
        bytes: lockBytes("d".repeat(64)),
      },
    ];
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      writes,
      snapshot: snapshot.value,
    });
    assert.equal(composed.ok, false);
    if (!composed.ok) {
      assert.equal(composed.issues[0].code, "COMPOSE_IGNORE_UNOBSERVED");
    }
  });
});

test("a composed guarded ignore operation recovers without an unapproved-target refusal", () => {
  withRoot((root) => {
    seedPackage(root);
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "consumer",
        type: "module",
        dependencies: { svelte: "5.57.1", "@sveltejs/kit": "2.70.3" },
      }),
    );
    write(
      root,
      `${STATE}/kit.json`,
      Buffer.from(validKitConfigBytes(ROOTS)).toString("utf8"),
    );
    const composed = {
      ok: true as const,
      value: capturedFixtureInit(root, DEFAULT_KIT_CONFIG, false),
    };
    assert.deepEqual(composed.value.ignoreFiles, [".gitignore"]);
    const validated = validateApplyPlan(composed.value);
    assert.equal(validated.ok, true, JSON.stringify(validated));
    if (!validated.ok) return;
    const outcome = applyPlan(
      validated.value,
      faultAt("replace:apply", "review interruption before replacement"),
    );
    assert.equal(outcome.kind, "refused");
    assert.equal(
      outcome.issues.some(
        (entry) => entry.code === "JOURNAL_TARGET_UNAPPROVED",
      ),
      false,
      JSON.stringify(outcome.issues),
    );
    assert.equal(existsSync(abs(root, ".gitignore")), false);
    assert.equal(existsSync(abs(root, `${STATE}/kit.json`)), true);
  });
});

test("an unapproved created-directory claim refuses and preserves the directory", () => {
  withRoot((root) => {
    const unrelated = abs(root, "unrelated-empty");
    mkdirSync(unrelated, { recursive: true });
    const stats = lstatSync(unrelated);
    const readset = captureReadset(root, [], []);
    assert.equal(readset.ok, true);
    if (!readset.ok) return;
    const tid = "11111111-1111-4111-8111-111111111111";
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
        createdDirs: [
          { path: "unrelated-empty", device: stats.dev, inode: stats.ino },
        ],
      }),
    );
    const result = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(result.status, "refused");
    assert.ok(
      result.issues.some(
        (entry) => entry.code === "RECOVERY_CREATED_DIR_UNAPPROVED",
      ),
      JSON.stringify(result.issues),
    );
    assert.equal(existsSync(unrelated), true);
  });
});

test("a foreign owner record naming this PID does not bypass acquisition", () => {
  withRoot((root) => {
    const readset = captureReadset(root, [], []);
    assert.equal(readset.ok, true);
    if (!readset.ok) return;
    const tid = "22222222-2222-4222-8222-222222222222";
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
    write(
      root,
      `${writerLockDir(STATE)}/owner.json`,
      JSON.stringify({
        schemaVersion: 1,
        transactionId: "33333333-3333-4333-8333-333333333333",
        pid: process.pid,
      }),
    );
    const result = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(result.status, "refused");
    assert.ok(
      result.issues.some((entry) => entry.code === "WRITER_BUSY"),
      JSON.stringify(result.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);
  });
});

test("a standalone recovery release failure is reported with retained evidence", () => {
  withRoot((root) => {
    const plan = validatedPlan(root);
    const outcome = applyPlan(
      plan,
      faultAt("cleanup:staged", "review interruption"),
    );
    assert.equal(outcome.kind, "committed_needs_cleanup");
    const recovery = recoverTransactions(root, STATE, ROOTS, {
      before: (boundary) => {
        if (boundary === "recovery:cleanup") {
          write(
            root,
            `${writerLockDir(STATE)}/unexpected.txt`,
            "preserve owner evidence",
          );
        }
      },
    });
    assert.ok(
      recovery.some((entry) =>
        entry.issues.some(
          (issue) => issue.code === "WRITER_LOCK_RELEASE_FAILED",
        ),
      ),
      JSON.stringify(recovery),
    );
    assert.equal(
      existsSync(abs(root, `${writerLockDir(STATE)}/owner.json`)),
      true,
    );
  });
});

test("guarded lock validation enforces the approved UI mapping context", () => {
  withRoot((root) => {
    const plan = makePlan(root);
    const parsed = JSON.parse(Buffer.from(plan.lock.bytes).toString("utf8"));
    parsed.requested = ["button"];
    parsed.items = [
      {
        id: "button",
        version: "0.1.0",
        digest: "a".repeat(64),
        origin: "explicit",
      },
    ];
    parsed.files = [
      {
        path: "unrelated/button.svelte",
        owner: "button",
        baseHash: "a".repeat(64),
        itemVersion: "0.1.0",
        cohort: "core",
      },
    ];
    const result = validateApplyPlan({
      ...plan,
      lock: {
        bytes: new TextEncoder().encode(`${JSON.stringify(parsed)}\n`),
        preimage: plan.lock.preimage,
      },
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.issues.some((entry) => entry.code === "LOCK_NAMESPACE"),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("a publication witness with a contradictory plan digest is preserved", () => {
  withRoot((root) => {
    const plan = validatedPlan(root);
    const outcome = applyPlan(
      plan,
      faultAt("cleanup:staged", "review interruption"),
    );
    assert.equal(outcome.kind, "committed_needs_cleanup");
    const id = readFileSyncJournalId(root);
    const intentPath = publicationIntentPath(STATE, id);
    const witness = JSON.parse(readFileSync(abs(root, intentPath), "utf8"));
    witness.planDigest = "f".repeat(64);
    write(root, intentPath, `${JSON.stringify(witness)}\n`);

    const recovery = recoverTransactions(root, STATE, ROOTS);
    const refused = recovery.find((entry) => entry.status === "refused");
    assert.ok(refused, JSON.stringify(recovery));
    assert.ok(
      refused?.issues.some(
        (entry) => entry.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(recovery),
    );
    assert.equal(existsSync(abs(root, intentPath)), true);
  });
});

test("a stale dead-writer lock refuses automatically before the bounded manual step", () => {
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
    // A lock owned by a process that is not running is still never reclaimed
    // automatically: PID/age is not proof that no writer is live.
    write(
      root,
      `${writerLockDir(STATE)}/owner.json`,
      JSON.stringify({
        schemaVersion: 1,
        transactionId: "55555555-5555-4555-8555-555555555555",
        pid: 2147483646,
      }),
    );
    const refused = recoverTransaction(root, STATE, tid, ROOTS);
    assert.equal(refused.status, "refused");
    assert.ok(
      refused.issues.some((entry) => entry.code === "WRITER_BUSY"),
      JSON.stringify(refused.issues),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), true);

    // The documented bounded operator step removes only the coordination
    // directory; the guarded boundary then recovers the retained transaction.
    rmSync(abs(root, writerLockDir(STATE)), { recursive: true, force: true });
    const recovered = recoverTransaction(root, STATE, tid, ROOTS);
    assert.ok(
      recovered.status === "cleaned" || recovered.status === "rolled_back",
      JSON.stringify(recovered),
    );
    assert.equal(existsSync(abs(root, journalPath(STATE, tid))), false);
  });
});

function readFileSyncJournalId(root: string): string {
  const dir = abs(root, transactionsDir(STATE));
  const entries = readdirSync(dir);
  const id = entries.find((entry) => /^[0-9a-f-]{16,}$/.test(entry));
  assert.ok(id, "expected an owned transaction directory");
  return id as string;
}
