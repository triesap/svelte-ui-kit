/**
 * Managed TypeScript export region parsing (S052).
 *
 * Registry export declarations are the source of generated public exports. The
 * managed region lives between two standalone, column-zero line comments:
 *
 *   // svelte-ui-kit:start exports
 *   // svelte-ui-kit:end exports
 *
 * Markers are recognized from the actual TypeScript scanner tokens, so a
 * marker-like sequence inside a string, template literal or block comment never
 * creates a region. The pinned TypeScript compiler also parses the file, so a
 * source with a syntax error fails closed and a malformed reserved comment is a
 * typed failure. Existing application export declarations (including
 * destructured and aliased names) are inspected for collisions.
 */
import ts from "typescript";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export const EXPORT_START = "// svelte-ui-kit:start exports";
export const EXPORT_END = "// svelte-ui-kit:end exports";
const RESERVED_PREFIX = "// svelte-ui-kit:";

export interface ExportRegion {
  /** Offset of the first character of the start marker line. */
  readonly startOffset: number;
  /** Offset just past the start marker line (including its newline). */
  readonly contentStart: number;
  /** Offset of the first character of the end marker line. */
  readonly contentEnd: number;
  /** Offset just past the end marker line (including its newline). */
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

function scriptKindFor(fileName: string): ts.ScriptKind {
  if (
    fileName.endsWith(".ts") ||
    fileName.endsWith(".mts") ||
    fileName.endsWith(".cts")
  ) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.JS;
}

function parseDiagnostics(sourceFile: ts.SourceFile): readonly ts.Diagnostic[] {
  const internal = sourceFile as ts.SourceFile & {
    parseDiagnostics?: readonly ts.Diagnostic[];
  };
  return internal.parseDiagnostics ?? [];
}

/** Index just past the newline that terminates the line starting at `pos`. */
function lineEnd(source: string, pos: number): number {
  const newline = source.indexOf("\n", pos);
  return newline === -1 ? source.length : newline + 1;
}

interface MarkerSpan {
  readonly start: number;
  readonly contentStart: number;
  readonly contentEnd: number;
  readonly endOffset: number;
}

/**
 * Locate the managed region from standalone column-zero scanner comments. A
 * reserved comment that is not a valid start/end marker is a typed failure.
 */
function markerRegion(
  fileName: string,
  source: string,
): ModelResult<ExportRegion | null> {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    scriptKindFor(fileName),
  );
  const diagnostics = parseDiagnostics(sourceFile);
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    const detail =
      first === undefined
        ? "a syntax error"
        : ts.flattenDiagnosticMessageText(first.messageText, " ");
    return fail([
      issue(
        "EXPORT_PARSE_INVALID",
        `the export source has a static parse error: ${detail}`,
      ),
    ]);
  }

  const starts: number[] = [];
  const ends: number[] = [];
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.Standard,
    source,
  );
  let token = scanner.scan();
  while (token !== ts.SyntaxKind.EndOfFileToken) {
    if (token === ts.SyntaxKind.SingleLineCommentTrivia) {
      const pos = scanner.getTokenPos();
      const text = scanner.getTokenText();
      const atLineStart = pos === 0 || source[pos - 1] === "\n";
      const trimmed = text.replace(/\r$/, "").trimEnd();
      if (atLineStart && trimmed.startsWith(RESERVED_PREFIX)) {
        if (trimmed === EXPORT_START) starts.push(pos);
        else if (trimmed === EXPORT_END) ends.push(pos);
        else {
          return fail([
            issue(
              "EXPORT_MARKER_MALFORMED",
              `reserved marker comment ${JSON.stringify(trimmed)} is not a valid start/end marker`,
            ),
          ]);
        }
      }
    }
    token = scanner.scan();
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
  const startPos = starts[0] as number;
  const endPos = ends[0] as number;
  if (endPos <= startPos) {
    return fail([
      issue(
        "EXPORT_REGION_ORDER",
        "the export end marker appears before the start marker",
      ),
    ]);
  }
  const region: MarkerSpan = {
    start: startPos,
    contentStart: lineEnd(source, startPos),
    contentEnd: endPos,
    endOffset: lineEnd(source, endPos),
  };
  return ok({
    startOffset: region.start,
    contentStart: region.contentStart,
    contentEnd: region.contentEnd,
    endOffset: region.endOffset,
  });
}

/** Collect every identifier bound by a binding name (including destructuring). */
function collectBindingNames(
  name: ts.BindingName,
  push: (name: string) => void,
): void {
  if (ts.isIdentifier(name)) {
    push(name.text);
    return;
  }
  for (const element of name.elements) {
    if (ts.isOmittedExpression(element)) continue;
    collectBindingNames(element.name, push);
  }
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
    scriptKindFor(fileName),
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
        collectBindingNames(declaration.name, (name) => push(name, "value"));
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
 * declarations. Returns a typed failure for a syntax error, a malformed
 * reserved comment or duplicate/misordered marker structure.
 */
export function parseExportRegion(
  fileName: string,
  source: string,
): ModelResult<ExportRegionParse> {
  const region = markerRegion(fileName, source);
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
