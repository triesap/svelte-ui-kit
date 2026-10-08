/** Qualified native artifact identity; no package code is executed or installed. */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import baseline from "./native-dependency-baseline.json" with { type: "json" };
import { isSafeLogicalRelativePath } from "./paths.js";
import type { ModelIssue } from "../registry/errors.js";
import { issue } from "../registry/errors.js";
import { validateWithSchema } from "../registry/schema.js";

export const NATIVE_BASELINE = Object.freeze(baseline);
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

/** Same declaration-field precedence as ordinary dependency inspection. */
export function nativeDeclaration(
  manifest: Record<string, unknown> | null,
): string | null {
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const record = manifest?.[field];
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record) ||
      !Object.hasOwn(record, NATIVE_BASELINE.name)
    )
      continue;
    const value = (record as Record<string, unknown>)[NATIVE_BASELINE.name];
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
): NativeFileObservation {
  for (const field of ["dependencies", "devDependencies", "peerDependencies"]) {
    const record = manifest?.[field];
    if (
      typeof record !== "object" ||
      record === null ||
      Array.isArray(record) ||
      !Object.hasOwn(record, NATIVE_BASELINE.name)
    )
      continue;
    const declaration = (record as Record<string, unknown>)[
      NATIVE_BASELINE.name
    ];
    if (typeof declaration !== "string" || !declaration.startsWith("file:"))
      return { kind: "absent" };
    const logical = declaration.slice(5).replace(/^\.\//, "");
    try {
      if (!logical.endsWith(".tgz")) throw new Error("archive suffix");
      const file = regularInside(root, logical);
      if (digest(file.bytes) !== NATIVE_BASELINE.archiveSha256)
        throw new Error("unqualified archive digest");
      return {
        kind: "value",
        declaration,
        path: logical,
        version: NATIVE_BASELINE.version,
        digest: NATIVE_BASELINE.archiveSha256,
        mode: file.mode,
      };
    } catch {
      return {
        kind: "invalid",
        issues: [
          issue(
            "NATIVE_ARCHIVE_INVALID",
            "The declared Bits file must be the qualified archive in an application-owned regular file with safe ancestry. Copy it from the locally packed CLI, verify its digest, and install it explicitly.",
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
): readonly ModelIssue[] {
  try {
    const provenance = regularInside(packageRoot, "NATIVE_PROVENANCE.json");
    if (digest(provenance.bytes) !== NATIVE_BASELINE.provenanceSha256)
      throw new Error("provenance digest");
    const data = JSON.parse(provenance.bytes.toString("utf8")) as {
      schemaVersion: number;
      name: string;
      version: string;
      distributionFiles: { path: string; sha256: string }[];
    };
    const parsed = validateWithSchema(
      "native-provenance.schema.json",
      data,
      "package.json",
    );
    if (!parsed.ok) return parsed.issues;
    if (
      data.schemaVersion !== 1 ||
      data.name !== NATIVE_BASELINE.name ||
      data.version !== NATIVE_BASELINE.version
    )
      throw new Error("native identity");
    const expected = new Set(["NATIVE_PROVENANCE.json"]);
    const directories = new Set<string>();
    for (const file of data.distributionFiles) {
      if (expected.has(file.path)) throw new Error("duplicate inventory path");
      expected.add(file.path);
      const segments = file.path.split("/");
      for (let index = 1; index < segments.length; index++)
        directories.add(segments.slice(0, index).join("/"));
      if (digest(regularInside(packageRoot, file.path).bytes) !== file.sha256)
        throw new Error("distribution bytes");
    }
    const visit = (directory: string, prefix = ""): void => {
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const logical = `${prefix}${entry.name}`;
        if (entry.isSymbolicLink()) throw new Error("distribution link");
        if (entry.isDirectory()) {
          if (!directories.delete(logical))
            throw new Error("extra distribution directory");
          visit(path.join(directory, entry.name), `${logical}/`);
        } else if (!entry.isFile() || !expected.delete(logical))
          throw new Error("extra distribution entry");
      }
    };
    visit(packageRoot);
    if (expected.size !== 0 || directories.size !== 0)
      throw new Error("missing distribution entry");
    return [];
  } catch {
    return [
      issue(
        "NATIVE_INSTALL_INVALID",
        "Installed Bits does not match the qualified local distribution. Recopy the authenticated native archive and reinstall it explicitly; the CLI never repairs package stores.",
        "package.json",
      ),
    ];
  }
}
