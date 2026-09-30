#!/usr/bin/env node
/**
 * S005/S009 typed suite runner.
 *
 * This runner is intentionally dependency-free: it uses the pinned TypeScript
 * compiler already present in the dev dependencies and Node's built-in
 * `node:test` runner (`run()`), so no new dependency is introduced. It selects
 * a named typed suite (`unit`, `integration`, later `components`) that keeps
 * its own tests root, its own tracked compiler configuration and its own
 * output subdirectory under the ignored `.unit-test-build/` tree, so one
 * suite's run never removes another suite's output.
 *
 * Behavioural contract:
 *
 * - Selection is deterministic. With no operands it discovers every regular
 *   `*.test.ts` file below the selected suite's tests root, including
 *   dot-prefixed filenames and directories and names beginning with `..`, in
 *   sorted order. With operands it accepts one optional leading `--` separator
 *   followed by explicit repository-relative `*.test.ts` operands. Missing
 *   files, globs, directories, unknown options, absolute operands,
 *   parent-directory components and paths (or symlinks) escaping the suite
 *   tests tree are rejected without silently falling back to the full suite.
 * - The suite is chosen with `--suite <name>` (default `unit`); unknown suite
 *   names are rejected. `--suite=<name>` is also accepted.
 * - Package-owned boundaries are anchored to this package root. A symlinked
 *   `tests` or `tests/<suite>` root, a final symlink, or a symlinked ancestor
 *   directory inside the test tree is rejected before any cleanup, compilation
 *   or execution. Nested symlink entries are ignored by discovery, never
 *   followed.
 * - The suite's owned `.unit-test-build/<suite>` output is removed before
 *   compiling so a previous run can never satisfy a later failing compile. The
 *   cleanup refuses a symlinked (including dangling) or otherwise unexpected
 *   `.unit-test-build` ancestor or suite output root using non-following
 *   metadata, and it removes only the selected suite's output.
 * - Every discovered suite entry is compiled through an ephemeral compiler
 *   configuration that lives inside the guarded, ignored suite output tree and
 *   extends the tracked `tsconfig.<suite>.json` while explicitly listing the
 *   discovered entries. Explicit selection controls execution, never which
 *   ordinary suite inputs are typechecked. A compile failure stops execution
 *   before any test runs.
 * - Results are read from Node's structured test events, not from output text.
 *   Child events are attributed to `entryFile` (with a `file` fallback) while
 *   the defining file/line is retained for diagnostics. Every selected file
 *   must produce a completed per-file summary with at least one executed,
 *   non-skipped/non-TODO test and no failures, cancellations or abnormal
 *   termination. Any `test:fail` event, including a TODO-marked one, fails the
 *   run wherever it was defined. An unsuccessful aggregate summary, failed or
 *   cancelled aggregate counts, or a failure event that cannot be assigned to a
 *   selected file also fails the run. An empty file yields a passing file
 *   wrapper without a per-file summary and is therefore rejected.
 * - Suites and leaf tests are reported separately and the process exits nonzero
 *   on any failure.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  realpathSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { run } from "node:test";
import { fileURLToPath } from "node:url";
import { inspect } from "node:util";

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
const PKG_ROOT = path.resolve(TOOLS_DIR, "..");
const TESTS_ROOT = path.join(PKG_ROOT, "tests");
const OUT_DIR_NAME = ".unit-test-build";
const OUT_BASE = path.join(PKG_ROOT, OUT_DIR_NAME);
const TSC_BIN = path.join(PKG_ROOT, "node_modules", "typescript", "bin", "tsc");

const LOG_PREFIX = "run-unit-tests:";

/** Approved typed suites. `components` and `registry` follow the typed runner contract. */
const SUITE_NAMES = ["unit", "integration", "components", "registry"];

/** A deterministic, user-facing selection problem (never a crash). */
class SelectionError extends Error {}

function log(message) {
  process.stdout.write(`${LOG_PREFIX} ${message}\n`);
}

function logError(message) {
  process.stderr.write(`${LOG_PREFIX} ${message}\n`);
}

function suiteDefinition(name) {
  if (!SUITE_NAMES.includes(name)) {
    throw new SelectionError(
      `unknown suite "${name}"; expected one of ${SUITE_NAMES.join(", ")}`,
    );
  }
  return {
    name,
    testsRoot: path.join(TESTS_ROOT, name),
    outputDir: path.join(OUT_BASE, name),
    baseTsconfig: path.join(PKG_ROOT, `tsconfig.${name}.json`),
    generatedTsconfig: path.join(
      OUT_BASE,
      name,
      `tsconfig.${name}.generated.json`,
    ),
  };
}

/**
 * Path-component containment. `path.relative` is component-aware, so a
 * filename such as `..legal.test.ts` is not mistaken for a parent traversal.
 */
function isContained(parent, child) {
  const relative = path.relative(parent, child);
  if (relative === "" || path.isAbsolute(relative)) return false;
  return relative !== ".." && !relative.startsWith(`..${path.sep}`);
}

/**
 * Reject a symlinked or non-directory `tests` / `tests/<suite>` root. Only the
 * final path component is inspected, so a package checkout reached through an
 * otherwise valid working-directory symlink remains a valid test root.
 */
function assertTestRootsReal(suite) {
  const roots = [
    ["tests", TESTS_ROOT],
    [`tests/${suite.name}`, suite.testsRoot],
  ];
  for (const [label, root] of roots) {
    let stats;
    try {
      stats = lstatSync(root);
    } catch (error) {
      if (error && error.code === "ENOENT") continue;
      throw error;
    }
    if (stats.isSymbolicLink()) {
      throw new SelectionError(`the ${label} root must not be a symlink`);
    }
    if (!stats.isDirectory()) {
      throw new SelectionError(`the ${label} root must be a directory`);
    }
  }
}

/**
 * Parse `--suite <name>` (or `--suite=<name>`) plus an optional leading `--`
 * separator and repository-relative operands. Unknown options are rejected.
 */
function parseArgs(argv) {
  const operands = [];
  let suite = "unit";
  let optionsEnded = false;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (optionsEnded) {
      operands.push(arg);
      continue;
    }
    if (arg === "--") {
      optionsEnded = true;
      continue;
    }
    if (arg === "--suite") {
      const value = argv[++index];
      if (value === undefined) {
        throw new SelectionError("--suite requires a suite name");
      }
      suite = value;
      continue;
    }
    if (arg.startsWith("--suite=")) {
      suite = arg.slice("--suite=".length);
      continue;
    }
    if (arg.startsWith("-")) {
      throw new SelectionError(`unknown option is not supported: ${arg}`);
    }
    operands.push(arg);
  }
  return { suiteName: suite, operands };
}

/**
 * Walk a resolved path from the package root, rejecting any symlink component
 * (final or ancestor) and reporting the first missing component. Returns the
 * final `lstat` result so the caller can classify the entry kind.
 */
function walkComponents(abs, operand) {
  const relative = path.relative(PKG_ROOT, abs);
  const segments = relative.split(path.sep).filter((segment) => segment !== "");
  let current = PKG_ROOT;
  let stats = null;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    try {
      stats = lstatSync(current);
    } catch {
      throw new SelectionError(`test file not found: ${operand}`);
    }
    if (stats.isSymbolicLink()) {
      throw new SelectionError(
        index === segments.length - 1
          ? `test operand must not be a symlink: ${operand}`
          : `test operand must not traverse a symlinked directory: ${operand}`,
      );
    }
  }
  return stats;
}

function resolveOperand(suite, operand) {
  if (operand === "") throw new SelectionError("empty test operand");
  if (/[*?[\]{}]/.test(operand)) {
    throw new SelectionError(
      `glob and brace patterns are not supported: ${operand}`,
    );
  }
  if (path.isAbsolute(operand)) {
    throw new SelectionError(
      `test operand must be repository-relative: ${operand}`,
    );
  }
  const segments = operand.split(/[\\/]+/).filter((segment) => segment !== "");
  if (segments.length === 0) {
    throw new SelectionError(`empty test operand: ${operand}`);
  }
  if (segments.includes("..")) {
    throw new SelectionError(
      `test operand must not contain a parent-directory segment: ${operand}`,
    );
  }
  const abs = path.resolve(PKG_ROOT, ...segments);
  if (abs !== suite.testsRoot && !isContained(suite.testsRoot, abs)) {
    throw new SelectionError(
      `test operand escapes tests/${suite.name}: ${operand}`,
    );
  }
  const stats = walkComponents(abs, operand);
  if (stats.isDirectory()) {
    throw new SelectionError(
      `test operand is a directory, not a file: ${operand}`,
    );
  }
  if (!stats.isFile()) {
    throw new SelectionError(`test operand is not a regular file: ${operand}`);
  }
  if (!abs.endsWith(".test.ts")) {
    throw new SelectionError(
      `test operand must be a *.test.ts file: ${operand}`,
    );
  }
  return abs;
}

/**
 * Discover every regular `*.test.ts` entry below the suite tests root,
 * including dot-prefixed names and directories. Symlink and other entry kinds
 * are ignored, never followed.
 */
function discover(suite) {
  if (!existsSync(suite.testsRoot)) return [];
  const found = [];
  const walk = (dir) => {
    const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs);
      else if (entry.isFile() && entry.name.endsWith(".test.ts")) {
        found.push(abs);
      }
    }
  };
  walk(suite.testsRoot);
  return found;
}

/**
 * Reject a symlinked or non-directory `.unit-test-build` base before it is
 * touched. A dangling or live symlink there must never be followed.
 */
function assertOwnedOutputBase() {
  const dirname = path.dirname(OUT_BASE);
  if (dirname !== PKG_ROOT || path.basename(OUT_BASE) !== OUT_DIR_NAME) {
    throw new Error(`refusing to clean unexpected output base: ${OUT_BASE}`);
  }
  let stats;
  try {
    stats = lstatSync(OUT_BASE);
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }
  if (stats.isSymbolicLink()) {
    throw new Error(
      `refusing to clean symlinked unit-build output: ${OUT_DIR_NAME}`,
    );
  }
  if (!stats.isDirectory()) {
    throw new Error(
      `refusing to clean non-directory unit-build output: ${OUT_DIR_NAME}`,
    );
  }
}

/**
 * Remove only the selected suite's owned output directory. Only a truly absent
 * suite directory is absent: non-following metadata rejects a symlinked output
 * root (or a symlinked `.unit-test-build` ancestor) before the compiler runs.
 */
function cleanOwnedOutput(suite) {
  assertOwnedOutputBase();
  let stats;
  try {
    stats = lstatSync(suite.outputDir);
  } catch (error) {
    if (error && error.code === "ENOENT") return;
    throw error;
  }
  if (stats.isSymbolicLink()) {
    throw new Error(
      `refusing to clean symlinked ${suite.name} output: ${OUT_DIR_NAME}/${suite.name}`,
    );
  }
  if (!stats.isDirectory()) {
    throw new Error(
      `refusing to clean non-directory ${suite.name} output: ${OUT_DIR_NAME}/${suite.name}`,
    );
  }
  rmSync(suite.outputDir, { recursive: true, force: true });
}

function toPosix(value) {
  return value.split(path.sep).join("/");
}

/**
 * Write the ephemeral compiler configuration inside the guarded, ignored suite
 * output tree. It extends the tracked suite configuration (inheriting
 * strictness and the ordinary includes) and explicitly lists every discovered
 * suite entry so dot-prefixed files and names beginning with `..` are emitted
 * exactly like any other regular test entry.
 */
function writeGeneratedConfig(suite, compileSet) {
  if (!existsSync(suite.baseTsconfig)) {
    throw new Error(
      `missing ${suite.name} compiler configuration: ${path.relative(PKG_ROOT, suite.baseTsconfig)}`,
    );
  }
  const config = {
    extends: toPosix(path.relative(suite.outputDir, suite.baseTsconfig)),
    files: compileSet.map((absTs) =>
      toPosix(path.relative(suite.outputDir, absTs)),
    ),
  };
  mkdirSync(suite.outputDir, { recursive: true });
  writeFileSync(
    suite.generatedTsconfig,
    `${JSON.stringify(config, null, 2)}\n`,
  );
  return suite.generatedTsconfig;
}

function compileConfig(configPath) {
  if (!existsSync(TSC_BIN)) {
    throw new Error(
      `installed TypeScript compiler not found at ${path.relative(PKG_ROOT, TSC_BIN)}`,
    );
  }
  const result = spawnSync(process.execPath, [TSC_BIN, "-p", configPath], {
    cwd: PKG_ROOT,
    encoding: "utf8",
  });
  if (result.error) {
    throw new Error(`failed to launch the suite compiler: ${result.error}`);
  }
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(
      `${suiteNameForConfig(configPath)} TypeScript compilation failed (exit ${result.status ?? "null"})`,
    );
  }
}

/** Recover the suite name for a friendly compile diagnostic. */
function suiteNameForConfig(configPath) {
  const match = /tsconfig\.([a-z]+)\.generated\.json$/.exec(configPath);
  return match ? match[1] : "suite";
}

function compiledPathFor(suite, absTs) {
  const rel = path.relative(PKG_ROOT, absTs);
  return path.join(suite.outputDir, rel.replace(/\.test\.ts$/, ".test.js"));
}

/**
 * A stable identity for a path reported by the child test process. Child
 * events may report the logical path (`entryFile`) or a resolved path
 * (`file`), so both are normalised before they are matched against the
 * selected compiled files.
 */
function keyFor(value) {
  const resolved = path.resolve(value);
  try {
    return realpathSync(resolved);
  } catch {
    return resolved;
  }
}

/**
 * Render a path reported by the child test process relative to the package,
 * mapping mirror-compiled `.js` output back to its `.ts` source so defining
 * file/line information stays meaningful to a developer.
 */
function displayPath(value, outputDir) {
  const resolved = path.resolve(value);
  if (
    resolved === outputDir ||
    resolved.startsWith(`${outputDir}${path.sep}`)
  ) {
    return path.relative(outputDir, resolved).replace(/\.js$/, ".ts");
  }
  const relative = path.relative(PKG_ROOT, resolved);
  if (
    relative === "" ||
    path.isAbsolute(relative) ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`)
  ) {
    return resolved;
  }
  return relative;
}

function renderFailure(rel, data, outputDir) {
  const parts = [];
  const rawName = typeof data.name === "string" ? data.name : "(unnamed test)";
  const name = path.isAbsolute(rawName)
    ? displayPath(rawName, outputDir)
    : rawName;
  parts.push(`test: ${name}`);
  const definingFile =
    typeof data.file === "string" ? displayPath(data.file, outputDir) : null;
  const location =
    data.line != null
      ? `:${data.line}${data.column != null ? `:${data.column}` : ""}`
      : "";
  if (definingFile !== null && definingFile !== rel) {
    parts.push(`defined in ${definingFile}${location}`);
  } else if (location !== "") {
    parts.push(`location ${rel}${location}`);
  }
  const error = data.details?.error;
  if (error !== undefined && error !== null) {
    parts.push(inspect(error, { depth: 4, breakLength: 120 }));
  }
  return parts.join("\n");
}

function formatDiagnostic(rel, text) {
  return text
    .split("\n")
    .map((line) => `    ${rel}: ${line}`)
    .join("\n");
}

/**
 * Run the compiled files and classify each selected file from Node's
 * structured events. Returns `{ ok, lines }`.
 */
async function runCompiled(suite, selected, compiledByTs) {
  const summaries = new Map();
  const failures = new Map();
  const captured = new Map();
  const selectedKeys = new Set();
  for (const compiled of compiledByTs.values())
    selectedKeys.add(keyFor(compiled));
  const strayFailures = [];
  let aggregate = null;
  let streamError = null;

  const remember = (map, key, value) => {
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
  };

  const entryKeyFor = (data) => {
    if (typeof data.entryFile === "string") return keyFor(data.entryFile);
    if (typeof data.file === "string") return keyFor(data.file);
    return null;
  };

  try {
    const stream = run({
      files: [...compiledByTs.values()],
      cwd: PKG_ROOT,
      concurrency: 1,
    });
    for await (const event of stream) {
      const data = event.data ?? {};
      const entry = entryKeyFor(data);
      if (event.type === "test:summary") {
        if (entry !== null) summaries.set(entry, data);
        else aggregate = data;
      } else if (event.type === "test:fail") {
        if (entry !== null && selectedKeys.has(entry)) {
          remember(failures, entry, data);
        } else {
          strayFailures.push(data);
        }
      } else if (
        (event.type === "test:stdout" || event.type === "test:stderr") &&
        entry !== null
      ) {
        remember(captured, entry, `${data.message ?? ""}`);
      }
    }
  } catch (error) {
    streamError = error;
  }

  const lines = [];
  let ok = streamError === null;

  if (streamError) {
    lines.push(
      `FAIL (runner stream error) ${streamError instanceof Error ? streamError.message : String(streamError)}`,
    );
  }

  for (const absTs of selected) {
    const rel = path.relative(PKG_ROOT, absTs);
    const compiled = compiledByTs.get(absTs);
    const compiledKey = keyFor(compiled);
    const summary = summaries.get(compiledKey);
    const fileFailures = failures.get(compiledKey) ?? [];
    const counts = summary?.counts;
    let reason = null;
    if (fileFailures.length > 0) {
      reason = `${fileFailures.length} failing test event(s)`;
      if (!summary) reason += " (no completed per-file summary)";
    } else if (!summary) {
      reason =
        "no completed per-file summary (empty file, load error or abnormal termination)";
    } else if (typeof counts !== "object" || counts === null) {
      reason = "per-file summary had no counts";
    } else if (counts.cancelled > 0) {
      reason = `${counts.cancelled} cancelled test(s)`;
    } else if (counts.failed > 0) {
      reason = `${counts.failed} failing test(s)`;
    } else if (summary.success === false) {
      reason = "per-file summary reported success: false";
    } else if (counts.tests < 1) {
      reason = "no tests executed (empty suite)";
    } else if (counts.passed < 1) {
      reason = "no executed non-skipped/non-TODO tests (skipped or TODO only)";
    }
    if (reason !== null) {
      ok = false;
      const block = [`FAIL ${rel} (${reason})`];
      for (const failure of fileFailures) {
        block.push(
          formatDiagnostic(rel, renderFailure(rel, failure, suite.outputDir)),
        );
      }
      const capturedText = (captured.get(compiledKey) ?? []).join("");
      if (capturedText.trim() !== "") {
        block.push(formatDiagnostic(rel, capturedText.replace(/\n+$/, "")));
      }
      lines.push(block.join("\n"));
    } else {
      lines.push(
        `PASS ${rel} (tests ${counts.tests}, pass ${counts.passed}, suites ${counts.suites}, skipped ${counts.skipped}, todo ${counts.todo})`,
      );
    }
  }

  const totals = aggregate?.counts ?? null;
  if (totals === null) {
    ok = false;
    lines.push("FAIL (no aggregate test summary was produced)");
  } else {
    lines.push(
      `totals: tests ${totals.tests}, pass ${totals.passed}, fail ${totals.failed}, suites ${totals.suites}, skipped ${totals.skipped}, todo ${totals.todo}, cancelled ${totals.cancelled}`,
    );
    if (aggregate.success === false) {
      ok = false;
      lines.push("FAIL (aggregate summary reported success: false)");
    }
    if (totals.cancelled > 0) {
      ok = false;
      lines.push(`FAIL (${totals.cancelled} cancelled test(s))`);
    }
    if (totals.failed > 0) {
      ok = false;
      lines.push(
        `FAIL (${totals.failed} failing test(s) in the aggregate summary)`,
      );
    }
  }

  if (strayFailures.length > 0) {
    ok = false;
    const block = [
      `FAIL (${strayFailures.length} failure event(s) were not assigned to a selected test file)`,
    ];
    for (const failure of strayFailures) {
      block.push(
        formatDiagnostic(
          "(unassigned)",
          renderFailure("(unassigned)", failure, suite.outputDir),
        ),
      );
    }
    lines.push(block.join("\n"));
  }

  return { ok, lines };
}

async function main(argv) {
  let parsed;
  let suite;
  try {
    parsed = parseArgs(argv);
    suite = suiteDefinition(parsed.suiteName);
  } catch (error) {
    logError(error instanceof SelectionError ? error.message : String(error));
    return 1;
  }

  let selected;
  let discovered;
  try {
    assertTestRootsReal(suite);
    discovered = discover(suite);
    selected =
      parsed.operands.length > 0
        ? parsed.operands.map((operand) => resolveOperand(suite, operand))
        : discovered;
  } catch (error) {
    logError(
      error instanceof SelectionError
        ? error.message
        : `selection failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }

  selected = [...new Set(selected)].sort();
  if (selected.length === 0) {
    logError(
      `no ${suite.name} test files were discovered under tests/${suite.name}`,
    );
    return 1;
  }

  log(`suite ${suite.name}`);
  log(`selected ${selected.length} file(s):`);
  for (const absTs of selected) log(`  ${path.relative(PKG_ROOT, absTs)}`);

  const compileSet = [...new Set([...discovered, ...selected])].sort();

  try {
    cleanOwnedOutput(suite);
    const configPath = writeGeneratedConfig(suite, compileSet);
    compileConfig(configPath);
  } catch (error) {
    logError(error instanceof Error ? error.message : String(error));
    return 1;
  }

  const compiledByTs = new Map();
  for (const absTs of selected) {
    const compiled = compiledPathFor(suite, absTs);
    if (!existsSync(compiled)) {
      logError(
        `compiled output missing for ${path.relative(PKG_ROOT, absTs)} after a successful compile`,
      );
      return 1;
    }
    compiledByTs.set(absTs, compiled);
  }

  const { ok, lines } = await runCompiled(suite, selected, compiledByTs);
  for (const line of lines) {
    if (line.startsWith("FAIL")) logError(line);
    else log(line);
  }
  return ok ? 0 : 1;
}

const exitCode = await main(process.argv.slice(2));
process.exitCode = exitCode;
