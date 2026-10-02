import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  acquireWriterLock,
  readWriterLock,
  releaseWriterLock,
} from "../../src/codegen/write-lock.js";
import {
  transientRoot,
  writerLockDir,
} from "../../src/codegen/transaction-types.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID_ONE = "1111111111111111";
const ID_TWO = "2222222222222222";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-lock-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

test("a second cooperative writer cannot enter mutation", () => {
  withRoot((root) => {
    const first = acquireWriterLock(root, STATE_DIR, ID_ONE);
    assert.equal(first.ok, true);
    if (!first.ok) return;

    const second = acquireWriterLock(root, STATE_DIR, ID_TWO);
    assert.equal(second.ok, false);
    if (!second.ok) {
      assert.equal(second.issues[0].code, "WRITER_BUSY");
    }

    assert.equal(releaseWriterLock(first.value).ok, true);
    assert.equal(existsSync(abs(root, writerLockDir(STATE_DIR))), false);

    const third = acquireWriterLock(root, STATE_DIR, ID_TWO);
    assert.equal(third.ok, true);
    if (third.ok) assert.equal(releaseWriterLock(third.value).ok, true);
  });
});

test("read-only inspection creates no coordination state", () => {
  withRoot((root) => {
    assert.equal(existsSync(abs(root, transientRoot(STATE_DIR))), false);
    const observed = readWriterLock(root, STATE_DIR);
    assert.equal(observed.kind, "absent");
    assert.equal(existsSync(abs(root, transientRoot(STATE_DIR))), false);
  });
});

test("an ambiguous stale lock is not silently removed", () => {
  withRoot((root) => {
    const lockDir = abs(root, writerLockDir(STATE_DIR));
    mkdirSync(lockDir, { recursive: true, mode: 0o700 });
    writeFileSync(path.join(lockDir, "owner.json"), "{corrupt\n");

    const observed = readWriterLock(root, STATE_DIR);
    assert.equal(observed.kind, "ambiguous");

    const attempt = acquireWriterLock(root, STATE_DIR, ID_ONE);
    assert.equal(attempt.ok, false);
    if (!attempt.ok) assert.equal(attempt.issues[0].code, "WRITER_BUSY");
    assert.equal(existsSync(lockDir), true);

    // A handle referencing a different transaction cannot remove it either.
    const refused = releaseWriterLock({
      root,
      stateDir: STATE_DIR,
      lockDir,
      transactionId: ID_ONE,
    });
    assert.equal(refused.ok, false);
    if (!refused.ok)
      assert.equal(refused.issues[0].code, "WRITER_LOCK_UNOWNED");
    assert.equal(existsSync(lockDir), true);
  });
});

test("owned lock cleanup is bounded to the lock directory", () => {
  withRoot((root) => {
    const acquired = acquireWriterLock(root, STATE_DIR, ID_ONE);
    assert.equal(acquired.ok, true);
    if (!acquired.ok) return;

    const sibling = abs(root, `${transientRoot(STATE_DIR)}/unrelated.tmp`);
    writeFileSync(sibling, "do not delete");

    assert.equal(releaseWriterLock(acquired.value).ok, true);
    assert.equal(existsSync(abs(root, writerLockDir(STATE_DIR))), false);
    assert.equal(existsSync(sibling), true);
    assert.equal(existsSync(abs(root, transientRoot(STATE_DIR))), true);
  });
});
