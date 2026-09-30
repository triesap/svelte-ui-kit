/**
 * Deterministic canonical JSON serialization.
 *
 * Canonical semantic JSON is used for registry identity and generated metadata:
 *
 * - object keys are sorted by UTF-16 code unit (locale independent);
 * - array order is preserved, because array order is meaningful unless a
 *   specific field is documented as a sorted set;
 * - two-space indentation and exactly one trailing LF;
 * - only JSON data is accepted. Non-finite numbers, `undefined`, functions,
 *   symbols, bigints, non-plain objects (`Date`, `Map`, class instances), sparse
 *   array holes, `undefined` entries and reference cycles are rejected with a
 *   typed diagnostic instead of silently dropped, mangled into invalid JSON or
 *   overflowing the stack.
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

/** True for a plain JSON object (object literal or null-prototype record). */
function isPlainObject(value: object): boolean {
  const proto: unknown = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function unsupported(message: string): ModelError {
  return new ModelError([issue("JSON_VALUE_UNSUPPORTED", message)]);
}

function cycle(): ModelError {
  return new ModelError([
    issue("JSON_CYCLE", "cannot serialize a value that contains a cycle"),
  ]);
}

/** A safe, path-free label for a rejected non-JSON object. */
function objectLabel(value: object): string {
  const tag = Object.prototype.toString.call(value);
  const match = /^\[object ([\w.]*)\]$/.exec(tag);
  return match?.[1] === undefined || match[1] === "" ? "Object" : match[1];
}

function stringify(
  value: unknown,
  depth: number,
  ancestors: Set<object>,
): string {
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
        const reference: object = value;
        if (ancestors.has(reference)) throw cycle();
        ancestors.add(reference);
        try {
          const pad = INDENT.repeat(depth + 1);
          const items: string[] = [];
          for (let index = 0; index < value.length; index += 1) {
            if (!(index in value)) {
              throw new ModelError([
                issue(
                  "JSON_ARRAY_HOLE",
                  `cannot serialize a sparse array hole at index ${index}`,
                ),
              ]);
            }
            items.push(
              `${pad}${stringify(value[index], depth + 1, ancestors)}`,
            );
          }
          if (items.length === 0) return "[]";
          return `[\n${items.join(",\n")}\n${INDENT.repeat(depth)}]`;
        } finally {
          ancestors.delete(reference);
        }
      }
      if (!isPlainObject(value)) {
        throw unsupported(
          `cannot serialize non-JSON object [${objectLabel(value)}]`,
        );
      }
      const reference: object = value;
      if (ancestors.has(reference)) throw cycle();
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record).sort(compareCodeUnit);
      if (keys.length === 0) return "{}";
      const pad = INDENT.repeat(depth + 1);
      ancestors.add(reference);
      try {
        const entries = keys.map((key) => {
          const entry = record[key];
          if (entry === undefined) {
            throw unsupported(
              `cannot serialize undefined at key ${JSON.stringify(key)}`,
            );
          }
          return `${pad}${JSON.stringify(key)}: ${stringify(entry, depth + 1, ancestors)}`;
        });
        return `{\n${entries.join(",\n")}\n${INDENT.repeat(depth)}}`;
      } finally {
        ancestors.delete(reference);
      }
    }
    default:
      throw unsupported(`cannot serialize value of type ${typeof value}`);
  }
}

/** Serialize a JSON value canonically (sorted keys, 2-space, one LF). */
export function canonicalJson(value: unknown): string {
  return `${stringify(value, 0, new Set<object>())}\n`;
}
