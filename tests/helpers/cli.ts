import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * Real executable invocation helper for integration tests.
 *
 * Tests run the actual built CLI as a child process; stdout, stderr and the
 * exit status are captured verbatim and the process is always bounded. The
 * helper never imports the CLI module, mocks its streams or runs against a
 * caller's project.
 */
export interface CliResult {
  readonly status: number | null;
  readonly signal: NodeJS.Signals | null;
  readonly stdout: string;
  readonly stderr: string;
  /** Set when the child was killed by the timeout (ETIMEDOUT). */
  readonly timedOut: boolean;
}

export interface RunCliOptions {
  /** Package root used to resolve the built bin and as the default cwd. */
  packageRoot?: string;
  /** Explicit entrypoint override (used to prove a bounded failure). */
  entrypoint?: string;
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
}

/** Resolve the built CLI bin from the package manifest, not the cwd. */
export function resolveCliEntrypoint(
  packageRoot: string = process.cwd(),
): string {
  const manifestPath = path.join(packageRoot, "package.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as {
    bin?: Record<string, string>;
  };
  const bin = manifest.bin?.["svelte-ui-kit"];
  if (typeof bin !== "string" || bin === "") {
    throw new Error(
      `package manifest at ${manifestPath} has no "svelte-ui-kit" bin entry`,
    );
  }
  return path.resolve(packageRoot, bin);
}

export function runCli(
  args: readonly string[],
  options: RunCliOptions = {},
): CliResult {
  const packageRoot = options.packageRoot ?? process.cwd();
  const entrypoint = options.entrypoint ?? resolveCliEntrypoint(packageRoot);
  const result = spawnSync(process.execPath, [entrypoint, ...args], {
    cwd: options.cwd ?? packageRoot,
    encoding: "utf8",
    timeout: options.timeoutMs ?? 15_000,
    env: { ...process.env, ...(options.env ?? {}) },
  });
  const error = result.error as NodeJS.ErrnoException | undefined;
  return {
    status: result.status,
    signal: result.signal,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    timedOut: error?.code === "ETIMEDOUT",
  };
}
