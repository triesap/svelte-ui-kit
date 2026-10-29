/** Strict generated-host children retain attributable process diagnostics. */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import path from "node:path";

export class GeneratedCommandFailure extends Error {
  constructor(readonly diagnostic: string) {
    super(`Generated CLI failed; process evidence: ${diagnostic}`);
  }
}

export function runGeneratedCommand(
  root: string,
  entrypoint: string,
  args: readonly string[],
  options: {
    readonly timeoutMs?: number;
    readonly diagnosticDir?: string;
  } = {},
): void {
  const deadline = options.timeoutMs ?? 30000;
  assert.ok(
    Number.isSafeInteger(deadline) && deadline > 0 && deadline <= 30000,
    "bounded generated CLI deadline",
  );
  const argv = [entrypoint, ...args, "--json", "--cwd", root];
  const result = spawnSync(process.execPath, argv, {
    cwd: root,
    encoding: "utf8",
    timeout: deadline,
    killSignal: "SIGKILL",
  });
  if (
    !result.error &&
    result.signal === null &&
    result.status === 0 &&
    result.stderr === ""
  )
    return;
  const directory =
    options.diagnosticDir ?? ".artifacts/verification/generated-consumer";
  mkdirSync(directory, { recursive: true });
  const diagnostic = path.join(
    mkdtempSync(path.join(directory, "cli-failure-")),
    "process.json",
  );
  const error = result.error as NodeJS.ErrnoException | undefined;
  writeFileSync(
    diagnostic,
    `${JSON.stringify(
      {
        executable: process.execPath,
        node: process.versions.node,
        argv,
        cwd: root,
        pid: result.pid,
        deadlineMs: deadline,
        killSignal: "SIGKILL",
        status: result.status,
        signal: result.signal,
        error: error
          ? {
              name: error.name,
              code: error.code ?? null,
              message: error.message,
            }
          : null,
        stdout: result.stdout,
        stderr: result.stderr,
      },
      null,
      2,
    )}\n`,
  );
  throw new GeneratedCommandFailure(diagnostic);
}
