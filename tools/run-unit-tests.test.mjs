#!/usr/bin/env node
/**
 * S005 focused, dependency-free regression tests for `tools/run-unit-tests.mjs`.
 *
 * Each case builds a disposable package fixture (a copy of the real manifest,
 * both TypeScript configurations, `src/`, the runner itself and a symlinked
 * `node_modules`) under an owned temporary directory, writes only the test
 * files the case needs, and invokes the real runner as a child process. Failure
 * fixtures are never placed under the real `tests/unit` tree and every owned
 * temporary root is removed by test cleanup. Every child subprocess is bounded
 * so a broken runner cannot hang the harness.
 *
 * The child environment drops an inherited `NODE_TEST_CONTEXT` so an
 * independent nested runner cannot silently no-op.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const RUNNER_REL = path.join("tools", "run-unit-tests.mjs");
const SUBPROCESS_TIMEOUT_MS = 60_000;

const PASS_TEST = `import { test } from "node:test";
import assert from "node:assert/strict";

test("fixture passes", () => {
  assert.equal(1, 1);
});
`;

const FAIL_TEST = `import { test } from "node:test";
import assert from "node:assert/strict";

test("fixture fails", () => {
  assert.equal(1, 2);
});
`;

const SENTINEL_PASS = `import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

test("writes a side-effect sentinel", () => {
  writeFileSync("sentinel.txt", "ran\\n");
  assert.equal(1, 1);
});
`;

const SENTINEL_FAIL = `import { test } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";

test("writes a side-effect sentinel", () => {
  writeFileSync("sentinel.txt", "ran\\n");
  assert.equal(1, 2);
});
`;

const THROW_TEST = `throw new Error("import boom");
`;

const EMPTY_FILE = "";

const EMPTY_SUITE = `import { describe } from "node:test";

describe("empty suite", () => {});
`;

const SKIP_TODO_ONLY = `import { test } from "node:test";

test("skipped", { skip: true }, () => {});
test("todo", { todo: true }, () => {});
`;

const TODO_OK_BESIDE_PASS = `import { test } from "node:test";
import assert from "node:assert/strict";

test("real pass", () => {
  assert.equal(1, 1);
});
test("todo ok", { todo: true }, () => {});
`;

const TODO_FAIL_INLINE = `import { test } from "node:test";

test("inline todo failure", { todo: true }, () => {
  throw new Error("inline todo boom");
});
`;

const TIMEOUT_TEST = `import { test } from "node:test";

test("slow cancellation", { timeout: 100 }, async () => {
  await new Promise(() => {});
});
`;

const EXIT_ABNORMAL = `import { test } from "node:test";
import assert from "node:assert/strict";

test("before abnormal exit", () => {
  assert.equal(1, 1);
});
process.exit(7);
`;

const TS_ERROR = `export const broken: number = "not a number";
`;

// A helper compiled through the inherited `tests/unit/**/*.ts` include. It
// registers tests as an import side effect so a failing test can be defined in
// an imported module rather than in the selected entry file.
const IMPORTED_ASSERT_HELPER = `import { test } from "node:test";
import assert from "node:assert/strict";

export function registerImportedFailures(): void {
  test("imported named assertion", () => {
    assert.equal(1, 2, "imported assertion message");
  });
  test("imported thrown error", () => {
    throw new Error("imported thrown error");
  });
}
`;

const IMPORTED_TODO_HELPER = `import { test } from "node:test";

export function registerImportedTodoFailure(): void {
  test("imported todo failure", { todo: true }, () => {
    throw new Error("imported todo boom");
  });
}
`;

const IMPORTED_ENTRY = `import { test } from "node:test";
import assert from "node:assert/strict";
import { registerImportedFailures } from "./helper.js";

test("inline passing", () => {
  assert.equal(1, 1);
});
registerImportedFailures();
`;

const IMPORTED_TODO_ENTRY = `import { test } from "node:test";
import assert from "node:assert/strict";
import { registerImportedTodoFailure } from "./helper.js";

test("inline passing", () => {
  assert.equal(1, 1);
});
registerImportedTodoFailure();
`;

/** Build a disposable package fixture; the test owns its cleanup. */
function makePackage(t) {
  const dir = mkdtempSync(path.join(os.tmpdir(), "suik-unit-harness-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const rel of ["package.json", "tsconfig.json", "tsconfig.unit.json"]) {
    cpSync(path.join(REPO_ROOT, rel), path.join(dir, rel));
  }
  cpSync(path.join(REPO_ROOT, "src"), path.join(dir, "src"), {
    recursive: true,
  });
  mkdirSync(path.join(dir, "tools"), { recursive: true });
  cpSync(path.join(REPO_ROOT, RUNNER_REL), path.join(dir, RUNNER_REL));
  mkdirSync(path.join(dir, "tests"), { recursive: true });
  symlinkSync(
    path.join(REPO_ROOT, "node_modules"),
    path.join(dir, "node_modules"),
    "dir",
  );
  return dir;
}

function writeTest(pkg, rel, source) {
  const abs = path.join(pkg, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, source);
}

function writeOwnedFile(pkg, rel, contents) {
  const abs = path.join(pkg, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, contents);
}

function externalDir(t, prefix = "suik-unit-external-") {
  const dir = mkdtempSync(path.join(os.tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

function runRunner(pkg, args = [], options = {}) {
  const env = { ...process.env };
  // The outer `node --test` worker exports NODE_TEST_CONTEXT; a nested
  // independent runner must not inherit it or it can silently no-op.
  delete env.NODE_TEST_CONTEXT;
  const runner = path.join(pkg, options.runnerRel ?? RUNNER_REL);
  const result = spawnSync(process.execPath, [runner, ...args], {
    cwd: pkg,
    encoding: "utf8",
    env,
    timeout: options.timeout ?? SUBPROCESS_TIMEOUT_MS,
  });
  assert.equal(
    result.error,
    undefined,
    `could not launch the unit runner: ${String(result.error)}`,
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function selected(stdout) {
  return stdout
    .split("\n")
    .filter((line) => line.startsWith("run-unit-tests:   "))
    .map((line) => line.slice("run-unit-tests:   ".length));
}

test("default discovery selects every test file deterministically", (t) => {
  const pkg = makePackage(t);
  // Written out of order on purpose.
  writeTest(pkg, "tests/unit/b.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);

  const first = runRunner(pkg);
  const second = runRunner(pkg);
  assert.equal(first.status, 0, first.stderr);
  assert.equal(second.status, 0, second.stderr);
  assert.deepEqual(selected(first.stdout), [
    "tests/unit/a.test.ts",
    "tests/unit/b.test.ts",
  ]);
  assert.deepEqual(selected(second.stdout), selected(first.stdout));
  assert.equal(first.stdout, second.stdout);
});

test("an explicit operand runs only the requested file", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/b.test.ts", FAIL_TEST);

  const plain = runRunner(pkg, ["tests/unit/a.test.ts"]);
  assert.equal(plain.status, 0, plain.stderr);
  assert.deepEqual(selected(plain.stdout), ["tests/unit/a.test.ts"]);
  assert.ok(!plain.stdout.includes("b.test.ts"));

  const dashed = runRunner(pkg, ["--", "tests/unit/a.test.ts"]);
  assert.equal(dashed.status, 0, dashed.stderr);
  assert.deepEqual(selected(dashed.stdout), ["tests/unit/a.test.ts"]);

  const explicitBad = runRunner(pkg, ["tests/unit/b.test.ts"]);
  assert.equal(explicitBad.status, 1);
  assert.match(explicitBad.stderr, /FAIL tests\/unit\/b\.test\.ts/);
  assert.match(explicitBad.stderr, /fixture fails/);
});

test("a test file in a directory with spaces is discovered and run", (t) => {
  const pkg = makePackage(t);
  const rel = "tests/unit/spaced dir/space.test.ts";
  writeTest(pkg, rel, PASS_TEST);

  const discovered = runRunner(pkg);
  assert.equal(discovered.status, 0, discovered.stderr);
  assert.deepEqual(selected(discovered.stdout), [rel]);

  const explicit = runRunner(pkg, ["--", rel]);
  assert.equal(explicit.status, 0, explicit.stderr);
  assert.deepEqual(selected(explicit.stdout), [rel]);
});

test("a missing operand is rejected without falling back to all tests", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);

  const result = runRunner(pkg, ["tests/unit/missing.test.ts"]);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /test file not found: tests\/unit\/missing\.test\.ts/,
  );
  assert.equal(result.stdout, "", "no tests may run for an invalid selection");
});

test("invalid selections are rejected with a clear diagnostic", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);

  const cases = [
    ["tests/unit/*.test.ts", /glob and brace patterns are not supported/],
    ["tests/unit", /is a directory, not a file/],
    ["--unknown", /unknown option is not supported/],
    ["../outside.test.ts", /must not contain a parent-directory segment/],
    [
      "tests/unit/../unit/a.test.ts",
      /must not contain a parent-directory segment/,
    ],
    [path.join(pkg, "tests/unit/a.test.ts"), /must be repository-relative/],
  ];
  for (const [operand, expected] of cases) {
    const result = runRunner(pkg, [operand]);
    assert.equal(result.status, 1, `operand ${operand} must fail`);
    assert.match(result.stderr, expected);
    assert.equal(result.stdout, "", `operand ${operand} must not run tests`);
  }
});

test("no discovered test files is a failure", (t) => {
  const pkg = makePackage(t);
  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no unit test files were discovered/);
});

test("an empty selected file fails even beside a passing one", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/empty.test.ts", EMPTY_FILE);
  writeTest(pkg, "tests/unit/pass.test.ts", PASS_TEST);

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL tests\/unit\/empty\.test\.ts/);
  assert.match(result.stderr, /no completed per-file summary/);
  assert.match(result.stdout, /PASS tests\/unit\/pass\.test\.ts/);
});

test("an empty suite fails", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/suite.test.ts", EMPTY_SUITE);
  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /no tests executed \(empty suite\)/);
});

test("a skipped-or-TODO-only selection fails", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/skipall.test.ts", SKIP_TODO_ONLY);
  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /no executed non-skipped\/non-TODO tests \(skipped or TODO only\)/,
  );
});

test("a non-failing TODO beside a passing test is not required to fail", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/pass.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/todo.test.ts", TODO_OK_BESIDE_PASS);
  const result = runRunner(pkg);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /PASS tests\/unit\/todo\.test\.ts/);
});

test("a named assertion failure fails and is identified", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/fail.test.ts", FAIL_TEST);
  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL tests\/unit\/fail\.test\.ts/);
  assert.match(result.stderr, /fixture fails/);
  assert.match(result.stderr, /1 !== 2/);
});

test("an import failure fails and preserves the load-error output", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/throw.test.ts", THROW_TEST);
  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL tests\/unit\/throw\.test\.ts/);
  assert.match(result.stderr, /import boom/);
  // The intended failure is the module load error, not a selection/setup crash.
  assert.doesNotMatch(result.stderr, /not found|escapes tests\/unit/);
});

test("a TypeScript error stops execution and removes stale output", (t) => {
  const pkg = makePackage(t);
  const rel = "tests/unit/ts.test.ts";
  writeTest(pkg, rel, PASS_TEST);

  const first = runRunner(pkg);
  assert.equal(first.status, 0, first.stderr);
  const compiled = path.join(pkg, ".unit-test-build", "tests/unit/ts.test.js");
  assert.ok(existsSync(compiled), "a passing compile emits the compiled file");

  writeTest(pkg, rel, `${PASS_TEST}\n${TS_ERROR}`);
  const broken = runRunner(pkg);
  assert.equal(broken.status, 1);
  assert.match(broken.stderr, /unit TypeScript compilation failed/);
  assert.ok(
    !existsSync(compiled),
    "stale compiled output must be removed before a failing compile",
  );

  writeTest(pkg, rel, PASS_TEST);
  const restored = runRunner(pkg);
  assert.equal(restored.status, 0, restored.stderr);
});

test("explicit selection still compiles ordinary inputs it does not run", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/good.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/bad.test.ts", TS_ERROR);

  const result = runRunner(pkg, ["tests/unit/good.test.ts"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unit TypeScript compilation failed/);
});

test("dot-prefixed and dotdot-prefixed names run in both modes", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/..legal.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/.dot.test.ts", PASS_TEST);
  writeTest(pkg, "tests/unit/.hidden/nested.test.ts", PASS_TEST);

  const discovered = runRunner(pkg);
  assert.equal(discovered.status, 0, discovered.stderr);
  assert.deepEqual(selected(discovered.stdout), [
    "tests/unit/..legal.test.ts",
    "tests/unit/.dot.test.ts",
    "tests/unit/.hidden/nested.test.ts",
  ]);

  const explicit = runRunner(pkg, ["--", "tests/unit/.hidden/nested.test.ts"]);
  assert.equal(explicit.status, 0, explicit.stderr);
  assert.deepEqual(selected(explicit.stdout), [
    "tests/unit/.hidden/nested.test.ts",
  ]);

  const dotdot = runRunner(pkg, ["tests/unit/..legal.test.ts"]);
  assert.equal(dotdot.status, 0, dotdot.stderr);
  assert.deepEqual(selected(dotdot.stdout), ["tests/unit/..legal.test.ts"]);
});

test("nested symlink entries are ignored by discovery, never followed", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/real.test.ts", PASS_TEST);
  symlinkSync(
    path.join(pkg, "tests/unit/real.test.ts"),
    path.join(pkg, "tests/unit/alias.test.ts"),
  );
  const external = externalDir(t);
  writeTest(external, "external.test.ts", SENTINEL_PASS);
  symlinkSync(external, path.join(pkg, "tests/unit/linkdir"), "dir");

  const result = runRunner(pkg);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(selected(result.stdout), ["tests/unit/real.test.ts"]);
  assert.ok(
    !existsSync(path.join(pkg, "sentinel.txt")),
    "an ignored nested symlink must never be executed",
  );
});

test("a symlinked tests/unit root is rejected in both modes", (t) => {
  const external = externalDir(t);
  writeTest(external, "external.test.ts", SENTINEL_PASS);

  for (const args of [[], ["tests/unit/external.test.ts"]]) {
    const pkg = makePackage(t);
    symlinkSync(external, path.join(pkg, "tests", "unit"), "dir");
    writeOwnedFile(
      pkg,
      path.join(".unit-test-build", "stale-marker"),
      "keep\n",
    );

    const result = runRunner(pkg, args);
    assert.equal(result.status, 1, `args ${JSON.stringify(args)} must fail`);
    assert.match(result.stderr, /tests\/unit root must not be a symlink/);
    assert.ok(
      !existsSync(path.join(pkg, "sentinel.txt")),
      "a rejected root must not execute the linked test",
    );
    assert.equal(
      readFileSync(path.join(pkg, ".unit-test-build", "stale-marker"), "utf8"),
      "keep\n",
      "a rejected selection must not clean owned stale output",
    );
  }
});

test("a symlinked tests root is rejected", (t) => {
  const externalParent = externalDir(t);
  writeTest(externalParent, "unit/a.test.ts", SENTINEL_PASS);

  const pkg = makePackage(t);
  rmSync(path.join(pkg, "tests"), { recursive: true, force: true });
  symlinkSync(externalParent, path.join(pkg, "tests"), "dir");

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /tests root must not be a symlink/);
  assert.ok(!existsSync(path.join(pkg, "sentinel.txt")));
});

test("a symlinked ancestor directory inside the tree is rejected", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/realdir/ok.test.ts", PASS_TEST);
  symlinkSync(
    path.join(pkg, "tests", "unit", "realdir"),
    path.join(pkg, "tests", "unit", "linkdir"),
    "dir",
  );

  const result = runRunner(pkg, ["tests/unit/linkdir/ok.test.ts"]);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /must not traverse a symlinked directory: tests\/unit\/linkdir\/ok\.test\.ts/,
  );
  assert.equal(result.stdout, "");
});

test("a final symlinked operand is rejected even when it points inside", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/real.test.ts", PASS_TEST);
  symlinkSync(
    path.join(pkg, "tests", "unit", "real.test.ts"),
    path.join(pkg, "tests", "unit", "alias.test.ts"),
  );

  const result = runRunner(pkg, ["tests/unit/alias.test.ts"]);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /must not be a symlink: tests\/unit\/alias\.test\.ts/,
  );
});

test("an invalid selection preserves stale output and side-effect sentinels", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/ok.test.ts", SENTINEL_PASS);
  writeOwnedFile(pkg, path.join(".unit-test-build", "stale-marker"), "keep\n");

  const result = runRunner(pkg, [path.join(pkg, "tests/unit/ok.test.ts")]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /must be repository-relative/);
  assert.ok(
    !existsSync(path.join(pkg, "sentinel.txt")),
    "an invalid selection must not run a side-effect sentinel",
  );
  assert.equal(
    readFileSync(path.join(pkg, ".unit-test-build", "stale-marker"), "utf8"),
    "keep\n",
    "an invalid selection must not clean stale output",
  );
});

test("a dangling owned output symlink is rejected before compilation", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);
  const danglingTarget = path.join(externalDir(t), "does-not-exist");
  symlinkSync(danglingTarget, path.join(pkg, ".unit-test-build"), "dir");

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /refusing to clean symlinked unit-build output/);
  assert.ok(
    !existsSync(danglingTarget),
    "a dangling output symlink must not be created by the compiler",
  );
});

test("a symlinked owned output root is refused instead of deleted", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);

  const target = mkdtempSync(path.join(os.tmpdir(), "suik-unit-guard-"));
  t.after(() => rmSync(target, { recursive: true, force: true }));
  writeFileSync(path.join(target, "sentinel"), "keep\n");
  symlinkSync(target, path.join(pkg, ".unit-test-build"), "dir");

  const refused = runRunner(pkg);
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /refusing to clean symlinked unit-build output/);
  assert.equal(
    readFileSync(path.join(target, "sentinel"), "utf8"),
    "keep\n",
    "the symlink target must not be touched",
  );

  rmSync(path.join(pkg, ".unit-test-build"));
  const ok = runRunner(pkg);
  assert.equal(ok.status, 0, ok.stderr);
});

test("a package checkout reached through a working-directory symlink stays valid", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", PASS_TEST);

  const alias = path.join(
    path.dirname(pkg),
    `suik-unit-alias-${path.basename(pkg)}`,
  );
  symlinkSync(pkg, alias, "dir");
  t.after(() => rmSync(alias, { force: true }));

  const result = runRunner(alias);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(selected(result.stdout), ["tests/unit/a.test.ts"]);
});

test("imported failures keep their name, defining location and error details", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/helper.ts", IMPORTED_ASSERT_HELPER);
  writeTest(pkg, "tests/unit/entry.test.ts", IMPORTED_ENTRY);

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /FAIL tests\/unit\/entry\.test\.ts/);
  assert.match(result.stderr, /imported named assertion/);
  assert.match(result.stderr, /imported assertion message/);
  assert.match(result.stderr, /1 !== 2/);
  assert.match(result.stderr, /defined in tests\/unit\/helper\.ts/);
  assert.match(result.stderr, /imported thrown error/);
});

test("TODO-marked failures are fatal inline and when imported", (t) => {
  const inline = makePackage(t);
  writeTest(inline, "tests/unit/todo.test.ts", TODO_FAIL_INLINE);
  const inlineResult = runRunner(inline);
  assert.equal(inlineResult.status, 1);
  assert.match(inlineResult.stderr, /inline todo failure|inline todo boom/);

  const imported = makePackage(t);
  writeTest(imported, "tests/unit/helper.ts", IMPORTED_TODO_HELPER);
  writeTest(imported, "tests/unit/entry.test.ts", IMPORTED_TODO_ENTRY);
  const importedResult = runRunner(imported);
  assert.equal(importedResult.status, 1);
  assert.match(
    importedResult.stderr,
    /imported todo failure|imported todo boom/,
  );
});

test("an explicit short test timeout cancels and fails the run", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/timeout.test.ts", TIMEOUT_TEST);

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /timed out after 100ms|cancelled/);
});

test("an abnormal nonzero child exit fails the run", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/exit.test.ts", EXIT_ABNORMAL);

  const result = runRunner(pkg);
  assert.equal(result.status, 1);
  assert.match(
    result.stderr,
    /no completed per-file summary|abnormal termination/,
  );
  assert.match(result.stderr, /exitCode: 7/);
});

test("an invalid fixture restores to green after the negative probe", (t) => {
  const pkg = makePackage(t);
  writeTest(pkg, "tests/unit/a.test.ts", SENTINEL_FAIL);
  const failed = runRunner(pkg);
  assert.equal(failed.status, 1);
  assert.ok(existsSync(path.join(pkg, "sentinel.txt")));

  writeTest(pkg, "tests/unit/a.test.ts", SENTINEL_PASS);
  const restored = runRunner(pkg);
  assert.equal(restored.status, 0, restored.stderr);
});
