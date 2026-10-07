import assert from "node:assert/strict";
import {
  chmodSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { recoverTransactions } from "../../src/codegen/recovery.js";
import {
  lockPath,
  publicationIntentPath,
  stagedDir,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";
import { RECOVERY_ROOTS } from "../helpers/transactions.js";
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

test("a canonical lock deleted before the rename is a contradiction that preserves source", () => {
  withRoot((root) => {
    // Seed a real canonical preimage so its recorded physical identity proves
    // the lock existed before the interrupted rename.
    write(
      root,
      lockPath(GUARDED_STATE),
      new TextDecoder().decode(lockJson("c".repeat(64))),
    );
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          unlinkSync(abs(root, lockPath(GUARDED_STATE)));
          throw new Error("canonical was removed before the rename");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
    );
  });
});

test("a published canonical mode edit refuses cleanup and preserves evidence", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary === "lock:publish") {
          chmodSync(abs(root, lockPath(GUARDED_STATE)), 0o700);
          throw new Error("mode edit after publication");
        }
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "refused", JSON.stringify(recovered));
    assert.ok(
      recovered[0].issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(recovered[0].issues),
    );
    assert.equal(
      statSync(abs(root, lockPath(GUARDED_STATE))).mode & 0o777,
      0o700,
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
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
      "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
    );
    assert.equal(
      readFileSync(abs(root, lockPath(GUARDED_STATE)), "utf8"),
      "edited after publication",
    );
  });
});

test("an equal-byte canonical at a different inode is not a proven publication", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      // Interrupt owned cleanup after the canonical rename has durably
      // completed, then swap the canonical for a fresh inode carrying identical
      // bytes and mode.
      before: (boundary) => {
        if (boundary === "cleanup:staged") {
          const canonical = abs(root, lockPath(GUARDED_STATE));
          const bytes = readFileSync(canonical);
          const replacement = `${canonical}.physical-replacement`;
          writeFileSync(replacement, bytes, { mode: 0o644 });
          renameSync(replacement, canonical);
          throw new Error("replaced the published physical image");
        }
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "refused", JSON.stringify(recovered));
    assert.ok(
      recovered[0].issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(recovered[0].issues),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
    );
  });
});

test("a missing witness with an edited canonical mode refuses cleanup", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "cleanup:staged") {
          const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
          const witness = abs(
            root,
            publicationIntentPath(GUARDED_STATE, ids[0] as string),
          );
          chmodSync(abs(root, lockPath(GUARDED_STATE)), 0o700);
          unlinkSync(witness);
          throw new Error("witness removed and canonical mode edited");
        }
      },
    });
    assert.equal(
      outcome.kind,
      "committed_needs_cleanup",
      JSON.stringify(outcome.issues),
    );
    const recovered = recoverTransactions(root, GUARDED_STATE, RECOVERY_ROOTS);
    assert.equal(recovered[0].status, "refused", JSON.stringify(recovered));
    assert.ok(
      recovered[0].issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(recovered[0].issues),
    );
    assert.equal(
      statSync(abs(root, lockPath(GUARDED_STATE))).mode & 0o777,
      0o700,
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css/* svelte-ui-kit:start tokens */\n@layer svelte-ui-kit.tokens, svelte-ui-kit.themes, svelte-ui-kit.components;\n/* svelte-ui-kit:end tokens */",
    );
  });
});

test("a replaced staged publication image before the rename fails closed", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
          const stagedLock = abs(
            root,
            `${stagedDir(GUARDED_STATE, ids[0] as string)}/kit.lock.json`,
          );
          const bytes = readFileSync(stagedLock);
          unlinkSync(stagedLock);
          writeFileSync(stagedLock, bytes, { mode: 0o644 });
          throw new Error("replaced the staged publication image");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(outcome.issues),
    );
  });
});

test("a deleted staged publication image before the rename fails closed", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
          unlinkSync(
            abs(
              root,
              `${stagedDir(GUARDED_STATE, ids[0] as string)}/kit.lock.json`,
            ),
          );
          throw new Error("deleted the staged publication image");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(outcome.issues),
    );
  });
});

test("a symlinked publication witness is refused as unsafe evidence", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          const ids = readdirSync(abs(root, transactionsDir(GUARDED_STATE)));
          const intent = abs(
            root,
            publicationIntentPath(GUARDED_STATE, ids[0] as string),
          );
          const bytes = readFileSync(intent);
          unlinkSync(intent);
          const decoy = abs(root, `${GUARDED_STATE}/decoy-witness.json`);
          writeFileSync(decoy, bytes);
          symlinkSync(decoy, intent);
          throw new Error("symlinked the publication witness");
        }
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) =>
          issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION" ||
          issue.code === "PUBLICATION_INTENT_UNSAFE",
      ),
      JSON.stringify(outcome.issues),
    );
  });
});
