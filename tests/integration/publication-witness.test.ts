import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  GUARDED_STYLES,
  lockJson,
  makeGuardedPlan,
  write,
} from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-3: unique publication from a physical rename witness.
 *
 * Byte equality is never proof of publication: a same-byte interruption before
 * the canonical rename must not be reported as committed, and a post-rename
 * lock edit must not authorize rolling back the committed source.
 */

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-publication-witness-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function sealed(plan: unknown) {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

test("a same-byte interruption before the rename is not a false commit", () => {
  withRoot((root) => {
    // Seed the canonical lock with exactly the planned publication bytes, so a
    // digest-only classification would wrongly report a commit.
    const bytes = new TextDecoder().decode(lockJson("d".repeat(64)));
    write(root, lockPath(GUARDED_STATE), bytes);
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          throw new Error("interruption before canonical rename");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
    assert.equal(
      readFileSync(abs(root, lockPath(GUARDED_STATE)), "utf8"),
      bytes,
    );
  });
});

test("a post-publication lock edit does not roll back committed source", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary === "lock:publish") {
          write(root, lockPath(GUARDED_STATE), "edited after publication");
          throw new Error("post-publication interruption");
        }
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
    assert.equal(
      readFileSync(abs(root, lockPath(GUARDED_STATE)), "utf8"),
      "edited after publication",
    );
  });
});
