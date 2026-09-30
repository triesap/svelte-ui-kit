import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { parseEnvelope, type CommandEnvelope } from "../../src/cli/protocol.js";

/**
 * S022/S023 failure-protocol tests.
 *
 * Every built CLI failure preserves JSON intent: exactly one deterministic
 * envelope on stdout, no human stderr, the frozen exit map and safe (locator
 * free) diagnostics. Metadata failures in the Node adapter obey the same rule.
 */

const PKG_ROOT = process.cwd();
const ENTRYPOINT = path.join(PKG_ROOT, "dist", "cli", "main.js");

interface RunResult {
  readonly status: number | null;
  readonly stdout: string;
  readonly stderr: string;
}

function runCli(
  args: readonly string[],
  entrypoint: string = ENTRYPOINT,
  cwd: string = PKG_ROOT,
): RunResult {
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.equal(result.error, undefined, String(result.error));
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

function envelopeOf(stdout: string): CommandEnvelope {
  assert.equal(stdout.endsWith("\n"), true, "envelope must end with one LF");
  assert.equal(
    stdout.trimEnd().split("\n\n").length,
    1,
    "exactly one JSON document must be emitted",
  );
  const parsed = parseEnvelope(JSON.parse(stdout));
  assert.equal(parsed.ok, true, JSON.stringify(parsed));
  return parsed.ok ? parsed.value : (undefined as unknown as CommandEnvelope);
}

test("json usage failures emit exactly one safe envelope", () => {
  const cases: ReadonlyArray<{
    argv: string[];
    command: string;
    message: RegExp;
  }> = [
    { argv: ["--json", "view"], command: "view", message: /exactly one item/ },
    {
      argv: ["info", "--json", "--bogus"],
      command: "info",
      message: /unsupported option/,
    },
    {
      argv: ["--json", "info", "--bogus"],
      command: "info",
      message: /unsupported option/,
    },
    {
      argv: ["--json", "nonsense"],
      command: "help",
      message: /unknown command/,
    },
    { argv: ["--json"], command: "help", message: /no command/ },
    {
      argv: ["--json", "--cwd"],
      command: "help",
      message: /requires a directory value/,
    },
    {
      argv: ["--json", "add", "Button"],
      command: "add",
      message: /invalid item id/,
    },
    {
      argv: ["add", "button", "--json", "--json"],
      command: "add",
      message: /duplicate --json/,
    },
    {
      argv: ["view", "button", "--json", "--strict"],
      command: "view",
      message: /--strict is only valid/,
    },
    {
      argv: ["info", "--bogus", "--json"],
      command: "info",
      message: /unsupported option/,
    },
    {
      argv: ["--cwd", "--json", "info"],
      command: "info",
      message: /requires a directory value/,
    },
    {
      argv: ["--bogus", "info", "--json"],
      command: "info",
      message: /unsupported option/,
    },
    {
      argv: ["--json", "--bogus", "info"],
      command: "info",
      message: /unsupported option/,
    },
    {
      argv: ["--cwd", "info", "--json"],
      command: "help",
      message: /no command/,
    },
    {
      argv: ["--cwd=--json", "--json"],
      command: "help",
      message: /no command/,
    },
  ];
  for (const entry of cases) {
    const result = runCli(entry.argv);
    assert.equal(result.status, 2, JSON.stringify(entry.argv));
    assert.equal(result.stderr, "", "json mode keeps stderr empty");
    const envelope = envelopeOf(result.stdout);
    assert.equal(envelope.command, entry.command);
    assert.equal(envelope.status, "error");
    assert.equal(envelope.diagnostics[0]?.level, "error");
    assert.match(envelope.diagnostics[0]?.message ?? "", entry.message);
    for (const diagnostic of envelope.diagnostics) {
      assert.equal(diagnostic.locator, undefined);
    }
  }
});

test("human usage failures stay on stderr with empty stdout", () => {
  for (const argv of [
    ["view"],
    ["info", "--bogus"],
    ["nonsense"],
    ["--cwd"],
    ["--cwd=--json"],
  ]) {
    const result = runCli(argv);
    assert.equal(result.status, 2, JSON.stringify(argv));
    assert.equal(result.stdout, "", JSON.stringify(argv));
    assert.match(result.stderr, /svelte-ui-kit:/);
  }
});

function isolatedPackage(
  t: { after: (fn: () => void) => void },
  manifestText: string,
): { entrypoint: string; dir: string } {
  const dir = mkdtempSync(path.join(os.tmpdir(), "suik-cli-meta-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(path.join(PKG_ROOT, "dist"), path.join(dir, "dist"), {
    recursive: true,
  });
  writeFileSync(path.join(dir, "package.json"), manifestText);
  return { entrypoint: path.join(dir, "dist", "cli", "main.js"), dir };
}

test("controlled metadata failures emit one json envelope", (t) => {
  const cases: ReadonlyArray<{ manifest: string; code: string }> = [
    {
      manifest: '{"type":"module","version":"0.1.0"}\n',
      code: "PACKAGE_METADATA_NAME",
    },
    {
      manifest: '{"type":"module","name":"other","version":"0.1.0"}\n',
      code: "PACKAGE_METADATA_NAME",
    },
    {
      manifest: '{"type":"module","name":"svelte-ui-kit"}\n',
      code: "PACKAGE_METADATA_VERSION",
    },
    {
      manifest: '{"type":"module","name":"svelte-ui-kit","version":"v1"}\n',
      code: "PACKAGE_METADATA_VERSION",
    },
  ];
  for (const entry of cases) {
    const { entrypoint, dir } = isolatedPackage(t, entry.manifest);
    const result = runCli(["--json", "info"], entrypoint, dir);
    assert.equal(result.status, 1, entry.manifest);
    assert.equal(result.stderr, "", entry.manifest);
    const envelope = envelopeOf(result.stdout);
    assert.equal(envelope.command, "info");
    assert.equal(envelope.status, "error");
    assert.equal(envelope.diagnostics[0]?.code, entry.code);
    for (const diagnostic of envelope.diagnostics) {
      assert.equal(diagnostic.locator, undefined);
    }
  }
});

test("metadata failures attribute the recognized command regardless of flag order", (t) => {
  const { entrypoint, dir } = isolatedPackage(
    t,
    '{"type":"module","name":"other","version":"0.1.0"}\n',
  );
  for (const argv of [
    ["--json", "info"],
    ["info", "--json"],
    ["--bogus", "info", "--json"],
  ]) {
    const result = runCli(argv, entrypoint, dir);
    assert.equal(result.status, 1, JSON.stringify(argv));
    assert.equal(result.stderr, "", JSON.stringify(argv));
    const envelope = envelopeOf(result.stdout);
    assert.equal(envelope.command, "info", JSON.stringify(argv));
    assert.equal(envelope.diagnostics[0]?.code, "PACKAGE_METADATA_NAME");
  }
});

test("metadata failures without json keep the human diagnostic", (t) => {
  const { entrypoint, dir } = isolatedPackage(
    t,
    '{"type":"module","version":"0.1.0"}\n',
  );
  const result = runCli(["info"], entrypoint, dir);
  assert.equal(result.status, 1);
  assert.equal(result.stdout, "");
  assert.match(result.stderr, /no string "name"/);
});

test("bare help and version remain byte stable", () => {
  const help = runCli(["--help"]);
  assert.equal(help.status, 0);
  assert.equal(help.stderr, "");
  assert.match(help.stdout, /Usage:/);
  const version = runCli(["--version"]);
  assert.equal(version.status, 0);
  assert.equal(version.stderr, "");
  assert.match(version.stdout, /^svelte-ui-kit \d+\.\d+\.\d+\n$/);
  assert.equal(runCli([]).stdout, help.stdout);
});
