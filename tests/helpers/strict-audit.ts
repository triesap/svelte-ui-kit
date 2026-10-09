import { spawnSync } from "node:child_process";
import { readFileSync, realpathSync, writeFileSync } from "node:fs";
import path from "node:path";

import { copyConsumerFixture, type FixtureCopy } from "./fixture.js";

/**
 * Strict native/consumer qualification. The raw checker must exit zero with
 * no errors or warnings; no upstream diagnostic is excepted. Machine records,
 * tools, actual installed pins, native source and distribution are verified.
 * Fault injection only modifies owned copies.
 */
import {
  authenticateNativeInstall,
  NATIVE_BASELINE,
  observeNativeFile,
} from "../../src/project/native-dependency.js";

export const STRICT_AUDIT_PINS = {
  "bits-ui": NATIVE_BASELINE.version,
  typescript: "6.0.3",
  svelte: "5.57.1",
  "svelte-check": "4.7.6",
  csstype: "3.1.3",
  "@internationalized/date": "3.12.4",
} as const;

/** The only approved pinned package whose declarations are qualified. */
export const BITS_UI_PIN = STRICT_AUDIT_PINS["bits-ui"];

const STRICT_TSCONFIG = `${JSON.stringify(
  { extends: "./tsconfig.json", compilerOptions: { skipLibCheck: false } },
  null,
  2,
)}\n`;

/** A single parsed machine-verbose diagnostic record. */
export interface MachineDiagnostic {
  readonly type: "ERROR" | "WARNING";
  readonly filename: string;
  readonly start: { readonly line: number; readonly character: number };
  readonly end: { readonly line: number; readonly character: number };
  readonly message: string;
  readonly code: number | string;
  readonly source: string | null;
}

/** The parsed COMPLETED summary record. */
export interface MachineCompleted {
  readonly files: number;
  readonly errors: number;
  readonly warnings: number;
  readonly filesWithProblems: number;
}

/** A completely parsed machine-verbose run. */
export interface MachineRun {
  readonly workspace: string;
  readonly diagnostics: readonly MachineDiagnostic[];
  readonly completed: MachineCompleted;
}

/** Outcome of parsing a `--output machine-verbose` stream. */
export interface MachineParseResult {
  readonly ok: boolean;
  readonly reasons: readonly string[];
  readonly run: MachineRun | null;
}

/** The result of one child-process invocation. */
export interface BinOutcome {
  readonly exitCode: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly timedOut: boolean;
  readonly stdout: string;
  readonly stderr: string;
}

/** The sync and checker outcomes, kept separately attributable. */
export interface StrictCheckRun {
  readonly sync: BinOutcome;
  readonly check: BinOutcome;
}

export type StrictAuditClassification =
  | {
      readonly kind: "strict-pass";
      readonly exitCode: number | null;
      readonly diagnostics: readonly MachineDiagnostic[];
      readonly reasons: readonly string[];
      readonly raw: string;
    }
  | {
      readonly kind: "rejected";
      readonly exitCode: number | null;
      readonly diagnostics: readonly MachineDiagnostic[];
      readonly reasons: readonly string[];
      readonly raw: string;
    };

const EMPTY_OUTCOME: BinOutcome = {
  exitCode: null,
  signal: null,
  timedOut: false,
  stdout: "",
  stderr: "",
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

function runBin(
  root: string,
  bin: string,
  args: readonly string[],
  timeoutMs: number,
): BinOutcome {
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
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

/**
 * Run `svelte-kit sync` then the strict `svelte-check` in an owned copy. The
 * two child outcomes are preserved independently; when sync fails, the checker
 * is not run and its outcome is empty.
 */
export function runStrictCheck(
  root: string,
  timeoutMs = 240_000,
): StrictCheckRun {
  const sync = runBin(root, "svelte-kit", ["sync"], timeoutMs);
  if (sync.timedOut || sync.exitCode !== 0 || sync.signal !== null) {
    return { sync, check: EMPTY_OUTCOME };
  }
  const check = runBin(
    root,
    "svelte-check",
    [
      "--tsconfig",
      "./tsconfig.strict.json",
      "--fail-on-warnings",
      "--output",
      "machine-verbose",
    ],
    timeoutMs,
  );
  return { sync, check };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readPosition(
  value: unknown,
): { readonly line: number; readonly character: number } | null {
  if (!isPlainObject(value)) return null;
  const { line, character } = value;
  if (!Number.isInteger(line) || !Number.isInteger(character)) return null;
  if ((line as number) < 0 || (character as number) < 0) return null;
  return { line: line as number, character: character as number };
}

function readCode(value: unknown): number | string | null {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value !== "") return value;
  return null;
}

/**
 * Parse a COMPLETED summary count. Counts must be finite nonnegative safe
 * integers, so an overflowing digit run (which `Number` would coerce to a
 * float or `Infinity`) is rejected rather than silently accepted.
 */
function readSummaryCount(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value >= 0 ? value : null;
}

function describeDiagnostic(diagnostic: MachineDiagnostic): string {
  return `${diagnostic.filename}:${diagnostic.start.line + 1}:${diagnostic.start.character + 1} [${diagnostic.type}] ${diagnostic.message}`;
}

/**
 * Parse a complete `svelte-check --output machine-verbose` stream.
 *
 * The stream must be exactly one START record followed by zero or more
 * timestamped diagnostic JSON records, then exactly one COMPLETED summary.
 * Any FAILURE record, unknown record type, malformed or truncated JSON,
 * duplicate record, or summary that disagrees with the parsed diagnostics is
 * rejected with reasons.
 */
export function parseMachineVerbose(text: string): MachineParseResult {
  const reasons: string[] = [];
  const lines = text.split(/\r?\n/);
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }
  if (lines.length === 0) {
    return { ok: false, reasons: ["the machine output is empty"], run: null };
  }

  let workspace: string | null = null;
  let completed: MachineCompleted | null = null;
  const diagnostics: MachineDiagnostic[] = [];
  const seenDiagnostics = new Set<string>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === "") {
      reasons.push(`blank record at line ${index + 1}`);
      continue;
    }
    const record = line.match(/^(\d+) (.*)$/);
    if (!record) {
      reasons.push(
        `malformed record at line ${index + 1}: ${JSON.stringify(line)}`,
      );
      continue;
    }
    const payload = record[2];

    if (payload === "START" || payload.startsWith("START ")) {
      if (workspace !== null) reasons.push("duplicate START record");
      if (index !== 0) reasons.push("START must be the first record");
      const match = payload.match(/^START "(.*)"$/);
      if (!match) {
        reasons.push(`malformed START record: ${JSON.stringify(payload)}`);
      } else {
        workspace = match[1];
      }
      continue;
    }

    if (payload === "COMPLETED" || payload.startsWith("COMPLETED ")) {
      if (completed !== null) reasons.push("duplicate COMPLETED record");
      if (index !== lines.length - 1) {
        reasons.push("COMPLETED must be the last record");
      }
      const match = payload.match(
        /^COMPLETED (\d+) FILES (\d+) ERRORS (\d+) WARNINGS (\d+) FILES_WITH_PROBLEMS$/,
      );
      if (!match) {
        reasons.push(`malformed COMPLETED record: ${JSON.stringify(payload)}`);
      } else {
        const files = readSummaryCount(match[1]);
        const errors = readSummaryCount(match[2]);
        const warnings = readSummaryCount(match[3]);
        const filesWithProblems = readSummaryCount(match[4]);
        if (
          files === null ||
          errors === null ||
          warnings === null ||
          filesWithProblems === null
        ) {
          reasons.push(
            `COMPLETED record has a non-safe or non-finite summary count: ${JSON.stringify(payload)}`,
          );
        } else {
          completed = { files, errors, warnings, filesWithProblems };
        }
      }
      continue;
    }

    if (payload === "FAILURE" || payload.startsWith("FAILURE ")) {
      const match = payload.match(/^FAILURE "(.*)"$/);
      reasons.push(
        `the checker reported FAILURE ${match ? JSON.stringify(match[1]) : JSON.stringify(payload)}`,
      );
      continue;
    }

    if (payload.startsWith("{")) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(payload);
      } catch {
        reasons.push(
          `truncated or malformed diagnostic JSON at line ${index + 1}`,
        );
        continue;
      }
      if (!isPlainObject(parsed)) {
        reasons.push(`diagnostic record is not an object at line ${index + 1}`);
        continue;
      }
      const type = parsed["type"];
      if (type !== "ERROR" && type !== "WARNING") {
        reasons.push(
          `unknown diagnostic type at line ${index + 1}: ${JSON.stringify(type)}`,
        );
        continue;
      }
      const filename = parsed["filename"];
      if (typeof filename !== "string" || filename === "") {
        reasons.push(`missing filename at line ${index + 1}`);
        continue;
      }
      const start = readPosition(parsed["start"]);
      const end = readPosition(parsed["end"]);
      if (start === null || end === null) {
        reasons.push(`malformed position at line ${index + 1}`);
        continue;
      }
      const message = parsed["message"];
      if (typeof message !== "string") {
        reasons.push(`missing message at line ${index + 1}`);
        continue;
      }
      const code = readCode(parsed["code"]);
      if (code === null) {
        reasons.push(`missing diagnostic code at line ${index + 1}`);
        continue;
      }
      const rawSource = parsed["source"];
      if (
        rawSource !== undefined &&
        (typeof rawSource !== "string" || rawSource === "")
      ) {
        reasons.push(`malformed diagnostic source at line ${index + 1}`);
        continue;
      }
      const diagnostic: MachineDiagnostic = {
        type,
        filename,
        start,
        end,
        message,
        code,
        source: rawSource === undefined ? null : rawSource,
      };
      const key = JSON.stringify([
        diagnostic.type,
        diagnostic.filename,
        diagnostic.start,
        diagnostic.end,
        diagnostic.code,
        diagnostic.source,
        diagnostic.message,
      ]);
      if (seenDiagnostics.has(key)) {
        reasons.push(
          `duplicate diagnostic record at line ${index + 1}: ${describeDiagnostic(diagnostic)}`,
        );
      }
      seenDiagnostics.add(key);
      diagnostics.push(diagnostic);
      continue;
    }

    reasons.push(
      `unknown record type at line ${index + 1}: ${JSON.stringify(payload)}`,
    );
  }

  if (workspace === null) reasons.push("missing START record");
  if (completed === null) reasons.push("missing COMPLETED record");
  if (workspace === null || completed === null) {
    return { ok: false, reasons, run: null };
  }

  const run: MachineRun = {
    workspace,
    diagnostics,
    completed,
  };
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.type === "ERROR",
  ).length;
  const warningCount = diagnostics.filter(
    (diagnostic) => diagnostic.type === "WARNING",
  ).length;
  const problemFileCount = new Set(
    diagnostics.map((diagnostic) => diagnostic.filename),
  ).size;
  if (completed.errors !== errorCount) {
    reasons.push(
      `summary reports ${completed.errors} error(s) but ${errorCount} diagnostic record(s) were parsed`,
    );
  }
  if (completed.warnings !== warningCount) {
    reasons.push(
      `summary reports ${completed.warnings} warning(s) but ${warningCount} diagnostic record(s) were parsed`,
    );
  }
  if (completed.filesWithProblems !== problemFileCount) {
    reasons.push(
      `summary reports ${completed.filesWithProblems} problem file(s) but ${problemFileCount} distinct diagnostic file(s) were parsed`,
    );
  }
  if (completed.files < completed.filesWithProblems) {
    reasons.push(
      `summary reports ${completed.files} total file(s) but ${completed.filesWithProblems} problem file(s)`,
    );
  }
  if (reasons.length > 0) return { ok: false, reasons, run };
  return { ok: true, reasons: [], run };
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

/** Read the installed compatibility versions for every pinned package. */
export function readStrictAuditVersions(
  fixtureRoot: string,
): Readonly<Record<string, string | null>> {
  const versions: Record<string, string | null> = {};
  for (const name of Object.keys(STRICT_AUDIT_PINS)) {
    versions[name] = readPackageVersion(
      path.join(fixtureRoot, "node_modules", name, "package.json"),
    );
  }
  return versions;
}

/** Reasons for every pinned version that does not match the approved pin. */
export function validateStrictAuditVersions(
  fixtureRoot: string,
): readonly string[] {
  const versions = readStrictAuditVersions(fixtureRoot);
  const reasons: string[] = [];
  for (const [name, expected] of Object.entries(STRICT_AUDIT_PINS)) {
    const found = versions[name] ?? null;
    if (found !== expected) {
      reasons.push(
        `${name} pin changed: expected ${expected}, found ${found ?? "unreadable"}`,
      );
    }
  }
  if (versions["bits-ui"] === NATIVE_BASELINE.version) {
    reasons.push(
      ...authenticateNativeInstall(
        path.join(fixtureRoot, "node_modules/bits-ui"),
      ).map((issue) => issue.message),
    );
    try {
      const manifest = JSON.parse(
        readFileSync(path.join(fixtureRoot, "package.json"), "utf8"),
      ) as Record<string, unknown>;
      if (observeNativeFile(fixtureRoot, manifest).kind !== "value")
        reasons.push(
          "the strict fixture requires its authenticated application-owned native archive",
        );
    } catch {
      reasons.push("the strict fixture native declaration is unreadable");
    }
  }
  return reasons;
}

function realpathOrNull(abs: string): string | null {
  try {
    return realpathSync(abs);
  } catch {
    return null;
  }
}

function resolveDiagnosticFile(
  workspace: string,
  filename: string,
): string | null {
  return realpathOrNull(path.resolve(workspace, filename));
}

/** Accept only raw strict success with authenticated actual dependencies. */
export function classifyStrictCheck(
  run: StrictCheckRun,
  fixtureRoot: string,
): StrictAuditClassification {
  const reasons: string[] = [];
  const raw = `${run.sync.stdout}\n${run.sync.stderr}\n${run.check.stdout}\n${run.check.stderr}`;
  const finish = (
    diagnostics: readonly MachineDiagnostic[],
  ): StrictAuditClassification => {
    if (reasons.length > 0) {
      return {
        kind: "rejected",
        exitCode: run.check.exitCode,
        diagnostics,
        reasons,
        raw,
      };
    }
    return {
      kind: "strict-pass",
      exitCode: run.check.exitCode,
      diagnostics,
      reasons: [],
      raw,
    };
  };

  if (run.sync.timedOut) {
    reasons.push("svelte-kit sync timed out");
    return finish([]);
  }
  if (run.sync.signal !== null) {
    reasons.push(`svelte-kit sync terminated by signal ${run.sync.signal}`);
    return finish([]);
  }
  if (run.sync.exitCode !== 0) {
    reasons.push(
      `svelte-kit sync exited ${String(run.sync.exitCode)} instead of 0`,
    );
    return finish([]);
  }
  if (run.sync.stderr.trim() !== "") {
    reasons.push(
      `svelte-kit sync wrote unexpected stderr:\n${run.sync.stderr}`,
    );
    return finish([]);
  }

  if (run.check.timedOut) {
    reasons.push("the strict checker timed out");
    return finish([]);
  }
  if (run.check.signal !== null) {
    reasons.push(
      `the strict checker was terminated by signal ${run.check.signal}`,
    );
    return finish([]);
  }

  const parsed = parseMachineVerbose(run.check.stdout);
  if (!parsed.ok || parsed.run === null) {
    reasons.push(...parsed.reasons);
    return finish(parsed.run?.diagnostics ?? []);
  }
  const machineRun = parsed.run;

  if (run.check.exitCode !== 0) {
    reasons.push(
      `expected the strict checker to exit 0 with zero diagnostics, found exit ${String(run.check.exitCode)}`,
    );
  }
  if (run.check.stderr.trim() !== "") {
    reasons.push(
      `the strict checker wrote unexpected stderr:\n${run.check.stderr}`,
    );
    return finish(machineRun.diagnostics);
  }

  const errors = machineRun.diagnostics.filter(
    (diagnostic) => diagnostic.type === "ERROR",
  );
  const warnings = machineRun.diagnostics.filter(
    (diagnostic) => diagnostic.type === "WARNING",
  );
  if (errors.length !== 0) {
    reasons.push(`expected zero error diagnostics, found ${errors.length}`);
  }
  if (warnings.length !== 0) {
    reasons.push(`expected zero warnings, found ${warnings.length}`);
  }
  if (machineRun.completed.filesWithProblems !== 0) {
    reasons.push(
      `expected zero problem files, found ${machineRun.completed.filesWithProblems}`,
    );
  }

  reasons.push(...validateStrictAuditVersions(fixtureRoot));

  // The START record names the workspace the checker analyzed. It must resolve
  // to the actual fixture passed to the qualifier: an equivalent real path is
  // accepted (temporary roots are commonly reached through a `/var` or
  // `symlink` alias), but an absent or different root is rejected. This closes
  // the gap where unrelated relative diagnostic paths still resolved to the
  // installed Bits files through a coincidentally equivalent `..` depth.
  const expectedWorkspace = realpathOrNull(fixtureRoot);
  const reportedWorkspace = realpathOrNull(machineRun.workspace);
  if (reportedWorkspace === null) {
    reasons.push(
      `the reported START workspace does not resolve to an existing directory: ${machineRun.workspace}`,
    );
  } else if (
    expectedWorkspace === null ||
    reportedWorkspace !== expectedWorkspace
  ) {
    reasons.push(
      `the reported START workspace ${machineRun.workspace} does not identify the audited fixture ${fixtureRoot}`,
    );
  }

  const unmatched = [...machineRun.diagnostics];
  for (const extra of unmatched) {
    const resolved = resolveDiagnosticFile(
      machineRun.workspace,
      extra.filename,
    );
    const isDependency =
      resolved !== null &&
      resolved.includes(`${path.sep}node_modules${path.sep}`);
    reasons.push(
      `${isDependency ? "additional dependency" : "authored"} diagnostic: ${describeDiagnostic(extra)}`,
    );
  }

  return finish(machineRun.diagnostics);
}
