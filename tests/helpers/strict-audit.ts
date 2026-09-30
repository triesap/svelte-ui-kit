import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { copyConsumerFixture, type FixtureCopy } from "./fixture.js";

/**
 * Strict declaration audit for the fixture's `skipLibCheck: true` exception.
 *
 * The normal fixture check keeps `skipLibCheck: true` only because the pinned
 * upstream Bits declarations emit two union-complexity diagnostics under
 * `skipLibCheck: false`. This helper runs the *real* strict checker in an owned
 * copy and qualifies exactly those two pinned upstream diagnostics. Any other
 * authored or dependency diagnostic, a warning, changed pin, unknown output,
 * timeout or tool failure is rejected. It never modifies shared installed
 * packages; fault injection uses disposable owned copies.
 */

/** The only approved pinned package whose declarations are qualified. */
export const BITS_UI_PIN = "2.19.3";

const STRICT_TSCONFIG = `${JSON.stringify(
  { extends: "./tsconfig.json", compilerOptions: { skipLibCheck: false } },
  null,
  2,
)}\n`;

const KNOWN_UPSTREAM_DIAGNOSTICS = [
  {
    label: "bits-ui button",
    pathSuffix: [
      "node_modules",
      "bits-ui",
      "dist",
      "bits",
      "button",
      "components",
      "button.svelte.d.ts",
    ],
    line: 2,
    column: 23,
  },
  {
    label: "bits-ui calendar",
    pathSuffix: [
      "node_modules",
      "bits-ui",
      "dist",
      "bits",
      "calendar",
      "components",
      "calendar.svelte.d.ts",
    ],
    line: 2,
    column: 25,
  },
] as const;

export interface Diagnostic {
  readonly file: string;
  readonly line: number;
  readonly column: number;
  readonly severity: "error" | "warning";
  readonly message: string;
}

export interface StrictCheckRun {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
  readonly output: string;
}

export type StrictAuditClassification =
  | {
      readonly kind: "qualified-upstream-exception";
      readonly exitCode: number | null;
      readonly diagnostics: readonly Diagnostic[];
      readonly reasons: readonly string[];
      readonly raw: string;
    }
  | {
      readonly kind: "rejected";
      readonly exitCode: number | null;
      readonly diagnostics: readonly Diagnostic[];
      readonly reasons: readonly string[];
      readonly raw: string;
    };

/** Copy the maintained fixture and add the strict (no skipLibCheck) config. */
export function prepareStrictFixture(packageRoot = process.cwd()): FixtureCopy {
  const copy = copyConsumerFixture({ packageRoot });
  try {
    writeFileSync(
      path.join(copy.root, "tsconfig.strict.json"),
      STRICT_TSCONFIG,
    );
  } catch (error) {
    copy.cleanup();
    throw error;
  }
  return copy;
}

interface BinResult {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
  readonly output: string;
}

function runBin(
  root: string,
  bin: string,
  args: readonly string[],
  timeoutMs: number,
): BinResult {
  const env = { ...process.env };
  delete env["NODE_TEST_CONTEXT"];
  delete env["NODE_OPTIONS"];
  delete env["NODE_V8_COVERAGE"];
  const result = spawnSync(path.join(root, "node_modules", ".bin", bin), args, {
    cwd: root,
    encoding: "utf8",
    timeout: timeoutMs,
    env,
  });
  const error = result.error as NodeJS.ErrnoException | undefined;
  return {
    exitCode: result.status,
    signal: result.signal,
    timedOut: error?.code === "ETIMEDOUT",
    output: `${result.stdout ?? ""}\n${result.stderr ?? ""}`,
  };
}

/** Run `svelte-kit sync` then the strict `svelte-check` in an owned copy. */
export function runStrictCheck(
  root: string,
  timeoutMs = 240_000,
): StrictCheckRun {
  const sync = runBin(root, "svelte-kit", ["sync"], timeoutMs);
  if (sync.timedOut) {
    return {
      exitCode: null,
      signal: null,
      timedOut: true,
      output: sync.output,
    };
  }
  if (sync.exitCode !== 0) {
    return {
      exitCode: sync.exitCode,
      signal: sync.signal,
      timedOut: false,
      output: `svelte-kit sync failed\n${sync.output}`,
    };
  }
  const check = runBin(
    root,
    "svelte-check",
    ["--tsconfig", "./tsconfig.strict.json", "--fail-on-warnings"],
    timeoutMs,
  );
  return {
    exitCode: check.exitCode,
    signal: check.signal,
    timedOut: check.timedOut,
    output: `${sync.output}\n${check.output}`,
  };
}

export interface ParsedDiagnostics {
  readonly diagnostics: readonly Diagnostic[];
  readonly summary: {
    readonly errors: number;
    readonly warnings: number;
    readonly files: number;
  } | null;
}

/** Parse `svelte-check` diagnostics without relying on incidental output text. */
export function parseDiagnostics(output: string): ParsedDiagnostics {
  const lines = output.split(/\r?\n/);
  const diagnostics: Diagnostic[] = [];
  for (let index = 0; index < lines.length; index += 1) {
    const location = lines[index].match(/^(\/[^:]*):(\d+):(\d+)$/);
    if (!location) continue;
    let next = index + 1;
    while (next < lines.length && lines[next].trim() === "") next += 1;
    const detail = lines[next]?.match(/^(Error|Warning):\s?(.*)$/);
    if (!detail) continue;
    diagnostics.push({
      file: location[1],
      line: Number(location[2]),
      column: Number(location[3]),
      severity: detail[1] === "Error" ? "error" : "warning",
      message: detail[2].trimEnd(),
    });
  }
  const summary = output.match(
    /svelte-check found (\d+) errors? and (\d+) warnings? in (\d+) files?/,
  );
  return {
    diagnostics,
    summary: summary
      ? {
          errors: Number(summary[1]),
          warnings: Number(summary[2]),
          files: Number(summary[3]),
        }
      : null,
  };
}

function readPackageVersion(manifestPath: string): string | null {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
      version?: unknown;
    };
    return typeof manifest.version === "string" ? manifest.version : null;
  } catch {
    return null;
  }
}

/**
 * Qualify a strict-check run against the pinned upstream exception.
 *
 * A `qualified-upstream-exception` result is not a raw strict-check pass: the
 * checker still exited 1 with the two pinned upstream diagnostics. Any other
 * diagnostic (authored or dependency), warning, changed pin, unknown output,
 * timeout or tool failure produces a `rejected` result with reasons.
 */
export function classifyStrictCheck(
  run: StrictCheckRun,
  fixtureRoot: string,
): StrictAuditClassification {
  const parsed = parseDiagnostics(run.output);
  const reasons: string[] = [];
  const rejected = (): StrictAuditClassification => ({
    kind: "rejected",
    exitCode: run.exitCode,
    diagnostics: parsed.diagnostics,
    reasons,
    raw: run.output,
  });

  if (run.timedOut) {
    reasons.push("the strict checker timed out");
    return rejected();
  }
  if (run.exitCode !== 1) {
    reasons.push(
      `expected the strict checker to exit 1 with the pinned diagnostics, found exit ${String(run.exitCode)} signal ${String(run.signal)}`,
    );
    return rejected();
  }
  if (parsed.summary === null) {
    reasons.push("the strict checker produced no recognizable summary");
    return rejected();
  }
  if (parsed.summary.warnings !== 0) {
    reasons.push(
      `the strict checker reported ${parsed.summary.warnings} warning(s)`,
    );
    return rejected();
  }
  const pinnedVersion = readPackageVersion(
    path.join(fixtureRoot, "node_modules", "bits-ui", "package.json"),
  );
  if (pinnedVersion !== BITS_UI_PIN) {
    reasons.push(
      `bits-ui pin changed: expected ${BITS_UI_PIN}, found ${String(pinnedVersion)}`,
    );
    return rejected();
  }
  if (parsed.diagnostics.length !== KNOWN_UPSTREAM_DIAGNOSTICS.length) {
    reasons.push(
      `expected exactly ${KNOWN_UPSTREAM_DIAGNOSTICS.length} diagnostics, found ${parsed.diagnostics.length}`,
    );
  }

  const unmatched = [...parsed.diagnostics];
  for (const known of KNOWN_UPSTREAM_DIAGNOSTICS) {
    const expectedSuffix = known.pathSuffix.join(path.sep);
    const index = unmatched.findIndex(
      (diagnostic) =>
        diagnostic.file.endsWith(expectedSuffix) &&
        diagnostic.line === known.line &&
        diagnostic.column === known.column &&
        diagnostic.severity === "error" &&
        /union type that is too complex/.test(diagnostic.message),
    );
    if (index === -1) {
      reasons.push(
        `missing the expected upstream diagnostic ${known.label} at ${known.pathSuffix.join("/")}:${known.line}:${known.column}`,
      );
    } else {
      unmatched.splice(index, 1);
    }
  }
  for (const extra of unmatched) {
    const isDependency = extra.file.includes(
      `${path.sep}node_modules${path.sep}`,
    );
    reasons.push(
      `${isDependency ? "additional dependency" : "authored"} diagnostic: ${extra.file}:${extra.line}:${extra.column} [${extra.severity}] ${extra.message}`,
    );
  }

  if (reasons.length > 0) return rejected();
  return {
    kind: "qualified-upstream-exception",
    exitCode: run.exitCode,
    diagnostics: parsed.diagnostics,
    reasons: [],
    raw: run.output,
  };
}
