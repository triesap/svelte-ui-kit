import assert from "node:assert/strict";
import { test } from "node:test";
import {
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { installIndependentCli } from "../helpers/packaged-cli.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";

test("installed schemas fail closed when missing, corrupt or behind substituted ancestry", () => {
  const cli = installIndependentCli();
  let passed = false;
  try {
    const copied = cli.clone("schema-controls");
    const app = path.join(cli.root, "read-only-application");
    mkdirSync(app);
    writeFileSync(path.join(app, ".operator-note"), "preserve");
    const before = snapshotTree(app);
    const schemaDir = path.join(copied, "assets/schemas");
    const files = readdirSync(schemaDir).sort();
    assert.equal(files.length, 10);
    const run = (expected: number) => {
      const result = cli.run(["view", "button", "--source"], app, copied);
      assert.equal(result.status, expected, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      assert.deepEqual(result.guardEvents, []);
      assert.deepEqual(snapshotTree(app), before);
      return JSON.parse(result.stdout);
    };
    run(0);
    for (const file of files) {
      const target = path.join(schemaDir, file);
      const bytes = readFileSync(target);
      rmSync(target);
      assert.ok(
        run(12).diagnostics.some(
          (row: { code: string }) => row.code === "ASSET_MISSING",
        ),
      );
      writeFileSync(target, "{ invalid schema JSON");
      assert.ok(
        run(12).diagnostics.some((row: { code: string }) =>
          row.code.startsWith("SCHEMA_"),
        ),
      );
      writeFileSync(target, bytes);
    }
    run(0);
    const original = path.join(copied, "assets");
    const moved = path.join(cli.root, "owned-substituted-assets");
    renameSync(original, moved);
    symlinkSync(moved, original);
    assert.ok(
      run(12).diagnostics.some((row: { code: string }) =>
        row.code.startsWith("ASSET_"),
      ),
    );
    rmSync(original);
    renameSync(moved, original);
    run(0);
    passed = true;
  } finally {
    if (passed) cli.cleanup();
  }
});
