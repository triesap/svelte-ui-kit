/**
 * Deterministic canonical JSON serialization.
 *
 * Canonical semantic JSON is used for registry identity and generated metadata:
 *
 * - object keys are sorted by UTF-16 code unit (locale independent);
 * - array order is preserved, because array order is meaningful unless a
 *   specific field is documented as a sorted set;
 * - two-space indentation and exactly one trailing LF;
 * - non-finite numbers and non-JSON values (`undefined`, functions, symbols,
 *   bigints) are rejected instead of silently dropped.
 *
 * This is deliberately *not* the same as the exact-byte hashing in
 * `./digest.ts`: an application's CRLF, comments and formatter output must
 * never be normalized to hide edits. Semantic serialization is only for
 * tool-generated metadata.
 */
import { issue, ModelError } from "../registry/errors.js";

const INDENT = "  ";

function compareCodeUnit(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function stringify(value: unknown, depth: number): string {
  if (value === null) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) {
        throw new ModelError([
          issue(
            "JSON_NUMBER_NONFINITE",
            `cannot serialize non-finite number ${String(value)}`,
          ),
        ]);
      }
      return JSON.stringify(value);
    case "string":
      return JSON.stringify(value);
    case "object": {
      if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        const pad = INDENT.repeat(depth + 1);
        const items = value.map(
          (entry) => `${pad}${stringify(entry, depth + 1)}`,
        );
        return `[\n${items.join(",\n")}\n${INDENT.repeat(depth)}]`;
      }
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort(compareCodeUnit);
      if (keys.length === 0) return "{}";
      const pad = INDENT.repeat(depth + 1);
      const entries = keys.map((key) => {
        const entry = record[key];
        if (entry === undefined) {
          throw new ModelError([
            issue(
              "JSON_VALUE_UNSUPPORTED",
              `cannot serialize undefined at key ${JSON.stringify(key)}`,
            ),
          ]);
        }
        return `${pad}${JSON.stringify(key)}: ${stringify(entry, depth + 1)}`;
      });
      return `{\n${entries.join(",\n")}\n${INDENT.repeat(depth)}}`;
    }
    default:
      throw new ModelError([
        issue(
          "JSON_VALUE_UNSUPPORTED",
          `cannot serialize value of type ${typeof value}`,
        ),
      ]);
  }
}

/** Serialize a JSON value canonically (sorted keys, 2-space, one LF). */
export function canonicalJson(value: unknown): string {
  return `${stringify(value, 0)}\n`;
}
