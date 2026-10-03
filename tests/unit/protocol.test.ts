import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createEnvelope,
  exitCodeFor,
  FAILURE_CLASS_EXITS,
  isSafeLocator,
  isSuccessStatus,
  parseEnvelope,
  PROTOCOL_VERSION,
  readRenderedEnvelope,
  recoveryDiagnostic,
  recoveryGuidance,
  renderEnvelope,
  STATUS_EXITS,
  type ResultStatus,
} from "../../src/cli/protocol.js";

/**
 * S022 tests: the exit map is frozen, envelopes are single and deterministic,
 * and unsafe physical locators are never exposed.
 */

test("every result status has a stable exit outcome", () => {
  const expected: Record<ResultStatus, number> = {
    success: 0,
    planned: 0,
    no_change: 0,
    warning: 0,
    error: 1,
    unsupported: 2,
    conflict: 10,
  };
  for (const [status, code] of Object.entries(expected)) {
    assert.equal(exitCodeFor(status as ResultStatus), code, status);
    assert.equal(STATUS_EXITS[status as ResultStatus], code, status);
    assert.equal(isSuccessStatus(status as ResultStatus), code === 0, status);
  }
});

test("a specific failure class wins over the ordinary error exit", () => {
  assert.equal(exitCodeFor("error", "usage"), 2);
  assert.equal(exitCodeFor("error", "strict_doctor"), 3);
  assert.equal(exitCodeFor("error", "unsafe_path"), 11);
  assert.equal(exitCodeFor("error", "registry_failure"), 12);
  assert.equal(exitCodeFor("conflict", "registry_failure"), 10);
  assert.deepEqual(FAILURE_CLASS_EXITS, {
    usage: 2,
    strict_doctor: 3,
    unsafe_path: 11,
    registry_failure: 12,
  });
});

test("the protocol version is independent of package and framework versions", () => {
  assert.equal(PROTOCOL_VERSION, 1);
  const envelope = createEnvelope({ command: "info", status: "success" });
  assert.equal(envelope.schemaVersion, 1);
});

test("a golden envelope round-trips and renders deterministically", () => {
  const envelope = createEnvelope({
    command: "add",
    status: "success",
    diagnostics: [
      { code: "ADD_INSTALLED", level: "info", message: "Installed button." },
    ],
    changes: [
      {
        action: "create",
        path: "src/lib/components/ui/button.svelte",
        applied: true,
      },
    ],
    data: { installed: ["button"], transitive: ["spinner", "tokens"] },
  });
  const rendered = renderEnvelope(envelope);
  assert.equal(renderEnvelope(envelope), rendered);
  assert.match(rendered, /\n$/);
  const parsed = readRenderedEnvelope(rendered);
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  if (parsed.ok) {
    assert.deepEqual(parsed.value, envelope);
    assert.equal(parsed.value.diagnostics.length, 1);
  }
});

test("canonical rendering ignores object key insertion order", () => {
  const a = createEnvelope({
    command: "info",
    status: "success",
    data: { b: 2, a: 1 },
  });
  const b = createEnvelope({
    command: "info",
    status: "success",
    data: { a: 1, b: 2 },
  });
  assert.equal(renderEnvelope(a), renderEnvelope(b));
});

test("unsafe physical locators and change paths are rejected", () => {
  for (const locator of [
    "/etc/passwd",
    "C:\\secret",
    "\\\\server\\share",
    "../x",
  ]) {
    const result = parseEnvelope(
      createEnvelope({
        command: "doctor",
        status: "warning",
        diagnostics: [{ code: "X", level: "warn", message: "m", locator }],
      }),
    );
    assert.equal(result.ok, false, locator);
    if (!result.ok) {
      assert.equal(result.issues[0]?.code, "ENVELOPE_LOCATOR_UNSAFE");
    }
  }
  assert.equal(isSafeLocator("src/routes/+layout.svelte"), true);
  assert.equal(isSafeLocator("../x"), false);
  const unsafePath = parseEnvelope(
    createEnvelope({
      command: "init",
      status: "success",
      changes: [{ action: "create", path: "/abs/file.css", applied: true }],
    }),
  );
  assert.equal(unsafePath.ok, false);
  if (!unsafePath.ok) {
    assert.equal(unsafePath.issues[0]?.code, "ENVELOPE_CHANGE_PATH_UNSAFE");
  }
});

test("status invariants are enforced", () => {
  const plannedApplied = parseEnvelope(
    createEnvelope({
      command: "add",
      status: "planned",
      changes: [
        {
          action: "create",
          path: "src/lib/components/ui/button.svelte",
          applied: true,
        },
      ],
    }),
  );
  assert.equal(plannedApplied.ok, false);
  if (!plannedApplied.ok) {
    assert.equal(plannedApplied.issues[0]?.code, "ENVELOPE_PLANNED_APPLIED");
  }
  const noChangeWithChanges = parseEnvelope(
    createEnvelope({
      command: "sync",
      status: "no_change",
      changes: [
        { action: "update", path: "src/styles/kit.css", applied: false },
      ],
    }),
  );
  assert.equal(noChangeWithChanges.ok, false);
  const errorWithoutDiagnostic = parseEnvelope(
    createEnvelope({ command: "add", status: "error" }),
  );
  assert.equal(errorWithoutDiagnostic.ok, false);
  if (!errorWithoutDiagnostic.ok) {
    assert.equal(
      errorWithoutDiagnostic.issues[0]?.code,
      "ENVELOPE_ERROR_WITHOUT_DIAGNOSTIC",
    );
  }
});

test("a rendered envelope is exactly one JSON document", () => {
  const rendered = renderEnvelope(
    createEnvelope({
      command: "version",
      status: "success",
      data: { version: "0.1.0" },
    }),
  );
  assert.equal(rendered.trimEnd().split("\n\n").length, 1);
  const objectCount = (rendered.match(/^\}$/gm) ?? []).length;
  assert.equal(objectCount, 1);
  const doubled = `${rendered}${rendered}`;
  const result = readRenderedEnvelope(doubled);
  assert.equal(result.ok, false);
});

test("unknown commands and statuses fail the schema", () => {
  assert.equal(
    parseEnvelope({
      ...createEnvelope({ command: "info", status: "success" }),
      command: "remove",
    }).ok,
    false,
  );
  assert.equal(
    parseEnvelope({
      ...createEnvelope({ command: "info", status: "success" }),
      status: "ok",
    }).ok,
    false,
  );
});

test("recovery diagnostics carry code-specific manual guidance", () => {
  const codes = [
    "RECOVERY_SCAN_UNSAFE",
    "RECOVERY_UNEXPECTED_ENTRY",
    "RECOVERY_ROOT_MISMATCH",
    "RECOVERY_ANCESTRY_NOT_EMPTY",
    "RECOVERY_AMBIGUOUS_JOURNAL",
    "WRITER_BUSY",
    "WRITER_LOCK_UNOWNED",
  ];
  const fallback =
    "Inspect the retained transaction evidence and reconcile manually before retrying.";
  for (const code of codes) {
    const guidance = recoveryGuidance(code);
    assert.notEqual(guidance, fallback, code);
    assert.ok(!/force|--recover|roll forward/i.test(guidance), code);
    const diagnostic = recoveryDiagnostic({
      code,
      message: `${code} occurred`,
      locator: "src/styles/kit.css",
    });
    assert.equal(diagnostic.code, code);
    assert.equal(diagnostic.guidance, guidance);
  }
});
