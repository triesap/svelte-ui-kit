import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
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
      before: (boundary, detail) => {
        if (detail === `${GUARDED_STYLES}/kit.css`)
          events.push(`before:${boundary}`);
      },
      after: (boundary, detail) => {
        if (detail === `${GUARDED_STYLES}/kit.css`)
          events.push(`after:${boundary}`);
      },
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

test("a durability fault at every boundary yields a truthful safe outcome", () => {
  for (const boundary of [
    "durability:stage",
    "durability:backup",
    "durability:replace",
    "durability:lock-publish",
  ] as const) {
    withRoot((root) => {
      const outcome = applyPlan(
        sealed(makeGuardedPlan(root)),
        faultAt(boundary),
      );
      const css = readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8");
      assert.notEqual(outcome.kind, "applied", boundary);
      if (boundary === "durability:lock-publish") {
        // The canonical rename already happened: the batch is committed and
        // must not be reported as an uncommitted refusal.
        assert.equal(outcome.kind, "committed_needs_cleanup", boundary);
        assert.equal(
          css,
          "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
          boundary,
        );
      } else {
        assert.equal(outcome.kind, "refused", boundary);
        assert.equal(css, "old css", boundary);
      }
    });
  }
});

test("a fault before the publication witness is an ambiguity that never rolls back", () => {
  withRoot((root) => {
    const outcome = applyPlan(
      sealed(makeGuardedPlan(root)),
      faultAt("durability:lock-stage"),
    );
    // No physical rename witness exists yet, so publication is ambiguous: the
    // batch refuses, the canonical lock is not published, and evidence remains.
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.equal(existsSync(abs(root, lockPath(GUARDED_STATE))), false);
  });
});
