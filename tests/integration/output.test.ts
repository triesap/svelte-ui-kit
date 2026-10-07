import { spawnSync } from "node:child_process";
import path from "node:path";
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyOutcomeEnvelope,
  issueEnvelope,
  renderCommandOutput,
} from "../../src/cli/output.js";
import {
  createEnvelope,
  readRenderedEnvelope,
  type ResultStatus,
} from "../../src/cli/protocol.js";

for (const status of [
  "success",
  "planned",
  "no_change",
  "warning",
  "conflict",
  "error",
  "unsupported",
] as ResultStatus[]) {
  test(`one deterministic JSON envelope for ${status}`, () => {
    const envelope = createEnvelope({
      command: "init",
      status,
      diagnostics:
        status === "error" || status === "conflict" || status === "unsupported"
          ? [{ code: "CHECK", level: "error", message: "Resolve input" }]
          : [],
      changes:
        status === "planned"
          ? [{ action: "create", path: "src/ui/button.svelte", applied: false }]
          : [],
    });
    const result = renderCommandOutput(envelope, true);
    assert.equal(result.stderr, "");
    assert.equal(readRenderedEnvelope(result.stdout).ok, true);
    assert.equal(result.stdout, renderCommandOutput(envelope, true).stdout);
    assert.equal(result.stdout.includes("\u001b"), false);
  });
}

test("JSON help uses the same single-object renderer", () => {
  const result = renderCommandOutput(
    createEnvelope({
      command: "help",
      status: "success",
      data: "command help",
    }),
    true,
  );
  assert.equal(readRenderedEnvelope(result.stdout).ok, true);
  assert.equal(result.exitCode, 0);
});

test("human failures use only stderr and frozen typed exit classes", () => {
  const envelope = issueEnvelope("init", [
    {
      code: "INPUT_BAD",
      message: "Fix the source",
      locator: "src/routes/+layout.svelte",
    },
  ]);
  for (const [cause, exit] of [
    ["usage", 2],
    ["strict_doctor", 3],
    ["unsafe_path", 11],
    ["registry_failure", 12],
  ] as const) {
    const output = renderCommandOutput(envelope, false, cause);
    assert.equal(output.stdout, "");
    assert.equal(output.exitCode, exit);
    assert.match(output.stderr, /INPUT_BAD: Fix the source/);
    assert.match(output.stderr, /before retrying/);
  }
});

test("planned and applied human changes have distinct truthful verbs", () => {
  const envelope = createEnvelope({
    command: "add",
    status: "planned",
    changes: [
      { action: "create", path: "src/ui/button.svelte", applied: false },
    ],
  });
  assert.match(renderCommandOutput(envelope, false).stdout, /Planned create/);
  const applied = applyOutcomeEnvelope(
    "add",
    {
      kind: "applied",
      transactionId: "11111111-1111-4111-8111-111111111111",
      issues: [],
    },
    envelope.changes,
  );
  assert.match(renderCommandOutput(applied, false).stdout, /Applied create/);
});

test("internal transaction details never enter equivalent semantic output", () => {
  const make = (id: string) =>
    applyOutcomeEnvelope(
      "sync",
      {
        kind: "refused",
        transactionId: id,
        issues: [
          {
            code: "RECOVERY_JOURNAL_UNREADABLE",
            message: `transaction ${id} has no readable journal`,
            locator: "/private/host",
          },
        ],
      },
      [],
    );
  const a = make("11111111-1111-4111-8111-111111111111"),
    b = make("22222222-2222-4222-8222-222222222222");
  assert.equal(
    renderCommandOutput(a, true).stdout,
    renderCommandOutput(b, true).stdout,
  );
  assert.equal(a.diagnostics[0]?.locator, undefined);
  assert.equal(a.data, null);
  assert.deepEqual(a.changes, []);
});

test("committed cleanup warning reports writes and manual guidance without rollback claims", () => {
  const envelope = applyOutcomeEnvelope(
    "init",
    {
      kind: "committed_needs_cleanup",
      transactionId: "t",
      issues: [
        {
          code: "RECOVERY_UNEXPECTED_ENTRY",
          message: "Inspect the owned namespace",
        },
      ],
    },
    [{ action: "create", path: "src/ui/index.ts", applied: false }],
  );
  const output = renderCommandOutput(envelope, false);
  assert.equal(output.exitCode, 0);
  assert.match(output.stdout, /Applied create/);
  assert.match(output.stderr, /unknown state/);
  assert.equal(envelope.changes[0]?.applied, true);
});

test("built executable JSON help and usage failure use the shared renderer", () => {
  for (const args of [
    ["--json", "--help"],
    ["--help", "--json"],
    ["--json", "--help", "extra"],
  ]) {
    const result = spawnSync(
      process.execPath,
      [path.resolve("dist/cli/main.js"), ...args],
      { encoding: "utf8" },
    );
    assert.equal(result.status, args.length === 2 ? 0 : 2, result.stderr);
    assert.equal(result.stderr, "");
    const parsed = readRenderedEnvelope(result.stdout);
    assert.equal(parsed.ok, true, JSON.stringify(parsed));
    if (parsed.ok) {
      assert.equal(parsed.value.command, "help");
      assert.equal(
        parsed.value.status,
        args.length === 2 ? "success" : "error",
      );
    }
  }
});
