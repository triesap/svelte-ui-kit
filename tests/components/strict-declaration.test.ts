import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { runFixtureScript } from "../helpers/fixture.js";
import {
  classifyStrictCheck,
  parseMachineVerbose,
  prepareStrictFixture,
  runStrictCheck,
  validateStrictAuditVersions,
  type BinOutcome,
  type StrictCheckRun,
} from "../helpers/strict-audit.js";

/**
 * S011 strict declaration audit controls.
 *
 * The fixture's `skipLibCheck: true` is accepted only because exactly two
 * pinned upstream Bits 2.19.3 declarations fail under `skipLibCheck: false`.
 * The baseline proves the qualified exception. Pure parser controls prove the
 * `--output machine-verbose` parser fails closed on unknown, truncated,
 * duplicate and inconsistent output. Synthetic classifier controls prove tool
 * failures, changed pins and misleading path suffixes are rejected. Real
 * checker controls prove separately authored `.svelte`, `.ts`, referenced
 * `.d.ts` and additional-dependency errors are rejected and that removing them
 * restores the baseline. No shared installed package is modified.
 */

const OK_SYNC: BinOutcome = {
  exitCode: 0,
  signal: null,
  timedOut: false,
  stdout: "",
  stderr: "",
};

function syntheticRun(
  machine: string,
  check: Partial<BinOutcome> = {},
): StrictCheckRun {
  return {
    sync: OK_SYNC,
    check: {
      exitCode: 1,
      signal: null,
      timedOut: false,
      stdout: machine,
      stderr: "",
      ...check,
    },
  };
}

function startRecord(workspace = "/ws"): string {
  return `1 START ${JSON.stringify(workspace)}`;
}

function diagnosticRecord(overrides: Record<string, unknown> = {}): string {
  return `2 ${JSON.stringify({
    type: "ERROR",
    filename: "src/a.ts",
    start: { line: 0, character: 0 },
    end: { line: 0, character: 1 },
    message: "boom",
    code: 2322,
    ...overrides,
  })}`;
}

function completedRecord(
  errors: number,
  warnings: number,
  problems: number,
): string {
  return `9 COMPLETED 10 FILES ${errors} ERRORS ${warnings} WARNINGS ${problems} FILES_WITH_PROBLEMS`;
}

function machine(lines: readonly string[]): string {
  return `${lines.join("\n")}\n`;
}

const ACCEPTED_MACHINE = machine([
  startRecord(),
  diagnosticRecord(),
  completedRecord(1, 0, 1),
]);

function classify(copy: {
  root: string;
}): ReturnType<typeof classifyStrictCheck> {
  return classifyStrictCheck(runStrictCheck(copy.root), copy.root);
}

// ---------------------------------------------------------------------------
// Pure parser controls
// ---------------------------------------------------------------------------

test("the machine parser accepts a complete well-formed stream", () => {
  const parsed = parseMachineVerbose(ACCEPTED_MACHINE);
  assert.equal(parsed.ok, true, parsed.reasons.join("\n"));
  assert.equal(parsed.run?.workspace, "/ws");
  assert.equal(parsed.run?.diagnostics.length, 1);
  assert.deepEqual(parsed.run?.completed, {
    files: 10,
    errors: 1,
    warnings: 0,
    filesWithProblems: 1,
  });
});

test("the machine parser rejects unknown, malformed and truncated records", () => {
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        diagnosticRecord(),
        completedRecord(1, 0, 1),
        `10 UNKNOWN "extra"`,
      ]),
    ).reasons.join("\n"),
    /unknown record type/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        `2 {"type":"ERROR","filename":`,
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /truncated or malformed diagnostic JSON/,
  );
  assert.match(
    parseMachineVerbose(
      machine([startRecord(), diagnosticRecord()]),
    ).reasons.join("\n"),
    /missing COMPLETED record/,
  );
  assert.match(
    parseMachineVerbose(machine([startRecord()])).reasons.join("\n"),
    /missing COMPLETED record/,
  );
  assert.match(
    parseMachineVerbose(machine(['not-a-timestamp START "/ws"'])).reasons.join(
      "\n",
    ),
    /malformed record/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        diagnosticRecord({ type: "INFO" }),
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /unknown diagnostic type/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        diagnosticRecord({ start: { line: "x", character: 0 } }),
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /malformed position/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        diagnosticRecord({ code: undefined }),
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /missing diagnostic code/,
  );
});

test("the machine parser rejects summary and duplicate inconsistencies", () => {
  assert.match(
    parseMachineVerbose(
      machine([startRecord(), diagnosticRecord(), completedRecord(2, 0, 2)]),
    ).reasons.join("\n"),
    /summary reports 2 error\(s\) but 1 diagnostic record\(s\) were parsed/,
  );
  assert.match(
    parseMachineVerbose(
      machine([startRecord(), diagnosticRecord(), completedRecord(1, 0, 2)]),
    ).reasons.join("\n"),
    /summary reports 2 problem file\(s\) but 1 distinct diagnostic file\(s\) were parsed/,
  );
  assert.match(
    parseMachineVerbose(
      machine([startRecord(), startRecord(), completedRecord(0, 0, 0)]),
    ).reasons.join("\n"),
    /duplicate START record/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        completedRecord(0, 0, 0),
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /duplicate COMPLETED record/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        diagnosticRecord(),
        diagnosticRecord(),
        completedRecord(2, 0, 1),
      ]),
    ).reasons.join("\n"),
    /duplicate diagnostic record/,
  );
  assert.match(
    parseMachineVerbose(
      machine([
        startRecord(),
        `2 FAILURE "Connection closed"`,
        completedRecord(0, 0, 0),
      ]),
    ).reasons.join("\n"),
    /FAILURE "Connection closed"/,
  );
});

// ---------------------------------------------------------------------------
// Synthetic classifier controls
// ---------------------------------------------------------------------------

test("the classifier rejects tool failures, signals, timeouts and unexpected stderr", () => {
  const base = ACCEPTED_MACHINE;
  assert.match(
    classifyStrictCheck(
      syntheticRun(base, { timedOut: true }),
      process.cwd(),
    ).reasons.join("\n"),
    /strict checker timed out/,
  );
  assert.match(
    classifyStrictCheck(
      syntheticRun(base, { signal: "SIGKILL" }),
      process.cwd(),
    ).reasons.join("\n"),
    /terminated by signal SIGKILL/,
  );
  assert.match(
    classifyStrictCheck(
      syntheticRun(base, { exitCode: 2 }),
      process.cwd(),
    ).reasons.join("\n"),
    /expected the strict checker to exit 1/,
  );
  assert.match(
    classifyStrictCheck(
      syntheticRun(base, { stderr: "node: warning\n" }),
      process.cwd(),
    ).reasons.join("\n"),
    /strict checker wrote unexpected stderr/,
  );
  assert.match(
    classifyStrictCheck(
      { sync: { ...OK_SYNC, exitCode: 1 }, check: syntheticRun(base).check },
      process.cwd(),
    ).reasons.join("\n"),
    /svelte-kit sync exited 1/,
  );
  assert.match(
    classifyStrictCheck(
      {
        sync: { ...OK_SYNC, stderr: "sync noise\n" },
        check: syntheticRun(base).check,
      },
      process.cwd(),
    ).reasons.join("\n"),
    /svelte-kit sync wrote unexpected stderr/,
  );
});

test("the classifier rejects warnings", () => {
  const result = classifyStrictCheck(
    syntheticRun(
      machine([
        startRecord(),
        diagnosticRecord({ type: "WARNING", message: "warn" }),
        completedRecord(0, 1, 1),
      ]),
    ),
    process.cwd(),
  );
  assert.equal(result.kind, "rejected");
  assert.match(result.reasons.join("\n"), /expected zero warnings, found 1/);
});

test("the classifier rejects a misleading Bits-like path outside the installed package", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());

  const fakeWorkspace = mkdtempSync(path.join(os.tmpdir(), "suik-audit-fake-"));
  t.after(() => rmSync(fakeWorkspace, { recursive: true, force: true }));

  const fakeDiagnostic = (filename: string): string =>
    `2 ${JSON.stringify({
      type: "ERROR",
      filename,
      start: { line: 1, character: 22 },
      end: { line: 1, character: 76 },
      message:
        "Expression produces a union type that is too complex to represent.",
      code: 2590,
    })}`;
  const result = classifyStrictCheck(
    syntheticRun(
      machine([
        `1 START ${JSON.stringify(fakeWorkspace)}`,
        fakeDiagnostic(
          "node_modules/bits-ui/dist/bits/button/components/button.svelte.d.ts",
        ),
        fakeDiagnostic(
          "node_modules/bits-ui/dist/bits/calendar/components/calendar.svelte.d.ts",
        ),
        completedRecord(2, 0, 2),
      ]),
    ),
    copy.root,
  );
  assert.equal(result.kind, "rejected");
  assert.match(
    result.reasons.join("\n"),
    /missing the expected upstream diagnostic/,
  );
});

test("the version guard rejects every changed or unreadable pin", (t) => {
  assert.deepEqual(
    validateStrictAuditVersions(prepareStrictFixture().root),
    [],
    "the maintained fixture must match every approved pin",
  );

  const fakeRoot = mkdtempSync(path.join(os.tmpdir(), "suik-audit-pins-"));
  t.after(() => rmSync(fakeRoot, { recursive: true, force: true }));
  for (const name of [
    "bits-ui",
    "typescript",
    "svelte",
    "svelte-check",
    "csstype",
    "@internationalized/date",
  ]) {
    const dir = path.join(fakeRoot, "node_modules", name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(
      path.join(dir, "package.json"),
      `${JSON.stringify({ name, version: "9.9.9" })}\n`,
    );
  }
  const reasons = validateStrictAuditVersions(fakeRoot);
  assert.equal(reasons.length, 6);
  assert.match(reasons.join("\n"), /bits-ui pin changed: expected 2\.19\.3/);
});

// ---------------------------------------------------------------------------
// Real checker controls
// ---------------------------------------------------------------------------

test("the strict audit qualifies exactly the two pinned upstream diagnostics", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());

  const run = runStrictCheck(copy.root);
  const result = classifyStrictCheck(run, copy.root);
  assert.equal(
    result.kind,
    "qualified-upstream-exception",
    `strict audit must qualify the pinned upstream exception\n${result.reasons.join("\n")}\n${result.raw}`,
  );
  assert.equal(run.check.exitCode, 1, "the raw strict checker still exits 1");
  assert.equal(result.diagnostics.length, 2);
  assert.ok(
    result.diagnostics.every((diagnostic) => diagnostic.type === "ERROR"),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.filename.endsWith(
          "bits/button/components/button.svelte.d.ts",
        ) &&
        diagnostic.code === 2590 &&
        diagnostic.start.character === 22,
    ),
    "the button union-complexity diagnostic must be present",
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.filename.endsWith(
          "bits/calendar/components/calendar.svelte.d.ts",
        ) &&
        diagnostic.code === 2590 &&
        diagnostic.start.character === 24,
    ),
    "the calendar union-complexity diagnostic must be present",
  );
});

interface AuthoredProbe {
  readonly label: string;
  readonly category: "authored" | "additional dependency";
  readonly expectedFile: string;
  readonly files: ReadonlyArray<{
    readonly rel: string;
    readonly contents: string;
    readonly kind: "file" | "dir";
  }>;
}

const AUTHORED_PROBES: readonly AuthoredProbe[] = [
  {
    label: "authored Svelte component with a colon and space",
    category: "authored",
    expectedFile: "src/audit authored:probe.svelte",
    files: [
      {
        rel: "src/audit authored:probe.svelte",
        kind: "file",
        contents:
          '<script lang="ts">\n  const authoredValue: number = "not a number";\n</script>\n\n<p>{authoredValue}</p>\n',
      },
    ],
  },
  {
    label: "authored TypeScript module with a colon",
    category: "authored",
    expectedFile: "src/audit-authored:probe.ts",
    files: [
      {
        rel: "src/audit-authored:probe.ts",
        kind: "file",
        contents: 'export const authoredNumber: number = "not a number";\n',
      },
    ],
  },
  {
    label: "referenced declaration file with a colon",
    category: "authored",
    expectedFile: "src/audit-declared:probe.d.ts",
    files: [
      {
        rel: "src/audit-declared:probe.d.ts",
        kind: "file",
        contents:
          "declare const brokenNumber: number;\ndeclare const brokenString: string = brokenNumber;\n",
      },
      {
        rel: "src/audit-reference.ts",
        kind: "file",
        contents:
          '/// <reference path="./audit-declared:probe.d.ts" />\nexport const probe = 1;\n',
      },
    ],
  },
  {
    label: "additional disposable dependency",
    category: "additional dependency",
    expectedFile: "suik-audit-probe/index.d.ts",
    files: [
      {
        rel: "node_modules/suik-audit-probe",
        kind: "dir",
        contents: "",
      },
      {
        rel: "node_modules/suik-audit-probe/package.json",
        kind: "file",
        contents: `${JSON.stringify(
          { name: "suik-audit-probe", version: "0.0.0", types: "index.d.ts" },
          null,
          2,
        )}\n`,
      },
      {
        rel: "node_modules/suik-audit-probe/index.d.ts",
        kind: "file",
        contents:
          "declare const brokenProbe: number;\ndeclare const brokenProbeString: string = brokenProbe;\n",
      },
      {
        rel: "src/audit-dependency.ts",
        kind: "file",
        contents: 'import "suik-audit-probe";\n\nexport const probe = 1;\n',
      },
    ],
  },
];

function applyProbe(root: string, probe: AuthoredProbe): void {
  for (const file of probe.files) {
    const abs = path.join(root, file.rel);
    if (file.kind === "dir") {
      mkdirSync(abs, { recursive: true });
    } else {
      mkdirSync(path.dirname(abs), { recursive: true });
      writeFileSync(abs, file.contents);
    }
  }
}

function removeProbe(root: string, probe: AuthoredProbe): void {
  for (const file of [...probe.files].reverse()) {
    rmSync(path.join(root, file.rel), { recursive: true, force: true });
  }
}

for (const probe of AUTHORED_PROBES) {
  test(`an ${probe.label} error fails the strict audit`, (t) => {
    const copy = prepareStrictFixture();
    t.after(() => copy.cleanup());
    applyProbe(copy.root, probe);

    const result = classify(copy);
    assert.equal(
      result.kind,
      "rejected",
      `the ${probe.label} probe must be rejected\n${result.reasons.join("\n")}\n${result.raw}`,
    );
    assert.match(result.reasons.join("\n"), new RegExp(probe.category));
    assert.ok(
      result.diagnostics.some((diagnostic) =>
        diagnostic.filename.endsWith(probe.expectedFile),
      ),
      `the ${probe.label} diagnostic must name ${probe.expectedFile}`,
    );
  });
}

test("removing every authored probe restores and requalifies the strict baseline", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());
  for (const probe of AUTHORED_PROBES) applyProbe(copy.root, probe);

  const faulted = classify(copy);
  assert.equal(faulted.kind, "rejected");
  for (const probe of AUTHORED_PROBES) {
    assert.match(
      faulted.reasons.join("\n"),
      new RegExp(probe.category),
      `${probe.label} must be rejected`,
    );
  }

  for (const probe of AUTHORED_PROBES) removeProbe(copy.root, probe);
  const restored = classify(copy);
  assert.equal(
    restored.kind,
    "qualified-upstream-exception",
    `restoration must return to the known baseline\n${restored.reasons.join("\n")}\n${restored.raw}`,
  );
});

test("the normal fixture check hides the referenced declaration defect that the strict audit rejects", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());
  const probe = AUTHORED_PROBES[2];
  applyProbe(copy.root, probe);

  // The fixture's skipLibCheck:true hides the authored declaration defect.
  const normal = runFixtureScript(copy.root, "check");
  assert.equal(
    normal.status,
    0,
    `the normal fixture check must pass while the declaration defect is hidden\n${normal.stdout}\n${normal.stderr}`,
  );

  // The strict audit is the qualifier that refuses to admit it.
  const strict = classify(copy);
  assert.equal(strict.kind, "rejected");
  assert.match(strict.reasons.join("\n"), /authored diagnostic/);

  removeProbe(copy.root, probe);
  const restored = classify(copy);
  assert.equal(restored.kind, "qualified-upstream-exception");
});
