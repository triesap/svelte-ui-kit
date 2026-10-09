#!/usr/bin/env node
/**
 * S006 tooling unit test.
 *
 * The runner compiles this file with `tsconfig.unit.json` into
 * `.unit-test-build/tests/unit/tooling.test.js` and executes it with the
 * package root as the working directory. It exercises the real authoring
 * `lint` and `format:check` package scripts against disposable package
 * fixtures that copy the real ESLint/Prettier configuration byte-for-byte and
 * resolve the real installed tools through a `node_modules` symlink.
 *
 * Each fixture is fully owned by its test, is created outside the repository
 * (so negative probes never enter real unit discovery), and is removed on
 * completion. Subprocesses are bounded, the inherited `node:test` environment
 * is neutralized, and no fixture ever reaches an unrelated external
 * application.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test, type TestContext } from "node:test";

const PACKAGE_ROOT = process.cwd();
const SUBPROCESS_TIMEOUT_MS = 120_000;

const REAL_CONFIG_FILES = [
  "eslint.config.mjs",
  ".prettierrc.json",
  ".prettierignore",
] as const;

type FixtureScript = "lint" | "format:check";

interface RunResult {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  readonly error: Error | undefined;
}

/** Snapshot of one filesystem entry, without following symlinks. */
interface FileEntry {
  readonly kind: "file";
  readonly mode: number;
  readonly size: number;
  readonly sha256: string;
}

interface DirectoryEntry {
  readonly kind: "directory";
  readonly mode: number;
}

interface SymlinkEntry {
  readonly kind: "symlink";
  readonly target: string;
}

type EntrySnapshot = FileEntry | DirectoryEntry | SymlinkEntry;

type TreeSnapshot = Readonly<Record<string, EntrySnapshot>>;

interface Fixture {
  readonly root: string;
  readonly externalRoot: string;
  readonly sentinelPath: string;
  write(relative: string, contents: string): void;
  remove(relative: string): void;
  snapshot(): TreeSnapshot;
  externalSnapshot(): TreeSnapshot;
}

function readRealScripts(): Record<FixtureScript, string> {
  const raw = readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);
  assert.ok(
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed),
    "package.json must be a JSON object",
  );
  const scripts = (parsed as Record<string, unknown>)["scripts"];
  assert.ok(
    typeof scripts === "object" && scripts !== null && !Array.isArray(scripts),
    'package.json must define a "scripts" object',
  );
  const record = scripts as Record<string, unknown>;
  const lint = record["lint"];
  const formatCheck = record["format:check"];
  assert.equal(typeof lint, "string", 'package.json must define "lint"');
  assert.equal(
    typeof formatCheck,
    "string",
    'package.json must define "format:check"',
  );
  return { lint: lint as string, "format:check": formatCheck as string };
}

const REAL_SCRIPTS = readRealScripts();

/** Reserved dependency/output directories excluded at every depth. */
const RESERVED_OUTPUT_DIRS = [
  "node_modules",
  ".pnpm-store",
  "dist",
  "build",
  ".svelte-kit",
  "coverage",
  ".unit-test-build",
] as const;

/** Explicitly rooted authoring boundaries reserved from both tools. */
const EXPLICIT_OUTPUT_BOUNDARIES = [
  "tests/fixtures/generated",
  ".artifacts/verification",
  "implementation/evidence/logs",
] as const;

/** A probe that is a real lint and formatting defect if it is inspected. */
const BAD_AUTHORING_PROBE = "const  unformatted=1\n";

function sha256(contents: Buffer): string {
  return createHash("sha256").update(contents).digest("hex");
}

/** Recursively snapshot a tree with lstat, stopping at symlinks. */
function snapshotTree(root: string): TreeSnapshot {
  const entries: Record<string, EntrySnapshot> = {};
  const walk = (absolute: string, relative: string): void => {
    const info = lstatSync(absolute);
    if (info.isSymbolicLink()) {
      entries[relative] = { kind: "symlink", target: readlinkSync(absolute) };
      return;
    }
    if (info.isDirectory()) {
      entries[relative] = { kind: "directory", mode: info.mode };
      for (const name of readdirSync(absolute).sort()) {
        walk(
          path.join(absolute, name),
          relative === "" ? name : `${relative}/${name}`,
        );
      }
      return;
    }
    entries[relative] = {
      kind: "file",
      mode: info.mode,
      size: info.size,
      sha256: sha256(readFileSync(absolute)),
    };
  };
  walk(root, "");
  return entries;
}

/** Resolve a deterministic pnpm invocation against the pinned Node runtime. */
function pnpmCommand(): { command: string; args: readonly string[] } {
  const execPath = process.env["npm_execpath"];
  if (
    execPath !== undefined &&
    existsSync(execPath) &&
    /\.[cm]?js$/.test(execPath)
  ) {
    return { command: process.execPath, args: [execPath] };
  }
  return { command: "pnpm", args: [] };
}

function runFixtureScript(root: string, script: FixtureScript): RunResult {
  const { command, args } = pnpmCommand();
  const env: NodeJS.ProcessEnv = { ...process.env };
  // Neutralize the inherited node:test runner environment and prevent pnpm
  // from attempting a dependency install against a fixture-local symlink.
  delete env["NODE_OPTIONS"];
  delete env["NODE_V8_COVERAGE"];
  delete env["NODE_TEST_CONTEXT"];
  env["npm_config_verify_deps_before_run"] = "false";
  env["PATH"] = `${path.dirname(process.execPath)}${path.delimiter}${
    env["PATH"] ?? ""
  }`;
  const result = spawnSync(command, [...args, "run", script], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: SUBPROCESS_TIMEOUT_MS,
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout,
    stderr: result.stderr,
    error: result.error,
  };
}

function combinedOutput(result: RunResult): string {
  return `${result.stdout}\n${result.stderr}`;
}

function assertExited(result: RunResult, label: string): number {
  assert.equal(
    result.error,
    undefined,
    `${label}: subprocess reported an error: ${String(result.error)}`,
  );
  assert.notEqual(
    result.status,
    null,
    `${label}: process ended via signal ${String(result.signal)}`,
  );
  return result.status as number;
}

function assertPassed(result: RunResult, label: string): void {
  const status = assertExited(result, label);
  assert.equal(
    status,
    0,
    `${label}: expected exit 0\n${combinedOutput(result)}`,
  );
}

function assertFailed(result: RunResult, label: string): string {
  const status = assertExited(result, label);
  assert.notEqual(
    status,
    0,
    `${label}: expected a nonzero exit\n${combinedOutput(result)}`,
  );
  return combinedOutput(result);
}

const CLEAN_SVELTE = `<script lang="ts">
  let count = $state(0);
  const doubled: number = $derived(count * 2);
</script>

<img src="logo.png" alt="Logo" />
<button onclick={() => (count += 1)}>{doubled}</button>
`;

function createFixture(t: TestContext, label: string): Fixture {
  const base = mkdtempSync(path.join(os.tmpdir(), `suik-tooling-${label}-`));
  t.after(() => {
    rmSync(base, { recursive: true, force: true });
  });
  const root = path.join(base, "fixture");
  const externalRoot = path.join(base, "external-app");
  for (const directory of [root, externalRoot]) {
    mkdirSync(directory, { recursive: true });
  }

  for (const name of REAL_CONFIG_FILES) {
    cpSync(path.join(PACKAGE_ROOT, name), path.join(root, name));
  }
  // A real `node_modules` directory with one symlink per installed entry, so a
  // reserved root-level dependency probe can live inside it while the actual
  // tools still resolve through the real installed packages.
  const fixtureModules = path.join(root, "node_modules");
  mkdirSync(fixtureModules);
  for (const name of readdirSync(path.join(PACKAGE_ROOT, "node_modules"))) {
    symlinkSync(
      path.join(PACKAGE_ROOT, "node_modules", name),
      path.join(fixtureModules, name),
    );
  }
  writeFileSync(
    path.join(root, "package.json"),
    `${JSON.stringify(
      {
        name: "svelte-ui-kit-tooling-fixture",
        private: true,
        type: "module",
        scripts: { ...REAL_SCRIPTS },
      },
      null,
      2,
    )}\n`,
  );
  mkdirSync(path.join(root, "src"), { recursive: true });

  // Hidden sentinel and an in-fixture symlink prove entry kinds, link targets
  // and non-obvious files survive every invocation.
  writeFileSync(path.join(root, ".hidden-sentinel"), `sentinel ${label}\n`);
  symlinkSync("src/clean.ts", path.join(root, "link-to-clean"));

  // An unrelated external application: linked from the fixture but must never
  // be traversed or rewritten by the tools.
  writeFileSync(
    path.join(externalRoot, "unrelated.ts"),
    "export const  unrelated=1\n",
  );
  writeFileSync(
    path.join(externalRoot, ".external-sentinel"),
    `external ${label}\n`,
  );
  symlinkSync(externalRoot, path.join(root, "linked-app"));

  return {
    root,
    externalRoot,
    sentinelPath: path.join(root, ".hidden-sentinel"),
    write(relative, contents) {
      const absolute = path.join(root, relative);
      mkdirSync(path.dirname(absolute), { recursive: true });
      writeFileSync(absolute, contents);
    },
    remove(relative) {
      rmSync(path.join(root, relative), { force: true });
    },
    snapshot() {
      return snapshotTree(root);
    },
    externalSnapshot() {
      return snapshotTree(externalRoot);
    },
  };
}

function writeCleanSources(fixture: Fixture): void {
  fixture.write("src/clean.ts", "export const answer: number = 42;\n");
  fixture.write("src/clean.svelte", CLEAN_SVELTE);
}

/** Assert the fixture tree and the unrelated external app are untouched. */
function assertPreserved(
  fixture: Fixture,
  fixtureBefore: TreeSnapshot,
  externalBefore: TreeSnapshot,
  label: string,
): void {
  assert.deepEqual(fixture.snapshot(), fixtureBefore, `${label}: fixture tree`);
  assert.deepEqual(
    fixture.externalSnapshot(),
    externalBefore,
    `${label}: unrelated external app`,
  );
}

test("the fixture reproduces the real authoring package scripts", () => {
  assert.equal(REAL_SCRIPTS.lint, "eslint . --max-warnings 0");
  assert.equal(REAL_SCRIPTS["format:check"], "prettier --check .");
});

test("clean TypeScript and Svelte 5 lang=ts authoring input pass", (t) => {
  const fixture = createFixture(t, "clean");
  writeCleanSources(fixture);
  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();

  assertPassed(runFixtureScript(fixture.root, "lint"), "lint clean input");
  assertPassed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check clean input",
  );
  assertPreserved(fixture, before, externalBefore, "clean run");
});

test("malformed TypeScript formatting fails without rewriting and restores green", (t) => {
  const fixture = createFixture(t, "ts-format");
  fixture.write("src/clean.ts", "export const malformed:number=1\n");
  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();

  const output = assertFailed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check malformed TS",
  );
  assert.match(output, /src\/clean\.ts/);
  assertPreserved(fixture, before, externalBefore, "malformed TS format");

  fixture.write("src/clean.ts", "export const malformed: number = 1;\n");
  assertPassed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check restored TS",
  );
});

test("malformed Svelte formatting fails without rewriting and restores green", (t) => {
  const fixture = createFixture(t, "svelte-format");
  const malformed = `<script lang="ts">
let malformed:number=1
</script>

<p>{malformed}</p>
`;
  fixture.write("src/clean.svelte", malformed);
  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();

  const output = assertFailed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check malformed Svelte",
  );
  assert.match(output, /src\/clean\.svelte/);
  assertPreserved(fixture, before, externalBefore, "malformed Svelte format");

  fixture.write("src/clean.svelte", CLEAN_SVELTE);
  assertPassed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check restored Svelte",
  );
});

test("a genuine TypeScript lint defect fails for its intended diagnostic", (t) => {
  const fixture = createFixture(t, "ts-lint");
  fixture.write(
    "src/clean.ts",
    "export function build(): void {\n  const neverUsed = 1;\n}\n",
  );
  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();

  const output = assertFailed(
    runFixtureScript(fixture.root, "lint"),
    "lint TypeScript defect",
  );
  assert.match(output, /@typescript-eslint\/no-unused-vars/);
  assert.match(output, /neverUsed/);
  assertPreserved(fixture, before, externalBefore, "TypeScript lint defect");

  fixture.write(
    "src/clean.ts",
    "export function build(): number {\n  return 1;\n}\n",
  );
  assertPassed(runFixtureScript(fixture.root, "lint"), "lint restored TS");
});

test("Svelte accessibility and compiler defects fail for their diagnostics", (t) => {
  const fixture = createFixture(t, "svelte-lint");

  fixture.write(
    "src/clean.svelte",
    `<script lang="ts">
  const source: string = "logo.png";
</script>

<img src={source} />
`,
  );
  const accessibilityBefore = fixture.snapshot();
  const accessibilityExternal = fixture.externalSnapshot();
  const accessibility = assertFailed(
    runFixtureScript(fixture.root, "lint"),
    "lint Svelte accessibility defect",
  );
  assert.match(accessibility, /svelte\/valid-compile/);
  assert.match(accessibility, /a11y_missing_attribute/);
  assertPreserved(
    fixture,
    accessibilityBefore,
    accessibilityExternal,
    "Svelte accessibility defect",
  );

  fixture.write(
    "src/clean.svelte",
    `<script lang="ts">
  const enabled = $state(true);
</script>

{#if enabled}
  <p>open</p>
`,
  );
  const compilerBefore = fixture.snapshot();
  const compilerExternal = fixture.externalSnapshot();
  const compiler = assertFailed(
    runFixtureScript(fixture.root, "lint"),
    "lint Svelte compiler defect",
  );
  assert.match(compiler, /block_unclosed/);
  assertPreserved(
    fixture,
    compilerBefore,
    compilerExternal,
    "Svelte compiler defect",
  );

  fixture.write("src/clean.svelte", CLEAN_SVELTE);
  assertPassed(runFixtureScript(fixture.root, "lint"), "lint restored Svelte");
});

test("reserved output and dependency trees are excluded at root and nested depths", (t) => {
  const fixture = createFixture(t, "reserved-output");

  // Root depth, one nested depth under the fixture root, and a deeper level
  // beneath maintained consumer source. Configuration-root-only patterns such
  // as `dist/` leave the nested copies linted, so this distinguishes recursive
  // from rooted ignore patterns.
  for (const directory of RESERVED_OUTPUT_DIRS) {
    for (const relative of [
      `${directory}/probe.ts`,
      `tests/fixtures/consumer/${directory}/probe.ts`,
      `tests/fixtures/consumer/src/${directory}/probe.ts`,
    ]) {
      fixture.write(relative, BAD_AUTHORING_PROBE);
    }
  }

  // The explicitly rooted authoring boundaries (and their subtrees) plus the
  // ignored log tree must also stay out of both tools.
  for (const boundary of EXPLICIT_OUTPUT_BOUNDARIES) {
    for (const relative of [
      `${boundary}/probe.ts`,
      `${boundary}/nested/probe.ts`,
    ]) {
      fixture.write(relative, BAD_AUTHORING_PROBE);
    }
  }

  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();
  assertPassed(
    runFixtureScript(fixture.root, "lint"),
    "lint reserved output probes",
  );
  assertPassed(
    runFixtureScript(fixture.root, "format:check"),
    "format:check reserved output probes",
  );
  assertPreserved(fixture, before, externalBefore, "reserved output probes");
});

test("maintained consumer and registry source still fail for intended diagnostics and restore green", (t) => {
  const fixture = createFixture(t, "maintained-source");
  const maintainedRoots = [
    "registry/components",
    "tests/fixtures/consumer/src",
  ] as const;

  for (const maintainedRoot of maintainedRoots) {
    const tsPath = `${maintainedRoot}/bad.ts`;
    const sveltePath = `${maintainedRoot}/bad.svelte`;

    // A combined formatting/semantic TS defect must fail both tools where it is
    // authored, without being rewritten, and pass again after repair.
    fixture.write(tsPath, BAD_AUTHORING_PROBE);
    let before = fixture.snapshot();
    let externalBefore = fixture.externalSnapshot();
    const lintOutput = assertFailed(
      runFixtureScript(fixture.root, "lint"),
      `lint maintained TS ${tsPath}`,
    );
    assert.match(lintOutput, /@typescript-eslint\/no-unused-vars/);
    assertFailed(
      runFixtureScript(fixture.root, "format:check"),
      `format:check maintained TS ${tsPath}`,
    );
    assertPreserved(fixture, before, externalBefore, `maintained TS ${tsPath}`);
    fixture.write(tsPath, "export const repaired: number = 1;\n");
    assertPassed(
      runFixtureScript(fixture.root, "lint"),
      `lint repaired TS ${tsPath}`,
    );
    assertPassed(
      runFixtureScript(fixture.root, "format:check"),
      `format:check repaired TS ${tsPath}`,
    );

    // A maintained Svelte accessibility defect must still be reported.
    fixture.write(
      sveltePath,
      `<script lang="ts">\n  const source: string = "logo.png";\n</script>\n\n<img src={source} />\n`,
    );
    before = fixture.snapshot();
    externalBefore = fixture.externalSnapshot();
    const svelteOutput = assertFailed(
      runFixtureScript(fixture.root, "lint"),
      `lint maintained Svelte ${sveltePath}`,
    );
    assert.match(svelteOutput, /svelte\/valid-compile/);
    assert.match(svelteOutput, /a11y_missing_attribute/);
    assertPreserved(
      fixture,
      before,
      externalBefore,
      `maintained Svelte ${sveltePath}`,
    );
    fixture.write(sveltePath, CLEAN_SVELTE);
    assertPassed(
      runFixtureScript(fixture.root, "lint"),
      `lint repaired Svelte ${sveltePath}`,
    );
    assertPassed(
      runFixtureScript(fixture.root, "format:check"),
      `format:check repaired Svelte ${sveltePath}`,
    );

    fixture.remove(tsPath);
    fixture.remove(sveltePath);
  }
});

test("success and failure preserve hidden sentinels, link targets and external app", (t) => {
  const fixture = createFixture(t, "preservation");
  fixture.write("src/clean.ts", "export const answer: number = 42;\n");
  const sentinelBefore = readFileSync(fixture.sentinelPath, "utf8");
  const externalSentinel = readFileSync(
    path.join(fixture.externalRoot, ".external-sentinel"),
    "utf8",
  );
  const externalFile = readFileSync(
    path.join(fixture.externalRoot, "unrelated.ts"),
    "utf8",
  );
  const before = fixture.snapshot();
  const externalBefore = fixture.externalSnapshot();

  assert.equal(before["link-to-clean"]?.kind, "symlink");
  assert.equal(before["linked-app"]?.kind, "symlink");

  fixture.write("src/clean.ts", "const  broken=1\n");
  const failingBefore = fixture.snapshot();
  assertFailed(
    runFixtureScript(fixture.root, "format:check"),
    "preservation failing format:check",
  );
  assert.deepEqual(
    fixture.snapshot(),
    failingBefore,
    "failing run fixture tree",
  );
  assert.deepEqual(
    fixture.externalSnapshot(),
    externalBefore,
    "failing run external app",
  );

  fixture.write("src/clean.ts", "export const answer: number = 42;\n");
  assertPassed(runFixtureScript(fixture.root, "lint"), "preservation lint");
  assert.deepEqual(fixture.snapshot(), before, "restored fixture tree");
  assert.deepEqual(
    fixture.externalSnapshot(),
    externalBefore,
    "final external app",
  );
  assert.equal(readFileSync(fixture.sentinelPath, "utf8"), sentinelBefore);
  assert.equal(
    readFileSync(path.join(fixture.externalRoot, ".external-sentinel"), "utf8"),
    externalSentinel,
  );
  assert.equal(
    readFileSync(path.join(fixture.externalRoot, "unrelated.ts"), "utf8"),
    externalFile,
  );
  assert.equal(
    readlinkSync(path.join(fixture.root, "linked-app")),
    fixture.externalRoot,
  );
});
