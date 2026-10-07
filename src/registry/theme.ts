/**
 * Portable theme/token/customization metadata (S021).
 *
 * Three independent contracts describe the CSS surface:
 *
 * - `token-contract` — semantic token roles, the three named layers and the
 *   structural declaration that full border-radius grammar is preserved;
 * - `component-customization` — the separately governed runtime CSS API for
 *   per-component properties;
 * - `theme-integration` — stylesheet path, layer order, producer and the actual
 *   portal capabilities.
 *
 * The generated metadata is Svelte-native: no Rust package, crate, wasm or ABI
 * identifier is permitted, and no runtime theme store is invented. The contract
 * identifiers/versions and layer sets must agree across records.
 */
import {
  fail,
  issue,
  ModelError,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";
import { validateWithSchema, type SchemaAuthority } from "./schema.js";
import { isSafeLogicalRelativePath } from "../project/paths.js";
import {
  INITIAL_CONTRACT_VERSION,
  validateCompatibilityRange,
} from "./versions.js";

export const TOKEN_CONTRACT_ID = "urn:svelte-ui-kit:token-contract:v1";
export const COMPONENT_CUSTOMIZATION_ID =
  "urn:svelte-ui-kit:component-customization:v1";
export const THEME_INTEGRATION_ID = "urn:svelte-ui-kit:theme-integration:v1";

export const KIT_LAYERS = [
  "svelte-ui-kit.tokens",
  "svelte-ui-kit.themes",
  "svelte-ui-kit.components",
] as const;
export type KitLayer = (typeof KIT_LAYERS)[number];

export const TOKEN_METADATA_NAMES = [
  "token-contract.json",
  "component-customization.json",
  "theme-integration.json",
] as const;

export function tokenMetadataPaths(stateDir: string): readonly string[] {
  return TOKEN_METADATA_NAMES.map((name) => `${stateDir}/${name}`);
}

export function isTokenMetadataPath(path: string, stateDir?: string): boolean {
  return stateDir !== undefined && tokenMetadataPaths(stateDir).includes(path);
}

export function parseTokenMetadataDocument(
  name: string,
  value: unknown,
): ModelResult<unknown> {
  switch (name) {
    case "token-contract.json":
      return parseTokenContract(value);
    case "component-customization.json":
      return parseComponentCustomization(value);
    case "theme-integration.json":
      return parseThemeIntegration(value);
    default:
      return fail([
        issue(
          "TOKEN_METADATA_UNKNOWN",
          "Unknown token metadata document.",
          name,
        ),
      ]);
  }
}

/**
 * Source-only Rust/Leptos identity markers. These identify the reference
 * implementation and must never appear in portable Svelte metadata.
 */
export const RUST_IDENTITY_PATTERN =
  /(leptos|web_ui_primitives|wasm[_-]?bindgen|\brust\b|\bcargo\b|\bcrate\b|abi\b)/i;

export interface TokenRole {
  readonly name: string;
  readonly role: string;
  readonly type: string;
  readonly fallback: string;
}

export interface TokenContract {
  readonly id: string;
  readonly contractVersion: number;
  readonly description: string;
  readonly layers: readonly KitLayer[];
  readonly tokens: readonly TokenRole[];
  readonly radiusGrammar: {
    readonly corners: 4;
    readonly elliptical: true;
    readonly slashSeparator: true;
  };
}

export interface CustomizationProperty {
  readonly name: string;
  readonly scope: string;
  readonly grammar: string;
  readonly fallback: string;
}

export interface ComponentCustomization {
  readonly id: string;
  readonly contractVersion: number;
  readonly description: string;
  readonly properties: readonly CustomizationProperty[];
}

export interface ThemeIntegration {
  readonly id: string;
  readonly contractVersion: number;
  readonly description: string;
  readonly stylesheet: string;
  readonly layers: readonly KitLayer[];
  readonly producer: "svelte-ui-kit";
  readonly compatibility: {
    readonly svelte: string;
    readonly bits: string;
    readonly date: string;
  };
  readonly portal: {
    readonly supported: true;
    readonly strategies: readonly ("document" | "custom-host")[];
  };
  readonly tokenContract: {
    readonly id: string;
    readonly contractVersion: number;
  };
}

/** Recursively collect every string in a JSON-ish value with its locator. */
function collectStrings(
  value: unknown,
  path: string,
  out: { path: string; text: string }[],
): void {
  if (typeof value === "string") {
    out.push({ path, text: value });
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) =>
      collectStrings(entry, `${path}[${index}]`, out),
    );
    return;
  }
  if (typeof value === "object" && value !== null) {
    for (const [key, entry] of Object.entries(value)) {
      collectStrings(entry, path === "" ? key : `${path}.${key}`, out);
    }
  }
}

/** Reject any Rust/Leptos identity marker in portable metadata. */
function rustIssues(value: unknown, locator: string): ModelIssue[] {
  const strings: { path: string; text: string }[] = [];
  collectStrings(value, "", strings);
  const issues: ModelIssue[] = [];
  for (const entry of strings) {
    if (RUST_IDENTITY_PATTERN.test(entry.text)) {
      issues.push(
        issue(
          "RUST_IDENTITY_REJECTED",
          `${entry.path || "metadata"} must not reference a Rust/Leptos identifier in portable Svelte metadata`,
          locator,
        ),
      );
    }
  }
  return issues;
}

function sameOrder(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export function parseTokenContract(
  value: unknown,
  locator = "token-contract.json",
  authority?: SchemaAuthority,
): ModelResult<TokenContract> {
  const schema = validateWithSchema(
    "token-contract.schema.json",
    value,
    locator,
    authority,
  );
  if (!schema.ok) return fail(schema.issues);
  const issues = rustIssues(value, locator);
  const record = value as Record<string, unknown>;
  const layers = record["layers"] as string[];
  if (!sameOrder(layers, KIT_LAYERS)) {
    issues.push(
      issue(
        "TOKEN_LAYERS_ORDER",
        `token contract layers must be exactly ${KIT_LAYERS.join(", ")} in cascade order`,
        "layers",
      ),
    );
  }
  const tokenNames = new Set<string>();
  for (const [index, token] of (
    record["tokens"] as Record<string, unknown>[]
  ).entries()) {
    const name = token["name"];
    if (typeof name === "string") {
      if (tokenNames.has(name)) {
        issues.push(
          issue(
            "TOKEN_DUPLICATE_NAME",
            `duplicate semantic token ${JSON.stringify(name)} at tokens[${index}]`,
            locator,
          ),
        );
      }
      tokenNames.add(name);
    }
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    id: record["id"] as string,
    contractVersion: INITIAL_CONTRACT_VERSION,
    description: record["description"] as string,
    layers: layers as KitLayer[],
    tokens: record["tokens"] as TokenRole[],
    radiusGrammar: record["radiusGrammar"] as TokenContract["radiusGrammar"],
  });
}

export function parseComponentCustomization(
  value: unknown,
  locator = "component-customization.json",
  authority?: SchemaAuthority,
): ModelResult<ComponentCustomization> {
  const schema = validateWithSchema(
    "component-customization.schema.json",
    value,
    locator,
    authority,
  );
  if (!schema.ok) return fail(schema.issues);
  const issues = rustIssues(value, locator);
  // Duplicate property names are a conflict.
  const record = value as Record<string, unknown>;
  const names = new Set<string>();
  for (const [index, property] of (
    record["properties"] as Record<string, unknown>[]
  ).entries()) {
    const name = property["name"];
    if (typeof name === "string") {
      if (names.has(name)) {
        issues.push(
          issue(
            "CUSTOMIZATION_DUPLICATE_PROPERTY",
            `duplicate customization property ${JSON.stringify(name)} at properties[${index}]`,
            locator,
          ),
        );
      }
      names.add(name);
    }
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    id: record["id"] as string,
    contractVersion: INITIAL_CONTRACT_VERSION,
    description: record["description"] as string,
    properties: record["properties"] as CustomizationProperty[],
  });
}

export function parseThemeIntegration(
  value: unknown,
  locator = "theme-integration.json",
  authority?: SchemaAuthority,
): ModelResult<ThemeIntegration> {
  const schema = validateWithSchema(
    "theme-integration.schema.json",
    value,
    locator,
    authority,
  );
  if (!schema.ok) return fail(schema.issues);
  const issues = rustIssues(value, locator);
  const record = value as Record<string, unknown>;
  const compatibility = record["compatibility"] as Record<string, unknown>;
  for (const key of ["svelte", "bits", "date"] as const) {
    const result = validateCompatibilityRange(
      compatibility[key],
      `${key} compatibility`,
      `compatibility.${key}`,
    );
    if (!result.ok) issues.push(...result.issues);
  }
  const stylesheet = record["stylesheet"];
  if (
    typeof stylesheet !== "string" ||
    !isSafeLogicalRelativePath(stylesheet) ||
    !stylesheet.endsWith(".css")
  ) {
    issues.push(
      issue(
        "THEME_STYLESHEET_UNSAFE",
        `theme stylesheet must be a safe logical styles-relative .css path, received ${JSON.stringify(stylesheet)}`,
        "stylesheet",
      ),
    );
  }
  const layers = record["layers"] as string[];
  if (!sameOrder(layers, KIT_LAYERS)) {
    issues.push(
      issue(
        "THEME_LAYERS_ORDER",
        `theme integration layers must be exactly ${KIT_LAYERS.join(", ")} in cascade order`,
        "layers",
      ),
    );
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    id: record["id"] as string,
    contractVersion: INITIAL_CONTRACT_VERSION,
    description: record["description"] as string,
    stylesheet: stylesheet as string,
    layers: layers as KitLayer[],
    producer: "svelte-ui-kit",
    compatibility: {
      svelte: compatibility["svelte"] as string,
      bits: compatibility["bits"] as string,
      date: compatibility["date"] as string,
    },
    portal: record["portal"] as ThemeIntegration["portal"],
    tokenContract: record["tokenContract"] as ThemeIntegration["tokenContract"],
  });
}

/** Cross-check the three contracts for identity/layer agreement. */
export function parseThemeMetadata(
  bundle: {
    readonly tokenContract: unknown;
    readonly componentCustomization: unknown;
    readonly themeIntegration: unknown;
  },
  authority?: SchemaAuthority,
): ModelResult<{
  tokenContract: TokenContract;
  componentCustomization: ComponentCustomization;
  themeIntegration: ThemeIntegration;
}> {
  const tokenResult = parseTokenContract(
    bundle.tokenContract,
    "token-contract.json",
    authority,
  );
  const customizationResult = parseComponentCustomization(
    bundle.componentCustomization,
    "component-customization.json",
    authority,
  );
  const integrationResult = parseThemeIntegration(
    bundle.themeIntegration,
    "theme-integration.json",
    authority,
  );
  const issues: ModelIssue[] = [];
  if (!tokenResult.ok) issues.push(...tokenResult.issues);
  if (!customizationResult.ok) issues.push(...customizationResult.issues);
  if (!integrationResult.ok) issues.push(...integrationResult.issues);
  if (!tokenResult.ok || !customizationResult.ok || !integrationResult.ok) {
    return fail(issues);
  }

  const tokenContract = tokenResult.value;
  const themeIntegration = integrationResult.value;
  if (
    themeIntegration.tokenContract.id !== tokenContract.id ||
    themeIntegration.tokenContract.contractVersion !==
      tokenContract.contractVersion
  ) {
    issues.push(
      issue(
        "THEME_CONTRACT_MISMATCH",
        "theme integration must reference the same token contract id/version",
        "tokenContract",
      ),
    );
  }
  if (issues.length > 0) return fail(issues);
  return ok({
    tokenContract,
    componentCustomization: customizationResult.value,
    themeIntegration,
  });
}

/** Throw a typed error unless the bundle is consistent Svelte-native metadata. */
export function assertThemeMetadata(
  bundle: Parameters<typeof parseThemeMetadata>[0],
): void {
  const result = parseThemeMetadata(bundle);
  if (!result.ok) throw new ModelError(result.issues);
}
