/**
 * Static SvelteKit configuration inspection (S035).
 *
 * The generator must understand the *path-relevant* part of a consumer's
 * `svelte.config.*` without executing it. Executing application configuration
 * would run arbitrary user code and can have side effects, so this module
 * parses the source into a TypeScript AST and interprets only statically
 * provable, literal `kit.files.routes`/`kit.files.lib` mappings.
 *
 * It is deliberately conservative: a spread, computed key, environment
 * access, import reference, call or any other non-literal value that could
 * affect the resolved mapping yields an `unsupported` result (a typed manual
 * diagnostic), never an assumed default. Unrelated fields such as
 * `preprocess`, `kit.adapter` or `vitePlugin` are ignored entirely; their
 * values are never executed or interpreted.
 *
 * The pinned TypeScript compiler is the approved static parser (see the
 * S052/decision-4 runtime-promotion approval); no additional parser dependency
 * is introduced.
 */
import ts from "typescript";

/** Literal path mappings read from a static SvelteKit configuration. */
export interface StaticKitMapping {
  /** `kit.files.routes` when it is a literal string; otherwise `null`. */
  readonly routesDir: string | null;
  /** `kit.files.lib` when it is a literal string; otherwise `null`. */
  readonly libDir: string | null;
}

export type SvelteConfigInspection =
  | { readonly kind: "static"; readonly mapping: StaticKitMapping }
  | { readonly kind: "unsupported"; readonly reason: string };

const NO_MAPPING: StaticKitMapping = { routesDir: null, libDir: null };

function unsupported(reason: string): SvelteConfigInspection {
  return { kind: "unsupported", reason };
}

/** The literal name of a non-computed property name, or `null`. */
function literalPropertyName(name: ts.PropertyName | undefined): string | null {
  if (name === undefined) return null;
  if (ts.isIdentifier(name) || ts.isPrivateIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function isStringLiteralExpression(
  node: ts.Expression,
): node is ts.StringLiteral | ts.NoSubstitutionTemplateLiteral {
  return ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
}

/** Resolve a `const`/`let`/`var` identifier to its initializer, cycle-safe. */
function resolveExpression(
  node: ts.Expression,
  scope: ReadonlyMap<string, ts.Expression>,
  seen: ReadonlySet<string>,
): ts.Expression {
  let current = node;
  for (;;) {
    if (!ts.isIdentifier(current)) return current;
    const name = current.text;
    if (seen.has(name)) return current;
    const initializer = scope.get(name);
    if (initializer === undefined) return current;
    seen = new Set([...seen, name]);
    current = initializer;
  }
}

/**
 * Interpret a resolved `kit` object literal, collecting literal file mappings.
 * A spread or computed key makes the mapping unprovable.
 */
function inspectKitObject(
  object: ts.ObjectLiteralExpression,
  scope: ReadonlyMap<string, ts.Expression>,
): SvelteConfigInspection {
  let mapping = NO_MAPPING;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      return unsupported("`kit` contains a spread whose keys cannot be proven");
    }
    const name = literalPropertyName(property.name);
    if (name === null) {
      // A computed or otherwise non-literal key could name any kit field.
      return unsupported("`kit` contains a computed key");
    }
    if (name !== "files") continue;
    if (!ts.isPropertyAssignment(property)) {
      return unsupported("`kit.files` is not a static property assignment");
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (!ts.isObjectLiteralExpression(resolved)) {
      return unsupported("`kit.files` is not a static object literal");
    }
    const files = inspectFilesObject(resolved, scope);
    if (files.kind === "unsupported") return files;
    mapping = files.mapping;
  }
  return { kind: "static", mapping };
}

/** Interpret a `kit.files` object literal, reading only path-relevant keys. */
function inspectFilesObject(
  object: ts.ObjectLiteralExpression,
  scope: ReadonlyMap<string, ts.Expression>,
):
  | { readonly kind: "static"; readonly mapping: StaticKitMapping }
  | {
      readonly kind: "unsupported";
      readonly reason: string;
    } {
  let routesDir: string | null = null;
  let libDir: string | null = null;
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      return {
        kind: "unsupported",
        reason: "`kit.files` contains a spread whose keys cannot be proven",
      };
    }
    const name = literalPropertyName(property.name);
    if (name === null) {
      return {
        kind: "unsupported",
        reason: "`kit.files` contains a computed key",
      };
    }
    if (name !== "routes" && name !== "lib") continue;
    if (!ts.isPropertyAssignment(property)) {
      return {
        kind: "unsupported",
        reason: `\`kit.files.${name}\` is not a static property assignment`,
      };
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (!isStringLiteralExpression(resolved)) {
      return {
        kind: "unsupported",
        reason: `\`kit.files.${name}\` must be a literal string to prove the mapping`,
      };
    }
    if (name === "routes") routesDir = resolved.text;
    else libDir = resolved.text;
  }
  return { kind: "static", mapping: { routesDir, libDir } };
}

/** Interpret the top-level exported configuration object literal. */
function inspectRootObject(
  object: ts.ObjectLiteralExpression,
  scope: ReadonlyMap<string, ts.Expression>,
): SvelteConfigInspection {
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      return unsupported(
        "the exported config contains a spread whose keys cannot be proven",
      );
    }
    const name = literalPropertyName(property.name);
    if (name === null) {
      return unsupported("the exported config contains a computed key");
    }
    if (name !== "kit") continue;
    if (!ts.isPropertyAssignment(property)) {
      return unsupported("`kit` is not a static property assignment");
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (!ts.isObjectLiteralExpression(resolved)) {
      return unsupported(
        "`kit` is not a static object literal; the mapping cannot be proven",
      );
    }
    return inspectKitObject(resolved, scope);
  }
  return { kind: "static", mapping: NO_MAPPING };
}

/** Collect top-level `const`/`let`/`var` initializers by identifier name. */
function collectScope(sourceFile: ts.SourceFile): Map<string, ts.Expression> {
  const scope = new Map<string, ts.Expression>();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.initializer !== undefined
      ) {
        scope.set(declaration.name.text, declaration.initializer);
      }
    }
  }
  return scope;
}

/** Find the default-exported expression (`export default` / `module.exports`). */
function defaultExportExpression(
  sourceFile: ts.SourceFile,
): ts.Expression | null {
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      if (statement.isExportEquals) continue;
      return statement.expression;
    }
    if (ts.isExpressionStatement(statement)) {
      const expression = statement.expression;
      if (
        ts.isBinaryExpression(expression) &&
        expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
        ts.isPropertyAccessExpression(expression.left) &&
        expression.left.expression.getText(sourceFile) === "module" &&
        expression.left.name.getText(sourceFile) === "exports"
      ) {
        return expression.right;
      }
    }
  }
  return null;
}

function scriptKindFor(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  if (fileName.endsWith(".mts") || fileName.endsWith(".cts")) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.JS;
}

/**
 * Inspect a `svelte.config.*` source without executing it. Returns a literal
 * path mapping or an `unsupported` reason for anything that cannot be proven
 * statically.
 */
export function inspectSvelteConfigSource(
  fileName: string,
  source: string,
): SvelteConfigInspection {
  let sourceFile: ts.SourceFile;
  try {
    sourceFile = ts.createSourceFile(
      fileName,
      source,
      ts.ScriptTarget.Latest,
      true,
      scriptKindFor(fileName),
    );
  } catch {
    return unsupported("the configuration could not be parsed statically");
  }
  const expression = defaultExportExpression(sourceFile);
  if (expression === null) {
    return unsupported(
      "the configuration has no statically analysable default export",
    );
  }
  const scope = collectScope(sourceFile);
  const resolved = resolveExpression(expression, scope, new Set());
  if (!ts.isObjectLiteralExpression(resolved)) {
    return unsupported(
      "the default export is not a static object literal; the mapping cannot be proven",
    );
  }
  return inspectRootObject(resolved, scope);
}
