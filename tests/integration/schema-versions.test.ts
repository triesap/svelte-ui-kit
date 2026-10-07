import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { cliPackage, write } from "../helpers/cli-package.js";
import { snapshotTree } from "../helpers/tree-snapshot.js";
import {
  DEFAULT_KIT_CONFIG,
  deriveKitPaths,
} from "../../src/project/config.js";

for (const kind of ["config", "lock"] as const)
  for (const schemaVersion of [0, 2, 999, "1", "0.9.0-alpha", "5.57.1"])
    test(`${kind} unsupported schema ${schemaVersion} blocks every mutation without migration`, () => {
      const fixture = cliPackage();
      try {
        assert.equal(fixture.run(["add", "card"]).status, 0);
        const paths = deriveKitPaths(DEFAULT_KIT_CONFIG);
        const logical =
          paths.stateDir + (kind === "config" ? "/kit.json" : "/kit.lock.json");
        const value = JSON.parse(
          readFileSync(path.join(fixture.root, logical), "utf8"),
        );
        value.schemaVersion = schemaVersion;
        write(fixture.root, logical, JSON.stringify(value));
        const before = snapshotTree(fixture.root);
        for (const args of [
          ["init"],
          ["add", "button"],
          ["sync"],
          ["init", "--dry-run"],
          ["sync", "--dry-run"],
        ]) {
          const result = fixture.run(args);
          assert.notEqual(result.status, 0, result.stdout);
          const envelope = JSON.parse(result.stdout);
          assert.ok(
            envelope.diagnostics.some(
              (entry: { message: string }) =>
                entry.message.includes("Unsupported") &&
                entry.message.includes("migration"),
            ),
            result.stdout,
          );
          assert.deepEqual(snapshotTree(fixture.root), before);
        }
      } finally {
        fixture.cleanup();
      }
    });

for (const legacy of [
  {
    schemaVersion: "0.9.0-alpha",
    frameworkVersion: "0.9.0-alpha",
    uiDir: "src/components/ui",
  },
  {
    $schema: "https://ui.shadcn.com/schema.json",
    style: "new-york",
    rsc: false,
    tsx: true,
    tailwind: {},
    aliases: { ui: "$lib/ui" },
  },
  { ...DEFAULT_KIT_CONFIG, leptos: true },
])
  test("source-only legacy configuration is never normalized or adopted", () => {
    const fixture = cliPackage();
    try {
      const paths = deriveKitPaths(DEFAULT_KIT_CONFIG);
      write(fixture.root, paths.stateDir + "/kit.json", JSON.stringify(legacy));
      const before = snapshotTree(fixture.root);
      for (const args of [["info"], ["init"], ["add", "card"], ["sync"]]) {
        const result = fixture.run(args);
        assert.notEqual(result.status, 0);
        assert.deepEqual(snapshotTree(fixture.root), before);
      }
    } finally {
      fixture.cleanup();
    }
  });

test("independent package/framework versions do not migrate current installed state", () => {
  const fixture = cliPackage();
  try {
    assert.equal(fixture.run(["add", "card"]).status, 0);
    const paths = deriveKitPaths(DEFAULT_KIT_CONFIG);
    const configPath = paths.stateDir + "/kit.json";
    const lockPath = paths.stateDir + "/kit.lock.json";
    const config = JSON.parse(
      readFileSync(path.join(fixture.root, configPath), "utf8"),
    );
    const lock = JSON.parse(
      readFileSync(path.join(fixture.root, lockPath), "utf8"),
    );
    assert.equal(config.schemaVersion, 1);
    assert.equal(lock.schemaVersion, 1);
    const manifest = JSON.parse(
      readFileSync(path.join(fixture.root, "package.json"), "utf8"),
    );
    manifest.version = "9.9.9";
    manifest.dependencies.svelte = "5.58.0";
    write(fixture.root, "package.json", JSON.stringify(manifest));
    write(
      fixture.root,
      "node_modules/svelte/package.json",
      JSON.stringify({ name: "svelte", version: "5.58.0" }),
    );
    const before = snapshotTree(fixture.root);
    for (const args of [["info"], ["sync"], ["init"]]) {
      const result = fixture.run(args);
      assert.equal(result.status, 0, result.stdout);
      assert.deepEqual(snapshotTree(fixture.root), before);
    }
    assert.deepEqual(
      JSON.parse(readFileSync(path.join(fixture.root, lockPath), "utf8")),
      lock,
    );
  } finally {
    fixture.cleanup();
  }
});
