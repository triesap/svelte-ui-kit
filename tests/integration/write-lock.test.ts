import assert from "node:assert/strict";
import {
  existsSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  lstatSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  acquireWriterLock,
  readWriterLock,
  releaseWriterLock,
  holdsWriterLock,
  verifyHeldWriterLock,
} from "../../src/codegen/write-lock.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
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

test("a copied handle cannot release or discard the actual held acquisition", () => {
  withRoot((root) => {
    const acquired = acquireWriterLock(root, STATE_DIR, ID_ONE);
    assert.equal(acquired.ok, true);
    if (!acquired.ok) return;
    const before = snapshotTree(root);
    assert.equal(releaseWriterLock({ ...acquired.value }).ok, false);
    assert.equal(holdsWriterLock(root, STATE_DIR), true);
    assert.deepEqual(snapshotTree(root), before);
    assert.equal(releaseWriterLock(acquired.value).ok, true);
  });
});

for (const mutation of [
  "owner-identity",
  "directory-identity",
  "owner-link",
  "directory-link",
  "owner-mode",
  "directory-mode",
  "owner-bytes",
  "foreign",
] as const) {
  test(`held writer authority and release preserve ${mutation} substitution`, () => {
    withRoot((root) => {
      const acquired = acquireWriterLock(root, STATE_DIR, ID_ONE);
      assert.equal(acquired.ok, true);
      if (!acquired.ok) return;
      const directory = acquired.value.lockDir;
      const owner = path.join(directory, "owner.json");
      if (mutation === "owner-identity") {
        const substitute = path.join(root, "copied-owner.json");
        writeFileSync(substitute, readFileSync(owner), { mode: 0o600 });
        renameSync(substitute, owner);
      }
      if (mutation === "directory-identity" || mutation === "directory-link") {
        const displaced = path.join(root, "displaced-writer");
        renameSync(directory, displaced);
        if (mutation === "directory-link") symlinkSync(displaced, directory);
        else {
          mkdirSync(directory, { mode: 0o700 });
          writeFileSync(
            owner,
            readFileSync(path.join(displaced, "owner.json")),
            { mode: 0o600 },
          );
        }
      }
      if (mutation === "owner-link") {
        const displaced = path.join(root, "displaced-owner.json");
        renameSync(owner, displaced);
        symlinkSync(displaced, owner);
      }
      if (mutation === "owner-mode") chmodSync(owner, 0o644);
      if (mutation === "directory-mode") chmodSync(directory, 0o755);
      if (mutation === "owner-bytes")
        writeFileSync(owner, `${readFileSync(owner, "utf8")} `);
      if (mutation === "foreign")
        writeFileSync(path.join(directory, ".operator"), "preserve");
      const before = snapshotTree(root);
      assert.ok(
        verifyHeldWriterLock(root, STATE_DIR).some(
          (entry) => entry.code === "WRITER_LOCK_CONTRADICTED",
        ),
      );
      const released = releaseWriterLock(acquired.value);
      assert.equal(released.ok, false);
      assert.equal(holdsWriterLock(root, STATE_DIR), false);
      assert.deepEqual(snapshotTree(root), before);
    });
  });
}

for (const boundary of [
  "writer:create",
  "writer:owner",
  "durability:writer-acquire",
] as const) {
  test(`exclusive writer acquisition accounts for partial ${boundary} creation`, () => {
    withRoot((root) => {
      const before = snapshotTree(root);
      const result = acquireWriterLock(
        root,
        STATE_DIR,
        ID_ONE,
        faultAt(boundary),
      );
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.issues[0]?.code, "WRITER_LOCK_UNAVAILABLE");
      assert.deepEqual(snapshotTree(root), before);
      assert.equal(holdsWriterLock(root, STATE_DIR), false);
    });
  });
  test(`foreign partial ${boundary} acquisition state survives with the original cause`, () => {
    withRoot((root) => {
      let expected: ReturnType<typeof snapshotTree> | undefined;
      const result = acquireWriterLock(root, STATE_DIR, ID_ONE, {
        before: (candidate, detail) => {
          if (candidate !== boundary) return;
          assert.ok(detail);
          writeFileSync(
            path.join(detail, ".operator"),
            "retain foreign creation",
          );
          expected = snapshotTree(root);
          throw new Error("original acquisition failure");
        },
      });
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.ok(expected);
      assert.ok(
        result.issues.some((entry) =>
          entry.message.includes("original acquisition failure"),
        ),
      );
      assert.ok(
        result.issues.some((entry) => entry.code === "OWNED_CLEANUP_REFUSED"),
      );
      assert.deepEqual(snapshotTree(root), expected);
    });
  });
}

test("writer acquisition reports its original cause and secondary cleanup flush failure", () => {
  withRoot((root) => {
    const result = acquireWriterLock(root, STATE_DIR, ID_ONE, {
      before: (boundary) => {
        if (boundary === "writer:owner")
          throw new Error("original partial-owner failure");
        if (boundary === "durability:cleanup")
          throw new Error("secondary owner cleanup failure");
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(
      result.issues.some((entry) =>
        entry.message.includes("original partial-owner failure"),
      ),
    );
    assert.ok(
      result.issues.some(
        (entry) =>
          entry.code === "OWNED_CLEANUP_FAILED" &&
          entry.message.includes("secondary owner cleanup failure"),
      ),
    );
    assert.equal(existsSync(abs(root, writerLockDir(STATE_DIR))), true);
    assert.equal(holdsWriterLock(root, STATE_DIR), false);
  });
});

test("coordination ancestry creation and removal failures remain visible together", () => {
  withRoot((root) => {
    const result = acquireWriterLock(root, STATE_DIR, ID_ONE, {
      before: (boundary) => {
        if (boundary === "durability:owned-create")
          throw new Error("original ancestry creation flush failure");
        if (boundary === "durability:owned-remove")
          throw new Error("secondary ancestry removal flush failure");
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(
      result.issues.some(
        (entry) =>
          entry.code === "WRITER_LOCK_UNAVAILABLE" &&
          entry.message.includes("original ancestry creation flush failure"),
      ),
    );
    assert.ok(
      result.issues.some(
        (entry) => entry.code === "RECOVERY_ANCESTRY_FLUSH_FAILED",
      ),
    );
    assert.equal(holdsWriterLock(root, STATE_DIR), false);
  });
});

test("changed coordination ancestry mode prevents acquisition-failure cleanup", () => {
  withRoot((root) => {
    let expected: ReturnType<typeof snapshotTree> | undefined;
    const result = acquireWriterLock(root, STATE_DIR, ID_ONE, {
      before: (boundary, detail) => {
        if (boundary !== "durability:owned-create") return;
        assert.ok(detail);
        const ancestor = path.isAbsolute(detail) ? detail : abs(root, detail);
        chmodSync(
          ancestor,
          (lstatSync(ancestor).mode & 0o7777) === 0o700 ? 0o755 : 0o700,
        );
        expected = snapshotTree(root);
        throw new Error("original ancestry failure after mode edit");
      },
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(expected);
    assert.ok(
      result.issues.some((entry) => entry.code === "RECOVERY_ANCESTRY_CHANGED"),
    );
    assert.deepEqual(snapshotTree(root), expected);
  });
});

for (const mutation of ["owner", "directory", "foreign"] as const) {
  test(`release restoration preserves ${mutation} introduced after unlink`, () => {
    withRoot((root) => {
      const acquired = acquireWriterLock(root, STATE_DIR, ID_ONE);
      assert.equal(acquired.ok, true);
      if (!acquired.ok) return;
      const ownerBytes = readFileSync(
        path.join(acquired.value.lockDir, "owner.json"),
      );
      let expected: ReturnType<typeof snapshotTree> | undefined;
      const result = releaseWriterLock(acquired.value, {
        before: (boundary) => {
          if (boundary !== "durability:release") return;
          const directory = acquired.value.lockDir;
          if (mutation === "directory") {
            renameSync(directory, path.join(root, "displaced-empty-writer"));
            mkdirSync(directory, { mode: 0o700 });
          }
          if (mutation === "owner")
            writeFileSync(path.join(directory, "owner.json"), ownerBytes, {
              mode: 0o600,
            });
          if (mutation === "foreign")
            writeFileSync(
              path.join(directory, ".operator"),
              "preserve after unlink",
            );
          expected = snapshotTree(root);
          throw new Error("original release flush failure");
        },
      });
      assert.equal(result.ok, false);
      assert.ok(expected);
      assert.equal(holdsWriterLock(root, STATE_DIR), false);
      assert.deepEqual(snapshotTree(root), expected);
    });
  });
}

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
      createdDirectories: [],
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
