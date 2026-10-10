import assert from "node:assert/strict";
import {
  existsSync,
  chmodSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  renameSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { sha256Hex } from "../../src/codegen/digest.js";
import {
  cleanupStaged,
  stageOperations,
  verifyStaged,
  type StageOperation,
} from "../../src/codegen/stage.js";
import { faultAt } from "../../src/codegen/transaction-hooks.js";
import { stagedDir } from "../../src/codegen/transaction-types.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const STATE_DIR = "src/lib/components/ui/_kit";
const ID = "3333333333333333";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-stage-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

const abs = (root: string, logical: string): string =>
  path.join(root, ...logical.split("/"));

function liveWrite(root: string, logical: string, text: string): void {
  const target = abs(root, logical);
  mkdirSync(path.dirname(target), { recursive: true });
  writeFileSync(target, text);
}

test("staged bytes and digests match the plan", () => {
  withRoot((root) => {
    const operations: StageOperation[] = [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("new css"),
        mode: 0o644,
      },
      {
        path: "src/lib/components/ui/button.svelte",
        operation: "create",
        bytes: new TextEncoder().encode("<button />"),
        mode: 0o600,
      },
      {
        path: "src/lib/components/ui/old.svelte",
        operation: "retire",
        bytes: new Uint8Array(0),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(root, STATE_DIR, ID, operations);
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    assert.equal(staged.value.records.length, 2);
    for (const record of staged.value.records) {
      const text = readFileSync(abs(root, record.stagedPath), "utf8");
      assert.equal(sha256Hex(text), record.digest);
    }
    assert.equal(verifyStaged(root, staged.value.records).ok, true);
  });
});

test("a staging write failure leaves live files unchanged", () => {
  withRoot((root) => {
    liveWrite(root, "src/styles/kit.css", "original css");
    const operations: StageOperation[] = [
      {
        path: "src/styles/kit.css",
        operation: "update",
        bytes: new TextEncoder().encode("replacement css"),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(
      root,
      STATE_DIR,
      ID,
      operations,
      faultAt("stage:write"),
    );
    assert.equal(staged.ok, false);
    if (!staged.ok) assert.equal(staged.issues[0].code, "STAGE_FAILED");
    assert.equal(
      readFileSync(abs(root, "src/styles/kit.css"), "utf8"),
      "original css",
    );
  });
});

test("cleanup removes only the owned staged directory", () => {
  withRoot((root) => {
    const transient = abs(root, `${STATE_DIR}/.svelte-ui-kit`);
    const unrelated = path.join(transient, "unrelated.tmp");
    mkdirSync(transient, { recursive: true });
    writeFileSync(unrelated, "keep me");
    const staged = stageOperations(root, STATE_DIR, ID, [
      {
        path: "new.css",
        operation: "create",
        bytes: Buffer.from("staged"),
        mode: 0o600,
      },
    ]);
    assert.equal(staged.ok, true);
    if (!staged.ok) return;
    const stagedAbs = abs(root, staged.value.stagedDirectory);

    assert.deepEqual(cleanupStaged(stagedAbs, staged.value.ownership), []);
    assert.equal(existsSync(stagedAbs), false);
    assert.equal(existsSync(unrelated), true);
  });
});

test("a namespace name cannot authorize staging cleanup or adopt existing staging", () => {
  withRoot((root) => {
    const stagedAbs = abs(root, stagedDir(STATE_DIR, ID));
    mkdirSync(stagedAbs, { recursive: true });
    writeFileSync(path.join(stagedAbs, "stage-0"), "operator bytes");
    const before = snapshotTree(root);
    assert.equal(cleanupStaged(stagedAbs)[0]?.code, "OWNED_CLEANUP_REFUSED");
    const result = stageOperations(root, STATE_DIR, ID, [
      {
        path: "new.css",
        operation: "create",
        bytes: Buffer.from("replacement"),
        mode: 0o600,
      },
    ]);
    assert.equal(result.ok, false);
    assert.deepEqual(snapshotTree(root), before);
  });
});

test("exclusive empty-file creation is accounted for before a write failure", () => {
  withRoot((root) => {
    const before = snapshotTree(root);
    const result = stageOperations(
      root,
      STATE_DIR,
      ID,
      [
        {
          path: "new.css",
          operation: "create",
          bytes: Buffer.from("replacement"),
          mode: 0o600,
        },
      ],
      faultAt("stage:create"),
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.issues[0]?.code, "STAGE_FAILED");
    assert.ok(result.ownership.some((entry) => entry.kind === "file"));
    assert.deepEqual(snapshotTree(root), before);
  });
});

for (const mutation of [
  "unknown",
  "bytes",
  "mode",
  "identity",
  "link",
  "directory",
] as const) {
  test(`staging retains the whole uncertain inventory after ${mutation} mutation`, () => {
    withRoot((root) => {
      let expected: ReturnType<typeof snapshotTree> | undefined;
      const stagedAbs = abs(root, stagedDir(STATE_DIR, ID));
      const target = path.join(stagedAbs, "stage-0");
      const result = stageOperations(
        root,
        STATE_DIR,
        ID,
        [
          {
            path: "new.css",
            operation: "create",
            bytes: Buffer.from("replacement"),
            mode: 0o600,
          },
        ],
        {
          after: (boundary) => {
            if (boundary !== "stage:write") return;
            if (mutation === "unknown")
              writeFileSync(path.join(stagedAbs, ".operator"), "keep");
            if (mutation === "bytes") writeFileSync(target, "operator bytes");
            if (mutation === "mode") chmodSync(target, 0o644);
            if (mutation === "identity") {
              const replacement = path.join(root, "replacement.tmp");
              writeFileSync(replacement, "replacement", { mode: 0o600 });
              renameSync(replacement, target);
            }
            if (mutation === "link" || mutation === "directory") {
              rmSync(target);
              if (mutation === "link")
                symlinkSync("/unavailable-operator-target", target);
              else mkdirSync(target);
            }
            expected = snapshotTree(root);
            throw new Error("causal stage failure after operator mutation");
          },
        },
      );
      assert.equal(result.ok, false);
      if (result.ok) return;
      assert.equal(result.issues[0]?.code, "STAGE_FAILED");
      assert.ok(
        result.issues.some((entry) => entry.code === "OWNED_CLEANUP_REFUSED"),
      );
      assert.deepEqual(snapshotTree(root), expected);
    });
  });
}

test("staging does not create live target directories", () => {
  withRoot((root) => {
    const operations: StageOperation[] = [
      {
        path: "src/lib/components/ui/deep/new.svelte",
        operation: "create",
        bytes: new TextEncoder().encode("<new />"),
        mode: 0o644,
      },
    ];
    const staged = stageOperations(root, STATE_DIR, ID, operations);
    assert.equal(staged.ok, true);
    assert.equal(
      existsSync(abs(root, "src/lib/components/ui/deep")),
      false,
      "staging must not create live parent directories",
    );
  });
});
