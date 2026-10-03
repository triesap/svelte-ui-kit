import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { createEnvelope } from "../../src/cli/protocol.js";
import { sha256Hex } from "../../src/codegen/digest.js";
import {
  EMPTY_DIGEST,
  parseJournal,
  persistJournal,
  serializeJournal,
  validateJournalTargets,
  type TransactionJournal,
} from "../../src/codegen/transaction-journal.js";

const ROOTS = {
  uiDir: "src/lib/components/ui",
  stylesDir: "src/styles",
  layoutFile: "src/routes/+layout.svelte",
  stateDir: "src/lib/components/ui/_kit",
};

function validJournal(): TransactionJournal {
  return {
    schemaVersion: 1,
    transactionId: "0123456789abcdef0123456789abcdef",
    rootIdentity: "a".repeat(64),
    planDigest: "b".repeat(64),
    phase: "planned",
    operations: [
      {
        path: "src/styles/kit.css",
        operation: "update",
        preimage: {
          kind: "file",
          digest: sha256Hex("old css"),
          mode: 0o644,
        },
        resultDigest: sha256Hex("new css"),
        resultMode: 0o644,
        backupId: "backup-0",
        stagedId: "stage-0",
        applied: false,
      },
      {
        path: "src/lib/components/ui/button.svelte",
        operation: "create",
        preimage: { kind: "absent", digest: null, mode: null },
        resultDigest: sha256Hex("<button />"),
        resultMode: 0o644,
        backupId: null,
        stagedId: "stage-1",
        applied: false,
      },
      {
        path: "src/lib/components/ui/old.svelte",
        operation: "retire",
        preimage: {
          kind: "file",
          digest: sha256Hex("old component"),
          mode: 0o644,
        },
        resultDigest: EMPTY_DIGEST,
        resultMode: 0o644,
        backupId: "backup-2",
        stagedId: null,
        applied: false,
      },
    ],
    lock: {
      path: "src/lib/components/ui/_kit/kit.lock.json",
      digest: sha256Hex("lock"),
      published: false,
      unchanged: false,
    },
  };
}

test("a valid journal round-trips deterministically", () => {
  const journal = validJournal();
  const first = serializeJournal(journal);
  const parsed = parseJournal(first);
  assert.equal(parsed.ok, true);
  if (!parsed.ok) return;
  assert.deepEqual(parsed.value, journal);
  assert.equal(serializeJournal(parsed.value), first);
});

test("forged paths and duplicate targets are refused", () => {
  const journal = validJournal();
  const escaped = parseJournal(
    JSON.stringify({
      ...journal,
      operations: [
        {
          ...journal.operations[1],
          path: "../escape.svelte",
        },
      ],
    }),
  );
  assert.equal(escaped.ok, false);
  if (!escaped.ok) {
    assert.match(
      escaped.issues.map((i) => i.message).join("; "),
      /safe logical/,
    );
  }

  const duplicate = parseJournal(
    JSON.stringify({
      ...journal,
      operations: [
        journal.operations[1],
        {
          ...journal.operations[1],
          path: journal.operations[1].path.toUpperCase(),
        },
      ],
    }),
  );
  assert.equal(duplicate.ok, false);
  if (!duplicate.ok) {
    assert.match(
      duplicate.issues.map((i) => i.message).join("; "),
      /duplicates target/,
    );
  }
});

test("bad digests, unknown states and unknown operations are refused", () => {
  const journal = validJournal();
  const badDigest = parseJournal(
    JSON.stringify({
      ...journal,
      operations: [{ ...journal.operations[0], resultDigest: "zz" }],
    }),
  );
  assert.equal(badDigest.ok, false);

  const unknownPhase = parseJournal(
    JSON.stringify({ ...journal, phase: "halfway" }),
  );
  assert.equal(unknownPhase.ok, false);
  if (!unknownPhase.ok) {
    assert.match(
      unknownPhase.issues.map((i) => i.message).join("; "),
      /phase is unknown/,
    );
  }

  const unknownOperation = parseJournal(
    JSON.stringify({
      ...journal,
      operations: [{ ...journal.operations[0], operation: "delete" }],
    }),
  );
  assert.equal(unknownOperation.ok, false);

  const extraKey = parseJournal(JSON.stringify({ ...journal, extra: true }));
  assert.equal(extraKey.ok, false);
  if (!extraKey.ok) {
    assert.match(
      extraKey.issues.map((i) => i.message).join("; "),
      /keys must be exactly/,
    );
  }

  assert.equal(parseJournal("{not json}").ok, false);
});

test("journal targets are validated against the approved roots", () => {
  const journal = validJournal();
  assert.equal(validateJournalTargets(journal, ROOTS).ok, true);

  const outside = {
    ...journal,
    operations: [{ ...journal.operations[0], path: "src/other/file.css" }],
  };
  assert.equal(validateJournalTargets(outside, ROOTS).ok, false);

  const transient = {
    ...journal,
    operations: [
      {
        ...journal.operations[0],
        path: "src/lib/components/ui/_kit/.svelte-ui-kit/x",
      },
    ],
  };
  assert.equal(validateJournalTargets(transient, ROOTS).ok, false);

  const wrongLock = {
    ...journal,
    lock: { ...journal.lock!, path: "src/styles/kit.lock.json" },
  };
  assert.equal(validateJournalTargets(wrongLock, ROOTS).ok, false);
});

test("internal transient fields never appear in the semantic envelope", () => {
  const envelope = createEnvelope({
    command: "sync",
    status: "planned",
    data: { planned: true },
  });
  const rendered = JSON.stringify(envelope);
  assert.deepEqual(Object.keys(envelope).sort(), [
    "changes",
    "command",
    "data",
    "diagnostics",
    "schemaVersion",
    "status",
  ]);
  for (const internal of [
    "transactionId",
    "planDigest",
    "preimage",
    "stagedId",
  ]) {
    assert.ok(!rendered.includes(internal), `${internal} must not leak`);
  }
});

test("persistJournal writes a durable, re-readable record", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-journal-"));
  try {
    const journal = validJournal();
    const logical =
      "src/lib/components/ui/_kit/.svelte-ui-kit/transactions/0123456789abcdef0123456789abcdef/journal.json";
    persistJournal(root, logical, journal);
    const text = readFileSync(path.join(root, ...logical.split("/")), "utf8");
    const parsed = parseJournal(text);
    assert.equal(parsed.ok, true);
    if (parsed.ok) assert.deepEqual(parsed.value, journal);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("owned created-directory records round-trip and reject malformed entries", () => {
  const journal = {
    ...validJournal(),
    createdDirs: [{ path: "src/styles", device: 42, inode: 7 }],
  };
  const text = serializeJournal(journal);
  const parsed = parseJournal(text);
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  if (parsed.ok) assert.deepEqual(parsed.value, journal);

  const unsafe = parseJournal(
    JSON.stringify({
      ...journal,
      createdDirs: [{ path: "../escape", device: 1, inode: 2 }],
    }),
  );
  assert.equal(unsafe.ok, false);

  const unknownKey = parseJournal(
    JSON.stringify({
      ...journal,
      createdDirs: [{ path: "src", device: 1, inode: 2, extra: true }],
    }),
  );
  assert.equal(unknownKey.ok, false);

  const duplicate = parseJournal(
    JSON.stringify({
      ...journal,
      createdDirs: [
        { path: "src/styles", device: 1, inode: 2 },
        { path: "SRC/STYLES", device: 3, inode: 4 },
      ],
    }),
  );
  assert.equal(duplicate.ok, false);
});
