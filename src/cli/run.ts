import { parseCliArgs, type CliRequest } from "./args.js";

/**
 * Pure CLI result handling.
 *
 * `runCli` maps arguments plus validated package metadata to an exit code and
 * injected output effects. It performs no filesystem access, no metadata
 * reading and no direct process writes; the Node adapter in `main.ts` owns the
 * package-relative metadata read and the real stdout/stderr/exit effects.
 */
export interface CliMetadata {
  readonly name: string;
  readonly version: string;
}

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

export const HELP_TEXT = `svelte-ui-kit — bootstrap CLI

Usage:
  svelte-ui-kit --help, -h     Show this help text.
  svelte-ui-kit --version, -V  Print the package name and version.

This is a bootstrap build. Component install/inspect/update commands are not
implemented yet, and no project inspection, network access or writes are
performed.
`;

export function formatUsageDiagnostic(argv: readonly string[]): string {
  const rendered = argv.map((arg) => JSON.stringify(arg)).join(" ");
  return [
    `svelte-ui-kit: unsupported argument list: ${rendered}`,
    "Usage: svelte-ui-kit --help, -h or svelte-ui-kit --version, -V.",
    "Only help and version are implemented in this bootstrap; other flags and",
    "commands (including --json and --cwd) are not yet supported.",
    "",
  ].join("\n");
}

/** Apply a classified request through injected output effects. */
export function applyRequest(
  request: CliRequest,
  metadata: CliMetadata,
  io: CliIo,
): number {
  if (request.kind === "help") {
    io.stdout(HELP_TEXT);
    return 0;
  }
  if (request.kind === "version") {
    io.stdout(`${metadata.name} ${metadata.version}\n`);
    return 0;
  }
  io.stderr(formatUsageDiagnostic(request.argv));
  return 2;
}

/** Parse and apply `argv` with validated metadata and injected output. */
export function runCli(
  argv: readonly string[],
  metadata: CliMetadata,
  io: CliIo,
): number {
  return applyRequest(parseCliArgs(argv), metadata, io);
}
