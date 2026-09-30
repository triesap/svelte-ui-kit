#!/usr/bin/env node
/**
 * Focused executable smoke for the S004 bootstrap CLI.
 *
 * This is the checkpoint's direct lane, not the S005 general unit harness and
 * not final tarball/consumer acceptance. It resolves the entrypoint from the
 * package `bin` metadata, fails (rather than skips) when the build output is
 * missing, and exercises help/version, rejected argument lists, no-write
 * behavior, metadata validation and metadata-relative version resolution.
 *
 * The snapshot helper records deterministic entry types, regular-file bytes
 * (hashed), hidden/nested entries and symlink targets without following links,
 * and never records timestamps, so read-induced time changes cannot mask or
 * fake content changes. Two disposable-copy mutation probes prove the suite
 * rejects an existing-file-write mutant and a hard-coded-version mutant; they
 * are skipped inside the nested probe run via `SVELTE_UI_KIT_MUTATION_PROBE`.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  readlinkSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

/** Set only when this file is re-invoked inside a disposable mutant copy. */
const MUTATION_PROBE_ENV = "SVELTE_UI_KIT_MUTATION_PROBE";
const insideMutationProbe = process.env[MUTATION_PROBE_ENV] === "1";

const packageRoot = fileURLToPath(new URL("../..", import.meta.url));
const packageJsonPath = path.join(packageRoot, "package.json");
const manifest = JSON.parse(readFileSync(packageJsonPath, "utf8"));

const binValue = manifest.bin?.["svelte-ui-kit"];
assert.equal(
  typeof binValue,
  "string",
  'package.json must map bin "svelte-ui-kit" to the built entrypoint',
);
const entrypoint = path.resolve(packageRoot, binValue);

assert.equal(manifest.name, "svelte-ui-kit");
assert.equal(
  typeof manifest.version,
  "string",
  "package.json version must be a string",
);
assert.ok(
  manifest.version.length > 0,
  "package.json version must be a non-empty string",
);
const expectedVersion = `${manifest.name} ${manifest.version}\n`;

/** Run a built entrypoint with the active Node and capture real streams. */
function runEntry(entry, args, cwd, env) {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd,
    encoding: "utf8",
    env,
  });
  assert.equal(result.error, undefined, `spawn failed: ${result.error}`);
  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function runCli(args, options = {}) {
  return runEntry(entrypoint, args, options.cwd ?? packageRoot);
}

/**
 * Deterministic snapshot of a directory tree. For each entry (sorted, hidden
 * entries included) it records the relative path, the lstat type, and either
 * the sha256+size of regular-file bytes or the raw symlink target. Symlinks are
 * never followed and no timestamps are recorded, so atime/mtime churn cannot
 * influence the result.
 */
function snapshot(dir) {
  const out = [];
  const walk = (base, prefix) => {
    const entries = readdirSync(base, { withFileTypes: true }).sort((a, b) =>
      a.name < b.name ? -1 : a.name > b.name ? 1 : 0,
    );
    for (const entry of entries) {
      const abs = path.join(base, entry.name);
      const rel = prefix === "" ? entry.name : `${prefix}/${entry.name}`;
      const stats = lstatSync(abs);
      if (stats.isSymbolicLink()) {
        out.push({ path: rel, type: "symlink", target: readlinkSync(abs) });
      } else if (stats.isDirectory()) {
        out.push({ path: rel, type: "dir" });
        walk(abs, rel);
      } else if (stats.isFile()) {
        const bytes = readFileSync(abs);
        out.push({
          path: rel,
          type: "file",
          size: bytes.length,
          sha256: createHash("sha256").update(bytes).digest("hex"),
        });
      } else {
        out.push({ path: rel, type: "other" });
      }
    }
  };
  walk(dir, "");
  return out;
}

function makeOwnedDir(t, prefix) {
  const dir = mkdtempSync(path.join(tmpdir(), prefix));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** Seed an owned fixture with visible, hidden, nested and symlinked entries. */
function seedProbeFixture(t, prefix = "svelte-ui-kit seeded ") {
  const dir = makeOwnedDir(t, prefix);
  writeFileSync(path.join(dir, "regular.txt"), "regular fixture\n");
  writeFileSync(path.join(dir, ".decoy-hidden"), "hidden fixture\n");
  mkdirSync(path.join(dir, "nested"));
  writeFileSync(path.join(dir, "nested", "deep.txt"), "nested fixture\n");
  mkdirSync(path.join(dir, "nested", ".nested-hidden"));
  symlinkSync("regular.txt", path.join(dir, "link-to-regular"));
  symlinkSync("nested", path.join(dir, "link-to-nested"));
  return dir;
}

/** Copy only built output and package metadata; no source or dev deps. */
function makeDisposableCopy(t, manifestText, prefix) {
  const dir = makeOwnedDir(t, prefix);
  mkdirSync(path.join(dir, "dist"), { recursive: true });
  cpSync(path.join(packageRoot, "dist"), path.join(dir, "dist"), {
    recursive: true,
  });
  writeFileSync(path.join(dir, "package.json"), manifestText);
  return { dir, entry: path.join(dir, binValue) };
}

function jsonText(value) {
  return `${JSON.stringify(value)}\n`;
}

const moduleManifest = (name, version) => ({
  type: "module",
  name,
  version,
});

test("built entrypoint exists (missing build output fails, not skips)", () => {
  assert.ok(
    existsSync(entrypoint),
    `missing built entrypoint ${binValue}; run "pnpm run build" first`,
  );
});

test("no arguments prints help to stdout and exits 0", () => {
  const result = runCli([]);
  assert.equal(result.status, 0);
  assert.equal(result.stderr, "");
  assert.match(result.stdout, /Usage:/);
  assert.match(result.stdout, /--help/);
  assert.match(result.stdout, /--version/);
  assert.match(result.stdout, /Commands:/);
});

for (const args of [["--help"], ["-h"]]) {
  test(`help form ${JSON.stringify(args)} exits 0 with empty stderr`, () => {
    const result = runCli(args);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout, runCli([]).stdout);
  });
}

for (const args of [["--version"], ["-V"]]) {
  test(`version form ${JSON.stringify(args)} prints metadata version`, () => {
    const result = runCli(args);
    assert.equal(result.status, 0);
    assert.equal(result.stderr, "");
    assert.equal(result.stdout, expectedVersion);
    assert.ok(result.stdout.endsWith("\n"));
  });
}

const rejectedArguments = [
  ["--help", "--version"],
  ["--version", "--help"],
  ["-h", "-V"],
  ["-V", "-h"],
  ["--version", "--version"],
  ["--help", "extra"],
  ["--cwd", "."],
  ["add"],
  ["view"],
  ["--"],
  [""],
  ["-v"],
  ["--Version"],
];

for (const args of rejectedArguments) {
  test(`rejects ${JSON.stringify(args)} with empty stdout and exit 2`, () => {
    const result = runCli(args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.ok(result.stderr.length > 0, "expected a stderr diagnostic");
    assert.match(result.stderr, /svelte-ui-kit:/);
    assert.match(result.stderr, /Usage:/);
  });
}

const jsonUsageFailures = [
  ["--json"],
  ["--json", "--version"],
  ["--json", "view"],
  ["info", "--json", "--bogus"],
  ["--json", "nonsense"],
];

for (const args of jsonUsageFailures) {
  test(`json usage failure ${JSON.stringify(args)} emits one envelope`, () => {
    const result = runCli(args);
    assert.equal(result.status, 2, JSON.stringify(args));
    assert.equal(result.stderr, "", JSON.stringify(args));
    const envelope = JSON.parse(result.stdout);
    assert.equal(envelope.schemaVersion, 1);
    assert.equal(envelope.status, "error");
    assert.ok(
      Array.isArray(envelope.diagnostics) && envelope.diagnostics.length > 0,
      "expected at least one error diagnostic",
    );
    assert.equal(envelope.diagnostics[0].level, "error");
    assert.equal((result.stdout.match(/^\}$/gm) ?? []).length, 1);
  });
}

const unsupportedCommands = [
  ["info"],
  ["init"],
  ["view", "button"],
  ["add", "button"],
  ["sync"],
  ["doctor"],
  ["doctor", "--strict"],
  ["add", "button", "--dry-run"],
];

for (const args of unsupportedCommands) {
  test(`unimplemented command ${JSON.stringify(args)} exits 2 honestly`, () => {
    const result = runCli(args);
    assert.equal(result.status, 2);
    assert.equal(result.stdout, "");
    assert.match(result.stderr, /not implemented yet/);
    assert.match(result.stderr, /svelte-ui-kit:/);
  });
}

test("json mode emits exactly one unsupported envelope", () => {
  const result = runCli(["info", "--json"]);
  assert.equal(result.status, 2);
  assert.equal(result.stderr, "");
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.command, "info");
  assert.equal(envelope.status, "unsupported");
  assert.equal(envelope.schemaVersion, 1);
  assert.ok(
    Array.isArray(envelope.diagnostics) && envelope.diagnostics.length > 0,
    "expected at least one diagnostic",
  );
  assert.equal((result.stdout.match(/^\}$/gm) ?? []).length, 1);
});

test("help, version and rejected argument lists never write to a seeded cwd", (t) => {
  const dir = seedProbeFixture(t);
  const before = snapshot(dir);

  const invocations = [
    [],
    ["--help"],
    ["-h"],
    ["--version"],
    ["-V"],
    ["--help", "--version"],
    ["--json"],
    ["--cwd", "."],
    ["--json", "--version"],
    ["add"],
    [""],
    ["--"],
    ["info", "--json"],
    ["init"],
    ["add", "button"],
    ["sync"],
    ["doctor", "--strict"],
  ];
  for (const args of invocations) {
    const result = runCli(args, { cwd: dir });
    assert.ok(
      result.status === 0 || result.status === 2,
      `unexpected status ${result.status} for ${JSON.stringify(args)}`,
    );
    assert.deepEqual(
      snapshot(dir),
      before,
      `seeded cwd changed after ${JSON.stringify(args)}`,
    );
  }
});

test("runs from an unrelated cwd with spaces and ignores cwd metadata", (t) => {
  const dir = seedProbeFixture(t, "svelte-ui-kit smoke ");
  writeFileSync(
    path.join(dir, "package.json"),
    jsonText({ name: "decoy-app", version: "9.9.9" }),
  );
  const before = snapshot(dir);

  const help = runCli([], { cwd: dir });
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /Usage:/);

  const version = runCli(["--version"], { cwd: dir });
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.equal(version.stdout, expectedVersion);

  assert.deepEqual(snapshot(dir), before, "cwd must not be written to");
});

test("disposable copy runs with built output and metadata only", (t) => {
  const { dir } = makeDisposableCopy(
    t,
    readFileSync(packageJsonPath, "utf8"),
    "svelte-ui-kit copy ",
  );
  assert.equal(existsSync(path.join(dir, "node_modules")), false);

  const copyEntrypoint = path.join(dir, binValue);
  assert.equal(existsSync(copyEntrypoint), true);
  const before = snapshot(dir);

  const help = runEntry(copyEntrypoint, ["--help"], dir);
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /Usage:/);

  const version = runEntry(copyEntrypoint, ["--version"], dir);
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.equal(version.stdout, expectedVersion);

  assert.deepEqual(snapshot(dir), before, "copy must not be written to");
});

test("a changed valid package version is printed by both version flags", (t) => {
  const changedVersion = "2.3.4-rc.1+build.001";
  const { entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", changedVersion)),
    "svelte-ui-kit changed-version ",
  );
  const unrelatedCwd = seedProbeFixture(t, "svelte-ui-kit unrelated cwd ");
  writeFileSync(
    path.join(unrelatedCwd, "package.json"),
    jsonText({ name: "decoy-app", version: "9.9.9" }),
  );

  for (const args of [["--version"], ["-V"]]) {
    const result = runEntry(entry, args, unrelatedCwd);
    assert.equal(result.status, 0, JSON.stringify(args));
    assert.equal(result.stderr, "", JSON.stringify(args));
    assert.equal(
      result.stdout,
      `svelte-ui-kit ${changedVersion}\n`,
      JSON.stringify(args),
    );
  }
});

test("rejects wrong, control and whitespace names with exit 1", (t) => {
  const wrongNames = [
    ["wrong-package", "different product name"],
    ["svelte-ui-kit\nforged line", "embedded newline"],
    ["svelte-ui-kit ", "trailing space"],
    [" svelte-ui-kit", "leading space"],
    ["svelte-ui kit", "inner space"],
    ["svelte-ui-kit\u0007", "control character"],
    ["svelte-ui-kit\u0000", "NUL character"],
    ["Svelte-UI-Kit", "wrong case"],
    ["svelte_ui_kit", "underscore alias"],
    ["", "empty name"],
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit wrong-name ",
  );

  for (const [name, label] of wrongNames) {
    writeFileSync(
      path.join(dir, "package.json"),
      jsonText(moduleManifest(name, "0.1.0")),
    );
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.match(result.stderr, /svelte-ui-kit:/, label);
  }
});

test("rejects non-string name fields (Node package-config) with exit 1", (t) => {
  // Node validates the package `name` field type while selecting the module
  // loader, so these values are rejected before the entrypoint runs; the
  // observable contract (exit 1, empty stdout, safe stderr) still holds.
  const nodeRejectedNames = [
    [moduleManifest(123, "0.1.0"), "numeric name"],
    [moduleManifest(null, "0.1.0"), "null name"],
    [moduleManifest(true, "0.1.0"), "boolean name"],
    [moduleManifest(["svelte-ui-kit"], "0.1.0"), "array name"],
    [moduleManifest({ name: "svelte-ui-kit" }, "0.1.0"), "object name"],
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit bad-name ",
  );

  for (const [value, label] of nodeRejectedNames) {
    writeFileSync(path.join(dir, "package.json"), jsonText(value));
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.match(
      result.stderr,
      /Invalid package config|ERR_INVALID_PACKAGE_CONFIG/,
      label,
    );
  }
});

test("rejects missing and non-string version fields with exit 1", (t) => {
  const cliRejectedFields = [
    [{ type: "module", version: "0.1.0" }, "missing name"],
    [{ type: "module", name: "svelte-ui-kit" }, "missing version"],
    [moduleManifest("svelte-ui-kit", 123), "numeric version"],
    [moduleManifest("svelte-ui-kit", null), "null version"],
    [moduleManifest("svelte-ui-kit", true), "boolean version"],
    [moduleManifest("svelte-ui-kit", ["0.1.0"]), "array version"],
    [moduleManifest("svelte-ui-kit", { version: "0.1.0" }), "object version"],
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit bad-fields ",
  );

  for (const [value, label] of cliRejectedFields) {
    writeFileSync(path.join(dir, "package.json"), jsonText(value));
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.match(result.stderr, /svelte-ui-kit:/, label);
  }
});

test("rejects non-object metadata with exit 1", (t) => {
  // A non-object package.json is rejected by Node while selecting the module
  // loader (same ERR_INVALID_PACKAGE_CONFIG class as unparseable JSON), so the
  // entrypoint never runs; exit 1, empty stdout and a safe stderr still hold.
  const nonObjects = [
    ["[]", "empty array"],
    ["[1,2,3]", "array of numbers"],
    ["null", "null"],
    ['"hello"', "JSON string"],
    ["123", "JSON number"],
    ["true", "JSON boolean"],
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit non-object ",
  );

  for (const [text, label] of nonObjects) {
    writeFileSync(path.join(dir, "package.json"), text);
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.match(
      result.stderr,
      /Invalid package config|ERR_INVALID_PACKAGE_CONFIG/,
      label,
    );
  }
});

test("rejects invalid SemVer versions with exit 1", (t) => {
  const invalidVersions = [
    ["", "empty version"],
    ["1.2", "missing patch"],
    ["1.2.3.4", "extra numeric component"],
    ["01.2.3", "major leading zero"],
    ["1.02.3", "minor leading zero"],
    ["1.2.03", "patch leading zero"],
    ["1.2.3-", "empty prerelease"],
    ["1.2.3+", "empty build"],
    ["1.2.3-..", "empty prerelease identifiers"],
    ["1.2.3+..", "empty build identifiers"],
    ["1.2.3-a..b", "empty middle prerelease identifier"],
    ["1.2.3+a..b", "empty middle build identifier"],
    ["1.2.3-01", "numeric prerelease leading zero"],
    ["1.2.3-1.01", "numeric prerelease identifier leading zero"],
    ["1.2.3-alpha.01", "trailing numeric prerelease leading zero"],
    ["1.2.3-rc.1+", "trailing plus with empty build"],
    ["v1.2.3", "leading v prefix"],
    ["1.2.3 ", "trailing space"],
    [" 1.2.3", "leading space"],
    ["1.2.3\n", "trailing newline"],
    ["1.2.3\t", "trailing tab"],
    ["\n1.2.3", "leading newline"],
    ["not-a-version", "non-version text"],
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit bad-version ",
  );

  for (const [version, label] of invalidVersions) {
    writeFileSync(
      path.join(dir, "package.json"),
      jsonText(moduleManifest("svelte-ui-kit", version)),
    );
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 1, label);
    assert.equal(result.stdout, "", label);
    assert.match(result.stderr, /svelte-ui-kit:/, label);
  }
});

test("accepts valid SemVer versions, including build leading zeroes", (t) => {
  const validVersions = [
    "0.0.0",
    "1.2.3",
    "10.20.30",
    "2.3.4-rc.1+build.001",
    "1.2.3-0",
    "1.2.3+001",
    "1.2.3-alpha",
    "1.2.3-alpha.1",
    "1.2.3-alpha.0.1",
    "1.2.3-0.3.7",
    "1.0.0-x.7.z.92",
    "1.2.3+build.001",
    "1.2.3-rc.1",
    "1.2.3--",
    "1.2.3-0a",
  ];
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit good-version ",
  );

  for (const version of validVersions) {
    writeFileSync(
      path.join(dir, "package.json"),
      jsonText(moduleManifest("svelte-ui-kit", version)),
    );
    const result = runEntry(entry, ["--version"], dir);
    assert.equal(result.status, 0, version);
    assert.equal(result.stderr, "", version);
    assert.equal(result.stdout, `svelte-ui-kit ${version}\n`, version);
  }
});

test("valid metadata with unsupported arguments still exits 2", (t) => {
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "2.3.4-rc.1+build.001")),
    "svelte-ui-kit valid-args ",
  );

  for (const args of [["add"], ["--help", "--version"]]) {
    const result = runEntry(entry, args, dir);
    assert.equal(result.status, 2, JSON.stringify(args));
    assert.equal(result.stdout, "", JSON.stringify(args));
    assert.match(result.stderr, /svelte-ui-kit:/, JSON.stringify(args));
  }

  const jsonResult = runEntry(entry, ["--json"], dir);
  assert.equal(jsonResult.status, 2);
  assert.equal(jsonResult.stderr, "");
  const envelope = JSON.parse(jsonResult.stdout);
  assert.equal(envelope.command, "help");
  assert.equal(envelope.status, "error");
});

test("metadata validation precedes argument handling", (t) => {
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "not-a-version")),
    "svelte-ui-kit meta-first ",
  );

  for (const args of [[], ["--help"], ["-h"], ["--version"], ["-V"], ["add"]]) {
    const result = runEntry(entry, args, dir);
    assert.equal(result.status, 1, JSON.stringify(args));
    assert.equal(result.stdout, "", JSON.stringify(args));
    assert.match(result.stderr, /svelte-ui-kit:/, JSON.stringify(args));
  }

  const jsonResult = runEntry(entry, ["--json"], dir);
  assert.equal(jsonResult.status, 1);
  assert.equal(jsonResult.stderr, "");
  const envelope = JSON.parse(jsonResult.stdout);
  assert.equal(envelope.command, "help");
  assert.equal(envelope.status, "error");
  assert.equal(envelope.diagnostics[0].code, "PACKAGE_METADATA_VERSION");
});

test("syntactically invalid package metadata is rejected with exit 1", (t) => {
  const { dir, entry } = makeDisposableCopy(
    t,
    "{ not json\n",
    "svelte-ui-kit invalid-json ",
  );

  // Node resolves the nearest package.json before executing the module, so an
  // unparseable file fails there with its own clear exit-1 diagnostic.
  const result = runEntry(entry, ["--version"], dir);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.ok(result.stderr.length > 0);
});

test("missing package metadata fails clearly with exit 1", (t) => {
  const { dir, entry } = makeDisposableCopy(
    t,
    jsonText(moduleManifest("svelte-ui-kit", "0.1.0")),
    "svelte-ui-kit missing ",
  );
  rmSync(path.join(dir, "package.json"), { force: true });
  assert.equal(existsSync(path.join(dir, "package.json")), false);

  const result = runEntry(entry, ["--version"], dir);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /svelte-ui-kit:/);
});

test("snapshot records entry types, bytes and symlink targets", (t) => {
  const dir = makeOwnedDir(t, "svelte-ui-kit snapshot-shape ");
  writeFileSync(path.join(dir, "file.txt"), "hello");
  mkdirSync(path.join(dir, "sub"));
  writeFileSync(path.join(dir, "sub", "inner.txt"), "nested");
  symlinkSync("file.txt", path.join(dir, "link"));

  const byPath = new Map(snapshot(dir).map((entry) => [entry.path, entry]));
  assert.equal(byPath.get("file.txt").type, "file");
  assert.equal(
    byPath.get("file.txt").sha256,
    createHash("sha256").update("hello").digest("hex"),
  );
  assert.equal(byPath.get("sub").type, "dir");
  assert.equal(byPath.get("sub/inner.txt").type, "file");
  assert.equal(byPath.get("link").type, "symlink");
  assert.equal(byPath.get("link").target, "file.txt");
});

test("snapshot detects same-path, same-length content replacement", (t) => {
  const dir = makeOwnedDir(t, "svelte-ui-kit snapshot-bytes ");
  writeFileSync(path.join(dir, "existing.txt"), "AAAA");
  const before = snapshot(dir);
  writeFileSync(path.join(dir, "existing.txt"), "BBBB");
  assert.notDeepEqual(snapshot(dir), before);
});

test("snapshot detects a retargeted symlink", (t) => {
  const dir = makeOwnedDir(t, "svelte-ui-kit snapshot-link ");
  writeFileSync(path.join(dir, "one.txt"), "one");
  writeFileSync(path.join(dir, "two.txt"), "two");
  symlinkSync("one.txt", path.join(dir, "link"));
  const before = snapshot(dir);
  rmSync(path.join(dir, "link"));
  symlinkSync("two.txt", path.join(dir, "link"));
  assert.notDeepEqual(snapshot(dir), before);
});

/** Inject an "overwrite a pre-existing seeded hidden file" behaviour. */
function existingFileWriteMutant(source) {
  const needle = 'import { readFileSync } from "node:fs";';
  const withImports = source.replace(
    needle,
    'import { readFileSync, existsSync, writeFileSync } from "node:fs";',
  );
  assert.notEqual(
    withImports,
    source,
    "expected the built entrypoint to import readFileSync from node:fs",
  );
  return (
    withImports +
    "\n// S004 mutation probe: overwrite a pre-existing seeded hidden file.\n" +
    "{\n" +
    '  const mutantPath = process.cwd() + "/.decoy-hidden";\n' +
    '  if (existsSync(mutantPath)) writeFileSync(mutantPath, "mutant overwrite\\n");\n' +
    "}\n"
  );
}

/** Replace metadata-derived version output with a literal. */
function hardCodedVersionMutant(source) {
  // After S012 the version string is produced by the shared `runCli` executor,
  // so the mutant hard-codes it in the adapter before the metadata is read.
  const needle = "const metadata = readPackageMetadata(intent);";
  const mutated = source.replace(
    needle,
    'if (argv.length === 1 && (argv[0] === "--version" || argv[0] === "-V")) { process.stdout.write("svelte-ui-kit 0.1.0\\n"); process.exit(0); } const metadata = readPackageMetadata(intent);',
  );
  assert.notEqual(
    mutated,
    source,
    "expected the built entrypoint to read metadata and derive version output",
  );
  return mutated;
}

/**
 * Build a disposable copy of the built CLI plus this smoke suite, apply a
 * mutation, and run the suite against it. The nested run sets the probe env
 * var so its own mutation meta-tests are skipped rather than recursing.
 */
function runMutantSuite(t, { version, mutate }) {
  const { dir } = makeDisposableCopy(
    t,
    jsonText({ ...manifest, version }),
    "svelte-ui-kit mutant ",
  );
  mkdirSync(path.join(dir, "tests", "smoke"), { recursive: true });
  cpSync(
    fileURLToPath(import.meta.url),
    path.join(dir, "tests", "smoke", "cli-bootstrap.test.mjs"),
  );

  const builtPath = path.join(dir, binValue);
  const mutated = mutate(readFileSync(builtPath, "utf8"));
  writeFileSync(builtPath, mutated);

  // The outer test runner sets NODE_TEST_CONTEXT for its own worker; inheriting
  // it would make the nested `node --test` no-op and return 0. Strip it so the
  // nested suite really runs, and set the probe marker to skip its own
  // mutation meta-tests instead of recursing.
  const probeEnv = { ...process.env, [MUTATION_PROBE_ENV]: "1" };
  delete probeEnv.NODE_TEST_CONTEXT;

  return spawnSync(
    process.execPath,
    ["--test", "--test-reporter=tap", "tests/smoke/cli-bootstrap.test.mjs"],
    {
      cwd: dir,
      encoding: "utf8",
      env: probeEnv,
    },
  );
}

test(
  "strengthened smoke rejects an existing-file-write mutant",
  { skip: insideMutationProbe },
  (t) => {
    const result = runMutantSuite(t, {
      version: manifest.version,
      mutate: existingFileWriteMutant,
    });
    assert.notEqual(
      result.status,
      0,
      "existing-file-write mutant unexpectedly passed the smoke suite",
    );
    assert.match(result.stdout, /^not ok /m);
  },
);

test(
  "strengthened smoke rejects a hard-coded-version mutant",
  { skip: insideMutationProbe },
  (t) => {
    const result = runMutantSuite(t, {
      version: "2.3.4-rc.1+build.001",
      mutate: hardCodedVersionMutant,
    });
    assert.notEqual(
      result.status,
      0,
      "hard-coded-version mutant unexpectedly passed the smoke suite",
    );
    assert.match(result.stdout, /^not ok /m);
  },
);
