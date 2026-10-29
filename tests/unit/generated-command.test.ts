import assert from "node:assert/strict";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  GeneratedCommandFailure,
  runGeneratedCommand,
} from "../helpers/generated-command.js";

function fixture(t: { after(fn: () => void): void }, source: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-generated-command-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const app = path.join(root, "app");
  mkdirSync(app);
  const entrypoint = path.join(root, "cli.mjs");
  writeFileSync(entrypoint, source);
  const marker = path.join(app, "preserve.txt");
  writeFileSync(marker, "owned diagnostic input\n");
  return {
    root: app,
    entrypoint,
    marker,
    options: { timeoutMs: 1000, diagnosticDir: path.join(root, "diagnostics") },
  };
}

test("completed generated commands write no diagnostic artifact", (t) => {
  const f = fixture(t, "process.stdout.write('{\"ok\":true}\\n');\n");
  runGeneratedCommand(f.root, f.entrypoint, ["init"], f.options);
  assert.equal(existsSync(f.options.diagnosticDir), false);
  assert.equal(readFileSync(f.marker, "utf8"), "owned diagnostic input\n");
});

for (const scenario of [
  {
    name: "valid-looking response then stall",
    source:
      "process.stdout.write('{\"ok\":true}\\n'); setInterval(() => {}, 1000);",
    signal: "SIGKILL",
    status: null,
    code: "ETIMEDOUT",
  },
  {
    name: "actual signal",
    source: "process.kill(process.pid, 'SIGTERM');",
    signal: "SIGTERM",
    status: null,
    code: null,
  },
  {
    name: "nonzero exit",
    source: "process.exit(7);",
    signal: null,
    status: 7,
    code: null,
  },
  {
    name: "unexpected diagnostic",
    source: "process.stderr.write('unexpected diagnostic\\n');",
    signal: null,
    status: 0,
    code: null,
  },
]) {
  test(`generated command refuses ${scenario.name} with retained exact evidence`, (t) => {
    const f = fixture(t, scenario.source);
    let failure: unknown;
    try {
      runGeneratedCommand(f.root, f.entrypoint, ["add", "radio"], f.options);
    } catch (error) {
      failure = error;
    }
    assert.ok(failure instanceof GeneratedCommandFailure);
    const report = JSON.parse(readFileSync(failure.diagnostic, "utf8"));
    assert.equal(report.cwd, f.root);
    assert.equal(report.deadlineMs, 1000);
    assert.equal(report.signal, scenario.signal);
    assert.equal(report.status, scenario.status);
    assert.equal(report.error?.code ?? null, scenario.code);
    assert.ok(report.pid > 0);
    if (scenario.code === "ETIMEDOUT")
      assert.equal(report.stdout, '{"ok":true}\n');
    assert.equal(readFileSync(f.marker, "utf8"), "owned diagnostic input\n");
    assert.equal(readdirSync(f.options.diagnosticDir).length, 1);
  });
}
