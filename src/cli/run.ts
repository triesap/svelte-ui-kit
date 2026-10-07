import { renderCommandOutput } from "./output.js";
import {
  parseCliArgs,
  type CliRequest,
  type CommandRequest,
  type ProductCommand,
} from "./args.js";
import {
  createEnvelope,
  exitCodeFor,
  type CommandEnvelope,
  type FailureClass,
} from "./protocol.js";

/**
 * Pure CLI result handling.
 *
 * `runCli` maps arguments plus validated package metadata to an exit code and
 * injected output effects. It performs no filesystem access, no metadata
 * reading and no direct process writes; the Node adapter in `main.ts` owns the
 * package-relative metadata read and the real stdout/stderr/exit effects.
 *
 * Help/version are built in; the adapter injects implemented use cases. Other
 * approved product commands
 * (`info`/`init`/`view`/`add`/`sync`/`doctor`) return an honest `unsupported`
 * outcome: a single JSON envelope in `--json` mode, or a human diagnostic on
 * stderr otherwise. They never fabricate a successful plan or write.
 */
export interface CliMetadata {
  readonly name: string;
  readonly version: string;
}

export type CommandHandlers = Partial<
  Record<
    ProductCommand,
    (request: CommandRequest) => {
      readonly envelope: CommandEnvelope;
      readonly failureClass?: FailureClass;
    }
  >
>;

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

export const HELP_TEXT = `svelte-ui-kit — source-first UI kit generator

Usage:
  svelte-ui-kit [--json] [--cwd <path>] <command> [options] [item]

Commands:
  info                 Inspect the project, paths and registry readiness.
  init                 Plan or apply kit configuration and integration.
  view <item>          Show bundled item metadata (--source for source).
  add <item>           Add one explicit item request (--dry-run to plan).
  sync                 Reconcile the project with the packaged registry.
  doctor               Report installation consistency (--strict to fail CI).

Global options:
  --json               Emit exactly one structured result envelope.
  --cwd <path>         Select the application package explicitly.
  --help, -h           Show this help text.
  --version, -V        Print the package name and version.

Unavailable commands return an unsupported result without changing project files.
`;

export function formatUsageDiagnostic(
  message: string,
  argv: readonly string[],
): string {
  const rendered = argv.map((arg) => JSON.stringify(arg)).join(" ");
  return [
    `svelte-ui-kit: ${message}`,
    `Argument list: ${rendered}`,
    "Usage: svelte-ui-kit [--json] [--cwd <path>] <command> [options] [item].",
    "Run svelte-ui-kit --help for the command list.",
    "",
  ].join("\n");
}

export function formatUnsupportedDiagnostic(command: string): string {
  return [
    `svelte-ui-kit: the "${command}" command is not implemented yet.`,
    "No project files were changed. See svelte-ui-kit --help for the surface.",
    "",
  ].join("\n");
}

/** Apply a classified request through injected output effects. */
export function applyRequest(
  request: CliRequest,
  metadata: CliMetadata,
  io: CliIo,
  handlers: CommandHandlers = {},
): number {
  if (request.kind === "help") {
    io.stdout(
      request.json
        ? renderCommandOutput(
            createEnvelope({
              command: "help",
              status: "success",
              data: HELP_TEXT,
            }),
            true,
          ).stdout
        : HELP_TEXT,
    );
    return 0;
  }
  if (request.kind === "version") {
    io.stdout(`${metadata.name} ${metadata.version}\n`);
    return 0;
  }
  if (request.kind === "usage-error") {
    if (request.json) {
      io.stdout(
        renderCommandOutput(
          createEnvelope({
            command: request.command,
            status: "error",
            diagnostics: [
              {
                code: "CLI_USAGE_ERROR",
                level: "error",
                message: request.message,
                guidance:
                  "run svelte-ui-kit --help for the approved command surface",
              },
            ],
          }),
          true,
        ).stdout,
      );
    } else {
      io.stderr(formatUsageDiagnostic(request.message, request.argv));
    }
    return exitCodeFor("error", "usage");
  }
  const handler = handlers[request.command];
  if (handler !== undefined) {
    const result = handler(request);
    const output = renderCommandOutput(
      result.envelope,
      request.json,
      result.failureClass,
    );
    if (output.stdout !== "") io.stdout(output.stdout);
    if (output.stderr !== "") io.stderr(output.stderr);
    return output.exitCode;
  }
  // Approved but not-yet-implemented product command: honest unsupported.
  const envelope = createEnvelope({
    command: request.command,
    status: "unsupported",
    diagnostics: [
      {
        code: "COMMAND_NOT_IMPLEMENTED",
        level: "error",
        message: `the "${request.command}" command is not implemented yet`,
        guidance: "run svelte-ui-kit --help for the approved command surface",
      },
    ],
  });
  if (request.json) {
    io.stdout(renderCommandOutput(envelope, true).stdout);
  } else {
    io.stderr(formatUnsupportedDiagnostic(request.command));
  }
  return exitCodeFor("unsupported");
}

/** Parse and apply `argv` with validated metadata and injected output. */
export function runCli(
  argv: readonly string[],
  metadata: CliMetadata,
  io: CliIo,
  handlers: CommandHandlers = {},
): number {
  return applyRequest(parseCliArgs(argv), metadata, io, handlers);
}
