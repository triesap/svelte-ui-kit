import {
  nativeCommand as command,
  verifyTargetConsumer,
} from "../helpers/target-consumer.js";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parse, stringify } from "yaml";
import { snapshotTree } from "../helpers/tree-snapshot.js";

const owner = process.cwd();
function cli(root: string, ...args: string[]) {
  return command(root, process.execPath, [
    path.join(owner, "dist/cli/main.js"),
    "--cwd",
    root,
    ...args,
  ]);
}

test(
  "real generated Astro consumer checks, builds, serves SSR and hydrates independent islands",
  { timeout: 360_000 },
  async (t) => {
    const root = path.join(
      owner,
      ".artifacts/verification",
      `astro-${randomUUID()}`,
    );
    mkdirSync(root, { recursive: true });
    const blueprint = path.join(owner, "tests/fixtures/astro-consumer");
    cpSync(blueprint, root, {
      recursive: true,
      filter: (source) =>
        !source
          .split(path.sep)
          .some((part) => ["node_modules", ".astro", "dist"].includes(part)),
    });
    const workspace = parse(
      readFileSync(path.join(owner, "pnpm-workspace.yaml"), "utf8"),
    );
    writeFileSync(
      path.join(root, "pnpm-workspace.yaml"),
      stringify({
        packages: ["."],
        catalog: workspace.catalog,
        minimumReleaseAgeExclude: workspace.minimumReleaseAgeExclude,
      }),
    );
    const manifest = JSON.parse(
      readFileSync(path.join(root, "package.json"), "utf8"),
    );
    const archive = manifest.dependencies["bits-ui"]
      .slice(5)
      .replace(/^\.\//, "");
    mkdirSync(path.dirname(path.join(root, archive)), { recursive: true });
    cpSync(path.join(owner, archive), path.join(root, archive));
    const state = path.join(root, "src/generated/ui/_kit");
    mkdirSync(state, { recursive: true });
    cpSync(path.join(root, "kit-intent.json"), path.join(state, "kit.json"));
    const logs: Record<string, string> = {};
    logs.install = command(root, "pnpm", [
      "install",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ]);
    logs.frozenInstall = command(root, "pnpm", [
      "install",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ]);
    const manifestBefore = readFileSync(
      path.join(root, "package.json"),
      "utf8",
    );
    const layoutBefore = readFileSync(
      path.join(root, "src/layouts/Layout.astro"),
      "utf8",
    );
    logs.init = cli(root, "init");
    for (const item of ["button", "field", "dialog"])
      logs[item] = cli(root, "add", item);
    logs.sync = cli(root, "sync");
    assert.equal(
      readFileSync(path.join(root, "package.json"), "utf8"),
      manifestBefore,
    );
    const generated = readFileSync(
      path.join(root, "src/layouts/Layout.astro"),
      "utf8",
    );
    assert.ok(
      generated.endsWith(
        layoutBefore.slice(layoutBefore.indexOf("interface Props")),
      ),
    );
    const before = snapshotTree(root);
    for (const args of [
      ["info"],
      ["doctor"],
      ["sync", "--dry-run"],
      ["sync"],
      ["init"],
    ]) {
      logs[args.join(" ")] = cli(root, ...args);
      assert.deepEqual(snapshotTree(root), before, args.join(" "));
    }
    logs.check = command(root, "pnpm", ["run", "check"]);
    assert.match(
      logs.check,
      /Result \(([1-9]\d*) files\):\s*\n- 0 errors\s*\n- 0 warnings/,
    );
    assert.match(logs.check, /svelte-check found 0 errors and 0 warnings/);
    logs.build = command(root, "pnpm", ["run", "build"]);
    writeFileSync(
      path.join(root, "verification-commands.json"),
      JSON.stringify(logs, null, 2),
    );
    await verifyTargetConsumer(
      { root, framework: "astro", commands: Object.keys(logs) },
      t,
    );
  },
);
