#!/usr/bin/env node
import { fileURLToPath } from "node:url";
import { renderCommandOutput } from "./output.js";
import { readFileSync } from "node:fs";

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
 * This entrypoint injects read-only info alongside help/version. It performs
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

interface PackageMetadata {
  readonly name: string;
  readonly version: string;
}

/**
 * Fixed product/package identity. This entrypoint is only valid when built
 * from this exact package metadata name; whitespace-normalized aliases and
 * names containing control characters are rejected by exact comparison.
 */
const EXPECTED_NAME = "svelte-ui-kit";

/**
 * [SemVer 2.0.0](https://semver.org) — the official grammar, including
 * optional prerelease and build metadata. Numeric prerelease identifiers may
 * not carry a leading zero; build identifiers may. Anchored without the
 * multiline flag, so surrounding whitespace or a trailing newline is
 * rejected. Implemented inline; no extra dependency is used.
 */
const SEMVER_RE =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+(?:[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

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

/** Read and validate the bundled package metadata, independent of cwd. */
function readPackageMetadata(intent: ArgvIntent): PackageMetadata | undefined {
  let raw: string;
  try {
    raw = readFileSync(PACKAGE_METADATA_URL, "utf8");
  } catch {
    return failMetadata(
      intent,
      "could not read the bundled package metadata next to this executable.",
      "PACKAGE_METADATA_READ",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return failMetadata(
      intent,
      "the bundled package metadata is not valid JSON.",
      "PACKAGE_METADATA_JSON",
    );
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failMetadata(
      intent,
      "the bundled package metadata is not a JSON object.",
      "PACKAGE_METADATA_SHAPE",
    );
  }

  const record = value as Record<string, unknown>;
  const name = record["name"];
  if (typeof name !== "string") {
    return failMetadata(
      intent,
      'the bundled package metadata has no string "name".',
      "PACKAGE_METADATA_NAME",
    );
  }
  if (name !== EXPECTED_NAME) {
    return failMetadata(
      intent,
      `this executable must be built from the "${EXPECTED_NAME}" package metadata.`,
      "PACKAGE_METADATA_NAME",
    );
  }

  const version = record["version"];
  if (typeof version !== "string") {
    return failMetadata(
      intent,
      'the bundled package metadata has no string "version".',
      "PACKAGE_METADATA_VERSION",
    );
  }
  if (!SEMVER_RE.test(version)) {
    return failMetadata(
      intent,
      "the bundled package metadata version is not valid SemVer 2.0.0.",
      "PACKAGE_METADATA_VERSION",
    );
  }
  return { name, version };
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

await main(process.argv.slice(2));
