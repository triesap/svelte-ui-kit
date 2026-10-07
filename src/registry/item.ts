/**
 * Typed registry item manifest (S017).
 *
 * A manifest names its own identity/kind/version, the exact source files it
 * installs (Svelte and/or TypeScript), the public symbols those files export,
 * and the managed CSS blocks it contributes. Targets are logical paths
 * relative to the declared UI styles namespace, so no filename is guessed from
 * an item ID and no symbol is synthesized from a filename.
 *
 * Shape rules:
 *
 * - a `component` must install at least one `.svelte` file;
 * - a simple component uses top-level `${id}.svelte` (+ optional
 *   `${id}.types.ts`); a compound component uses `${id}/` files including
 *   `${id}/index.ts`;
 * - every export targets a declared file, so a CSS-only `foundation` cannot
 *   invent a source file or export.
 *
 * Cross-item path/export uniqueness is a separate S032 gate.
 */
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import { validateWithSchema, type SchemaAuthority } from "./schema.js";
import {
  INITIAL_ITEM_VERSION,
  INITIAL_SCHEMA_VERSION,
  isCompatibilityRange,
  isSemVer,
  validateCompatibilityRange,
} from "./versions.js";

/** Schema document that owns the item-manifest shape. */
export const REGISTRY_ITEM_SCHEMA = "registry-item.schema.json";

export type ItemKind = "component" | "foundation";
export type FileKind = "svelte" | "typescript";
export type ExportKind = "value" | "type";
export type NpmRole = "runtime" | "tooling" | "peer";

export interface ItemFile {
  readonly source: string;
  readonly target: string;
  readonly kind: FileKind;
  readonly cohort: string;
}

export interface ItemExport {
  readonly name: string;
  readonly target: string;
  readonly kind: ExportKind;
}

export interface ItemStyle {
  readonly source: string;
  readonly target: string;
  readonly blockId: string;
  readonly cohort: string;
}

/** One npm plan entry; the CLI reports it but never installs it. */
export interface NpmRequirement {
  readonly name: string;
  readonly range: string;
  readonly role: NpmRole;
}

/**
 * Descriptive accessibility obligations. These are required names,
 * keyboard/focus/form behaviors and their test obligations, never executable
 * hooks and never a claim that an untested component is accessible.
 */
export interface AccessibilityMetadata {
  readonly requiredNames: readonly string[];
  readonly keyboard: readonly string[];
  readonly focus: readonly string[];
  readonly form: readonly string[];
  readonly tests: readonly string[];
}

export const EMPTY_ACCESSIBILITY: AccessibilityMetadata = {
  requiredNames: [],
  keyboard: [],
  focus: [],
  form: [],
  tests: [],
};

export interface RegistryItem {
  readonly schemaVersion: number;
  readonly id: string;
  readonly kind: ItemKind;
  readonly version: string;
  readonly description: string;
  readonly compatibility: {
    readonly svelte: string;
    readonly bits: string;
    readonly date: string;
  };
  readonly files: readonly ItemFile[];
  readonly exports: readonly ItemExport[];
  readonly styles: readonly ItemStyle[];
  readonly registryDependencies: readonly string[];
  readonly npmDependencies: readonly NpmRequirement[];
  readonly accessibility: AccessibilityMetadata;
  readonly contracts?: {
    readonly tokenContract: string;
    readonly componentCustomization: string;
  };
}

const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const EXPORT_NAME = /^[A-Z][A-Za-z0-9]*$/;

/**
 * Interim safe logical target check. S033 centralizes lexical path validation;
 * this local helper only rejects the clearly unsafe forms the manifest can
 * express (absolute, traversal, separator confusion, empty segments) and
 * enforces the expected extension.
 */
export function isSafeTarget(
  value: unknown,
  extension: ".svelte" | ".ts" | ".css" | ".json" | null,
): value is string {
  if (typeof value !== "string" || value.length === 0) return false;
  if (value.startsWith("/") || value.includes("\\") || value.endsWith("/")) {
    return false;
  }
  if (/^[A-Za-z]:/.test(value)) return false;
  const segments = value.split("/");
  if (
    !segments.every(
      (segment) => segment !== "" && segment !== "." && segment !== "..",
    )
  ) {
    return false;
  }
  return extension === null || value.endsWith(extension);
}

function fileKindMatchesTarget(kind: FileKind, target: string): boolean {
  return kind === "svelte"
    ? target.endsWith(".svelte")
    : target.endsWith(".ts") && !target.endsWith(".d.ts");
}

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  return value === null ? "null" : typeof value;
}

/**
 * Validate a candidate item manifest: schema, identity/kind/version,
 * compatibility ranges, safe targets, unique targets/exports/block IDs, and
 * the simple/compound/CSS-only shape rules.
 */
export function parseRegistryItem(
  value: unknown,
  locator = "registry item manifest",
  authority?: SchemaAuthority,
): ModelResult<RegistryItem> {
  const schemaResult = authority
    ? authority.validate(REGISTRY_ITEM_SCHEMA, value, locator)
    : validateWithSchema(REGISTRY_ITEM_SCHEMA, value, locator);
  if (!schemaResult.ok) return fail(schemaResult.issues);

  const record = value as Record<string, unknown>;
  const issues: ModelIssue[] = [];

  if (!isSemVer(record["version"])) {
    issues.push(
      issue(
        "ITEM_VERSION_INVALID",
        `item version must be a strict SemVer 2.0.0 release, received ${describe(record["version"])}`,
        "version",
      ),
    );
  }
  const compatibility = record["compatibility"] as Record<string, unknown>;
  for (const key of ["svelte", "bits", "date"] as const) {
    const result = validateCompatibilityRange(
      compatibility[key],
      `${key} compatibility`,
      `compatibility.${key}`,
    );
    if (!result.ok) issues.push(...result.issues);
  }

  const files = record["files"] as readonly Record<string, unknown>[];
  const targets = new Set<string>();
  const fileTargets: string[] = [];
  for (const [index, file] of files.entries()) {
    const target = file["target"];
    const kind = file["kind"] as FileKind;
    if (typeof target !== "string" || !isSafeTarget(target, null)) {
      issues.push(
        issue(
          "ITEM_TARGET_INVALID",
          `files[${index}].target must be a safe logical relative path, received ${describe(target)}`,
          `files[${index}].target`,
        ),
      );
    } else {
      if (targets.has(target)) {
        issues.push(
          issue(
            "ITEM_DUPLICATE_TARGET",
            `duplicate file target ${JSON.stringify(target)} at files[${index}]`,
            locator,
          ),
        );
      }
      targets.add(target);
      fileTargets.push(target);
      if (!fileKindMatchesTarget(kind, target)) {
        issues.push(
          issue(
            "ITEM_FILE_KIND_MISMATCH",
            `files[${index}] kind ${JSON.stringify(kind)} does not match target ${JSON.stringify(target)}`,
            `files[${index}].kind`,
          ),
        );
      }
    }
    if (typeof file["source"] !== "string" || file["source"].length === 0) {
      issues.push(
        issue(
          "ITEM_SOURCE_INVALID",
          `files[${index}].source must be a non-empty path`,
          `files[${index}].source`,
        ),
      );
    }
    if (typeof file["cohort"] !== "string" || !KEBAB.test(file["cohort"])) {
      issues.push(
        issue(
          "ITEM_COHORT_INVALID",
          `files[${index}].cohort must be a lowercase kebab-case id`,
          `files[${index}].cohort`,
        ),
      );
    }
  }

  const id = record["id"] as string;
  const kind = record["kind"] as ItemKind;
  const svelteFiles = fileTargets.filter((target) =>
    target.endsWith(".svelte"),
  );
  if (kind === "component" && svelteFiles.length === 0) {
    issues.push(
      issue(
        "ITEM_COMPONENT_FILES_MISSING",
        `component ${JSON.stringify(id)} must declare at least one .svelte file`,
        "files",
      ),
    );
  }
  const compound = fileTargets.some((target) => target.includes("/"));
  if (kind === "component") {
    if (compound) {
      if (!fileTargets.includes(`${id}/index.ts`)) {
        issues.push(
          issue(
            "ITEM_COMPOUND_INDEX_MISSING",
            `compound component ${JSON.stringify(id)} must declare ${id}/index.ts`,
            "files",
          ),
        );
      }
      for (const target of fileTargets) {
        if (!target.startsWith(`${id}/`)) {
          issues.push(
            issue(
              "ITEM_COMPOUND_TARGET_INVALID",
              `compound component ${JSON.stringify(id)} target ${JSON.stringify(target)} must live under ${id}/`,
              "files",
            ),
          );
        }
      }
    } else {
      for (const target of fileTargets) {
        const allowed =
          target === `${id}.svelte` || target === `${id}.types.ts`;
        if (!allowed) {
          issues.push(
            issue(
              "ITEM_SIMPLE_TARGET_INVALID",
              `simple component ${JSON.stringify(id)} target ${JSON.stringify(target)} must be ${id}.svelte or ${id}.types.ts`,
              "files",
            ),
          );
        }
      }
    }
  }

  const exportNames = new Set<string>();
  const exports = record["exports"] as readonly Record<string, unknown>[];
  for (const [index, entry] of exports.entries()) {
    const name = entry["name"];
    if (typeof name === "string") {
      if (!EXPORT_NAME.test(name)) {
        issues.push(
          issue(
            "ITEM_EXPORT_NAME_INVALID",
            `exports[${index}].name must be PascalCase, received ${JSON.stringify(name)}`,
            `exports[${index}].name`,
          ),
        );
      }
      if (exportNames.has(name)) {
        issues.push(
          issue(
            "ITEM_DUPLICATE_EXPORT",
            `duplicate export name ${JSON.stringify(name)} at exports[${index}]`,
            locator,
          ),
        );
      }
      exportNames.add(name);
    }
    const target = entry["target"];
    if (typeof target === "string" && !targets.has(target)) {
      issues.push(
        issue(
          "ITEM_EXPORT_TARGET_UNKNOWN",
          `exports[${index}].target ${JSON.stringify(target)} is not a declared file`,
          `exports[${index}].target`,
        ),
      );
    }
  }
  if (kind === "foundation" && exports.length > 0 && files.length === 0) {
    issues.push(
      issue(
        "ITEM_FOUNDATION_SOURCE_INVENTED",
        `foundation ${JSON.stringify(id)} exports a symbol without declaring a source file`,
        "exports",
      ),
    );
  }

  const blockIds = new Set<string>();
  const styles = record["styles"] as readonly Record<string, unknown>[];
  for (const [index, style] of styles.entries()) {
    const blockId = style["blockId"];
    if (typeof blockId === "string") {
      if (blockIds.has(blockId)) {
        issues.push(
          issue(
            "ITEM_DUPLICATE_BLOCK",
            `duplicate CSS block id ${JSON.stringify(blockId)} at styles[${index}]`,
            locator,
          ),
        );
      }
      blockIds.add(blockId);
    }
    if (!isSafeTarget(style["target"], ".css")) {
      issues.push(
        issue(
          "ITEM_STYLE_TARGET_INVALID",
          `styles[${index}].target must be a safe logical .css path, received ${describe(style["target"])}`,
          `styles[${index}].target`,
        ),
      );
    }
  }

  const registryDependencies = (record["registryDependencies"] ?? []) as
    readonly unknown[] | undefined;
  const registryDepIds: string[] = [];
  for (const [index, dependency] of (registryDependencies ?? []).entries()) {
    if (typeof dependency !== "string") continue;
    registryDepIds.push(dependency);
    if (dependency === id) {
      issues.push(
        issue(
          "ITEM_SELF_DEPENDENCY",
          `registryDependencies[${index}] must not reference the item itself (${JSON.stringify(id)})`,
          `registryDependencies[${index}]`,
        ),
      );
    }
  }

  const rawNpm = (record["npmDependencies"] ?? []) as readonly Record<
    string,
    unknown
  >[];
  const seenNpm = new Map<string, number>();
  for (const [index, dependency] of rawNpm.entries()) {
    const name = dependency["name"];
    if (typeof name === "string") {
      if (seenNpm.has(name)) {
        issues.push(
          issue(
            "ITEM_DUPLICATE_NPM_DEPENDENCY",
            `duplicate npm dependency ${JSON.stringify(name)} at npmDependencies[${index}] and npmDependencies[${seenNpm.get(name)}]`,
            locator,
          ),
        );
      } else {
        seenNpm.set(name, index);
      }
    }
    if (!isCompatibilityRange(dependency["range"])) {
      issues.push(
        issue(
          "NPM_RANGE_INVALID",
          `npmDependencies[${index}].range must be a registry npm range (not a git/file/url source), received ${describe(dependency["range"])}`,
          `npmDependencies[${index}].range`,
        ),
      );
    }
  }

  const rawAccessibility = record["accessibility"] as
    Record<string, unknown> | undefined;
  const accessibility: AccessibilityMetadata =
    rawAccessibility === undefined
      ? EMPTY_ACCESSIBILITY
      : {
          requiredNames: rawAccessibility["requiredNames"] as string[],
          keyboard: rawAccessibility["keyboard"] as string[],
          focus: rawAccessibility["focus"] as string[],
          form: rawAccessibility["form"] as string[],
          tests: rawAccessibility["tests"] as string[],
        };

  const contracts = record["contracts"] as RegistryItem["contracts"];
  if (contracts !== undefined) {
    if (
      id !== "tokens" ||
      kind !== "foundation" ||
      files.length !== 0 ||
      exports.length !== 0 ||
      styles.length !== 1 ||
      styles[0]?.["target"] !== "kit.css" ||
      styles[0]?.["blockId"] !== "tokens" ||
      styles[0]?.["cohort"] !== "tokens"
    ) {
      issues.push(
        issue(
          "REGISTRY_CONTRACT_SCOPE",
          "portable contracts belong only to the CSS-only tokens foundation and its tokens cohort",
          locator,
        ),
      );
    }
    for (const source of [
      contracts.tokenContract,
      contracts.componentCustomization,
    ]) {
      if (!isSafeTarget(source, ".json"))
        issues.push(
          issue(
            "REGISTRY_CONTRACT_PATH_INVALID",
            "contract sources must be safe registry-relative JSON paths",
            locator,
          ),
        );
    }
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    schemaVersion: INITIAL_SCHEMA_VERSION,
    id,
    kind,
    version: record["version"] as string,
    description: record["description"] as string,
    compatibility: {
      svelte: compatibility["svelte"] as string,
      bits: compatibility["bits"] as string,
      date: compatibility["date"] as string,
    },
    files: files.map((file) => ({
      source: file["source"] as string,
      target: file["target"] as string,
      kind: file["kind"] as FileKind,
      cohort: file["cohort"] as string,
    })),
    exports: exports.map((entry) => ({
      name: entry["name"] as string,
      target: entry["target"] as string,
      kind: entry["kind"] as ExportKind,
    })),
    styles: styles.map((style) => ({
      source: style["source"] as string,
      target: style["target"] as string,
      blockId: style["blockId"] as string,
      cohort: style["cohort"] as string,
    })),
    registryDependencies: registryDepIds,
    npmDependencies: rawNpm.map((dependency) => ({
      name: dependency["name"] as string,
      range: dependency["range"] as string,
      role: dependency["role"] as NpmRole,
    })),
    accessibility,
    ...(contracts === undefined ? {} : { contracts: { ...contracts } }),
  });
}

/** True when the item is a CSS-only foundation (no source files/exports). */
export function isCssOnlyFoundation(item: RegistryItem): boolean {
  return item.kind === "foundation" && item.files.length === 0;
}

/** True when a component uses the compound directory layout. */
export function isCompoundComponent(item: RegistryItem): boolean {
  return item.files.some((file) => file.target.includes("/"));
}

/** Initial item version used by authored sample manifests. */
export const SAMPLE_ITEM_VERSION = INITIAL_ITEM_VERSION;
