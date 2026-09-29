import { spawnSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  symlinkSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Consumer-fixture copy and script helper for the component compatibility
 * suite. Copies are owned by the caller, never touch the maintained fixture,
 * and resolve the pinned tools through a node_modules symlink.
 */
export const CONSUMER_FIXTURE_REL = "tests/fixtures/consumer";

const COPY_EXCLUDES = new Set([
  "node_modules",
  ".svelte-kit",
  "build",
  "dist",
  "coverage",
]);

export function consumerFixtureRoot(
  packageRoot: string = process.cwd(),
): string {
  return path.join(packageRoot, CONSUMER_FIXTURE_REL);
}

export interface FixtureCopy {
  readonly root: string;
  cleanup(): void;
}

export interface CopyFixtureOptions {
  packageRoot?: string;
  parent?: string;
}

/**
 * Link the fixture's installed packages into an owned copy.
 *
 * A direct `node_modules` directory symlink breaks pnpm's bin shims in the
 * copy, because the shims resolve their package target relative to their own
 * invoked path. Linking each package and bin script individually keeps the
 * copy's package resolution and the shims' real path correct.
 */
function linkFixtureNodeModules(
  fixtureNodeModules: string,
  targetNodeModules: string,
): void {
  mkdirSync(targetNodeModules, { recursive: true });
  for (const entry of readdirSync(fixtureNodeModules)) {
    if (entry === ".bin") continue;
    symlinkSync(
      path.join(fixtureNodeModules, entry),
      path.join(targetNodeModules, entry),
    );
  }
  const binDir = path.join(targetNodeModules, ".bin");
  mkdirSync(binDir, { recursive: true });
  for (const bin of readdirSync(path.join(fixtureNodeModules, ".bin"))) {
    symlinkSync(
      path.join(fixtureNodeModules, ".bin", bin),
      path.join(binDir, bin),
    );
  }
}

/** Copy the maintained fixture into an owned directory; caller cleans up. */
export function copyConsumerFixture(
  options: CopyFixtureOptions = {},
): FixtureCopy {
  const packageRoot = options.packageRoot ?? process.cwd();
  const fixture = consumerFixtureRoot(packageRoot);
  const parent = options.parent ?? os.tmpdir();
  mkdirSync(parent, { recursive: true });
  const base = mkdtempSync(path.join(parent, "suik-components-"));
  const cleanup = () => rmSync(base, { recursive: true, force: true });
  try {
    const root = path.join(base, "consumer");
    cpSync(fixture, root, {
      recursive: true,
      filter: (source) => !COPY_EXCLUDES.has(path.basename(source)),
    });
    linkFixtureNodeModules(
      path.join(fixture, "node_modules"),
      path.join(root, "node_modules"),
    );
    return { root, cleanup };
  } catch (error) {
    cleanup();
    throw error;
  }
}

export interface ScriptResult {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
}

/** Run a fixture-managed pnpm script in an owned copy or the maintained root. */
export function runFixtureScript(
  root: string,
  script: string,
  timeoutMs = 180_000,
): ScriptResult {
  const execPath = process.env["npm_execpath"];
  const viaNode =
    typeof execPath === "string" &&
    existsSync(execPath) &&
    /\.[cm]?js$/.test(execPath);
  const command = viaNode ? process.execPath : "pnpm";
  const args = viaNode ? [execPath, "run", script] : ["run", script];
  const env = { ...process.env };
  delete env["NODE_TEST_CONTEXT"];
  env["npm_config_verify_deps_before_run"] = "false";
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    encoding: "utf8",
    timeout: timeoutMs,
  });
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}
