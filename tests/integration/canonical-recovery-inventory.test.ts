import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import {
  recoverTransaction,
  recoverTransactions,
} from "../../src/transactions/recovery.js";
import {
  persistJournal,
  serializeJournal,
  type TransactionDraft,
  type TransactionJournal,
} from "../../src/transactions/journal.js";
import { journalPath, writerLockDir } from "../../src/transactions/types.js";
import { createTempProject } from "../helpers/project.js";
import { liveRootIdentity } from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import type { TargetKind } from "../../src/project/config.js";
const stateDir = "components/design/_kit";
function roots(target: TargetKind) {
  const common = {
    configSchema: 1 as const,
    uiDir: "components/design",
    stylesDir: "theme/site",
  };
  return target === "svelte-library"
    ? { ...common, target, styleEntry: "style/index.css" }
    : {
        ...common,
        target,
        layoutFile:
          target === "astro" ? "app/Shell.astro" : "app/routes/+layout.svelte",
      };
}
function journal(
  root: string,
  target: TargetKind,
  id: string,
): TransactionJournal {
  return {
    schemaVersion: 3,
    target,
    transactionId: id,
    rootIdentity: liveRootIdentity(root),
    planDigest: "b".repeat(64),
    phase: "prepared",
    operations: [],
    lock: null,
    createdDirs: [],
    ignoreFiles: [],
  };
}
function write(root: string, id: string, value: unknown) {
  const file = path.join(root, journalPath(stateDir, id));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(value));
}
for (const target of ["sveltekit", "astro", "svelte-library"] as const) {
  for (const retiredVersion of [1, 2])
    for (const reversed of [false, true])
      for (const single of [false, true])
        test(`${target}: journal${retiredVersion} sibling refuses ${single ? "single" : "all"} recovery in order ${reversed}`, (t) => {
          const f = createTempProject();
          let passed = false;
          t.after(() => {
            if (passed) f.cleanup();
            else
              console.error(
                `Retained failed owned recovery inventory: ${f.root}`,
              );
          });
          const ids = ["1111111111111111", "ffffffffffffffff"];
          const valid = ids[reversed ? 1 : 0],
            invalid = ids[reversed ? 0 : 1];
          write(f.root, valid, journal(f.root, target, valid));
          write(f.root, invalid, {
            ...journal(f.root, target, invalid),
            schemaVersion: retiredVersion,
          });
          f.writeFile(".operator-note", "preserve unrelated bytes");
          const before = snapshotTree(f.root);
          const results = single
            ? [recoverTransaction(f.root, stateDir, valid, roots(target))]
            : recoverTransactions(f.root, stateDir, roots(target));
          assert.ok(results.length > 0);
          assert.ok(
            results.every((v) => v.status === "refused"),
            JSON.stringify(results),
          );
          assert.ok(
            results.some((v) =>
              v.issues.some((i) => i.code === "JOURNAL_INVALID"),
            ),
          );
          assert.deepEqual(snapshotTree(f.root), before);
          passed = true;
        });
  for (const single of [false, true])
    test(`${target}: ${single ? "single" : "all"} recovery revalidates the full inventory after writer acquisition`, (t) => {
      const f = createTempProject();
      let passed = false;
      t.after(() => {
        if (passed) f.cleanup();
        else
          console.error(`Retained failed owned recovery inventory: ${f.root}`);
      });
      const valid = "1111111111111111",
        invalid = "ffffffffffffffff";
      write(f.root, valid, journal(f.root, target, valid));
      let fired = false;
      let afterHook: ReturnType<typeof snapshotTree> = [];
      const hooks = {
        after(boundary: string) {
          if (boundary !== "durability:writer-acquire" || fired) return;
          fired = true;
          write(f.root, invalid, {
            ...journal(f.root, target, invalid),
            schemaVersion: 2,
          });
          afterHook = snapshotTree(f.root).filter(
            (v) => !v.path.startsWith(writerLockDir(stateDir)),
          );
        },
      };
      const results = single
        ? [recoverTransaction(f.root, stateDir, valid, roots(target), hooks)]
        : recoverTransactions(f.root, stateDir, roots(target), hooks);
      assert.equal(fired, true);
      assert.ok(
        results.every((v) => v.status === "refused"),
        JSON.stringify(results),
      );
      assert.ok(
        results.some((v) => v.issues.some((i) => i.code === "JOURNAL_INVALID")),
      );
      assert.deepEqual(snapshotTree(f.root), afterHook);
      assert.equal(
        readFileSync(path.join(f.root, journalPath(stateDir, valid)), "utf8"),
        JSON.stringify(journal(f.root, target, valid)),
      );
      passed = true;
    });
  test(`${target}: an in-memory draft cannot be serialized or persisted as a durable record`, (t) => {
    const f = createTempProject();
    t.after(() => f.cleanup());
    const id = "1111111111111111";
    const draft: TransactionDraft = {
      ...journal(f.root, target, id),
      phase: "planned",
    };
    const before = snapshotTree(f.root);
    assert.throws(
      () => serializeJournal(draft as never),
      /draft cannot be serialized/,
    );
    assert.throws(
      () => persistJournal(f.root, journalPath(stateDir, id), draft as never),
      /draft cannot be serialized/,
    );
    assert.deepEqual(snapshotTree(f.root), before);
  });
}

for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  test(`${target}: the authentic writer cannot conceal unrecorded writer inventory`, (t) => {
    const f = createTempProject();
    let passed = false;
    t.after(() => {
      if (passed) f.cleanup();
      else console.error(`Retained failed owned recovery inventory: ${f.root}`);
    });
    const valid = "1111111111111111";
    write(f.root, valid, journal(f.root, target, valid));
    let fired = false;
    let afterHook: ReturnType<typeof snapshotTree> = [];
    const result = recoverTransaction(f.root, stateDir, valid, roots(target), {
      after(boundary) {
        if (boundary !== "durability:writer-acquire" || fired) return;
        fired = true;
        writeFileSync(
          path.join(f.root, writerLockDir(stateDir), "operator-evidence"),
          "preserve foreign coordination evidence",
        );
        afterHook = snapshotTree(f.root);
      },
    });
    assert.equal(fired, true);
    assert.equal(result.status, "refused", JSON.stringify(result));
    assert.deepEqual(snapshotTree(f.root), afterHook);
    passed = true;
  });

for (const target of ["sveltekit", "astro", "svelte-library"] as const)
  for (const single of [false, true])
    for (const duringAcquisition of [false, true])
      test(`${target}: new foreign mapping refuses ${single ? "single" : "all"} recovery ${duringAcquisition ? "under writer" : "before writer"}`, (t) => {
        const f = createTempProject();
        let passed = false;
        t.after(() => {
          if (passed) f.cleanup();
          else
            console.error(
              `Retained failed owned recovery inventory: ${f.root}`,
            );
        });
        const valid = "1111111111111111";
        write(f.root, valid, journal(f.root, target, valid));
        f.writeDir("operator-existing");
        let fired = false;
        let expected: ReturnType<typeof snapshotTree> = [];
        const mutate = () => {
          fired = true;
          const state = path.join(
            f.root,
            "operator-existing",
            "new",
            "ui",
            "_kit",
          );
          mkdirSync(state, { recursive: true });
          writeFileSync(path.join(state, "kit.lock.json"), "{}\n");
          expected = snapshotTree(f.root).filter(
            (v) => !v.path.startsWith(writerLockDir(stateDir)),
          );
        };
        if (!duringAcquisition) mutate();
        const hooks = {
          after(boundary: string) {
            if (
              duringAcquisition &&
              !fired &&
              boundary === "durability:writer-acquire"
            )
              mutate();
          },
        };
        const results = single
          ? [recoverTransaction(f.root, stateDir, valid, roots(target), hooks)]
          : recoverTransactions(f.root, stateDir, roots(target), hooks);
        assert.equal(fired, true);
        assert.ok(
          results.every((row) => row.status === "refused"),
          JSON.stringify(results),
        );
        assert.ok(
          results.some((row) =>
            row.issues.some((i) => i.code === "RECOVERY_FOREIGN_INSTALLATION"),
          ),
          JSON.stringify(results),
        );
        assert.deepEqual(snapshotTree(f.root), expected);
        passed = true;
      });
