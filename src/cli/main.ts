#!/usr/bin/env node
import { readFileSync } from "node:fs";

import { parseCliArgs } from "./args.js";
import { HELP_TEXT, formatUsageDiagnostic } from "./run.js";

/**
 * Node adapter for the bootstrap `svelte-ui-kit` CLI.
 *
 * The adapter owns the only side effects: it reads and validates the bundled
 * package metadata next to the built module and applies the classified request
 * to the real stdout/stderr/exit. Argument classification and result handling
 * live in the pure `./args.js` and `./run.js` modules, which perform no I/O.
 *
 * This entrypoint deliberately implements only help and version output. It
 * performs no project inspection, network access or filesystem writes, and it
 * exposes no consumer import surface. Product commands are added by later
 * checkpoints (S022–S023 freeze the command envelope).
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

function main(argv: readonly string[]): void {
  const metadata = readPackageMetadata();
  if (metadata === undefined) return;

  const request = parseCliArgs(argv);
  if (request.kind === "help") {
    process.stdout.write(HELP_TEXT);
    return;
  }
  if (request.kind === "version") {
    process.stdout.write(`${metadata.name} ${metadata.version}\n`);
    return;
  }
  process.stderr.write(formatUsageDiagnostic(request.argv));
  process.exitCode = 2;
}

main(process.argv.slice(2));
