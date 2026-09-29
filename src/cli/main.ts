#!/usr/bin/env node
import { readFileSync } from "node:fs";

/**
 * Bootstrap `svelte-ui-kit` CLI.
 *
 * This entrypoint deliberately implements only help and version output. It
 * performs no project inspection, network access or filesystem writes, and it
 * exposes no consumer import surface. Product commands are added by later
 * checkpoints (S022–S023 freeze the command envelope).
 */

/** Package metadata is read next to the built module, never from the cwd. */
const PACKAGE_METADATA_URL = new URL("../../package.json", import.meta.url);

const HELP_TEXT = `svelte-ui-kit — bootstrap CLI

Usage:
  svelte-ui-kit --help, -h     Show this help text.
  svelte-ui-kit --version, -V  Print the package name and version.

This is a bootstrap build. Component install/inspect/update commands are not
implemented yet, and no project inspection, network access or writes are
performed.
`;

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

function failMetadata(message: string): undefined {
  process.stderr.write(`svelte-ui-kit: ${message}\n`);
  process.exitCode = 1;
  return undefined;
}

/** Read and validate the bundled package metadata, independent of cwd. */
function readPackageMetadata(): PackageMetadata | undefined {
  let raw: string;
  try {
    raw = readFileSync(PACKAGE_METADATA_URL, "utf8");
  } catch {
    return failMetadata(
      "could not read the bundled package metadata next to this executable.",
    );
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return failMetadata("the bundled package metadata is not valid JSON.");
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return failMetadata("the bundled package metadata is not a JSON object.");
  }

  const record = value as Record<string, unknown>;
  const name = record["name"];
  if (typeof name !== "string") {
    return failMetadata('the bundled package metadata has no string "name".');
  }
  if (name !== EXPECTED_NAME) {
    return failMetadata(
      `this executable must be built from the "${EXPECTED_NAME}" package metadata.`,
    );
  }

  const version = record["version"];
  if (typeof version !== "string") {
    return failMetadata(
      'the bundled package metadata has no string "version".',
    );
  }
  if (!SEMVER_RE.test(version)) {
    return failMetadata(
      "the bundled package metadata version is not valid SemVer 2.0.0.",
    );
  }
  return { name, version };
}

function usageDiagnostic(argv: readonly string[]): string {
  const rendered = argv.map((arg) => JSON.stringify(arg)).join(" ");
  return [
    `svelte-ui-kit: unsupported argument list: ${rendered}`,
    "Usage: svelte-ui-kit --help, -h or svelte-ui-kit --version, -V.",
    "Only help and version are implemented in this bootstrap; other flags and",
    "commands (including --json and --cwd) are not yet supported.",
    "",
  ].join("\n");
}

function main(argv: readonly string[]): void {
  const metadata = readPackageMetadata();
  if (metadata === undefined) return;

  const first = argv[0];
  if (first === undefined) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  if (argv.length === 1 && (first === "--help" || first === "-h")) {
    process.stdout.write(HELP_TEXT);
    return;
  }
  if (argv.length === 1 && (first === "--version" || first === "-V")) {
    process.stdout.write(`${metadata.name} ${metadata.version}\n`);
    return;
  }

  process.stderr.write(usageDiagnostic(argv));
  process.exitCode = 2;
}

main(process.argv.slice(2));
