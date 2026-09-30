/**
 * Local draft-07 schema compilation and validation.
 *
 * Every shipped schema is a local JSON document under the versioned `schema/`
 * directory with a fixed local URN `$id`. Validation is deliberately
 * non-coercing and non-mutating:
 *
 * - `coerceTypes: false` never turns `"1"` into `1`;
 * - `useDefaults: false` never injects a JSON Schema `default`;
 * - `removeAdditional: false` never deletes an unknown property;
 * - `additionalProperties: false` in each schema makes unknown fields explicit
 *   validation failures instead.
 *
 * There is one explicit schema authority per asset provider. The authority
 * reads each schema through that provider (no CWD, source-checkout or network
 * fallback), validates its identity/format, compiles it once and caches it for
 * the provider root. Each authority owns its own `ajv` instance so two
 * providers that reuse a schema `$id` can never cross-contaminate each other.
 *
 * `ajv` 6 is a CommonJS module whose `export =` is a constructable value. It is
 * loaded through `createRequire` so the ESM build does not depend on a
 * synthetic default import.
 */
import type { ErrorObject, ValidateFunction } from "ajv";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { AssetProvider } from "./assets.js";
import {
  fail,
  issue,
  ok,
  type ModelIssue,
  type ModelResult,
} from "./errors.js";

interface AjvOptions {
  allErrors?: boolean;
  coerceTypes?: boolean;
  useDefaults?: boolean;
  removeAdditional?: boolean;
}

interface AjvInstance {
  compile(schema: object): ValidateFunction;
}

type AjvConstructor = new (options?: AjvOptions) => AjvInstance;

const nodeRequire = createRequire(import.meta.url);

const AJV_OPTIONS: AjvOptions = {
  allErrors: true,
  coerceTypes: false,
  useDefaults: false,
  removeAdditional: false,
};

/** Shipped schema file name → fixed local `$id` identity. */
export const SHIPPED_SCHEMAS: Readonly<Record<string, string>> = {
  "kit.schema.json": "urn:svelte-ui-kit:schema:v1:kit",
  "kit-lock.schema.json": "urn:svelte-ui-kit:schema:v1:kit-lock",
  "registry.schema.json": "urn:svelte-ui-kit:schema:v1:registry",
  "registry-item.schema.json": "urn:svelte-ui-kit:schema:v1:registry-item",
  "token-contract.schema.json": "urn:svelte-ui-kit:schema:v1:token-contract",
  "component-customization.schema.json":
    "urn:svelte-ui-kit:schema:v1:component-customization",
  "theme-integration.schema.json":
    "urn:svelte-ui-kit:schema:v1:theme-integration",
  "command-envelope.schema.json":
    "urn:svelte-ui-kit:schema:v1:command-envelope",
};

/** The `schema/v1/<file>` logical paths of every shipped schema. */
export const SHIPPED_SCHEMA_PATHS: readonly string[] = Object.keys(
  SHIPPED_SCHEMAS,
).map((file) => `schema/v1/${file}`);

function createAjv(): AjvInstance {
  const Ajv = nodeRequire("ajv") as AjvConstructor;
  return new Ajv(AJV_OPTIONS);
}

/**
 * Locate the package root by walking up for `package.json`. This works for the
 * emitted `dist/` tree and for the mirrored unit/integration build trees
 * without depending on the process CWD. It is only the default provider for
 * callers that do not supply an explicit asset provider.
 */
function packageRootDir(): string {
  let dir = dirname(fileURLToPath(import.meta.url));
  for (;;) {
    if (existsSync(join(dir, "package.json"))) return dir;
    const parent = dirname(dir);
    if (parent === dir) {
      throw new Error("could not locate the svelte-ui-kit package root");
    }
    dir = parent;
  }
}

let schemaRootDir: string | null = null;

function schemaRoot(): string {
  if (schemaRootDir === null) {
    schemaRootDir = join(packageRootDir(), "schema", "v1");
  }
  return schemaRootDir;
}

const legacyCompiled = new Map<string, ValidateFunction>();
let legacyAjvInstance: AjvInstance | null = null;

function legacyAjv(): AjvInstance {
  if (legacyAjvInstance === null) legacyAjvInstance = createAjv();
  return legacyAjvInstance;
}

function legacyValidatorFor(schemaFile: string): ValidateFunction {
  const existing = legacyCompiled.get(schemaFile);
  if (existing !== undefined) return existing;
  const text = readFileSync(join(schemaRoot(), schemaFile), "utf8");
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`schema ${schemaFile} is not a JSON object`);
  }
  const created = legacyAjv().compile(parsed as object);
  legacyCompiled.set(schemaFile, created);
  return created;
}

/** Read and parse one local schema document (relative to `schema/v1/`). */
export function loadSchemaDocument(
  schemaFile: string,
): Record<string, unknown> {
  const text = readFileSync(join(schemaRoot(), schemaFile), "utf8");
  const parsed: unknown = JSON.parse(text);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error(`schema ${schemaFile} is not a JSON object`);
  }
  return parsed as Record<string, unknown>;
}

/**
 * Compile (once) and return the validator for a bundled schema document. This
 * is the default-package path; provider-scoped callers use a
 * `SchemaAuthority`.
 */
export function validatorFor(schemaFile: string): ValidateFunction {
  return legacyValidatorFor(schemaFile);
}

function toIssues(
  errors: readonly ErrorObject[],
  locator: string | undefined,
): ModelIssue[] {
  return errors.map((error) => {
    const path = error.dataPath === "" ? "/" : error.dataPath;
    return issue(
      "SCHEMA_INVALID",
      `${path} ${error.message ?? "failed schema validation"}`,
      locator,
    );
  });
}

/**
 * Validate `data` against a bundled schema through the default package
 * provider. Provider-scoped callers should prefer `SchemaAuthority.validate`.
 */
export function validateWithSchema(
  schemaFile: string,
  data: unknown,
  locator?: string,
): ModelResult<unknown> {
  const validate = legacyValidatorFor(schemaFile);
  if (validate(data)) return ok(data);
  return fail(toIssues(validate.errors ?? [], locator));
}

/** A compiled, provider-scoped set of the shipped schemas. */
export interface SchemaAuthority {
  /** Absolute provider root this authority is pinned to. */
  readonly root: string;
  /** Validate `data` against one shipped schema file name. */
  validate(
    schemaFile: string,
    data: unknown,
    locator?: string,
  ): ModelResult<unknown>;
}

const authorities = new Map<string, SchemaAuthority>();

function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return Array.isArray(value) ? "an array" : typeof value;
}

/**
 * Build (or reuse) the schema authority for `provider`. Every shipped schema is
 * read through the provider, checked for a JSON object shape, the expected
 * local `$id` and a draft-07 meta-schema, then compiled. Missing, malformed,
 * non-object, invalid-UTF8 or incompatible schemas fail with typed logical
 * diagnostics rather than throwing. No remote resolution or checkout fallback
 * is used.
 */
export function createSchemaAuthority(
  provider: AssetProvider,
): ModelResult<SchemaAuthority> {
  const cached = authorities.get(provider.root);
  if (cached !== undefined) return ok(cached);

  const issues: ModelIssue[] = [];
  const ajv = createAjv();
  const validators = new Map<string, ValidateFunction>();

  for (const [schemaFile, expectedId] of Object.entries(SHIPPED_SCHEMAS)) {
    const logicalPath = `schema/v1/${schemaFile}`;
    const text = provider.readText(logicalPath);
    if (!text.ok) {
      issues.push(...text.issues);
      continue;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.value);
    } catch (error) {
      issues.push(
        issue(
          "SCHEMA_INVALID_DOCUMENT",
          `${logicalPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
          logicalPath,
        ),
      );
      continue;
    }
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      issues.push(
        issue(
          "SCHEMA_INVALID_DOCUMENT",
          `${logicalPath} must be a JSON object, received ${describe(parsed)}`,
          logicalPath,
        ),
      );
      continue;
    }
    const record = parsed as Record<string, unknown>;
    if (record["$id"] !== expectedId) {
      issues.push(
        issue(
          "SCHEMA_IDENTITY_MISMATCH",
          `${logicalPath} must declare $id ${JSON.stringify(expectedId)}, found ${JSON.stringify(record["$id"])}`,
          logicalPath,
        ),
      );
      continue;
    }
    if (
      typeof record["$schema"] !== "string" ||
      !record["$schema"].includes("draft-07")
    ) {
      issues.push(
        issue(
          "SCHEMA_IDENTITY_MISMATCH",
          `${logicalPath} must declare the local draft-07 meta-schema`,
          logicalPath,
        ),
      );
      continue;
    }
    try {
      validators.set(schemaFile, ajv.compile(record));
    } catch (error) {
      issues.push(
        issue(
          "SCHEMA_COMPILE_INVALID",
          `${logicalPath} could not be compiled: ${error instanceof Error ? error.message : String(error)}`,
          logicalPath,
        ),
      );
    }
  }

  if (issues.length > 0) return fail(issues);

  const authority: SchemaAuthority = {
    root: provider.root,
    validate(
      schemaFile: string,
      data: unknown,
      locator?: string,
    ): ModelResult<unknown> {
      const validate = validators.get(schemaFile);
      if (validate === undefined) {
        return fail([
          issue(
            "SCHEMA_UNKNOWN",
            `${schemaFile} is not a shipped schema`,
            locator,
          ),
        ]);
      }
      if (validate(data)) return ok(data);
      return fail(toIssues(validate.errors ?? [], locator));
    },
  };
  authorities.set(provider.root, authority);
  return ok(authority);
}

/** Drop all cached authorities (tests that reuse a provider root). */
export function resetSchemaAuthorities(): void {
  authorities.clear();
}
