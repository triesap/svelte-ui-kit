/**
 * Minimal Svelte layout import patching (S056).
 *
 * Inserts only the missing approved stylesheet imports into the instance script,
 * in the required order (kit, then themes, then app). Existing imports, comments
 * and rendering are preserved; the module script is never touched. When the
 * layout has no instance script, one is created.
 *
 * Import detection uses the actual TypeScript parsed import declarations of the
 * script content, not line regexes: an inline one-line import list is never
 * duplicated, and a marker-like `import` inside a comment or template literal
 * never suppresses a real insertion. Each missing import is placed in its
 * correct gap relative to the already-present approved imports; a genuinely
 * unsafe order, or an approved import that lives in the module script, is a
 * precise nonmutating conflict.
 */
import ts from "typescript";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { parseSvelteLayout } from "./svelte-parse.js";

export interface LayoutImport {
  readonly specifier: string;
}

interface ParsedImport {
  readonly specifier: string;
  readonly start: number;
  readonly end: number;
  readonly typeOnly: boolean;
}

/** Parse real import declarations from one script's content. */
function parseScriptImports(content: string): readonly ParsedImport[] {
  const sourceFile = ts.createSourceFile(
    "layout-script.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const imports: ParsedImport[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (!ts.isStringLiteral(specifier)) continue;
    imports.push({
      specifier: specifier.text,
      start: statement.getStart(sourceFile),
      end: statement.end,
      typeOnly: statement.importClause?.isTypeOnly ?? false,
    });
  }
  return imports;
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

  const moduleImports =
    info.module === null
      ? []
      : parseScriptImports(
          source.slice(info.module.start, info.module.end),
        ).filter((entry) => !entry.typeOnly);
  const inModule = desired.filter((specifier) =>
    moduleImports.some((entry) => entry.specifier === specifier),
  );
  if (inModule.length > 0) {
    return fail([
      issue(
        "LAYOUT_IMPORT_MODULE_CONFLICT",
        `the approved stylesheet import ${JSON.stringify(inModule[0])} lives in the module script; move it into the instance script manually so the kit/themes/app order can be guaranteed`,
      ),
    ]);
  }

  if (info.instance === null) {
    if (desired.length === 0) return ok(source);
    const block = `<script>\n${desired.map(importLine).join("\n")}\n</script>\n`;
    return ok(block + source);
  }

  const content = source.slice(info.instance.start, info.instance.end);
  const instanceImports = parseScriptImports(content).filter(
    (entry) => !entry.typeOnly,
  );
  const approved = desired
    .map((specifier, index) => ({ specifier, index }))
    .map((entry) => ({
      ...entry,
      statement: instanceImports.find(
        (candidate) => candidate.specifier === entry.specifier,
      ),
    }))
    .filter(
      (
        entry,
      ): entry is {
        specifier: string;
        index: number;
        statement: ParsedImport;
      } => entry.statement !== undefined,
    )
    .sort((left, right) => left.statement.start - right.statement.start);

  // Present approved imports must appear in the required relative order.
  let cursor = -1;
  for (const entry of approved) {
    if (entry.index < cursor) {
      return fail([
        issue(
          "LAYOUT_IMPORT_ORDER",
          `existing layout imports place ${JSON.stringify(entry.specifier)} out of the required kit/themes/app order; correct the order manually rather than reordering unrelated application code`,
        ),
      ]);
    }
    cursor = entry.index;
  }

  const presentIndices = new Set(approved.map((entry) => entry.index));
  const missing = desired
    .map((specifier, index) => ({ specifier, index }))
    .filter((entry) => !presentIndices.has(entry.index));
  if (missing.length === 0) return ok(source);

  const beforeGroups = new Map<number, string[]>();
  const afterGroups = new Map<number, string[]>();
  const leading: string[] = [];
  const appendGroup = (
    groups: Map<number, string[]>,
    key: number,
    specifier: string,
  ): void => {
    const existing = groups.get(key);
    if (existing === undefined) groups.set(key, [specifier]);
    else existing.push(specifier);
  };

  for (const entry of missing) {
    const before = approved.find(
      (candidate) =>
        candidate.index > entry.index && candidate.statement.start >= 0,
    );
    if (before !== undefined) {
      appendGroup(
        beforeGroups,
        info.instance.start + before.statement.start,
        entry.specifier,
      );
      continue;
    }
    const after = [...approved]
      .reverse()
      .find((candidate) => candidate.index < entry.index);
    if (after !== undefined) {
      appendGroup(
        afterGroups,
        info.instance.start + after.statement.end,
        entry.specifier,
      );
      continue;
    }
    leading.push(entry.specifier);
  }

  const insertions: { at: number; text: string }[] = [];
  for (const [start, specs] of beforeGroups) {
    insertions.push({
      at: start,
      text: `${specs.map(importLine).join("\n")}\n`,
    });
  }
  for (const [end, specs] of afterGroups) {
    insertions.push({
      at: end,
      text: `\n${specs.map(importLine).join("\n")}`,
    });
  }
  if (leading.length > 0) {
    insertions.push({
      at: info.instance.start,
      text: `${leading.map(importLine).join("\n")}\n`,
    });
  }

  let output = source;
  for (const insertion of [...insertions].sort(
    (left, right) => right.at - left.at,
  )) {
    output =
      output.slice(0, insertion.at) +
      insertion.text +
      output.slice(insertion.at);
  }
  return ok(output);
}
