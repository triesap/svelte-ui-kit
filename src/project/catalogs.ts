/** Read-only selected-owner pnpm catalog declarations and physical preimages. */
import { createHash } from "node:crypto";
import { lstatSync, readFileSync } from "node:fs";
import path from "node:path";
import { parseDocument } from "yaml";
import { validRange } from "semver";

import { issue, type ModelIssue } from "../registry/errors.js";
import { readJsonObject, observeEntry, type JsonObservation } from "./io.js";
import { workspaceDeclaresMember } from "./root.js";
import {
  isQualifiedNativeName,
  observeNativeFile,
} from "./native-dependency.js";

export interface CatalogObservation {
  /** Derived declaration view; physical manifest evidence always binds raw bytes. */
  readonly manifest: JsonObservation;
  readonly digest: string | null;
  readonly issues: readonly ModelIssue[];
}

const FIELDS = ["dependencies", "devDependencies", "peerDependencies"] as const;
const MAX_BYTES = 1024 * 1024;

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function physical(file: string, inputs: Map<string, Buffer>): unknown {
  const entry = observeEntry(file);
  if (entry.kind === "absent") return { path: file, kind: "absent" };
  if (entry.kind !== "file" && entry.kind !== "directory")
    throw new Error(
      "catalog ancestry or input is not a regular file/directory",
    );
  if (entry.kind === "file" && entry.stats.size > MAX_BYTES)
    throw new Error("catalog input exceeds the finite read limit");
  const bytes = entry.kind === "file" ? readFileSync(file) : null;
  if (bytes) inputs.set(file, bytes);
  return {
    path: file,
    kind: entry.kind,
    device: entry.stats.dev,
    inode: entry.stats.ino,
    mode: entry.stats.mode & 0o777,
    digest:
      entry.kind === "file"
        ? createHash("sha256").update(bytes!).digest("hex")
        : null,
  };
}

/** Catalogs never cross a nested Git owner or a nearer workspace boundary. */
function workspace(
  root: string,
  reads: unknown[],
  inputs: Map<string, Buffer>,
): string {
  let current = root;
  for (let depth = 0; depth < 64; depth++) {
    reads.push(physical(current, inputs));
    const file = path.join(current, "pnpm-workspace.yaml");
    const entry = observeEntry(file);
    reads.push(physical(file, inputs));
    if (entry.kind !== "absent") {
      if (entry.kind !== "file")
        throw new Error("pnpm workspace input is not a regular file");
      reads.push(physical(path.join(current, "package.json"), inputs));
      return current;
    }
    const boundary = observeEntry(path.join(current, ".git"));
    if (boundary.kind !== "absent") break;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error(
    "no pnpm workspace in the selected Git owner declares this package",
  );
}

function map(value: unknown, label: string): Map<string, unknown> {
  if (
    !(value instanceof Map) ||
    [...value.keys()].some((key) => typeof key !== "string")
  )
    throw new Error(`${label} must be a string-keyed mapping`);
  return value as Map<string, unknown>;
}

/** No scripts, package manager or executable configuration are evaluated. */
export function observeCatalogs(
  root: string,
  input: JsonObservation = readJsonObject(path.join(root, "package.json")),
): CatalogObservation {
  if (input.kind !== "value")
    return { manifest: input, digest: null, issues: [] };
  const references = FIELDS.flatMap((field) => {
    const values = input.value[field];
    return record(values)
      ? Object.entries(values)
          .filter(
            ([, value]) =>
              typeof value === "string" && value.startsWith("catalog:"),
          )
          .map(([name, value]) => ({ field, name, value: value as string }))
      : [];
  });
  if (!references.length) return { manifest: input, digest: null, issues: [] };
  try {
    const reads: unknown[] = [];
    const inputs = new Map<string, Buffer>();
    reads.push(physical(path.join(path.resolve(root), "package.json"), inputs));
    const selectedBytes = inputs.get(
      path.join(path.resolve(root), "package.json"),
    );
    if (
      !selectedBytes ||
      JSON.stringify(
        JSON.parse(
          new TextDecoder("utf-8", { fatal: true }).decode(selectedBytes),
        ),
      ) !== JSON.stringify(input.value)
    )
      throw new Error("selected manifest changed during catalog capture");
    const owner = workspace(path.resolve(root), reads, inputs);
    const file = path.join(owner, "pnpm-workspace.yaml");
    if (lstatSync(file).size > MAX_BYTES)
      throw new Error("workspace YAML exceeds the finite read limit");
    const document = parseDocument(
      new TextDecoder("utf-8", { fatal: true }).decode(inputs.get(file)),
      {
        uniqueKeys: true,
        strict: true,
      },
    );
    if (document.errors.length || document.warnings.length)
      throw new Error("invalid, duplicate or tagged workspace YAML");
    const yaml = map(
      document.toJS({ mapAsMap: true, maxAliasCount: 0 }),
      "workspace",
    );
    if (owner !== path.resolve(root)) {
      const patterns = yaml.get("packages");
      if (
        !Array.isArray(patterns) ||
        !patterns.every((value) => typeof value === "string") ||
        !workspaceDeclaresMember(
          owner,
          {
            include: patterns.filter((value) => !value.startsWith("!")),
            exclude: patterns
              .filter((value) => value.startsWith("!"))
              .map((value) => value.slice(1)),
          },
          path.resolve(root),
        )
      )
        throw new Error(
          "the nearest pnpm YAML does not prove selected package membership",
        );
    }
    // Includes can relocate catalog authority. Refuse rather than ignoring it.
    if (yaml.has("include") || yaml.has("includes") || yaml.has("catalogFile"))
      throw new Error(
        "included catalog configuration needs explicit source support",
      );
    const defaults = yaml.has("catalog")
      ? map(yaml.get("catalog"), "catalog")
      : null;
    const named = yaml.has("catalogs")
      ? map(yaml.get("catalogs"), "catalogs")
      : new Map();
    if (defaults && named.has("default"))
      throw new Error("default catalog is declared twice");
    const projected = { ...input.value };
    for (const reference of references) {
      const selector = /^catalog:([A-Za-z0-9][A-Za-z0-9_-]*)?$/.exec(
        reference.value,
      );
      if (!selector) throw new Error("unsupported catalog selector");
      const name = selector[1] ?? "default";
      const catalog =
        name === "default" && defaults
          ? defaults
          : map(named.get(name), "selected catalog");
      const value = catalog.get(reference.name);
      if (typeof value !== "string" || !value || value.startsWith("catalog:"))
        throw new Error(
          "selected catalog package is absent, nonliteral or recursively referenced",
        );
      // Native archives remain explicitly selected-package-owned. Catalog file
      // paths are relative to the workspace, never silently reinterpreted locally.
      if (value.startsWith("file:") && owner !== path.resolve(root))
        throw new Error(
          "catalog archive belongs to the workspace; declare the authenticated archive in the selected package explicitly",
        );
      if (value.startsWith("file:")) {
        if (!isQualifiedNativeName(reference.name))
          throw new Error("catalog file has no qualified native profile");
        const native = observeNativeFile(
          root,
          {
            [reference.field]: { [reference.name]: value },
          },
          reference.name,
        );
        if (native.kind !== "value")
          throw new Error(
            "catalog file is not the authenticated selected-package native archive",
          );
      } else if (validRange(value) === null)
        throw new Error("catalog value is not a supported SemVer declaration");
      projected[reference.field] = {
        ...(projected[reference.field] as Record<string, unknown>),
        [reference.name]: value,
      };
    }
    return {
      manifest: { kind: "value", value: projected },
      digest: createHash("sha256").update(JSON.stringify(reads)).digest("hex"),
      issues: [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;
    const detail =
      typeof code === "string"
        ? `catalog input could not be read (${code})`
        : error instanceof Error
          ? error.message.slice(0, 240)
          : "invalid workspace evidence";
    return {
      manifest: input,
      digest: null,
      issues: [
        issue("DEPENDENCY_CATALOG_INVALID", detail, "pnpm-workspace.yaml"),
      ],
    };
  }
}

/** Fresh physical proof, without granting write authority to workspace inputs. */
export function verifyCatalogDigest(
  root: string,
  expected: string | null | undefined,
): readonly ModelIssue[] {
  if (expected === undefined) return [];
  const actual = observeCatalogs(root);
  return actual.issues.length || actual.digest !== expected
    ? [
        issue(
          "AUTHORITY_CATALOG_CHANGED",
          "selected catalog or workspace ownership changed; request a fresh plan",
          "pnpm-workspace.yaml",
        ),
      ]
    : [];
}
