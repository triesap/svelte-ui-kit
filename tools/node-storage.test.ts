import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { nodeStorageCommand } from "./node-storage.ts";

const env = {
  EXTBUILD_EXECUTABLE: "/managed/extbuild",
  EXTBUILD_MACHINE_CONFIG: "/managed/node.toml",
  EXTBUILD_PROJECT_ROOT: "/source/owner",
};

test("unmanaged tools retain their native execution", () => {
  assert.deepEqual(
    nodeStorageCommand("pnpm", ["install"], "/source/owner", {}),
    {
      command: "pnpm",
      args: ["install"],
      cwd: "/source/owner",
    },
  );
  assert.equal(
    nodeStorageCommand("node", ["script.ts"], "/source/owner", env).command,
    "node",
  );
});

test("source and generated consumers receive independent native routing", () => {
  const source = nodeStorageCommand(
    "pnpm",
    ["install", "--ignore-workspace"],
    "/source/owner/.fixture",
    env,
  );
  assert.deepEqual(source.args.slice(2), [
    "run",
    "--",
    "pnpm",
    "install",
    "--ignore-workspace",
  ]);
  assert.equal(source.cwd, "/source/owner/.fixture");
  const external = nodeStorageCommand(
    "pnpm",
    ["install"],
    "/managed/tmp/fixture",
    env,
  );
  assert.deepEqual(external.args.slice(2), [
    "node",
    "fixture_run",
    "--workspace",
    "/managed/tmp/fixture",
    "--",
    "pnpm",
    "install",
  ]);
  assert.equal(external.cwd, "/source/owner");
  const sibling = nodeStorageCommand(
    "pnpm",
    ["install"],
    "/source/owner-other",
    env,
  );
  assert.equal(sibling.args[3], "fixture_run");
});

test("partial managed context fails before package execution", () => {
  assert.throws(
    () =>
      nodeStorageCommand("pnpm", ["install"], "/source/owner", {
        EXTBUILD_EXECUTABLE: "relative",
      }),
    /absolute/,
  );
});

test("generated pack inherits its declared manager without changing package bytes", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "node-storage-owner-"));
  try {
    writeFileSync(
      path.join(root, "package.json"),
      JSON.stringify({ packageManager: "pnpm@12.16.1" }),
    );
    const stage = path.join(root, "package");
    mkdirSync(stage);
    writeFileSync(
      path.join(stage, "package.json"),
      JSON.stringify({ name: "fixture", version: "1.0.0" }),
    );
    const routed = nodeStorageCommand("pnpm", ["pack"], stage, env);
    assert.deepEqual(routed.args.slice(2), [
      "node",
      "fixture_run",
      "--workspace",
      root,
      "--",
      "pnpm",
      "--dir",
      stage,
      "pack",
    ]);
  } finally {
    rmSync(root, { recursive: true });
  }
});

test("lifecycle tooling clears only invocation-local placement", async () => {
  const { clearInheritedNodePlacement } = await import(
    "./node-workspace-env.ts"
  );
  const environment = {
    ...env,
    npm_config_virtual_store_dir: "/parent",
    pnpm_config_virtual_store_dir: "/parent",
    npm_config_store_dir: "/managed/store",
    npm_config_userconfig: "/private/npmrc",
  };
  clearInheritedNodePlacement(environment);
  assert.equal("npm_config_virtual_store_dir" in environment, false);
  assert.equal("pnpm_config_virtual_store_dir" in environment, false);
  assert.equal(environment.npm_config_store_dir, "/managed/store");
  assert.equal(environment.npm_config_userconfig, "/private/npmrc");
});
