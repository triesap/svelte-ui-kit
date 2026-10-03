import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import {
  abs,
  GUARDED_STYLES,
  makeGuardedPlan,
} from "../helpers/guarded-plan.js";

/**
 * RCLD04-R2-2: durable write ordering across staging, backup, replacement, lock
 * publication and recovery. The hooks expose the exact protocol order so the
 * flush placement is causally verified rather than asserted in prose.
 */

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-durability-"));
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

function first(events: readonly string[], name: string): number {
  const index = events.indexOf(name);
  assert.ok(index >= 0, `missing boundary ${name}: ${events.join(",")}`);
  return index;
}

test("staged bytes are flushed before the staged image can be renamed", () => {
  withRoot((root) => {
    const events: string[] = [];
    const outcome = applyPlan(sealed(makeGuardedPlan(root)), {
      before: (boundary) => events.push(`before:${boundary}`),
      after: (boundary) => events.push(`after:${boundary}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.ok(
      first(events, "after:durability:stage") <
        first(events, "before:replace:apply"),
      events.join(","),
    );
    assert.ok(
      first(events, "after:stage:write") <
        first(events, "before:durability:stage"),
      events.join(","),
    );
  });
});

test("backup and replacement directory flushes bracket the renames", () => {
  withRoot((root) => {
    const events: string[] = [];
    const outcome = applyPlan(sealed(makeGuardedPlan(root)), {
      before: (boundary) => events.push(`before:${boundary}`),
      after: (boundary) => events.push(`after:${boundary}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    assert.ok(
      first(events, "before:backup:move") <
        first(events, "before:durability:backup"),
      events.join(","),
    );
    assert.ok(
      first(events, "after:durability:backup") <
        first(events, "after:backup:move"),
      events.join(","),
    );
    assert.ok(
      first(events, "after:durability:backup") <
        first(events, "before:replace:apply"),
      events.join(","),
    );
    assert.ok(
      first(events, "before:replace:apply") <
        first(events, "before:durability:replace"),
      events.join(","),
    );
    assert.ok(
      first(events, "after:durability:replace") <
        first(events, "after:replace:apply"),
      events.join(","),
    );
  });
});

test("lock staging and publication flushes bracket the canonical rename", () => {
  withRoot((root) => {
    const events: string[] = [];
    const outcome = applyPlan(sealed(makeGuardedPlan(root)), {
      before: (boundary) => events.push(`before:${boundary}`),
      after: (boundary) => events.push(`after:${boundary}`),
    });
    assert.equal(outcome.kind, "applied", JSON.stringify(outcome.issues));
    // Staged lock bytes are flushed before the rename begins.
    assert.ok(
      first(events, "after:durability:lock-stage") <
        first(events, "before:lock:publish"),
      events.join(","),
    );
    // The canonical directory is flushed after the rename and before the
    // publication boundary completes.
    assert.ok(
      first(events, "before:lock:publish") <
        first(events, "before:durability:lock-publish"),
      events.join(","),
    );
    assert.ok(
      first(events, "before:durability:lock-publish") <
        first(events, "after:lock:publish"),
      events.join(","),
    );
  });
});

test("a flush failure at the replacement boundary rolls back safely", () => {
  withRoot((root) => {
    const outcome = applyPlan(
      sealed(makeGuardedPlan(root)),
      faultAt("durability:replace"),
    );
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});
