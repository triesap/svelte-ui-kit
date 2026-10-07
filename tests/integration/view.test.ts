import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import { compoundRegistry } from "../helpers/multi-item-fixture.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

test("built view reads exact packaged metadata and source from an unrelated cwd without project state", () => {
  const base = mkdtempSync(path.join(os.tmpdir(), "suik-view-"));
  try {
    const pkg = path.join(base, "package");
    const cwd = path.join(base, "unrelated cwd");
    mkdirSync(pkg);
    mkdirSync(cwd);
    cpSync("dist", path.join(pkg, "dist"), { recursive: true });
    cpSync("package.json", path.join(pkg, "package.json"));
    symlinkSync(path.resolve("node_modules"), path.join(pkg, "node_modules"));
    const loaded = compoundRegistry(pkg);
    assert.equal(loaded.ok, true);
    if (!loaded.ok) return;
    const before = snapshotTree(cwd);
    const pkgBefore = snapshotTree(pkg);
    for (const source of [false, true]) {
      const args = [
        path.join(pkg, "dist/cli/main.js"),
        "view",
        "card",
        "--json",
        "--cwd",
        "absent",
      ];
      if (source) args.push("--source");
      const result = spawnSync(process.execPath, args, {
        cwd,
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stderr, "");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.command, "view");
      assert.equal(envelope.status, "success");
      assert.deepEqual(envelope.changes, []);
      assert.deepEqual(
        envelope.data.item,
        loaded.value.items.find((item) => item.id === "card")?.manifest,
      );
      if (source)
        for (const file of envelope.data.sources) {
          assert.equal(
            file.text,
            readFileSync(path.join(pkg, file.path), "utf8"),
          );
          assert.ok(
            loaded.value.items
              .find((item) => item.id === "card")
              ?.files.some(
                (entry) =>
                  entry.digest === file.digest &&
                  entry.logicalSource === file.path,
              ),
          );
        }
      else assert.equal(Object.hasOwn(envelope.data, "sources"), false);
      assert.equal(result.stdout.includes(base), false);
      assert.deepEqual(snapshotTree(cwd), before);
      assert.deepEqual(snapshotTree(pkg), pkgBefore);
    }
    const human = spawnSync(
      process.execPath,
      [path.join(pkg, "dist/cli/main.js"), "view", "card", "--source"],
      { cwd, encoding: "utf8" },
    );
    assert.equal(human.status, 0, human.stderr);
    assert.match(human.stdout, /compound fixture item/);
    assert.deepEqual(snapshotTree(cwd), before);
    assert.deepEqual(snapshotTree(pkg), pkgBefore);
  } finally {
    rmSync(base, { recursive: true, force: true });
  }
});

for (const [args, code, status] of [
  [["view", "unknown", "--json"], "REGISTRY_ITEM_UNKNOWN", 12],
  [["view", "unknown", "--json", "--dry-run"], "CLI_USAGE_ERROR", 2],
  [["view", "--json"], "CLI_USAGE_ERROR", 2],
] as const)
  test(`view refuses ${args.join(" ")} once without writes`, () => {
    const cwd = mkdtempSync(path.join(os.tmpdir(), "suik-view-refuse-"));
    try {
      const before = snapshotTree(cwd);
      const result = spawnSync(
        process.execPath,
        [path.resolve("dist/cli/main.js"), ...args],
        { cwd, encoding: "utf8" },
      );
      assert.equal(result.status, status, result.stderr);
      assert.equal(result.stderr, "");
      const envelope = JSON.parse(result.stdout);
      assert.equal(envelope.status, "error");
      assert.equal(envelope.diagnostics[0].code, code);
      assert.deepEqual(envelope.changes, []);
      assert.deepEqual(snapshotTree(cwd), before);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
