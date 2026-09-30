/**
 * Local draft-07 schema compilation and validation.
 *
 * Every shipped schema is a local JSON document under the versioned `schema/`
 * directory with a fixed local URN `$id`. Compiled schemas are cached for the
 * process. Validation is deliberately non-coercing and non-mutating:
 *
 * - `coerceTypes: false` never turns `"1"` into `1`;
 * - `useDefaults: false` never injects a JSON Schema `default`;
 * - `removeAdditional: false` never deletes an unknown property;
 * - `additionalProperties: false` in each schema makes unknown fields explicit
 *   validation failures instead.
 *
 * The package-relative asset provider of S025 later hardens the raw read
 * (traversal, symlink escape, invalid UTF-8); this module is the validation
 * boundary those assets feed.
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

import { fail, issue, ok, type ModelResult } from "./errors.js";
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

/**
 * Locate the package root by walking up for `package.json`. This works for the
 * emitted `dist/` tree and for the mirrored unit/integration build trees
 * without depending on the process CWD. S025 replaces this with the hardened
 * package-relative asset provider.
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

let ajvInstance: AjvInstance | null = null;
const compiled = new Map<string, ValidateFunction>();

function getAjv(): AjvInstance {
  if (ajvInstance === null) {
    const Ajv = nodeRequire("ajv") as AjvConstructor;
    ajvInstance = new Ajv({
      allErrors: true,
      coerceTypes: false,
      useDefaults: false,
      removeAdditional: false,
    });
  }
  return ajvInstance;
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

/** Compile (once) and return the validator for a local schema document. */
export function validatorFor(schemaFile: string): ValidateFunction {
  const existing = compiled.get(schemaFile);
  if (existing !== undefined) return existing;
  const created = getAjv().compile(loadSchemaDocument(schemaFile));
  compiled.set(schemaFile, created);
  return created;
}

/**
 * Validate `data` against a local schema. Returns the typed model result with
 * one `SCHEMA_INVALID` issue per Ajv error, carrying the logical locator.
 */
export function validateWithSchema(
  schemaFile: string,
  data: unknown,
  locator?: string,
): ModelResult<unknown> {
  const validate = validatorFor(schemaFile);
  if (validate(data)) return ok(data);
  const errors: readonly ErrorObject[] = validate.errors ?? [];
  const issues = errors.map((error) => {
    const path = error.dataPath === "" ? "/" : error.dataPath;
    return issue(
      "SCHEMA_INVALID",
      `${path} ${error.message ?? "failed schema validation"}`,
      locator,
    );
  });
  return fail(issues);
}
