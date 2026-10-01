/**
 * Managed TypeScript export region parsing (S052).
 *
 * Registry export declarations are the source of generated public exports. The
 * managed region lives between two standalone, column-zero line comments:
 *
 *   // svelte-ui-kit:start exports
 *   // svelte-ui-kit:end exports
 *
 * The exact marker syntax is distinct from the CSS comments and is only
 * recognized when the whole line is the marker (no leading indentation). The
 * pinned TypeScript compiler parses the file so existing application export
 * declarations can be inspected for collisions; marker-like strings or template
 * contents never create a region.
 */
import ts from "typescript";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export const EXPORT_START = "// svelte-ui-kit:start exports";
export const EXPORT_END = "// svelte-ui-kit:end exports";

export interface ExportRegion {
  /** Offset of the first character of the start marker line. */
  readonly startOffset: number;
  /** Offset just past the start marker line (including its newline). */
  readonly contentStart: number;
  /** Offset of the first character of the end marker line. */
  readonly contentEnd: number;
  /** Offset just past the end marker line. */
  readonly endOffset: number;
}

export interface AppExport {
  readonly name: string;
  readonly kind: "value" | "type";
}

export interface ExportRegionParse {
  /** The managed region, or `null` when the file has no markers. */
  readonly region: ExportRegion | null;
  /** Application export names declared outside the managed region. */
  readonly appExports: readonly AppExport[];
  /** True when the file has a bare `export *` re-export. */
  readonly hasWildcardReexport: boolean;
}

interface LineSpan {
  readonly text: string;
  readonly start: number;
  readonly end: number;
}

function lineSpans(source: string): LineSpan[] {
  const lines: LineSpan[] = [];
  let start = 0;
  for (let index = 0; index <= source.length; index += 1) {
    if (index === source.length || source[index] === "\n") {
      const end = index;
      const raw = source.slice(start, end);
      lines.push({ text: raw.replace(/\r$/, ""), start, end });
      start = index + 1;
    }
  }
  return lines;
}

function markerRegion(source: string): ModelResult<ExportRegion | null> {
  const lines = lineSpans(source);
  const starts: LineSpan[] = [];
  const ends: LineSpan[] = [];
  for (const line of lines) {
    if (line.text.trimEnd() === EXPORT_START) starts.push(line);
    if (line.text.trimEnd() === EXPORT_END) ends.push(line);
  }
  if (starts.length === 0 && ends.length === 0) return ok(null);
  if (starts.length !== 1 || ends.length !== 1) {
    return fail([
      issue(
        "EXPORT_REGION_DUPLICATE",
        `expected exactly one start and one end marker, found ${starts.length} start(s) and ${ends.length} end(s)`,
      ),
    ]);
  }
  const startLine = starts[0] as LineSpan;
  const endLine = ends[0] as LineSpan;
  if (endLine.start <= startLine.end) {
    return fail([
      issue(
        "EXPORT_REGION_ORDER",
        "the export end marker appears before the start marker",
        undefined,
      ),
    ]);
  }
  return ok({
    startOffset: startLine.start,
    contentStart: startLine.end + 1,
    contentEnd: endLine.start,
    endOffset: endLine.end + 1,
  });
}

/** Collect application export names from a TypeScript/JavaScript source file. */
function collectAppExports(
  fileName: string,
  source: string,
): { readonly exports: readonly AppExport[]; readonly wildcard: boolean } {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    fileName.endsWith(".ts") ? ts.ScriptKind.TS : ts.ScriptKind.JS,
  );
  const exports: AppExport[] = [];
  let wildcard = false;

  const push = (name: string, kind: "value" | "type") => {
    exports.push({ name, kind });
  };

  for (const statement of sourceFile.statements) {
    if (ts.isExportDeclaration(statement)) {
      if (statement.exportClause === undefined) {
        wildcard = true;
        continue;
      }
      if (ts.isNamedExports(statement.exportClause)) {
        for (const element of statement.exportClause.elements) {
          const kind: "value" | "type" =
            statement.isTypeOnly || element.isTypeOnly ? "type" : "value";
          push(element.name.text, kind);
        }
        continue;
      }
      if (ts.isNamespaceExport(statement.exportClause)) {
        push(statement.exportClause.name.text, "value");
      }
      continue;
    }
    if (ts.isExportAssignment(statement)) {
      push("default", "value");
      continue;
    }
    if (!hasExportModifier(statement)) continue;
    if (
      ts.isFunctionDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isEnumDeclaration(statement) ||
      ts.isModuleDeclaration(statement)
    ) {
      if (statement.name !== undefined)
        push(statement.name.getText(sourceFile), "value");
      continue;
    }
    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement)
    ) {
      push(statement.name.getText(sourceFile), "type");
      continue;
    }
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          push(declaration.name.text, "value");
        }
      }
    }
  }
  return { exports, wildcard };
}

function hasExportModifier(statement: ts.Statement): boolean {
  const modifiers = ts.canHaveModifiers(statement)
    ? ts.getModifiers(statement)
    : undefined;
  return (
    modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ) ?? false
  );
}

/**
 * Parse the managed export region and the application's own export
 * declarations. Returns a typed failure for duplicate, misordered or ambiguous
 * marker structure.
 */
export function parseExportRegion(
  fileName: string,
  source: string,
): ModelResult<ExportRegionParse> {
  const region = markerRegion(source);
  if (!region.ok) return region;
  // Application exports are collected outside the managed region only, so a
  // previously generated region is never mistaken for application ownership.
  const managed = region.value;
  const appSource =
    managed === null
      ? source
      : source.slice(0, managed.startOffset) + source.slice(managed.endOffset);
  const collected = collectAppExports(fileName, appSource);
  return ok({
    region: managed,
    appExports: collected.exports,
    hasWildcardReexport: collected.wildcard,
  });
}

/** Generated names that collide with an application-owned declaration. */
export function findExportCollisions(
  appExports: readonly AppExport[],
  generated: readonly AppExport[],
): readonly string[] {
  const appValue = new Set<string>();
  const appType = new Set<string>();
  for (const entry of appExports) {
    if (entry.kind === "value") appValue.add(entry.name);
    else appType.add(entry.name);
  }
  const collisions: string[] = [];
  for (const entry of generated) {
    const collides =
      entry.name === "default" ||
      appValue.has(entry.name) ||
      (entry.kind === "type" && appType.has(entry.name));
    if (collides) collisions.push(entry.name);
  }
  return [...new Set(collisions)].sort();
}
