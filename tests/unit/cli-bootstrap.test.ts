#!/usr/bin/env node
/**
 * S005 typed CLI bootstrap unit test.
 *
 * The runner compiles this file with `tsconfig.unit.json` into
 * `.unit-test-build/tests/unit/cli-bootstrap.test.js` and executes it with the
 * package root as the working directory. It deliberately resolves the product
 * entrypoint from the root manifest's `bin` mapping and invokes the real
 * `dist` build, so it can never accidentally execute (or import for side
 * effects) the unit compiler's mirrored CLI under `.unit-test-build`.
 */
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";

const PACKAGE_ROOT = process.cwd();
const BIN_NAME = "svelte-ui-kit";

interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly bin: Readonly<Record<string, string>>;
}

interface CliResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function readManifest(): PackageManifest {
  const raw = readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);
  assert.ok(
    typeof parsed === "object" && parsed !== null && !Array.isArray(parsed),
    "package.json must be a JSON object",
  );
  const record = parsed as Record<string, unknown>;
  const name = record["name"];
  const version = record["version"];
  const bin = record["bin"];
  assert.equal(typeof name, "string", 'package.json must have a string "name"');
  assert.equal(
    typeof version,
    "string",
    'package.json must have a string "version"',
  );
  assert.ok(
    typeof bin === "object" && bin !== null && !Array.isArray(bin),
    'package.json must have an object "bin"',
  );
  const binValue = (bin as Record<string, unknown>)[BIN_NAME];
  assert.equal(
    typeof binValue,
    "string",
    `package.json bin must map "${BIN_NAME}" to a string`,
  );
  return {
    name: name as string,
    version: version as string,
    bin: { [BIN_NAME]: binValue as string },
  };
}

const manifest = readManifest();
const entrypoint = path.resolve(PACKAGE_ROOT, manifest.bin[BIN_NAME] ?? "");

function runCli(args: readonly string[]): CliResult {
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd: PACKAGE_ROOT,
    encoding: "utf8",
  });
  assert.equal(
    result.error,
    undefined,
    `could not launch the built CLI: ${String(result.error)}`,
  );
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

test("the unit bootstrap test targets the real product build", () => {
  const distRoot = `${path.join(PACKAGE_ROOT, "dist")}${path.sep}`;
  assert.equal(manifest.bin[BIN_NAME], "./dist/cli/main.js");
  assert.ok(
    entrypoint.startsWith(distRoot),
    `bootstrap entrypoint must live under dist/, got ${entrypoint}`,
  );
  assert.ok(
    !entrypoint.includes(".unit-test-build"),
    "bootstrap must not invoke the unit compiler's mirrored CLI",
  );
});

test("--version prints the manifest name and version", () => {
  const result = runCli(["--version"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.equal(result.stdout, `${manifest.name} ${manifest.version}\n`);
});

test("-V prints the manifest name and version", () => {
  const result = runCli(["-V"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `${manifest.name} ${manifest.version}\n`);
});

test("--help prints usage on stdout and exits 0", () => {
  const result = runCli(["--help"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--version/);
});

test("an unsupported argument list exits 2 with empty stdout", () => {
  const result = runCli(["--not-a-real-command"]);
  assert.equal(result.status, 2);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /svelte-ui-kit:/);
});
