import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import { parseCliArgs } from "../../src/cli/args.js";
import { HELP_TEXT, formatUsageDiagnostic, runCli } from "../../src/cli/run.js";
import type { PlanningOutcome } from "../../src/codegen/plan.js";
import type { ProjectInput } from "../../src/project/input.js";
import type { RegistrySnapshot } from "../../src/registry/snapshot.js";

/**
 * S012 boundary tests.
 *
 * These prove the pure CLI modules classify and apply requests without
 * filesystem writes, that the injected result handling agrees with the real
 * built adapter, that the readonly boundary types reject invalid values at
 * compile time, and that consumer fixture sources never import CLI/Node/registry
 * internals.
 */
const PACKAGE_ROOT = process.cwd();
const CLI_ENTRYPOINT = path.join(PACKAGE_ROOT, "dist", "cli", "main.js");
const CONSUMER_SRC = path.join(
  PACKAGE_ROOT,
  "tests",
  "fixtures",
  "consumer",
  "src",
);

/** A deterministic complete-tree listing (paths, modes and file bytes). */
function listTree(root: string): string[] {
  const entries: string[] = [];
  const walk = (abs: string, rel: string) => {
    const stats = statSync(abs);
    if (stats.isDirectory()) {
      entries.push(`${rel}\tdir\t${(stats.mode & 0o7777).toString(8)}`);
      for (const name of readdirSync(abs).sort()) {
        walk(path.join(abs, name), rel === "" ? name : `${rel}/${name}`);
      }
    } else {
      entries.push(
        `${rel}\tfile\t${(stats.mode & 0o7777).toString(8)}\t${readFileSync(abs).toString("base64")}`,
      );
    }
  };
  walk(root, "");
  return entries;
}

test("parseCliArgs classifies help, version and unsupported arguments", () => {
  assert.deepEqual(parseCliArgs([]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["--help"]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["-h"]), { kind: "help" });
  assert.deepEqual(parseCliArgs(["--version"]), { kind: "version" });
  assert.deepEqual(parseCliArgs(["-V"]), { kind: "version" });
  assert.deepEqual(parseCliArgs(["--help", "extra"]), {
    kind: "usage-error",
    argv: ["--help", "extra"],
  });
  assert.deepEqual(parseCliArgs(["--json"]), {
    kind: "usage-error",
    argv: ["--json"],
  });
});

test("pure execution writes only through the injected effects", () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), "suik-boundaries-"));
  try {
    writeFileSync(path.join(dir, "sentinel.txt"), "keep\n");
    const before = listTree(dir);
    const out: string[] = [];
    const err: string[] = [];
    const code = runCli(
      ["--help"],
      { name: "svelte-ui-kit", version: "0.1.0" },
      {
        stdout: (text) => out.push(text),
        stderr: (text) => err.push(text),
      },
    );
    assert.equal(code, 0);
    assert.equal(out.join(""), HELP_TEXT);
    assert.deepEqual(err, []);
    assert.deepEqual(listTree(dir), before, "pure execution must not write");
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("injected result handling matches the real built adapter", () => {
  const manifest = JSON.parse(
    readFileSync(path.join(PACKAGE_ROOT, "package.json"), "utf8"),
  ) as { name: string; version: string };
  const metadata = { name: manifest.name, version: manifest.version };
  const cases: ReadonlyArray<{
    argv: string[];
    exitCode: number;
    stream: "stdout" | "stderr";
  }> = [
    { argv: ["--help"], exitCode: 0, stream: "stdout" },
    { argv: ["--version"], exitCode: 0, stream: "stdout" },
    { argv: ["--nope"], exitCode: 2, stream: "stderr" },
  ];
  for (const { argv, exitCode, stream } of cases) {
    const out: string[] = [];
    const err: string[] = [];
    const pureCode = runCli(argv, metadata, {
      stdout: (text) => out.push(text),
      stderr: (text) => err.push(text),
    });
    const built = spawnSync(process.execPath, [CLI_ENTRYPOINT, ...argv], {
      encoding: "utf8",
    });
    assert.equal(built.status, pureCode, `exit code for ${argv.join(" ")}`);
    assert.equal(pureCode, exitCode);
    if (stream === "stdout") {
      assert.equal(built.stdout, out.join(""));
      assert.equal(built.stderr, "");
    } else {
      assert.equal(built.stderr, err.join(""));
      assert.equal(built.stdout, "");
    }
  }
});

test("readonly boundary types reject invalid values at compile time", () => {
  const project: ProjectInput = {
    rootDir: "/tmp/example",
    packageName: null,
    dependencies: {},
  };
  assert.equal(project.rootDir, "/tmp/example");

  const badProject: ProjectInput = {
    rootDir: "/tmp/example",
    packageName: null,
    // @ts-expect-error dependencies must be a string map, not an array
    dependencies: [],
  };
  assert.equal(badProject.rootDir, "/tmp/example");

  const snapshot: RegistrySnapshot = { version: "1", items: [] };
  assert.equal(snapshot.items.length, 0);

  const badSnapshot: RegistrySnapshot = {
    version: "1",
    // @ts-expect-error items must be a readonly array of item refs
    items: 7,
  };
  assert.equal(badSnapshot.version, "1");

  const outcome: PlanningOutcome = {
    kind: "no-op",
    writes: [],
    diagnostics: [],
  };
  assert.equal(outcome.kind, "no-op");

  const badOutcome: PlanningOutcome = {
    // @ts-expect-error kind is limited to "no-op" or "apply"
    kind: "delete",
    writes: [],
    diagnostics: [],
  };
  assert.equal(badOutcome.writes.length, 0);
});

test("consumer fixture sources never import CLI, Node or registry internals", () => {
  const sources: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== "node_modules" && !entry.name.startsWith(".")) {
          walk(abs);
        }
      } else if (/\.(ts|svelte)$/.test(entry.name)) {
        sources.push(abs);
      }
    }
  };
  walk(CONSUMER_SRC);
  assert.ok(sources.length > 0, "expected maintained consumer sources");

  const forbidden = (specifier: string): boolean =>
    specifier.startsWith("node:") ||
    /(^|\/)src\/(cli|registry|codegen|project)(\/|$)/.test(specifier) ||
    specifier.includes("/dist/cli") ||
    specifier === "svelte-ui-kit" ||
    specifier.startsWith("svelte-ui-kit/");

  for (const file of sources) {
    const text = readFileSync(file, "utf8");
    const specifiers = [
      ...text.matchAll(/(?:from|import)\s+["']([^"']+)["']/g),
    ].map((match) => match[1]);
    for (const specifier of specifiers) {
      assert.ok(
        !forbidden(specifier),
        `${path.relative(PACKAGE_ROOT, file)} must not import "${specifier}"`,
      );
    }
  }
});

test("formatUsageDiagnostic renders the argv-independent prefix", () => {
  const diagnostic = formatUsageDiagnostic(["-x"]);
  assert.match(diagnostic, /^svelte-ui-kit: unsupported argument list: "-x"/);
  assert.match(
    diagnostic,
    /svelte-ui-kit --help, -h or svelte-ui-kit --version, -V/,
  );
});
