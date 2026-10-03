import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import type { ApplyPlanInput, ApplyTarget } from "../../src/codegen/apply.js";
import { captureReadset } from "../../src/codegen/authority.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import { abs, lockJson } from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-2: owned creation and empty-only rollback of absent generated
 * ancestry. A fresh install creates directories that did not exist; a refused
 * attempt must remove only the empty directories it made and leave no residue.
 */

const UI_DIR = "src/lib/components/ui";
const STYLES_DIR = "src/styles";
const LAYOUT_FILE = "src/routes/+layout.svelte";
const STATE_DIR = `${UI_DIR}/_kit`;

function enc(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

function emptyTreePlan(root: string): ApplyPlanInput {
  const targets: ApplyTarget[] = [
    {
      path: `${UI_DIR}/button.svelte`,
      operation: "create",
      bytes: enc("<button />\n"),
      mode: 0o644,
      preimage: capturePreimage(root, `${UI_DIR}/button.svelte`),
    },
    {
      path: `${STYLES_DIR}/kit.css`,
      operation: "create",
      bytes: enc("css\n"),
      mode: 0o644,
      preimage: capturePreimage(root, `${STYLES_DIR}/kit.css`),
    },
    {
      path: LAYOUT_FILE,
      operation: "create",
      bytes: enc("<layout />\n"),
      mode: 0o644,
      preimage: capturePreimage(root, LAYOUT_FILE),
    },
  ];
  const readset = captureReadset(
    root,
    [...targets.map((target) => target.path), lockPath(STATE_DIR)],
    [],
  );
  assert.equal(readset.ok, true, JSON.stringify(readset));
  if (!readset.ok) throw new Error("readset failed");
  return {
    root,
    stateDir: STATE_DIR,
    uiDir: UI_DIR,
    stylesDir: STYLES_DIR,
    layoutFile: LAYOUT_FILE,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    readset: readset.value,
    targets,
    lock: {
      bytes: lockJson("d".repeat(64)),
      preimage: capturePreimage(root, lockPath(STATE_DIR)),
    },
  };
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
      readFileSync(abs(root, `${UI_DIR}/button.svelte`), "utf8"),
      "<button />\n",
    );
    assert.equal(
      readFileSync(abs(root, `${STYLES_DIR}/kit.css`), "utf8"),
      "css\n",
    );
    assert.equal(existsSync(abs(root, lockPath(STATE_DIR))), true);
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
