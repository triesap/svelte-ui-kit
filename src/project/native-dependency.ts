/** Qualified native artifact identity; no package code is executed or installed. */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import baseline from "./native-dependency-baseline.json" with { type: "json" };
import svelteBaseline from "./svelte-runtime-baseline.json" with { type: "json" };
import { isSafeLogicalRelativePath } from "./paths.js";
import type { ModelIssue } from "../registry/errors.js";
import { issue } from "../registry/errors.js";
import { validateWithSchema } from "../registry/schema.js";
import { verifyNativeInventory } from "./native-inventory.js";

export const NATIVE_BASELINE = Object.freeze(baseline);
export const SVELTE_RUNTIME_BASELINE = Object.freeze(svelteBaseline);
/** Only independently qualified profiles can select authentication policy. */
export type QualifiedNativeName = "bits-ui" | "svelte";
export function isQualifiedNativeName(
  name: string,
): name is QualifiedNativeName {
  return name === "bits-ui" || name === "svelte";
}
export function qualifiedNativeBaseline(name: QualifiedNativeName) {
  if (name === "bits-ui") return NATIVE_BASELINE;
  if (name === "svelte") return SVELTE_RUNTIME_BASELINE;
  throw new Error("Unknown qualified native profile");
}
function label(name: QualifiedNativeName): string {
  return name === "bits-ui" ? "Bits" : "Svelte";
}
/** Positive installed evidence is distinct from an absent list of problems. */
export type NativeInstallAuthentication =
  | {
      readonly kind: "authenticated";
      readonly version: string;
      readonly provenanceSha256: string;
    }
  | { readonly kind: "invalid"; readonly issues: readonly ModelIssue[] };
export type NativeFileObservation =
  | { readonly kind: "absent" }
  | { readonly kind: "invalid"; readonly issues: readonly ModelIssue[] }
  | {
      readonly kind: "value";
      readonly declaration: string;
      readonly path: string;
      readonly version: string;
      readonly digest: string;
      readonly mode: number;
    };

/** Require the canonical raw identity and explicit positive captured proof. */
export function nativeInstallIssues(
  version: unknown,
  authentication: NativeInstallAuthentication | undefined,
  manifestVersion: unknown = version,
  name: QualifiedNativeName = "bits-ui",
): readonly ModelIssue[] {
  const profile = qualifiedNativeBaseline(name);
  if (version !== profile.version || manifestVersion !== profile.version) {
    return [
      issue(
        "NATIVE_INSTALL_VERSION",
        `Installed ${label(name)} must use the exact qualified version ${profile.version}; equivalent v-prefixed or build-metadata spellings are not qualified. Reinstall the authenticated application-owned archive explicitly.`,
        "package.json",
      ),
    ];
  }
  if (authentication?.kind === "invalid" && authentication.issues.length > 0)
    return authentication.issues;
  if (
    authentication?.kind !== "authenticated" ||
    authentication.version !== profile.version ||
    authentication.provenanceSha256 !== profile.provenanceSha256
  ) {
    return [
      issue(
        "NATIVE_INSTALL_UNAUTHENTICATED",
        `Installed ${label(name)} has no positive qualified distribution proof. Capture and authenticate the actual installation before planning.`,
        "package.json",
      ),
    ];
  }
  return [];
}

/** Require positive selected-application source evidence, never an inferred range. */
export function nativeArchiveIssues(
  declaration: string | null,
  source: NativeFileObservation | undefined,
  name: QualifiedNativeName = "bits-ui",
): readonly ModelIssue[] {
  const profile = qualifiedNativeBaseline(name);
  if (source?.kind === "invalid" && source.issues.length > 0)
    return source.issues;
  if (
    declaration === null ||
    !declaration.startsWith("file:") ||
    source?.kind !== "value" ||
    source.declaration !== declaration ||
    source.version !== profile.version ||
    source.digest !== profile.archiveSha256
  ) {
    return [
      issue(
        "NATIVE_ARCHIVE_REQUIRED",
        `The qualified local ${label(name)} build requires an explicit authenticated application-owned file declaration. Copy and verify the bundled archive, then install it explicitly.`,
        "package.json",
      ),
    ];
  }
  return [];
}

/** Capture installed proof only after raw version and complete inventory verification. */
export function observeNativeInstall(
  packageRoot: string,
  version: unknown,
  name: QualifiedNativeName = "bits-ui",
): NativeInstallAuthentication {
  const profile = qualifiedNativeBaseline(name);
  if (version !== profile.version)
    return {
      kind: "invalid",
      issues: nativeInstallIssues(version, undefined, version, name),
    };
  const issues = authenticateNativeInstall(packageRoot, name);
  return issues.length > 0
    ? { kind: "invalid", issues }
    : {
        kind: "authenticated",
        version: profile.version,
        provenanceSha256: profile.provenanceSha256,
      };
}

/** Same declaration-field precedence as ordinary dependency inspection. */
export function nativeDeclaration(
  manifest: Record<string, unknown> | null,
  name: QualifiedNativeName = "bits-ui",
): string | null {
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const record = manifest?.[field];
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record) ||
      !Object.hasOwn(record, name)
    )
      continue;
    const value = (record as Record<string, unknown>)[name];
    return typeof value === "string" ? value : null;
  }
  return null;
}

function digest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** A local dependency's ancestry must remain inside the selected app and real. */
function regularInside(
  root: string,
  logical: string,
): { bytes: Buffer; mode: number } {
  if (!isSafeLogicalRelativePath(logical))
    throw new Error("unsafe logical path");
  const segments = logical.split("/");
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const stats = lstatSync(current);
    if (
      stats.isSymbolicLink() ||
      (index === segments.length - 1 ? !stats.isFile() : !stats.isDirectory())
    )
      throw new Error("unsafe physical path");
  }
  const stats = lstatSync(current);
  return { bytes: readFileSync(current), mode: stats.mode & 0o777 };
}

/**
 * Authenticate an explicit app-owned file declaration. No other file/git/link
 * operand is inferred into a SemVer range. A valid archive can still need an
 * install; installation and the declaration are separate evidence.
 */
export function observeNativeFile(
  root: string,
  manifest: Record<string, unknown> | null,
  name: QualifiedNativeName = "bits-ui",
): NativeFileObservation {
  const profile = qualifiedNativeBaseline(name);
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const record = manifest?.[field];
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record) ||
      !Object.hasOwn(record, name)
    )
      continue;
    const declaration = (record as Record<string, unknown>)[name];
    if (typeof declaration !== "string" || !declaration.startsWith("file:"))
      return { kind: "absent" };
    const logical = declaration.slice(5).replace(/^\.\//, "");
    try {
      if (!logical.endsWith(".tgz")) throw new Error("archive suffix");
      const file = regularInside(root, logical);
      if (digest(file.bytes) !== profile.archiveSha256)
        throw new Error("unqualified archive digest");
      return {
        kind: "value",
        declaration,
        path: logical,
        version: profile.version,
        digest: profile.archiveSha256,
        mode: file.mode,
      };
    } catch {
      return {
        kind: "invalid",
        issues: [
          issue(
            "NATIVE_ARCHIVE_INVALID",
            `The declared ${label(name)} file must be the qualified archive in an application-owned regular file with safe ancestry. Copy it from the locally packed CLI, verify its digest, and install it explicitly.`,
            "package.json",
          ),
        ],
      };
    }
  }
  return { kind: "absent" };
}

/**
 * Verify the actual installed distribution, including authentic provenance and
 * every packed file. The package root may be a legitimate pnpm/hoisted link;
 * internal links and extra/missing distribution entries are refused.
 */
export function authenticateNativeInstall(
  packageRoot: string,
  name: QualifiedNativeName = "bits-ui",
): readonly ModelIssue[] {
  const profile = qualifiedNativeBaseline(name);
  try {
    const provenance = regularInside(packageRoot, "NATIVE_PROVENANCE.json");
    if (digest(provenance.bytes) !== profile.provenanceSha256)
      throw new Error("provenance digest");
    const data = JSON.parse(provenance.bytes.toString("utf8")) as {
      schemaVersion: number;
      name: string;
      version: string;
      buildId?: string;
      corrected?: boolean;
      mode?: string;
      distributionFiles: { path: string; sha256: string }[];
    };
    const parsed = validateWithSchema(
      name === "bits-ui"
        ? "native-provenance.schema.json"
        : "svelte-runtime-provenance.schema.json",
      data,
      "package.json",
    );
    if (!parsed.ok) return parsed.issues;
    if (
      data.schemaVersion !== 1 ||
      data.name !== name ||
      data.version !== profile.version ||
      (name === "svelte" &&
        (data.buildId !== SVELTE_RUNTIME_BASELINE.buildId ||
          data.corrected !== true ||
          data.mode !== "complete"))
    )
      throw new Error("native identity");
    const expected = new Map([
      ["NATIVE_PROVENANCE.json", profile.provenanceSha256],
    ]);
    for (const file of data.distributionFiles) {
      if (expected.has(file.path)) throw new Error("duplicate inventory path");
      expected.set(file.path, file.sha256);
    }
    verifyNativeInventory(packageRoot, expected);
    return [];
  } catch {
    return [
      issue(
        "NATIVE_INSTALL_INVALID",
        `Installed ${label(name)} does not match the qualified local distribution. Recopy the authenticated native archive and reinstall it explicitly; the CLI never repairs package stores.`,
        "package.json",
      ),
    ];
  }
}
