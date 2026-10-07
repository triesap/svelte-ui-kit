import { capturedFixtureInit } from "../helpers/guarded-plan.js";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ApplyPlanInput } from "../../src/codegen/apply.js";
import { recoverTransactions } from "../../src/codegen/recovery.js";
import { DEFAULT_KIT_CONFIG } from "../../src/project/config.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import { abs } from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-2: owned creation and empty-only rollback of absent generated
 * ancestry. A fresh install creates directories that did not exist; a refused
 * attempt must remove only the empty directories it made and leave no residue.
 */

const UI_DIR = "src/lib/components/ui";
const STYLES_DIR = "src/styles";

const STATE_DIR = `${UI_DIR}/_kit`;

function emptyTreePlan(root: string): ApplyPlanInput {
  return capturedFixtureInit(root);
}

function sealed(plan: unknown) {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

test("a refused fresh install removes only the empty ancestry it created", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-owned-ancestry-"));
  try {
    const outcome = applyPlan(
      sealed(emptyTreePlan(root)),
      faultAt("durability:replace"),
    );
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    // Every directory this attempt created (the coordination chain and the
    // extra target ancestry) was empty after rollback and is removed.
    for (const logical of ["src", UI_DIR, STYLES_DIR, "src/routes"]) {
      assert.equal(
        existsSync(abs(root, logical)),
        false,
        `${logical} should have been removed`,
      );
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("a successful fresh install keeps its created ancestry and publishes", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-owned-ancestry-ok-"));
  try {
    const outcome = applyPlan(sealed(emptyTreePlan(root)));
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.equal(
      readFileSync(abs(root, `${UI_DIR}/index.ts`), "utf8").includes(
        "svelte-ui-kit:start exports",
      ),
      true,
    );
    assert.equal(
      readFileSync(abs(root, `${STYLES_DIR}/kit.css`), "utf8").includes(
        "svelte-ui-kit:start tokens",
      ),
      true,
    );
    assert.equal(existsSync(abs(root, lockPath(STATE_DIR))), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("fresh rollback cleanup can resume after its recorded empty directories were removed", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-rollback-cleanup-"));
  try {
    const plan = sealed(emptyTreePlan(root));
    const before = snapshotTree(root);
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "replace:apply")
          throw new Error("interrupt before semantic replacement");
        if (boundary === "recovery:cleanup")
          throw new Error("interrupt after owned-directory rollback");
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome));
    const recovered = recoverTransactions(root, STATE_DIR, DEFAULT_KIT_CONFIG);
    assert.ok(recovered.length > 0);
    assert.ok(
      recovered.every(
        (entry) => entry.status === "rolled_back" || entry.status === "cleaned",
      ),
      JSON.stringify(recovered),
    );
    assert.deepEqual(snapshotTree(root), before);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an unrelated directory appearing after planning is refused, not adopted", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-owned-ancestry-x-"));
  try {
    const plan = sealed(emptyTreePlan(root));
    // A user creates the styles directory after planning but before apply.
    mkdirSync(abs(root, STYLES_DIR), { recursive: true });
    const outcome = applyPlan(plan);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "AUTHORITY_ANCESTOR_APPEARED",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.equal(existsSync(abs(root, STYLES_DIR)), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("an owned-directory removal flush failure retains terminal proof for a clean retry", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-owned-flush-retry-"));
  try {
    const plan = sealed(emptyTreePlan(root));
    const initial = snapshotTree(root);
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "replace:apply")
          throw new Error("stop before replacement");
        if (boundary === "durability:owned-remove")
          throw new Error(
            "actual removed ancestor cannot yet be durably confirmed",
          );
      },
    });
    assert.equal(outcome.kind, "refused");
    const namespace = abs(root, `${STATE_DIR}/.svelte-ui-kit/transactions`);
    const [id] = readdirSync(namespace);
    assert.ok(id, "cleanup failure must retain restoration proof");
    const journal = JSON.parse(
      readFileSync(path.join(namespace, id, "journal.json"), "utf8"),
    );
    assert.equal(journal.phase, "rolled_back");
    const recovered = recoverTransactions(root, STATE_DIR, DEFAULT_KIT_CONFIG);
    assert.ok(
      recovered.every(
        (entry) => entry.status === "rolled_back" || entry.status === "cleaned",
      ),
      JSON.stringify(recovered),
    );
    assert.deepEqual(snapshotTree(root), initial);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
