import assert from "node:assert/strict";
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { recoverTransaction } from "../../src/codegen/recovery.js";
import {
  DEFAULT_KIT_CONFIG as config,
  deriveKitPaths,
} from "../../src/project/config.js";
import { capturedFixtureInit, abs } from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const stateDir = deriveKitPaths(config).stateDir;
for (const kind of [
  "control",
  "missing witness",
  "wrong transaction",
  "wrong digest",
  "edited staged bytes",
  "edited staged mode",
  "replaced staged inode",
  "appeared canonical",
  "edited restored target",
  "published terminal claim",
]) {
  test(`terminal rollback cleanup: ${kind}`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-terminal-rollback-"));
    try {
      const sealed = validateApplyPlan(capturedFixtureInit(root));
      assert.equal(sealed.ok, true, JSON.stringify(sealed));
      if (!sealed.ok) return;
      const initial = snapshotTree(root);
      const interrupted = applyPlan(sealed.value, {
        before: (boundary) => {
          if (boundary === "lock:publish")
            throw new Error("stop before canonical rename");
          if (boundary === "recovery:cleanup")
            throw new Error("retain completed rollback evidence");
        },
      });
      assert.equal(interrupted.kind, "refused");
      const base = abs(root, `${stateDir}/.svelte-ui-kit/transactions`);
      const [id] = readdirSync(base);
      assert.ok(id);
      const transaction = path.join(base, id);
      const journalPath = path.join(transaction, "journal.json");
      const witnessPath = path.join(transaction, "publication.json");
      const stagedPath = path.join(transaction, "staged/kit.lock.json");
      const journal = JSON.parse(readFileSync(journalPath, "utf8"));
      assert.equal(journal.phase, "rolled_back");
      assert.notEqual(journal.lock, null);
      if (kind === "missing witness") unlinkSync(witnessPath);
      if (kind === "wrong transaction" || kind === "wrong digest") {
        const witness = JSON.parse(readFileSync(witnessPath, "utf8"));
        if (kind === "wrong transaction")
          witness.transactionId = "11111111-1111-4111-8111-111111111111";
        else witness.digest = "f".repeat(64);
        writeFileSync(witnessPath, JSON.stringify(witness));
      }
      if (kind === "edited staged bytes")
        writeFileSync(stagedPath, "user edited retained publication");
      if (kind === "edited staged mode") chmodSync(stagedPath, 0o700);
      if (kind === "replaced staged inode") {
        writeFileSync(
          path.join(transaction, "replacement"),
          readFileSync(stagedPath),
        );
        renameSync(path.join(transaction, "replacement"), stagedPath);
      }
      if (kind === "appeared canonical")
        writeFileSync(
          abs(root, `${stateDir}/kit.lock.json`),
          "unrelated canonical",
        );
      if (kind === "edited restored target") {
        mkdirSync(path.dirname(abs(root, config.layoutFile)), {
          recursive: true,
        });
        writeFileSync(abs(root, config.layoutFile), "user layout");
      }
      if (kind === "published terminal claim") {
        journal.lock.published = true;
        writeFileSync(journalPath, JSON.stringify(journal));
      }
      const beforeRetry = snapshotTree(root);
      const recovered = recoverTransaction(root, stateDir, id, config);
      if (kind === "control") {
        assert.equal(
          recovered.status,
          "rolled_back",
          JSON.stringify(recovered),
        );
        assert.deepEqual(snapshotTree(root), initial);
      } else {
        assert.equal(recovered.status, "refused", JSON.stringify(recovered));
        assert.ok(
          recovered.issues.some(
            (issue) =>
              issue.code ===
              (kind === "edited restored target"
                ? "RECOVERY_USER_EDIT"
                : "RECOVERY_AMBIGUOUS_PUBLICATION"),
          ),
          JSON.stringify(recovered),
        );
        assert.equal(existsSync(transaction), true);
        assert.deepEqual(
          snapshotTree(root),
          beforeRetry,
          "refusal preserves semantic and owned evidence",
        );
      }
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
}
