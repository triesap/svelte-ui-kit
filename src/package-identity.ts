import { readFileSync } from "node:fs";
export interface PackageMetadata {
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

export type PackageIdentityResult =
  | { readonly ok: true; readonly value: PackageMetadata }
  | { readonly ok: false; readonly message: string; readonly code: string };
/** Read and validate the bundled package metadata, independent of cwd. */
export function readPackageIdentity(metadataUrl: URL): PackageIdentityResult {
  let raw: string;
  try {
    raw = readFileSync(metadataUrl, "utf8");
  } catch {
    return {
      ok: false,
      message:
        "could not read the bundled package metadata next to this executable.",
      code: "PACKAGE_METADATA_READ",
    };
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return {
      ok: false,
      message: "the bundled package metadata is not valid JSON.",
      code: "PACKAGE_METADATA_JSON",
    };
  }
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {
      ok: false,
      message: "the bundled package metadata is not a JSON object.",
      code: "PACKAGE_METADATA_SHAPE",
    };
  }

  const record = value as Record<string, unknown>;
  const name = record["name"];
  if (typeof name !== "string") {
    return {
      ok: false,
      message: 'the bundled package metadata has no string "name".',
      code: "PACKAGE_METADATA_NAME",
    };
  }
  if (name !== EXPECTED_NAME) {
    return {
      ok: false,
      message: `this executable must be built from the "${EXPECTED_NAME}" package metadata.`,
      code: "PACKAGE_METADATA_NAME",
    };
  }

  const version = record["version"];
  if (typeof version !== "string") {
    return {
      ok: false,
      message: 'the bundled package metadata has no string "version".',
      code: "PACKAGE_METADATA_VERSION",
    };
  }
  if (!SEMVER_RE.test(version)) {
    return {
      ok: false,
      message:
        "the bundled package metadata version is not valid SemVer 2.0.0.",
      code: "PACKAGE_METADATA_VERSION",
    };
  }
  return { ok: true, value: { name, version } };
}
