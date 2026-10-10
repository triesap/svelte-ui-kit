import assert from "node:assert/strict";
import {
  existsSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  ensureIgnoreEntry,
  cleanupTransaction,
} from "../../src/codegen/transaction-cleanup.js";
import {
  serializeJournal,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { applyPlan, validateApplyPlan } from "../../src/codegen/apply.js";
import { capturedFixtureInit } from "../helpers/guarded-plan.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  backupsDir,
  journalPath,
  stagedDir,
  transactionDir,
  transientRoot,
  transactionsDir,
} from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "7777777777777777";
const OTHER_ID = "8888888888888888";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-cleanup-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function publishedJournal(id = ID): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: id,
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "published",
    operations: [
      {
        path: "src/styles/kit.css",
        operation: "update",
        preimage: { kind: "file", digest: sha256Hex("ephemeral"), mode: 0o644 },
        resultDigest: sha256Hex("ephemeral"),
        resultMode: 0o644,
        backupId: "backup-0",
        stagedId: "stage-0",
        applied: true,
      },
    ],
    lock: {
      path: `${STATE_DIR}/kit.lock.json`,
      digest: "c".repeat(64),
      published: true,
      unchanged: false,
    },
  };
}

function populate(root: string, id: string): void {
  for (const logical of [
    `${stagedDir(STATE_DIR, id)}/stage-0`,
    `${backupsDir(STATE_DIR, id)}/backup-0`,
  ]) {
    const target = abs(root, logical);
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    writeFileSync(target, "ephemeral");
  }
  const journal = abs(root, journalPath(STATE_DIR, id));
  mkdirSync(path.dirname(journal), { recursive: true });
  writeFileSync(journal, serializeJournal(publishedJournal(id)), {
    mode: 0o600,
  });
}

test("a completed batch cleans its own files only", () => {
  withRoot((root) => {
    populate(root, ID);
    populate(root, OTHER_ID);
    const unrelated = abs(root, `${transientRoot(STATE_DIR)}/unrelated.tmp`);
    writeFileSync(unrelated, "keep");

    const result = cleanupTransaction(root, STATE_DIR, publishedJournal());
    assert.equal(result.ok, true);
    assert.equal(result.needsCleanup, false);
    assert.equal(existsSync(abs(root, transactionDir(STATE_DIR, ID))), false);
    assert.equal(
      existsSync(abs(root, transactionDir(STATE_DIR, OTHER_ID))),
      true,
    );
    assert.equal(existsSync(unrelated), true);
  });
});

for (const boundary of [
  "transaction:create",
  "stage:create",
  "stage:write",
  "stage:verify",
  "durability:stage",
  "durability:owned-create",
  "journal:write",
  "journal:fsync",
] as const) {
  test(`early ${boundary} failure retains the entire foreign transaction and causal errors`, () => {
    withRoot((root) => {
      const plan = validateApplyPlan(capturedFixtureInit(root));
      assert.equal(plan.ok, true);
      if (!plan.ok) return;
      let expected: ReturnType<typeof snapshotTree> | undefined;
      const result = applyPlan(plan.value, {
        before: (candidate) => {
          if (candidate !== boundary || expected !== undefined) return;
          const namespace = abs(root, transactionsDir(STATE_DIR));
          if (!existsSync(namespace)) return;
          const id = readdirSync(namespace)[0];
          if (id === undefined) return;
          writeFileSync(
            path.join(namespace, id, ".operator"),
            "retain operator evidence",
            { mode: 0o640 },
          );
          expected = snapshotTree(root).filter(
            (entry) => !entry.path.includes("/writer.lock"),
          );
          throw new Error(`original ${boundary} failure`);
        },
      });
      assert.ok(expected, "the requested real boundary must execute");
      assert.equal(result.kind, "refused", JSON.stringify(result));
      assert.ok(
        result.issues.some(
          (entry) =>
            entry.message.includes(`original ${boundary} failure`) ||
            entry.code === "OWNED_ANCESTRY_FLUSH_FAILED",
        ),
        JSON.stringify(result),
      );
      assert.ok(
        result.issues.some((entry) => entry.code === "OWNED_CLEANUP_REFUSED"),
        JSON.stringify(result),
      );
      assert.deepEqual(snapshotTree(root), expected);
    });
  });
}

for (const mutation of [
  "unknown",
  "bytes",
  "mode",
  "identity",
  "link",
  "directory",
] as const) {
  test(`published cleanup retains its frozen inventory after ${mutation} mutation`, () => {
    withRoot((root) => {
      populate(root, ID);
      let expected: ReturnType<typeof snapshotTree> | undefined;
      const result = cleanupTransaction(root, STATE_DIR, publishedJournal(), {
        before: (boundary) => {
          if (boundary !== "cleanup:staged") return;
          const directory = abs(root, stagedDir(STATE_DIR, ID));
          const target = path.join(directory, "stage-0");
          if (mutation === "unknown")
            writeFileSync(path.join(directory, ".operator"), "keep");
          if (mutation === "bytes") writeFileSync(target, "operator change");
          if (mutation === "mode") chmodSync(target, 0o600);
          if (mutation === "identity") {
            const replacement = path.join(root, "replacement.tmp");
            writeFileSync(replacement, "ephemeral");
            renameSync(replacement, target);
          }
          if (mutation === "link" || mutation === "directory") {
            rmSync(target);
            if (mutation === "link")
              symlinkSync("/missing-operator-target", target);
            else mkdirSync(target);
          }
          expected = snapshotTree(root);
        },
      });
      assert.equal(result.ok, false, JSON.stringify(result));
      assert.equal(result.needsCleanup, true);
      assert.ok(
        result.issues.some((entry) => entry.code === "COMMITTED_NEEDS_CLEANUP"),
      );
      assert.deepEqual(snapshotTree(root), expected);
    });
  });
}

for (const cleanupCode of ["EIO", "ENOENT"] as const)
  test(`early staging preserves original and secondary ${cleanupCode} cleanup durability failures`, () => {
    withRoot((root) => {
      const plan = validateApplyPlan(capturedFixtureInit(root));
      assert.equal(plan.ok, true);
      if (!plan.ok) return;
      const before = snapshotTree(root);
      const result = applyPlan(plan.value, {
        before: (boundary) => {
          if (boundary === "stage:create")
            throw new Error("original exclusive-write failure");
          if (boundary === "durability:cleanup")
            throw Object.assign(new Error("secondary cleanup flush failure"), {
              code: cleanupCode,
            });
        },
      });
      assert.equal(result.kind, "refused");
      assert.ok(
        result.issues.some((entry) =>
          entry.message.includes("original exclusive-write failure"),
        ),
        JSON.stringify(result),
      );
      assert.ok(
        result.issues.some(
          (entry) =>
            entry.code === "OWNED_CLEANUP_FAILED" &&
            entry.message.includes("secondary cleanup flush failure"),
        ),
        JSON.stringify(result),
      );
      const current = snapshotTree(root);
      for (const entry of before)
        assert.deepEqual(
          current.find((candidate) => candidate.path === entry.path),
          entry,
        );
      assert.ok(
        current.some(
          (entry) =>
            entry.path.includes("/transactions/") && entry.kind === "directory",
        ),
        "failed prerequisite retains the transaction",
      );
    });
  });

test("a cleanup failure reports committed-but-needs-cleanup and retains evidence", () => {
  withRoot((root) => {
    populate(root, ID);
    const result = cleanupTransaction(
      root,
      STATE_DIR,
      publishedJournal(),
      faultAt("cleanup:staged"),
    );
    assert.equal(result.ok, false);
    assert.equal(result.needsCleanup, true);
    assert.equal(result.issues[0].code, "COMMITTED_NEEDS_CLEANUP");
    assert.equal(existsSync(abs(root, journalPath(STATE_DIR, ID))), true);
  });
});

test("ignore integration preserves existing rules and is idempotent", () => {
  withRoot((root) => {
    const gitignore = path.join(root, ".gitignore");
    writeFileSync(gitignore, "node_modules/\n# keep this rule\n");
    const first = ensureIgnoreEntry(root, STATE_DIR);
    assert.equal(first.changed, true);
    const content = readFileSync(gitignore, "utf8");
    assert.match(content, /node_modules\//);
    assert.match(content, /# keep this rule/);
    assert.match(content, /src\/lib\/components\/ui\/_kit\/\.svelte-ui-kit\//);
    const second = ensureIgnoreEntry(root, STATE_DIR);
    assert.equal(second.changed, false);
    assert.equal(readFileSync(gitignore, "utf8"), content);
  });
});

test("cleanup does not remove unrelated ignore or temporary state", () => {
  withRoot((root) => {
    const gitignore = path.join(root, ".gitignore");
    writeFileSync(gitignore, "dist/\n");
    populate(root, ID);
    const result = cleanupTransaction(root, STATE_DIR, publishedJournal());
    assert.equal(result.ok, true);
    assert.equal(readFileSync(gitignore, "utf8"), "dist/\n");
  });
});
