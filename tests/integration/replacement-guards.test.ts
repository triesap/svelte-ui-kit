import assert from "node:assert/strict";
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import {
  stagedDir,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  GUARDED_STYLES,
  makeGuardedPlan,
  write,
} from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-2: live/staged physical authority at replacement boundaries.
 *
 * A corrupted staged image and an observable intervening user edit are both
 * refused before publication, and the current application bytes are preserved.
 */

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-replace-guard-"));
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

test("a corrupted staged image is refused at replacement, not installed", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary !== "stage:verify") return;
        const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
        const staged = abs(root, stagedDir(GUARDED_STATE, ids[0] as string));
        for (const name of readdirSync(staged)) {
          writeFileSync(path.join(staged, name), "CORRUPTED STAGED IMAGE");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "REPLACE_STAGE_CORRUPT"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});

test("an edit at the backup boundary is refused and preserved", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const edited = "user edit after recheck";
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "backup:move") {
          write(root, `${GUARDED_STYLES}/kit.css`, edited);
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some((issue) => issue.code === "REPLACE_USER_EDIT"),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      edited,
    );
  });
});
