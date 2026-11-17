/** Explicit bootstrap and pinned-manager verification for test-owned consumers. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
const sha256Hex = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
export function linkedFixtureEnvironment(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    pnpm_config_verify_deps_before_run: "false",
    pnpm_config_pm_on_fail: "ignore",
  };
  delete env.NODE_TEST_CONTEXT;
  return env;
}
export function verifyFixtureManager(
  command: string,
  args: readonly string[],
  root: string,
  env: NodeJS.ProcessEnv,
): void {
  const expected = JSON.parse(
    readFileSync(path.resolve("package.json"), "utf8"),
  ).packageManager;
  assert.match(expected, /^pnpm@\d+\.\d+\.\d+$/);
  const actual = spawnSync(command, [...args, "--version"], {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: 30000,
  });
  assert.equal(actual.error, undefined);
  assert.equal(actual.signal, null);
  assert.equal(actual.status, 0, actual.stdout + actual.stderr);
  assert.equal(
    actual.stdout.trim(),
    expected.slice(5),
    "linked fixture uses the actual owner-pinned pnpm, without implicit manager provisioning",
  );
}

/** Linked fixtures never call this: dependency preparation is an explicit operator step. */
export function prepareOfflineInstall(
  root: string,
  run: (args: string[], stage: string) => unknown,
  label: string,
) {
  run(
    [
      "install",
      "--lockfile-only",
      "--no-frozen-lockfile",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ],
    `${label}-resolve-lock`,
  );
  const manifest = readFileSync(path.join(root, "package.json"));
  const lock = readFileSync(path.join(root, "pnpm-lock.yaml"));
  run(["fetch"], `${label}-fetch`);
  assert.ok(readFileSync(path.join(root, "pnpm-lock.yaml")).equals(lock));
  run(
    [
      "install",
      "--offline",
      "--frozen-lockfile",
      "--ignore-scripts",
      "--strict-peer-dependencies",
      "--engine-strict",
    ],
    label,
  );
  assert.ok(readFileSync(path.join(root, "package.json")).equals(manifest));
  assert.ok(readFileSync(path.join(root, "pnpm-lock.yaml")).equals(lock));
  return {
    label: `${label}-frozen-inputs`,
    manifestSha256: sha256Hex(manifest),
    lockSha256: sha256Hex(lock),
  };
}
