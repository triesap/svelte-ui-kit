/** Explicit project schema dispatch; v1 has no approved migration transition. */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { INITIAL_SCHEMA_VERSION } from "../registry/versions.js";

export type ProjectDocumentKind = "config" | "lock";
const legacyConfigFields = [
  "leptos",
  "leptosVersion",
  "frameworkVersion",
  "ui",
  "components",
  "style",
  "layout",
  "aliases",
  "tailwind",
  "rsc",
  "tsx",
  "$schema",
] as const;

/**
 * Choose only the explicitly supported schema before its strict parser runs.
 * Other version axes are deliberately ignored. Unknown current-schema fields
 * remain subject to the full schema; no field removal/coercion is a migration.
 */
export function selectProjectSchema(
  value: unknown,
  kind: ProjectDocumentKind,
  locator: string,
): ModelResult<number> {
  if (value === null || typeof value !== "object" || Array.isArray(value))
    return fail([
      issue(
        "SCHEMA_INVALID",
        `The ${kind} must be a versioned object; no migration was attempted.`,
        locator,
      ),
    ]);
  const record = value as Record<string, unknown>;
  const version = record["schemaVersion"];
  if (version !== INITIAL_SCHEMA_VERSION)
    return fail([
      issue(
        "SCHEMA_INVALID",
        `Unsupported ${kind} schemaVersion; only integer ${INITIAL_SCHEMA_VERSION} is supported. Older, future and framework-derived schemas require an explicitly specified migration; none was attempted.`,
        locator,
      ),
    ]);
  if (
    kind === "config" &&
    legacyConfigFields.some((field) => Object.hasOwn(record, field))
  )
    return fail([
      issue(
        "SCHEMA_INVALID",
        "Unsupported legacy/source-only configuration fields. Leptos and shadcn configuration are not Svelte kit configuration; no aliases or migration were applied.",
        locator,
      ),
    ]);
  return ok(INITIAL_SCHEMA_VERSION);
}
