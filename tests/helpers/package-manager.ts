/** Already-installed linked fixtures must never provision a manager or dependencies. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
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
