import assert from "node:assert/strict";
import {
  chmodSync,
  closeSync,
  fstatSync,
  mkdirSync,
  mkdtempSync,
  openSync,
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

import { applyPlan, validateApplyPlan } from "../../src/transactions/apply.js";
import {
  identityDigest,
  observeRootIdentity,
} from "../../src/codegen/authority.js";
import { composeApplyPlan } from "../../src/codegen/compose.js";
import { parseKitLock } from "../../src/codegen/lock.js";
import { holdMutationAuthority } from "../../src/transactions/mutation-authority.js";
import { planAdd } from "../../src/codegen/plan-add.js";
import { publishLock } from "../../src/transactions/publish-lock.js";
import { recoverTransactions } from "../../src/transactions/recovery.js";
import { captureSnapshot } from "../../src/codegen/snapshot.js";
import { stageOperations } from "../../src/transactions/stage.js";
import {
  persistJournal,
  type TransactionJournal,
} from "../../src/transactions/journal.js";
import {
  journalPath,
  lockPath,
  publicationIntentPath,
  stagedDir,
  transactionsDir,
  writerLockDir,
} from "../../src/transactions/types.js";
import {
  acquireWriterLock,
  releaseWriterLock,
} from "../../src/transactions/write-lock.js";
import {
  DEFAULT_KIT_CONFIG,
  generationInputPaths,
} from "../../src/project/config.js";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import {
  abs,
  capturedFixtureInit,
  GUARDED_LAYOUT,
  GUARDED_STATE,
  GUARDED_STYLES,
  lockJson,
  makeGuardedPlan,
  write,
} from "../helpers/guarded-plan.js";
import { RECOVERY_ROOTS } from "../helpers/transactions.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

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

function publicationFixture(root: string, existing = true) {
  const id = "0404040404040404";
  if (existing)
    write(
      root,
      lockPath(GUARDED_STATE),
      new TextDecoder().decode(lockJson("c".repeat(64))),
    );
  write(root, `${GUARDED_STATE}/.operator-note`, "keep hidden state");
  const writer = acquireWriterLock(root, GUARDED_STATE, id);
  assert.equal(writer.ok, true, JSON.stringify(writer));
  if (!writer.ok) throw new Error("writer acquisition failed");
  const staged = stageOperations(root, GUARDED_STATE, id, []);
  assert.equal(staged.ok, true, JSON.stringify(staged));
  if (!staged.ok) throw new Error("stage failed");
  const identity = observeRootIdentity(root);
  if (!identity.ok) throw new Error("root unavailable");
  const journal: TransactionJournal = {
    target: "sveltekit",
    createdDirs: [],
    ignoreFiles: [],
    schemaVersion: 3,
    transactionId: id,
    rootIdentity: identityDigest(identity.value),
    planDigest: "b".repeat(64),
    phase: "applied",
    operations: [],
    lock: null,
  };
  persistJournal(root, journalPath(GUARDED_STATE, id), journal);
  const stagedLock = `${stagedDir(GUARDED_STATE, id)}/kit.lock.json`;
  const authority = holdMutationAuthority(root, [
    lockPath(GUARDED_STATE),
    stagedLock,
  ]);
  return { id, journal, authority, stagedLock, writer: writer.value };
}

for (const event of ["after-stage", "before-publish"] as const) {
  for (const mutation of [
    "canonical-bytes",
    "canonical-mode",
    "canonical-identity",
    "canonical-delete",
    "staged-bytes",
    "staged-mode",
    "staged-identity",
    "staged-parent",
    "ancestor-mode",
    "writer",
  ] as const) {
    test(`publication preserves a returning ${mutation} edit ${event}`, () => {
      withRoot((root) => {
        const fixture = publicationFixture(root);
        let edited: ReturnType<typeof snapshotTree> | undefined;
        const mutate = () => {
          const canonical = abs(root, lockPath(GUARDED_STATE));
          const stage = abs(root, fixture.stagedLock);
          if (mutation === "canonical-bytes")
            writeFileSync(canonical, "late canonical edit");
          else if (mutation === "canonical-mode") chmodSync(canonical, 0o2644);
          else if (mutation === "canonical-identity") {
            const bytes = readFileSync(canonical);
            renameSync(canonical, `${canonical}.operator-original`);
            writeFileSync(canonical, bytes, { mode: 0o644 });
          } else if (mutation === "canonical-delete") unlinkSync(canonical);
          else if (mutation === "staged-bytes")
            writeFileSync(stage, "late staged edit");
          else if (mutation === "staged-mode") chmodSync(stage, 0o2644);
          else if (mutation === "staged-identity") {
            const bytes = readFileSync(stage);
            renameSync(stage, `${stage}.operator-original`);
            writeFileSync(stage, bytes, { mode: 0o644 });
          } else if (mutation === "staged-parent") {
            const directory = path.dirname(stage);
            renameSync(directory, `${directory}.operator-original`);
            mkdirSync(directory, { mode: 0o700 });
            renameSync(
              path.join(`${directory}.operator-original`, path.basename(stage)),
              stage,
            );
          } else if (mutation === "ancestor-mode")
            chmodSync(abs(root, GUARDED_STATE), 0o700);
          else {
            const owner = abs(
              root,
              `${writerLockDir(GUARDED_STATE)}/owner.json`,
            );
            const bytes = readFileSync(owner);
            renameSync(owner, `${owner}.operator-original`);
            writeFileSync(owner, bytes, { mode: 0o600 });
          }
          edited = snapshotTree(root);
        };
        try {
          const result = publishLock(
            root,
            GUARDED_STATE,
            fixture.journal,
            lockJson("d".repeat(64)),
            0o644,
            RECOVERY_ROOTS,
            {
              before: (boundary) => {
                if (event === "before-publish" && boundary === "lock:publish")
                  mutate();
              },
              after: (boundary) => {
                if (event === "after-stage" && boundary === "lock:stage")
                  mutate();
              },
            },
            undefined,
            fixture.authority,
          );
          assert.equal(result.ok, false, JSON.stringify(result));
          assert.ok(edited);
          assert.deepEqual(snapshotTree(root), edited);
          assert.equal(result.journal.phase, "applied");
          const witness = abs(
            root,
            publicationIntentPath(GUARDED_STATE, fixture.id),
          );
          if (event === "after-stage")
            assert.throws(() => readFileSync(witness), { code: "ENOENT" });
          else {
            const observed = JSON.parse(readFileSync(witness, "utf8"));
            assert.deepEqual(
              observed.preimage,
              fixture.authority.preimages.get(lockPath(GUARDED_STATE))
                ?.identity,
            );
          }
        } finally {
          assert.equal(
            releaseWriterLock(fixture.writer).ok,
            mutation !== "writer",
          );
        }
      });
    });
  }
}

test("an absent canonical that appears at publication survives", () => {
  withRoot((root) => {
    const fixture = publicationFixture(root, false);
    let edited: ReturnType<typeof snapshotTree> | undefined;
    try {
      const result = publishLock(
        root,
        GUARDED_STATE,
        fixture.journal,
        lockJson("d".repeat(64)),
        0o644,
        RECOVERY_ROOTS,
        {
          before: (boundary) => {
            if (boundary !== "lock:publish") return;
            write(root, lockPath(GUARDED_STATE), "new user lock");
            edited = snapshotTree(root);
          },
        },
        undefined,
        fixture.authority,
      );
      assert.equal(result.ok, false);
      assert.ok(edited);
      assert.deepEqual(snapshotTree(root), edited);
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

test("publication cannot bless a canonical replaced before invocation", () => {
  withRoot((root) => {
    const fixture = publicationFixture(root);
    try {
      const canonical = abs(root, lockPath(GUARDED_STATE));
      const bytes = readFileSync(canonical);
      renameSync(canonical, `${canonical}.operator-original`);
      writeFileSync(canonical, bytes, { mode: 0o644 });
      const before = snapshotTree(root);
      const result = publishLock(
        root,
        GUARDED_STATE,
        fixture.journal,
        lockJson("d".repeat(64)),
        0o644,
        RECOVERY_ROOTS,
        undefined,
        undefined,
        fixture.authority,
      );
      assert.equal(result.ok, false);
      assert.deepEqual(snapshotTree(root), before);
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

for (const invalid of ["copied", "unheld"] as const) {
  test(`publication with ${invalid} authority has zero effects`, () => {
    withRoot((root) => {
      const fixture = publicationFixture(root);
      if (invalid === "unheld")
        assert.equal(releaseWriterLock(fixture.writer).ok, true);
      try {
        const before = snapshotTree(root);
        const result = publishLock(
          root,
          GUARDED_STATE,
          fixture.journal,
          lockJson("d".repeat(64)),
          0o644,
          RECOVERY_ROOTS,
          undefined,
          undefined,
          invalid === "copied" ? { ...fixture.authority } : fixture.authority,
        );
        assert.equal(result.ok, false);
        assert.equal(
          result.issues[0].code,
          invalid === "copied"
            ? "MUTATION_AUTHORITY_INVALID"
            : "WRITER_LOCK_NOT_HELD",
        );
        assert.deepEqual(snapshotTree(root), before);
      } finally {
        if (invalid === "copied")
          assert.equal(releaseWriterLock(fixture.writer).ok, true);
      }
    });
  });
}

test("a sealed lock buffer changed during replacement cannot become publication input", () => {
  withRoot((root) => {
    const plan = sealed(makeGuardedPlan(root));
    const outcome = applyPlan(plan, {
      after: (boundary) => {
        if (boundary === "replace:apply") plan.lock.bytes.fill(0);
      },
    });
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome));
    assert.ok(
      outcome.issues.some((entry) => entry.code === "PLAN_AUTHORITY_STALE"),
    );
    assert.equal(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`), "utf8"),
      "old css",
    );
    assert.throws(() => readFileSync(abs(root, lockPath(GUARDED_STATE))), {
      code: "ENOENT",
    });
  });
});

test("publication freezes intended bytes before returning hooks", () => {
  withRoot((root) => {
    const fixture = publicationFixture(root);
    const bytes = lockJson("d".repeat(64));
    const original = Uint8Array.from(bytes);
    try {
      const result = publishLock(
        root,
        GUARDED_STATE,
        fixture.journal,
        bytes,
        0o644,
        RECOVERY_ROOTS,
        {
          before: (boundary) => {
            if (boundary === "lock:stage") bytes.fill(0);
          },
        },
        undefined,
        fixture.authority,
      );
      assert.equal(result.ok, true, JSON.stringify(result));
      assert.deepEqual(
        readFileSync(abs(root, lockPath(GUARDED_STATE))),
        Buffer.from(original),
      );
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

test("a completed publication rename remains committed if its next hook throws", () => {
  withRoot((root) => {
    const fixture = publicationFixture(root);
    const bytes = lockJson("d".repeat(64));
    try {
      const result = publishLock(
        root,
        GUARDED_STATE,
        fixture.journal,
        bytes,
        0o644,
        RECOVERY_ROOTS,
        {
          before: (boundary) => {
            if (boundary === "durability:lock-publish")
              throw new Error("after completed rename");
          },
        },
        undefined,
        fixture.authority,
      );
      assert.equal(result.ok, false);
      assert.equal(result.journal.phase, "published");
      assert.equal(result.journal.lock?.published, true);
      assert.deepEqual(
        readFileSync(abs(root, lockPath(GUARDED_STATE))),
        Buffer.from(bytes),
      );
      assert.throws(() => readFileSync(abs(root, fixture.stagedLock)), {
        code: "ENOENT",
      });
    } finally {
      assert.equal(releaseWriterLock(fixture.writer).ok, true);
    }
  });
});

for (const boundary of ["durability:lock-publish", "lock:publish"] as const) {
  for (const mutation of ["bytes", "mode", "identity"] as const) {
    test(`published rename retains evidence after returning ${boundary} canonical ${mutation} edit`, () => {
      withRoot((root) => {
        const plan = sealed(makeGuardedPlan(root));
        let edited: Buffer | undefined;
        const outcome = applyPlan(plan, {
          after(candidate) {
            if (candidate !== boundary || edited !== undefined) return;
            const canonical = abs(root, lockPath(GUARDED_STATE));
            if (mutation === "bytes")
              writeFileSync(canonical, "late canonical edit");
            else if (mutation === "mode") chmodSync(canonical, 0o2644);
            else {
              const bytes = readFileSync(canonical);
              renameSync(canonical, `${canonical}.operator-original`);
              writeFileSync(canonical, bytes, { mode: 0o644 });
            }
            edited = readFileSync(canonical);
          },
        });
        assert.ok(edited, "returning post-rename hook must execute");
        assert.equal(
          outcome.kind,
          "committed_needs_cleanup",
          JSON.stringify(outcome),
        );
        assert.deepEqual(
          readFileSync(abs(root, lockPath(GUARDED_STATE))),
          edited,
        );
        assert.ok(outcome.transactionId);
        assert.ok(
          readFileSync(
            abs(root, journalPath(GUARDED_STATE, outcome.transactionId)),
          ),
        );
        assert.ok(
          readFileSync(
            abs(
              root,
              publicationIntentPath(GUARDED_STATE, outcome.transactionId),
            ),
          ),
        );
      });
    });
  }
}

for (const mutation of ["bytes", "mode", "identity", "writer"] as const) {
  test(`published recovery preserves a returning canonical ${mutation} edit before cleanup`, () => {
    withRoot((root) => {
      const plan = sealed(makeGuardedPlan(root));
      const outcome = applyPlan(plan, {
        before: (boundary) => {
          if (boundary === "cleanup:staged")
            throw new Error("retain committed evidence");
        },
      });
      assert.equal(
        outcome.kind,
        "committed_needs_cleanup",
        JSON.stringify(outcome),
      );
      const writer = acquireWriterLock(root, GUARDED_STATE, "0404040404040404");
      assert.equal(writer.ok, true, JSON.stringify(writer));
      if (!writer.ok) throw new Error("writer unavailable");
      let edited: ReturnType<typeof snapshotTree> | undefined;
      try {
        const result = recoverTransactions(
          root,
          GUARDED_STATE,
          RECOVERY_ROOTS,
          {
            before: (boundary) => {
              if (boundary !== "recovery:cleanup") return;
              const canonical = abs(root, lockPath(GUARDED_STATE));
              if (mutation === "bytes")
                writeFileSync(canonical, "late published edit");
              else if (mutation === "mode") chmodSync(canonical, 0o2644);
              else if (mutation === "identity") {
                const bytes = readFileSync(canonical);
                renameSync(canonical, `${canonical}.operator-original`);
                writeFileSync(canonical, bytes, { mode: 0o644 });
              } else {
                const owner = abs(
                  root,
                  `${writerLockDir(GUARDED_STATE)}/owner.json`,
                );
                const bytes = readFileSync(owner);
                renameSync(owner, `${owner}.operator-original`);
                writeFileSync(owner, bytes, { mode: 0o600 });
              }
              edited = snapshotTree(root);
            },
          },
        );
        assert.equal(result[0]?.status, "refused", JSON.stringify(result));
        assert.ok(edited, JSON.stringify(result));
        assert.deepEqual(snapshotTree(root), edited);
      } finally {
        assert.equal(releaseWriterLock(writer.value).ok, mutation !== "writer");
      }
    });
  });
}

function sameByteRepair(root: string) {
  const initial = makeGuardedPlan(root);
  const originalLayout = readFileSync(abs(root, GUARDED_LAYOUT));
  assert.equal(applyPlan(sealed(initial)).kind, "applied");
  const installedLayout = readFileSync(abs(root, GUARDED_LAYOUT));
  const css = readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`));
  writeFileSync(abs(root, GUARDED_LAYOUT), originalLayout);
  const candidate = capturedFixtureInit(root);
  const lock = readFileSync(abs(root, lockPath(GUARDED_STATE)));
  assert.deepEqual(Buffer.from(candidate.lock.bytes), lock);
  assert.ok(candidate.targets.some((target) => target.path === GUARDED_LAYOUT));
  return {
    plan: sealed(candidate),
    originalLayout,
    installedLayout,
    css,
    lock,
  };
}

test("a same-byte interruption before the rename is not a false commit", () => {
  withRoot((root) => {
    const fixture = sameByteRepair(root);
    let reached = false;
    const outcome = applyPlan(fixture.plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          reached = true;
          throw new Error("interruption before canonical rename");
        }
      },
    });
    assert.equal(reached, true);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.deepEqual(
      readFileSync(abs(root, GUARDED_LAYOUT)),
      fixture.originalLayout,
    );
    assert.deepEqual(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`)),
      fixture.css,
    );
    assert.deepEqual(
      readFileSync(abs(root, lockPath(GUARDED_STATE))),
      fixture.lock,
    );
  });
});

test("a canonical lock deleted before the rename is a contradiction that preserves source", () => {
  withRoot((root) => {
    const fixture = sameByteRepair(root);
    let reached = false;
    const outcome = applyPlan(fixture.plan, {
      before: (boundary) => {
        if (boundary === "lock:publish") {
          reached = true;
          unlinkSync(abs(root, lockPath(GUARDED_STATE)));
          throw new Error("canonical was removed before the rename");
        }
      },
    });
    assert.equal(reached, true);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome.issues));
    assert.ok(
      outcome.issues.some(
        (issue) => issue.code === "RECOVERY_AMBIGUOUS_PUBLICATION",
      ),
      JSON.stringify(outcome.issues),
    );
    assert.deepEqual(
      readFileSync(abs(root, GUARDED_LAYOUT)),
      fixture.installedLayout,
    );
    assert.deepEqual(
      readFileSync(abs(root, `${GUARDED_STYLES}/kit.css`)),
      fixture.css,
    );
  });
});

test("add publishes a physical witness when only canonical config formatting changes", () => {
  withRoot((root) => {
    assert.equal(applyPlan(sealed(makeGuardedPlan(root))).kind, "applied");
    const configPath = `${GUARDED_STATE}/kit.json`;
    const canonicalConfig = readFileSync(abs(root, configPath));
    writeFileSync(
      abs(root, configPath),
      JSON.stringify(JSON.parse(canonicalConfig.toString())),
    );
    const beforeConfig = readFileSync(abs(root, configPath));
    const lockBytes = readFileSync(abs(root, lockPath(GUARDED_STATE)));
    const lock = parseKitLock(JSON.parse(lockBytes.toString()));
    assert.ok(lock.ok, JSON.stringify(lock));
    const registry = loadRegistrySnapshot(createAssetProvider(process.cwd()));
    assert.ok(registry.ok, JSON.stringify(registry));
    const snapshot = captureSnapshot(root, [
      ...generationInputPaths(),
      configPath,
      lockPath(GUARDED_STATE),
      `${DEFAULT_KIT_CONFIG.uiDir}/index.ts`,
      `${GUARDED_STYLES}/kit.css`,
      `${GUARDED_STYLES}/themes.css`,
      `${GUARDED_STYLES}/app.css`,
      GUARDED_LAYOUT,
      ".gitignore",
    ]);
    assert.ok(snapshot.ok, JSON.stringify(snapshot));
    const added = planAdd({
      config: DEFAULT_KIT_CONFIG,
      registry: registry.value,
      snapshot: snapshot.value,
      lock: lock.value,
      addedRoots: [],
      registryVersion: registry.value.root.registryVersion,
      registryHash: registry.value.root.contentHash,
    });
    assert.ok(added.ok, JSON.stringify(added));
    assert.equal(
      added.value.executable,
      true,
      JSON.stringify(added.value.diagnostics),
    );
    assert.ok(added.value.writes.some((write) => write.path === configPath));
    const publication = added.value.writes.find(
      (write) => write.path === lockPath(GUARDED_STATE),
    );
    assert.ok(publication);
    assert.deepEqual(Buffer.from(publication.bytes), lockBytes);
    const composed = composeApplyPlan({
      root,
      config: DEFAULT_KIT_CONFIG,
      snapshot: snapshot.value,
      writes: added.value.writes,
      exportAuthority: added.value.exportAuthority,
    });
    assert.ok(composed.ok, JSON.stringify(composed));
    let reached = false;
    const outcome = applyPlan(sealed(composed.value), {
      before(boundary) {
        if (boundary === "lock:publish") {
          reached = true;
          throw new Error("before same-byte publication");
        }
      },
    });
    assert.equal(reached, true);
    assert.equal(outcome.kind, "refused", JSON.stringify(outcome));
    assert.deepEqual(readFileSync(abs(root, configPath)), beforeConfig);
    assert.deepEqual(
      readFileSync(abs(root, lockPath(GUARDED_STATE))),
      lockBytes,
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
          // Keep the old inode allocated: unlink/recreate may otherwise reuse it
          // immediately on Linux and fail to inject the intended identity fault.
          const original = openSync(stagedLock, "r");
          try {
            const before = fstatSync(original, { bigint: true });
            unlinkSync(stagedLock);
            writeFileSync(stagedLock, bytes, { mode: 0o644 });
            const after = statSync(stagedLock, { bigint: true });
            assert.notDeepEqual(
              [after.dev, after.ino],
              [before.dev, before.ino],
            );
          } finally {
            closeSync(original);
          }
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
