#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import {
  readPackageIdentity,
  type PackageMetadata,
} from "../package-identity.js";
import { renderCommandOutput } from "./output.js";

import { classifyArgvIntent, parseCliArgs, type ArgvIntent } from "./args.js";
import { createEnvelope } from "./protocol.js";
import { runCli } from "./run.js";

/**
 * Node adapter for the bootstrap `svelte-ui-kit` CLI.
 *
 * The adapter owns the only side effects: it reads and validates the bundled
 * package metadata next to the built module, then routes the classified
 * request through the shared `runCli` executor with real stdout/stderr/exit
 * effects. Argument classification and result handling live in the pure
 * `./args.js` and `./run.js` modules, which perform no I/O; the adapter does
 * not duplicate their dispatch.
 *
 * This entrypoint lazily loads the approved command handlers. It performs
 * no network access or package installation, and it
 * exposes no consumer import surface. Product commands are added by later
 * checkpoints (S022–S023 freeze the command envelope).
 *
 * When `--json` was requested, a controlled metadata failure still emits
 * exactly one deterministic JSON envelope instead of leaving stdout empty; the
 * human path is unchanged.
 */

/** Package metadata is read next to the built module, never from the cwd. */
const PACKAGE_METADATA_URL = new URL("../../package.json", import.meta.url);

/**
 * Emit one deterministic adapter-metadata failure. JSON intent and command
 * attribution come from the shared lexical classification, so `--json info`
 * reports `info` rather than `help`.
 */
function failMetadata(
  intent: ArgvIntent,
  message: string,
  code: string,
): undefined {
  if (intent.json) {
    process.stdout.write(
      renderCommandOutput(
        createEnvelope({
          command: intent.command,
          status: "error",
          diagnostics: [
            {
              code,
              level: "error",
              message,
              guidance:
                "run svelte-ui-kit --help for the approved command surface",
            },
          ],
        }),
        true,
      ).stdout,
    );
  } else {
    process.stderr.write(`svelte-ui-kit: ${message}\n`);
  }
  process.exitCode = 1;
  return undefined;
}

/** Read the exact metadata for this built entrypoint; never consult cwd. */
function readPackageMetadata(intent: ArgvIntent): PackageMetadata | undefined {
  const identity = readPackageIdentity(PACKAGE_METADATA_URL);
  return identity.ok
    ? identity.value
    : failMetadata(intent, identity.message, identity.code);
}

async function main(argv: readonly string[]): Promise<void> {
  const intent = classifyArgvIntent(argv);
  const metadata = readPackageMetadata(intent);
  if (metadata === undefined) return;

  const request = parseCliArgs(argv);
  const info =
    request.kind === "command" && request.command === "info"
      ? (await import("./commands/info.js")).inspectInfo
      : undefined;

  const view =
    request.kind === "command" && request.command === "view"
      ? (await import("./commands/view.js")).inspectView
      : undefined;

  const init =
    request.kind === "command" && request.command === "init"
      ? (await import("./commands/init.js")).initialize
      : undefined;

  const add =
    request.kind === "command" && request.command === "add"
      ? (await import("./commands/add.js")).addItem
      : undefined;

  const sync =
    request.kind === "command" && request.command === "sync"
      ? (await import("./commands/sync.js")).synchronize
      : undefined;

  const doctor =
    request.kind === "command" && request.command === "doctor"
      ? (await import("./commands/doctor.js")).diagnose
      : undefined;

  // The adapter keeps metadata validation and the real process effects; the
  // shared executor performs the actual classified dispatch.
  process.exitCode = runCli(
    argv,
    metadata,
    {
      stdout: (text) => process.stdout.write(text),
      stderr: (text) => process.stderr.write(text),
    },
    {
      ...(doctor === undefined
        ? {}
        : {
            doctor: (request) =>
              doctor(
                request,
                fileURLToPath(new URL("../../", import.meta.url)),
              ),
          }),
      ...(sync === undefined
        ? {}
        : {
            sync: (request) =>
              sync(request, fileURLToPath(new URL("../../", import.meta.url))),
          }),
      ...(add === undefined
        ? {}
        : {
            add: (request) =>
              add(request, fileURLToPath(new URL("../../", import.meta.url))),
          }),
      ...(init === undefined
        ? {}
        : {
            init: (request) =>
              init(request, fileURLToPath(new URL("../../", import.meta.url))),
          }),
      ...(info === undefined
        ? {}
        : {
            info: (request) =>
              info(request, fileURLToPath(new URL("../../", import.meta.url))),
          }),
      ...(view === undefined
        ? {}
        : {
            view: (request) =>
              view(request, fileURLToPath(new URL("../../", import.meta.url))),
          }),
    },
  );
}

try {
  await main(process.argv.slice(2));
} catch {
  const intent = classifyArgvIntent(process.argv.slice(2));
  const output = renderCommandOutput(
    createEnvelope({
      command: intent.command,
      status: "error",
      diagnostics: [
        {
          code: "CLI_EXECUTION_FAILED",
          level: "error",
          message: "The command could not load or complete.",
          guidance:
            "Verify this CLI installation and project permissions before retrying.",
        },
      ],
    }),
    intent.json,
  );
  if (output.stdout !== "") process.stdout.write(output.stdout);
  if (output.stderr !== "") process.stderr.write(output.stderr);
  process.exitCode = output.exitCode;
}
