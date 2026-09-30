import assert from "node:assert/strict";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

import {
  classifyStrictCheck,
  prepareStrictFixture,
  runStrictCheck,
} from "../helpers/strict-audit.js";

/**
 * S011 strict declaration audit controls.
 *
 * The fixture's `skipLibCheck: true` is accepted only because exactly two
 * pinned upstream Bits 2.19.3 declarations fail under `skipLibCheck: false`.
 * The baseline proves the qualified exception; injected authored `.svelte`,
 * `.ts` and `.d.ts` errors plus an additional disposable dependency error must
 * all fail the audit; removing the injections restores the baseline. No shared
 * installed package is modified.
 */

test("the strict audit qualifies exactly the two pinned upstream diagnostics", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());

  const run = runStrictCheck(copy.root);
  const result = classifyStrictCheck(run, copy.root);
  assert.equal(
    result.kind,
    "qualified-upstream-exception",
    `strict audit must qualify the pinned upstream exception\n${result.reasons.join("\n")}\n${run.output}`,
  );
  assert.equal(run.exitCode, 1, "the raw strict checker still exits 1");
  assert.equal(result.diagnostics.length, 2);
  assert.ok(
    result.diagnostics.every((diagnostic) => diagnostic.severity === "error"),
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.file.endsWith("bits/button/components/button.svelte.d.ts") &&
        diagnostic.line === 2 &&
        diagnostic.column === 23,
    ),
    "the button union-complexity diagnostic must be present",
  );
  assert.ok(
    result.diagnostics.some(
      (diagnostic) =>
        diagnostic.file.endsWith(
          "bits/calendar/components/calendar.svelte.d.ts",
        ) &&
        diagnostic.line === 2 &&
        diagnostic.column === 25,
    ),
    "the calendar union-complexity diagnostic must be present",
  );
});

test("authored and additional dependency errors fail the strict audit, and removal restores the baseline", (t) => {
  const copy = prepareStrictFixture();
  t.after(() => copy.cleanup());

  const baseline = classifyStrictCheck(runStrictCheck(copy.root), copy.root);
  assert.equal(baseline.kind, "qualified-upstream-exception");

  const srcDir = path.join(copy.root, "src");
  const authoredSvelte = path.join(srcDir, "audit-authored.svelte");
  const authoredTs = path.join(srcDir, "audit-authored.ts");
  const authoredDts = path.join(srcDir, "audit-authored.d.ts");
  const probeSource = path.join(srcDir, "audit-probe.ts");
  const probePackage = path.join(copy.root, "node_modules", "suik-audit-probe");

  writeFileSync(
    authoredSvelte,
    '<script lang="ts">\n  const authoredValue: number = "not a number";\n</script>\n\n<p>{authoredValue}</p>\n',
  );
  writeFileSync(
    authoredTs,
    'export const authoredNumber: number = "not a number";\n',
  );
  writeFileSync(
    authoredDts,
    "declare const brokenNumber: number;\ndeclare const brokenString: string = brokenNumber;\n",
  );
  mkdirSync(probePackage, { recursive: true });
  writeFileSync(
    path.join(probePackage, "package.json"),
    `${JSON.stringify({ name: "suik-audit-probe", version: "0.0.0", types: "index.d.ts" }, null, 2)}\n`,
  );
  writeFileSync(
    path.join(probePackage, "index.d.ts"),
    "declare const brokenProbe: number;\ndeclare const brokenProbeString: string = brokenProbe;\n",
  );
  writeFileSync(
    probeSource,
    '/// <reference path="./audit-authored.d.ts" />\nimport "suik-audit-probe";\n\nexport const probe = 1;\n',
  );

  const faulted = classifyStrictCheck(runStrictCheck(copy.root), copy.root);
  assert.equal(
    faulted.kind,
    "rejected",
    `the faulted audit must be rejected\n${faulted.reasons.join("\n")}\n${faulted.raw}`,
  );
  const reasons = faulted.reasons.join("\n");
  assert.match(reasons, /authored diagnostic/);
  assert.match(reasons, /additional dependency diagnostic/);
  const files = faulted.diagnostics.map((diagnostic) => diagnostic.file);
  assert.ok(
    files.some((file) => file.endsWith("src/audit-authored.svelte")),
    "the authored Svelte error must be reported",
  );
  assert.ok(
    files.some((file) => file.endsWith("src/audit-authored.ts")),
    "the authored TypeScript error must be reported",
  );
  assert.ok(
    files.some((file) => file.endsWith("src/audit-authored.d.ts")),
    "the authored declaration error must be reported",
  );
  assert.ok(
    files.some((file) => file.endsWith("suik-audit-probe/index.d.ts")),
    "the additional dependency error must be reported",
  );

  rmSync(authoredSvelte, { force: true });
  rmSync(authoredTs, { force: true });
  rmSync(authoredDts, { force: true });
  rmSync(probeSource, { force: true });
  rmSync(probePackage, { recursive: true, force: true });

  const restored = classifyStrictCheck(runStrictCheck(copy.root), copy.root);
  assert.equal(
    restored.kind,
    "qualified-upstream-exception",
    `restoration must return to the known baseline\n${restored.reasons.join("\n")}\n${restored.raw}`,
  );
});
