import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import {
  stagedDir,
  lockPath,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  GUARDED_STYLES,
  makeGuardedPlan,
  lockJson,
  write,
} from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

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

for (const logical of [`${GUARDED_STYLES}/kit.css`, lockPath(GUARDED_STATE)]) {
  test(`an equal-byte physical replacement of ${logical} invalidates the original plan`, () => {
    withRoot((root) => {
      write(root, lockPath(GUARDED_STATE), lockJson("c".repeat(64)));
      const plan = sealed(makeGuardedPlan(root));
      const target = abs(root, logical);
      const bytes = readFileSync(target);
      renameSync(target, `${target}.original`);
      writeFileSync(target, bytes, { mode: 0o644 });
      const before = snapshotTree(root);
      const result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some((entry) => entry.code === "STALE_PLAN"),
        JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

for (const logical of ["", GUARDED_STYLES]) {
  test(`a post-planning mode edit of ${logical || "the root"} preserves the edited tree`, () => {
    withRoot((root) => {
      const plan = sealed(makeGuardedPlan(root));
      chmodSync(logical === "" ? root : abs(root, logical), 0o750);
      const before = snapshotTree(root);
      const result = applyPlan(plan);
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some((entry) => entry.code.startsWith("AUTHORITY_")),
        JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

test("removed or substituted original physical preimage evidence cannot seal a plan", () => {
  withRoot((root) => {
    const original = makeGuardedPlan(root);
    const index = original.targets.findIndex(
      (entry) => entry.preimage.kind === "file",
    );
    assert.ok(index >= 0);
    const target = original.targets[index];
    assert.ok(target.preimage.identity);
    const before = snapshotTree(root);
    for (const identity of [
      undefined,
      null,
      { device: -1, inode: 1 },
      {
        ...target.preimage.identity,
        inode: target.preimage.identity!.inode + 1,
      },
    ]) {
      const result = validateApplyPlan({
        ...original,
        targets: original.targets.map((entry, candidate) =>
          candidate === index
            ? {
                ...entry,
                preimage: { ...entry.preimage, identity },
              }
            : entry,
        ),
      });
      assert.equal(result.ok, false, JSON.stringify(result));
      assert.deepEqual(snapshotTree(root), before);
    }
  });
});

test("a corrupted staged image is refused at replacement, not installed", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary !== "replace:apply") return;
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
