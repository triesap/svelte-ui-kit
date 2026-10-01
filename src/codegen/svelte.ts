/**
 * Minimal Svelte layout import patching (S056).
 *
 * Inserts only the missing approved stylesheet imports into the instance script,
 * in the required order (kit, then themes, then app). Existing imports, comments
 * and rendering are preserved; the module script is never touched. When the
 * layout has no instance script, one is created. If the existing imports place
 * the approved specifiers out of the required relative order and cannot be
 * corrected without moving unrelated application code, a precise conflict is
 * returned instead of a guessed mutation.
 */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { parseSvelteLayout } from "./svelte-parse.js";

export interface LayoutImport {
  readonly specifier: string;
}

export interface ImportStatement {
  readonly start: number;
  readonly end: number;
  readonly specifier: string;
}

const IMPORT_LINE =
  /^[ \t]*import\s+(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["'][ \t]*;?/;

function findImportStatements(
  source: string,
  from: number,
  to: number,
): readonly ImportStatement[] {
  const result: ImportStatement[] = [];
  let lineStart = 0;
  for (let index = 0; index <= source.length; index += 1) {
    if (index === source.length || source[index] === "\n") {
      const lineEnd = index;
      if (lineStart >= from && lineEnd <= to) {
        const line = source.slice(lineStart, lineEnd);
        const match = IMPORT_LINE.exec(line);
        if (match) {
          result.push({
            start: lineStart,
            end: lineEnd,
            specifier: match[1] as string,
          });
        }
      }
      lineStart = index + 1;
    }
  }
  return result;
}

function importLine(specifier: string): string {
  return `import "${specifier}";`;
}

/**
 * Patch the layout so every approved import is present in order. No instance
 * script means one is created before the document body.
 */
export function patchLayoutImports(
  source: string,
  imports: readonly LayoutImport[],
): ModelResult<string> {
  const desired = imports.map((entry) => entry.specifier);
  const parsed = parseSvelteLayout(source);
  if (!parsed.ok) return parsed;
  const info = parsed.value;

  if (info.instance === null) {
    if (desired.length === 0) return ok(source);
    const block = `<script>\n${desired.map(importLine).join("\n")}\n</script>\n`;
    return ok(block + source);
  }

  const statements = findImportStatements(
    source,
    info.instance.start,
    info.instance.end,
  );
  const present = statements
    .map((statement) => statement.specifier)
    .filter((specifier) => desired.includes(specifier));

  // Present approved imports must appear in the required relative order.
  let cursor = -1;
  for (const specifier of present) {
    const position = desired.indexOf(specifier);
    if (position < cursor) {
      return fail([
        issue(
          "LAYOUT_IMPORT_ORDER",
          `existing layout imports place ${JSON.stringify(specifier)} out of the required kit/themes/app order; correct the order manually rather than reordering unrelated application code`,
        ),
      ]);
    }
    cursor = position;
  }

  const missing = desired.filter((specifier) => !present.includes(specifier));
  if (missing.length === 0) return ok(source);

  const lastApproved = [...statements]
    .reverse()
    .find((statement) => desired.includes(statement.specifier));
  const lastImport = [...statements].reverse()[0];
  const anchor = lastApproved ?? lastImport;
  const insertAt = anchor === undefined ? info.instance.start : anchor.end;

  const insertion = `\n${missing.map(importLine).join("\n")}`;
  return ok(source.slice(0, insertAt) + insertion + source.slice(insertAt));
}
