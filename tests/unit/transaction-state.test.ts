import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertTransition,
  backupsDir,
  canTransition,
  createTransactionIdentity,
  ignoreEntryFor,
  isMutatingPhase,
  isTerminalPhase,
  isTransactionId,
  journalPath,
  lockPath,
  stagedDir,
  TRANSACTION_PHASES,
  TRANSACTION_TRANSITIONS,
  transactionDir,
  transactionsDir,
  transientRoot,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";

test("the ordered phase table only admits documented transitions", () => {
  assert.deepEqual(TRANSACTION_PHASES, [
    "planned",
    "prepared",
    "applied",
    "published",
    "cleaned",
    "rolled_back",
  ]);

  assert.equal(canTransition("planned", "prepared"), true);
  assert.equal(canTransition("prepared", "applied"), true);
  assert.equal(canTransition("applied", "published"), true);
  assert.equal(canTransition("published", "cleaned"), true);
  assert.equal(canTransition("prepared", "rolled_back"), true);
  assert.equal(canTransition("applied", "rolled_back"), true);

  // Impossible or ambiguous outcomes.
  assert.equal(canTransition("planned", "applied"), false);
  assert.equal(canTransition("planned", "published"), false);
  assert.equal(canTransition("prepared", "published"), false);
  assert.equal(canTransition("applied", "prepared"), false);
  assert.equal(canTransition("published", "rolled_back"), false);
  assert.equal(canTransition("rolled_back", "prepared"), false);
  assert.equal(canTransition("cleaned", "planned"), false);
  for (const phase of TRANSACTION_PHASES) {
    assert.equal(
      canTransition(phase, phase),
      false,
      `${phase} must not self-transition`,
    );
  }

  assert.throws(
    () => assertTransition("planned", "published"),
    /illegal transaction transition/,
  );
  assert.doesNotThrow(() => assertTransition("prepared", "applied"));
});

test("a published transaction is terminal for mutation and only cleans up", () => {
  assert.deepEqual(TRANSACTION_TRANSITIONS.published, ["cleaned"]);
  assert.deepEqual(TRANSACTION_TRANSITIONS.cleaned, []);
  assert.deepEqual(TRANSACTION_TRANSITIONS.rolled_back, []);
  assert.equal(isTerminalPhase("cleaned"), true);
  assert.equal(isTerminalPhase("rolled_back"), true);
  assert.equal(isTerminalPhase("published"), false);
  assert.equal(isMutatingPhase("prepared"), true);
  assert.equal(isMutatingPhase("applied"), true);
  assert.equal(isMutatingPhase("planned"), false);
  assert.equal(isMutatingPhase("published"), false);
});

test("byte-equal lock publication is not a unique transaction identity", () => {
  const rootIdentity = "a".repeat(64);
  const equalLockDigest = "b".repeat(64);
  const first = createTransactionIdentity(rootIdentity, equalLockDigest);
  const second = createTransactionIdentity(rootIdentity, equalLockDigest);
  assert.equal(first.rootIdentity, second.rootIdentity);
  assert.equal(first.planDigest, second.planDigest);
  assert.notEqual(first.transactionId, second.transactionId);
  assert.ok(isTransactionId(first.transactionId));
  assert.ok(isTransactionId(second.transactionId));

  const seen = new Set<string>();
  for (let index = 0; index < 64; index += 1) {
    seen.add(
      createTransactionIdentity(rootIdentity, equalLockDigest).transactionId,
    );
  }
  assert.equal(seen.size, 64);

  assert.equal(isTransactionId(""), false);
  assert.equal(isTransactionId("short"), false);
  assert.equal(isTransactionId("ZZZZZZZZZZZZZZZZ"), false);
});

test("dry-run has no transition into mutation", () => {
  // A read-only plan never occupies a mutating phase and cannot jump
  // directly from `planned` into `applied`/`published`.
  assert.equal(isMutatingPhase("planned"), false);
  assert.ok(!TRANSACTION_TRANSITIONS.planned.includes("applied"));
  assert.ok(!TRANSACTION_TRANSITIONS.planned.includes("published"));
  assert.equal(canTransition("planned", "prepared"), true);
});

test("owned transient paths stay under the reserved state namespace", () => {
  const stateDir = "src/lib/components/ui/_kit";
  assert.equal(transientRoot(stateDir), `${stateDir}/.svelte-ui-kit`);
  assert.equal(
    writerLockDir(stateDir),
    `${stateDir}/.svelte-ui-kit/writer.lock`,
  );
  assert.equal(
    transactionsDir(stateDir),
    `${stateDir}/.svelte-ui-kit/transactions`,
  );
  const id = createTransactionIdentity(
    "a".repeat(64),
    "b".repeat(64),
  ).transactionId;
  const txnDir = transactionDir(stateDir, id);
  assert.equal(txnDir, `${transactionsDir(stateDir)}/${id}`);
  assert.ok(journalPath(stateDir, id).startsWith(`${txnDir}/`));
  assert.ok(stagedDir(stateDir, id).startsWith(`${txnDir}/`));
  assert.ok(backupsDir(stateDir, id).startsWith(`${txnDir}/`));
  // Semantic lock metadata is committed state, not transient namespaced state.
  assert.equal(lockPath(stateDir), `${stateDir}/kit.lock.json`);
  assert.ok(!lockPath(stateDir).includes(".svelte-ui-kit"));
  assert.equal(ignoreEntryFor(stateDir), `${stateDir}/.svelte-ui-kit/`);
});
