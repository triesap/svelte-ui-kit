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
 * There is exactly one containment path: every default parser resolves a
 * provider-scoped `SchemaAuthority` through the installed package provider, so
 * a `kit.json`/lock/theme/envelope parse reads the same contained, validated
 * schema bytes the registry snapshot does. There is no raw `readFileSync`
 * fallback, no CWD or source-checkout lookup and no remote resolution.
 *
 * Each operation validates its own inputs. The authority is built by reading
 * and validating every shipped schema through the supplied provider; only the
 * *compilation* of already-verified content is reused, keyed by the exact
 * validated schema text. A missing, malformed, non-object, wrongly identified
 * or invalid-UTF8 schema therefore fails with typed logical diagnostics on
 * every operation, while a compiled validator set is never reused across
 * different content.
 *
 * `ajv` 6 is a CommonJS module whose `export =` is a constructable value. It is
 * loaded through `createRequire` so the ESM build does not depend on a
 * synthetic default import.
 */
import type { ErrorObject, ValidateFunction } from "ajv";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";

import { createInstalledAssetProvider, type AssetProvider } from "./assets.js";
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
  "native-provenance.schema.json":
    "urn:svelte-ui-kit:schema:v1:native-provenance",
};

/** The `schema/v1/<file>` logical paths of every shipped schema. */
export const SHIPPED_SCHEMA_PATHS: readonly string[] = Object.keys(
  SHIPPED_SCHEMAS,
).map((file) => `schema/v1/${file}`);

function createAjv(): AjvInstance {
  const Ajv = nodeRequire("ajv") as AjvConstructor;
  return new Ajv(AJV_OPTIONS);
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

/** Describe a value for a typed diagnostic without echoing host state. */
function describe(value: unknown): string {
  if (typeof value === "string") return JSON.stringify(value);
  if (value === null) return "null";
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return Array.isArray(value) ? "an array" : typeof value;
}

/**
 * Compilation cache keyed by the exact validated schema text. Reusing a
 * compiled validator set is only safe for byte-identical, already-validated
 * content, never for a directory string.
 */
const compiledSchemas = new Map<
  string,
  ReadonlyMap<string, ValidateFunction>
>();

function validateSchemaDocument(
  logicalPath: string,
  expectedId: string,
  text: string,
  issues: ModelIssue[],
): boolean {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    issues.push(
      issue(
        "SCHEMA_INVALID_DOCUMENT",
        `${logicalPath} is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
        logicalPath,
      ),
    );
    return false;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    issues.push(
      issue(
        "SCHEMA_INVALID_DOCUMENT",
        `${logicalPath} must be a JSON object, received ${describe(parsed)}`,
        logicalPath,
      ),
    );
    return false;
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
    return false;
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
    return false;
  }
  return true;
}

function contentKey(entries: readonly (readonly [string, string])[]): string {
  const hash = createHash("sha256");
  for (const [file, text] of [...entries].sort((left, right) =>
    left[0] < right[0] ? -1 : left[0] > right[0] ? 1 : 0,
  )) {
    hash.update(`${file}\u0000${text}\u0000`);
  }
  return hash.digest("hex");
}

/** A compiled, provider-scoped set of the shipped schemas. */
export interface SchemaAuthority {
  /** Absolute provider root this authority was built from (informational). */
  readonly root: string;
  /** Validate `data` against one shipped schema file name. */
  validate(
    schemaFile: string,
    data: unknown,
    locator?: string,
  ): ModelResult<unknown>;
}

/**
 * Build a schema authority from `provider`. Every shipped schema is read and
 * validated through that provider; missing, malformed, non-object, wrongly
 * identified, invalid-UTF8 or incompatible schemas fail with typed logical
 * diagnostics rather than throwing. The returned authority is bound to the
 * captured schema content, so a later provider mutation cannot change it and a
 * second provider with different content is never shadowed by a cache.
 */
export function createSchemaAuthority(
  provider: AssetProvider,
): ModelResult<SchemaAuthority> {
  const issues: ModelIssue[] = [];
  const captured: [string, string][] = [];

  for (const [schemaFile, expectedId] of Object.entries(SHIPPED_SCHEMAS)) {
    const logicalPath = `schema/v1/${schemaFile}`;
    const text = provider.readText(logicalPath);
    if (!text.ok) {
      issues.push(...text.issues);
      continue;
    }
    if (validateSchemaDocument(logicalPath, expectedId, text.value, issues)) {
      captured.push([schemaFile, text.value]);
    }
  }

  if (issues.length > 0) return fail(issues);

  const key = contentKey(captured);
  let validators = compiledSchemas.get(key);
  if (validators === undefined) {
    const ajv = createAjv();
    const built = new Map<string, ValidateFunction>();
    for (const [schemaFile, text] of captured) {
      try {
        built.set(schemaFile, ajv.compile(JSON.parse(text) as object));
      } catch (error) {
        issues.push(
          issue(
            "SCHEMA_COMPILE_INVALID",
            `schema/v1/${schemaFile} could not be compiled: ${error instanceof Error ? error.message : String(error)}`,
            `schema/v1/${schemaFile}`,
          ),
        );
      }
    }
    if (issues.length > 0) return fail(issues);
    validators = built;
    compiledSchemas.set(key, validators);
  }

  const bound = validators;
  return ok({
    root: provider.root,
    validate(
      schemaFile: string,
      data: unknown,
      locator?: string,
    ): ModelResult<unknown> {
      const validate = bound.get(schemaFile);
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
  });
}

let installedProvider: AssetProvider | null = null;

/**
 * The safe default authority: the schemas shipped beside the running package.
 * Lazy, so bare CLI help/version bootstrap never needs a schema read. Every
 * call re-validates the installed schemas, so removing or replacing them after
 * a successful parse still fails the next operation with typed diagnostics.
 */
export function defaultSchemaAuthority(): ModelResult<SchemaAuthority> {
  if (installedProvider === null) {
    installedProvider = createInstalledAssetProvider();
  }
  return createSchemaAuthority(installedProvider);
}

/**
 * Validate `data` against one shipped schema through an explicit authority or,
 * when none is supplied, the contained installed-package default. A caller
 * never supplies a bare root string: config, lock, theme and envelope parsers
 * therefore share the same provider-bound validation path as the registry
 * snapshot.
 */
export function validateWithSchema(
  schemaFile: string,
  data: unknown,
  locator?: string,
  authority?: SchemaAuthority,
): ModelResult<unknown> {
  let resolved: ModelResult<SchemaAuthority>;
  if (authority === undefined) {
    resolved = defaultSchemaAuthority();
  } else {
    resolved = ok(authority);
  }
  if (!resolved.ok) return fail(resolved.issues);
  return resolved.value.validate(schemaFile, data, locator);
}
