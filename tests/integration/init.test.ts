import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
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
import { copyConsumerFixture, runFixtureScript } from "../helpers/fixture.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
function write(root: string, file: string, text: string) {
  mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
  writeFileSync(path.join(root, file), text);
}
function run(root: string, dry = false) {
  return spawnSync(
    process.execPath,
    [
      path.resolve("dist/cli/main.js"),
      "init",
      "--json",
      "--cwd",
      root,
      ...(dry ? ["--dry-run"] : []),
    ],
    { cwd: root, encoding: "utf8" },
  );
}
for (const custom of [false, true])
  test(`built init ${custom ? "custom" : "default"} dry-run/apply/replay preserves user regions`, () => {
    const root = mkdtempSync(path.join(os.tmpdir(), "suik-init-"));
    try {
      const config = custom
        ? {
            ...DEFAULT_KIT_CONFIG,
            uiDir: "app/ui",
            stylesDir: "assets/styles",
            layoutFile: "app/routes/+layout.svelte",
          }
        : DEFAULT_KIT_CONFIG;
      const paths = deriveKitPaths(config);
      write(
        root,
        "package.json",
        JSON.stringify({
          name: "consumer",
          type: "module",
          packageManager: "pnpm@11.22.0",
          dependencies: { svelte: "5.57.1", "@sveltejs/kit": "2.70.3" },
        }),
      );
      if (custom) {
        write(root, paths.stateDir + "/kit.json", JSON.stringify(config));
        write(
          root,
          "svelte.config.js",
          'export default {kit: {files: {routes: "app/routes"}}};\n',
        );
      }
      const layout =
        "<script>let {children} = $props();</script>\n<h1>USER_LAYOUT</h1>\n{@render children()}\n";
      write(root, config.layoutFile, layout);
      write(root, paths.appCss, ".application { color: rebeccapurple; }\n");
      write(root, paths.themesCss, "/* USER_THEME */\n");
      write(root, ".gitignore", "USER_IGNORE\n");
      const before = snapshotTree(root);
      const dry = run(root, true);
      assert.equal(dry.status, 0, dry.stderr + dry.stdout);
      const plan = JSON.parse(dry.stdout);
      assert.equal(plan.status, "planned");
      assert.ok(plan.changes.length > 0);
      assert.ok(
        plan.changes.every((entry: { applied: boolean }) => !entry.applied),
      );
      assert.deepEqual(snapshotTree(root), before);
      assert.equal(
        existsSync(path.join(root, paths.stateDir, "transactions")),
        false,
      );
      const applied = run(root);
      assert.equal(applied.status, 0, applied.stderr + applied.stdout);
      const outcome = JSON.parse(applied.stdout);
      assert.equal(outcome.status, "success");
      assert.deepEqual(
        outcome.changes.map((entry: { path: string; action: string }) => ({
          path: entry.path,
          action: entry.action,
        })),
        plan.changes.map((entry: { path: string; action: string }) => ({
          path: entry.path,
          action: entry.action,
        })),
      );
      assert.ok(
        outcome.changes.every((entry: { applied: boolean }) => entry.applied),
      );
      const after = snapshotTree(root);
      const changed = after
        .filter(
          (entry) =>
            entry.kind === "file" &&
            !before.some(
              (old) => JSON.stringify(old) === JSON.stringify(entry),
            ),
        )
        .map((entry) => entry.path)
        .sort();
      assert.deepEqual(
        changed,
        plan.changes.map((entry: { path: string }) => entry.path).sort(),
      );
      assert.match(
        readFileSync(path.join(root, config.layoutFile), "utf8"),
        /USER_LAYOUT/,
      );
      assert.equal(
        readFileSync(path.join(root, paths.appCss), "utf8"),
        ".application { color: rebeccapurple; }\n",
      );
      assert.equal(
        readFileSync(path.join(root, paths.themesCss), "utf8"),
        "/* USER_THEME */\n",
      );
      assert.match(
        readFileSync(path.join(root, ".gitignore"), "utf8"),
        /USER_IGNORE/,
      );
      const repeat = run(root);
      assert.equal(repeat.status, 0, repeat.stderr + repeat.stdout);
      assert.equal(JSON.parse(repeat.stdout).status, "no_change");
      assert.deepEqual(JSON.parse(repeat.stdout).changes, []);
      assert.deepEqual(snapshotTree(root), after);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

test("init rejects a symlinked generated ancestor before any write", () => {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-init-unsafe-"));
  try {
    const root = path.join(base, "app"),
      outside = path.join(base, "outside");
    mkdirSync(root);
    mkdirSync(outside);
    write(
      root,
      "package.json",
      JSON.stringify({
        name: "consumer",
        dependencies: { svelte: "5.57.1", "@sveltejs/kit": "2.70.3" },
      }),
    );
    mkdirSync(path.join(root, "src/lib"), { recursive: true });
    symlinkSync(outside, path.join(root, "src/lib/components"));
    const before = snapshotTree(base);
    for (const dry of [true, false]) {
      const result = run(root, dry);
      assert.equal(result.status, 11);
      assert.deepEqual(JSON.parse(result.stdout).changes, []);
      assert.deepEqual(snapshotTree(base), before);
    }
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

test("actual CLI initialization produces a checked production consumer", () => {
  const copy = copyConsumerFixture();
  try {
    const result = run(copy.root);
    assert.equal(result.status, 0, result.stderr + result.stdout);
    assert.equal(JSON.parse(result.stdout).status, "success");
    for (const script of ["check", "build"]) {
      const checked = runFixtureScript(copy.root, script);
      write(
        process.cwd(),
        `.artifacts/verification/codex-r10/s081-resulting-${script}.log`,
        checked.stdout + checked.stderr,
      );
      assert.equal(checked.status, 0, checked.stdout + checked.stderr);
      assert.equal(checked.signal, null);
    }
  } finally {
    copy.cleanup();
  }
});
