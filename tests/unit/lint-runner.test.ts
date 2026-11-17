/** The lint command must run both tools and never hide either failure. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

for (const fault of [
  "none",
  "biome",
  "eslint",
  "missing-biome",
  "signal-biome",
]) {
  test(`lint runner preserves ${fault} outcome and runs the complementary tool`, (t) => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-lint-runner-"));
    t.after(() => rmSync(root, { recursive: true, force: true }));
    const bin = path.join(root, "bin");
    mkdirSync(bin);
    const marker = path.join(root, "calls.jsonl");
    for (const tool of ["biome", "eslint"]) {
      if (fault === "missing-biome" && tool === "biome") continue;
      writeFileSync(
        path.join(bin, tool),
        `#!${process.execPath}
const fs = require("node:fs");
fs.appendFileSync(${JSON.stringify(marker)}, JSON.stringify({tool:${JSON.stringify(tool)}, args:process.argv.slice(2)}) + "\\n");
${fault === `signal-${tool}` ? 'process.kill(process.pid, "SIGTERM");' : `process.exit(${fault === tool ? 2 : 0});`}
`,
        { mode: 0o755 },
      );
    }
    const result = spawnSync(
      process.execPath,
      [path.resolve("tools/lint.ts")],
      {
        cwd: root,
        env: { ...process.env, PATH: bin },
        encoding: "utf8",
        timeout: 30_000,
        killSignal: "SIGKILL",
      },
    );
    assert.equal(result.error, undefined);
    assert.equal(result.signal, null);
    assert.equal(result.status, fault === "none" ? 0 : 1, result.stderr);
    const calls = readFileSync(marker, "utf8")
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line) as { tool: string; args: string[] });
    assert.deepEqual(
      calls.map((call) => call.tool),
      fault === "missing-biome" ? ["eslint"] : ["biome", "eslint"],
    );
    assert.deepEqual(calls.at(-1)?.args, [".", "--max-warnings", "0"]);
    if (fault !== "missing-biome")
      assert.deepEqual(calls[0]!.args, [
        "lint",
        ".",
        "--diagnostic-level=warn",
        "--error-on-warnings",
      ]);
    else assert.match(result.stderr, /ENOENT/);
  });
}
