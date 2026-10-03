import assert from "node:assert/strict";
import {
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  applyPlan,
  derivePlanDigest,
  validateApplyPlan,
  type ApplyTarget,
  type ValidatedApplyPlan,
} from "../../src/codegen/apply.js";
import { capturePreimage } from "../../src/codegen/revalidate.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { lockPath } from "../../src/codegen/transaction-types.js";
import {
  abs,
  GUARDED_STATE,
  GUARDED_STYLES,
  GUARDED_UI,
  lockJson,
  makeGuardedPlan,
  write,
} from "../helpers/guarded-plan.js";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-authority-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function sealed(plan: unknown): ValidatedApplyPlan {
  const result = validateApplyPlan(plan as never);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) throw new Error("plan invalid");
  return result.value;
}

function mutable(plan: unknown): { targets: ApplyTarget[] } {
  return plan as { targets: ApplyTarget[] };
}

test("a copied validated instance cannot transfer authority with recomputed digests", () => {
  withRoot((root) => {
    write(root, "notes.txt", "PRIVATE NOTES");
    const validated = sealed(makeGuardedPlan(root));
    // A spread copies enumerable properties (including any brand token), but
    // the module-owned validation registry is keyed by the exact instance.
    const bytes = new TextEncoder().encode("FORGED NOTES");
    const forged = {
      ...validated,
      targets: [
        {
          path: "notes.txt",
          operation: "update" as const,
          bytes,
          mode: 0o644,
          preimage: capturePreimage(root, "notes.txt"),
          resultDigest: sha256Hex(bytes),
        },
      ],
    } as unknown as ValidatedApplyPlan;
    const recomputed = {
      ...forged,
      planDigest: derivePlanDigest(forged as never),
    } as ValidatedApplyPlan;
    const outcome = applyPlan(recomputed);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.equal(outcome.issues[0].code, "PLAN_UNVALIDATED");
    assert.equal(readFileSync(abs(root, "notes.txt"), "utf8"), "PRIVATE NOTES");
  });
});

test("unknown operations are rejected before any coordination", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    mutable(plan).targets[2] = {
      ...mutable(plan).targets[2],
      operation: "explode" as never,
    };
    const result = validateApplyPlan(plan);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.issues[0].code, "PLAN_OPERATION_UNKNOWN");
    }
  });
});

test("the canonical lock is rejected as an ordinary target", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    mutable(plan).targets[2] = {
      path: lockPath(plan.stateDir),
      operation: "update",
      bytes: lockJson("e".repeat(64)),
      mode: 0o644,
      preimage: capturePreimage(root, lockPath(plan.stateDir)),
    };
    const result = validateApplyPlan(plan);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.issues[0].code, "PLAN_LOCK_TARGET");
    }
  });
});

test("a sealed plan is immune to post-validation caller mutation", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    const validated = sealed(plan);
    // Mutating the caller's object (including replacing a typed array) has no
    // effect: the sealed plan copied the bytes during validation.
    mutable(plan).targets[2] = {
      ...mutable(plan).targets[2],
      bytes: new TextEncoder().encode("mutated after validation"),
    };
    const outcome = applyPlan(validated);
    assert.equal(outcome.kind, "applied");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "new css\n",
    );
  });
});

test("in-place mutation of sealed bytes is refused by the digest binding", () => {
  withRoot((root) => {
    const validated = sealed(makeGuardedPlan(root));
    // Mutate the sealed byte array in place; the bound result digest no longer
    // matches, so the old authority cannot be reused.
    (validated.targets[2].bytes as Uint8Array)[0] = 0x6d;
    const outcome = applyPlan(validated);
    assert.equal(outcome.kind, "refused");
    assert.equal(outcome.issues[0].code, "PLAN_AUTHORITY_STALE");
  });
});

test("a replaced root identity is refused even with identical bytes", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    const validated = sealed(plan);
    const original = `${root}-original`;
    renameSync(root, original);
    cpSync(original, root, { recursive: true });
    try {
      const outcome = applyPlan(validated);
      assert.equal(outcome.kind, "refused");
      assert.match(
        outcome.issues.map((issue) => issue.code).join(","),
        /AUTHORITY_ROOT_REPLACED/,
      );
    } finally {
      rmSync(original, { recursive: true, force: true });
    }
  });
});

test("a replaced ancestor identity is refused even with equal target bytes", () => {
  withRoot((root) => {
    const validated = sealed(makeGuardedPlan(root));
    renameSync(abs(root, GUARDED_STYLES), abs(root, "old-styles"));
    write(root, `${GUARDED_STYLES}/kit.css`, "old css");
    const outcome = applyPlan(validated);
    assert.equal(outcome.kind, "refused");
    assert.match(
      outcome.issues.map((issue) => issue.code).join(","),
      /AUTHORITY_ANCESTOR_REPLACED/,
    );
  });
});

test("changed config evidence refuses a metadata-only plan", () => {
  withRoot((root) => {
    const validated = sealed(makeGuardedPlan(root, { metadataOnly: true }));
    write(root, `${GUARDED_UI}/_kit/kit.json`, "user changed config");
    const outcome = applyPlan(validated);
    assert.equal(outcome.kind, "refused");
    assert.match(
      outcome.issues.map((issue) => issue.code).join(","),
      /AUTHORITY_READ_CHANGED/,
    );
  });
});

test("an unvalidated object with matching digest fields is refused", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root) as unknown as {
      targets: { bytes: Uint8Array }[];
      lock: { bytes: Uint8Array; digest: string };
    };
    // Forge the shape a caller might assume confers authority: bind the result
    // digests exactly, but never call validateApplyPlan.
    for (const target of plan.targets) {
      (target as { resultDigest?: string }).resultDigest = sha256Hex(
        target.bytes,
      );
    }
    plan.lock.digest = sha256Hex(plan.lock.bytes);
    const outcome = applyPlan(plan as never);
    assert.equal(outcome.kind, "refused");
    assert.equal(outcome.issues[0].code, "PLAN_UNVALIDATED");
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
  });
});

test("a mutated sealed lock is refused even with zero ordinary targets", () => {
  withRoot((root) => {
    const validated = sealed(makeGuardedPlan(root, { metadataOnly: true }));
    // In-place mutation of the sealed lock bytes must be caught even though no
    // target loop would otherwise run.
    (validated.lock.bytes as Uint8Array)[0] = 0x00;
    const outcome = applyPlan(validated);
    assert.equal(outcome.kind, "refused");
    assert.equal(outcome.issues[0].code, "PLAN_AUTHORITY_STALE");
  });
});

test("an invalid final lock is rejected before any semantic replacement", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    (plan.lock as { bytes: Uint8Array }).bytes = new TextEncoder().encode(
      "{invalid",
    );
    const result = validateApplyPlan(plan);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(
        result.issues.some((issue) => issue.code === "LOCK_INVALID"),
        JSON.stringify(result.issues),
      );
    }
  });
});

test("a symlinked transient namespace is refused and the outside tree survives", () => {
  withRoot((root) => {
    const plan = makeGuardedPlan(root);
    const outside = mkdtempSync(path.join(os.tmpdir(), "suik-authority-out-"));
    try {
      symlinkSync(outside, abs(root, `${GUARDED_STATE}/.svelte-ui-kit`), "dir");
      const outcome = applyPlan(sealed(plan));
      assert.equal(outcome.kind, "refused");
      assert.equal(outcome.issues[0].code, "AUTHORITY_TRANSIENT_UNSAFE");
      assert.deepEqual(readdirSync(outside), []);
      assert.equal(existsSync(abs(root, `${GUARDED_STYLES}/kit.css`)), true);
      assert.equal(
        readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
        "old css",
      );
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });
});
