import { hasLiteralPrototypeAssignment } from "./literal-config.js";
/**
 * Static SvelteKit configuration inspection (S035).
 *
 * The generator must understand the *path-relevant* part of a consumer's
 * `svelte.config.*` without executing it. Executing application configuration
 * would run arbitrary user code and can have side effects, so this module
 * parses the source into a TypeScript AST and interprets only statically
 * provable, literal `kit.files.routes`/`kit.files.lib` mappings.
 *
 * It is deliberately conservative and inspects the *complete* relevant
 * structure: every property of the exported object and of its `kit`/`kit.files`
 * objects is examined, so a later spread, a duplicate key or a value that
 * overrides the mapping is rejected rather than silently ignored. Parse
 * diagnostics make an incomplete or malformed source unsupported instead of
 * falling back to a default. A referenced binding that is reassigned, mutated
 * or allowed to escape (assigned to another identifier, spread, or passed to a
 * call) is rejected because its final value cannot be proven.
 *
 * Unrelated fields such as `preprocess`, `kit.adapter` or `vitePlugin` are
 * ignored entirely; their values are never executed or interpreted, so an
 * ordinary static configuration with adapter/preprocessor calls remains
 * supported.
 *
 * The pinned TypeScript compiler is the approved static parser (see the
 * S052/decision-4 runtime-promotion approval); no additional parser dependency
 * is introduced.
 */
import ts from "typescript";
import path from "node:path";

/** Literal path mappings read from a static SvelteKit configuration. */
export interface StaticKitMapping {
  /** `kit.files.routes` when it is a literal string; otherwise `null`. */
  readonly routesDir: string | null;
  /** `kit.files.lib` when it is a literal string; otherwise `null`. */
  readonly libDir: string | null;
  /** Explicit files.src, retained for the native feature-version proof. */
  readonly srcDir?: string;
}

export type SvelteConfigInspection = (
  | { readonly kind: "static"; readonly mapping: StaticKitMapping }
  | {
      readonly kind: "unsupported";
      readonly reason: string;
      readonly nativeBoundary?: "extensions" | "prototype";
    }
) & { readonly minimumKitVersion?: "2.29.0" };

const NO_MAPPING: StaticKitMapping = { routesDir: null, libDir: null };

function unsupported(
  reason: string,
): Extract<SvelteConfigInspection, { kind: "unsupported" }> {
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

/** Top-level bindings and the identifiers whose final value cannot be proven. */
interface Scope {
  readonly initializers: ReadonlyMap<string, ts.Expression>;
  readonly unsafe: ReadonlySet<string>;
}

type Resolution =
  | { readonly kind: "expression"; readonly expression: ts.Expression }
  | {
      readonly kind: "unsupported";
      readonly reason: string;
      readonly nativeBoundary?: "extensions" | "prototype";
    };

/** Follow a chain of identifiers to the final expression, cycle-safe. */
function resolveExpression(
  node: ts.Expression,
  scope: Scope,
  seen: ReadonlySet<string>,
): Resolution {
  let current = node;
  let visited = seen;
  for (;;) {
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isTypeAssertionExpression(current)
    ) {
      current = current.expression;
      continue;
    }
    if (!ts.isIdentifier(current)) {
      return { kind: "expression", expression: current };
    }
    const name = current.text;
    if (scope.unsafe.has(name)) {
      return {
        kind: "unsupported",
        reason: `the referenced binding ${JSON.stringify(name)} may be reassigned or otherwise escape, so its final value cannot be proven`,
      };
    }
    if (visited.has(name)) {
      return {
        kind: "unsupported",
        reason: `the binding ${JSON.stringify(name)} is part of a reference cycle`,
      };
    }
    const initializer = scope.initializers.get(name);
    if (initializer === undefined) {
      return { kind: "expression", expression: current };
    }
    visited = new Set([...visited, name]);
    current = initializer;
  }
}

/**
 * Collect the identifiers whose binding is targeted by an assignment. Unlike a
 * plain text scan this follows the assignment *target* shape: property/element
 * access walks to its base object, array and object destructuring patterns
 * contribute their bound names, and spread elements recurse. A computed key is
 * not a bound binding, so it is not added.
 */
function collectAssignmentTargets(
  node: ts.Expression,
  into: Set<string>,
): void {
  if (ts.isIdentifier(node)) {
    into.add(node.text);
    return;
  }
  if (
    ts.isPropertyAccessExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isParenthesizedExpression(node)
  ) {
    collectAssignmentTargets(node.expression, into);
    return;
  }
  if (ts.isElementAccessExpression(node)) {
    collectAssignmentTargets(node.expression, into);
    return;
  }
  if (ts.isArrayLiteralExpression(node)) {
    for (const element of node.elements) {
      collectAssignmentTargets(element, into);
    }
    return;
  }
  if (ts.isObjectLiteralExpression(node)) {
    for (const property of node.properties) {
      if (ts.isShorthandPropertyAssignment(property)) {
        into.add(property.name.text);
      } else if (ts.isPropertyAssignment(property)) {
        collectAssignmentTargets(property.initializer, into);
      } else if (ts.isSpreadAssignment(property)) {
        collectAssignmentTargets(property.expression, into);
      }
    }
    return;
  }
  if (ts.isSpreadElement(node)) {
    collectAssignmentTargets(node.expression, into);
  }
}

/** True when `node` is an assignment operator (`=`, `+=`, …). */
function isAssignmentOperator(kind: ts.SyntaxKind): boolean {
  return (
    kind >= ts.SyntaxKind.FirstAssignment &&
    kind <= ts.SyntaxKind.LastAssignment
  );
}

/** Collect every identifier name referenced inside `node`. */
function collectReferencedNames(node: ts.Node, into: Set<string>): void {
  if (ts.isIdentifier(node)) into.add(node.text);
  ts.forEachChild(node, (child) => collectReferencedNames(child, into));
}

/**
 * Collect top-level `const`/`let`/`var` initializers and identify bindings
 * whose value can no longer be proven: ones that are reassigned, updated or
 * deleted, aliased to another identifier, spread, or passed to a call.
 */
function collectScope(sourceFile: ts.SourceFile): Scope {
  const initializers = new Map<string, ts.Expression>();
  const declared = new Set<string>();
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        declared.add(declaration.name.text);
        if (declaration.initializer !== undefined) {
          initializers.set(declaration.name.text, declaration.initializer);
        }
      }
    }
  }

  const unsafe = new Set<string>();
  const mark = (name: string | null): void => {
    if (name !== null && declared.has(name)) unsafe.add(name);
  };
  const markTarget = (target: ts.Expression): void => {
    const names = new Set<string>();
    collectAssignmentTargets(target, names);
    for (const name of names) mark(name);
  };

  const visit = (node: ts.Node): void => {
    if (
      ts.isBinaryExpression(node) &&
      isAssignmentOperator(node.operatorToken.kind)
    ) {
      markTarget(node.left);
    } else if (
      (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
      (node.operator === ts.SyntaxKind.PlusPlusToken ||
        node.operator === ts.SyntaxKind.MinusMinusToken)
    ) {
      markTarget(node.operand);
    } else if (ts.isDeleteExpression(node)) {
      markTarget(node.expression);
    } else if (ts.isSpreadElement(node) || ts.isSpreadAssignment(node)) {
      const names = new Set<string>();
      collectReferencedNames(node.expression, names);
      for (const name of names) mark(name);
    } else if (
      ts.isCallExpression(node) ||
      ts.isNewExpression(node) ||
      ts.isTaggedTemplateExpression(node)
    ) {
      const names = new Set<string>();
      ts.forEachChild(node, (child) => collectReferencedNames(child, names));
      for (const name of names) mark(name);
    } else if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      ts.isIdentifier(node.initializer)
    ) {
      // `const alias = config;` — the original binding escapes.
      mark(node.initializer.text);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  // A binding whose value is derived from a mutated/escaping binding can no
  // longer be proven either (for example `const alias = config.kit` followed by
  // `alias.files = …`). Propagate uncertainty through initializer references to
  // a fixed point so the underlying configuration object is rejected too.
  let changed = true;
  while (changed) {
    changed = false;
    for (const name of [...unsafe]) {
      const initializer = initializers.get(name);
      if (initializer === undefined) continue;
      const referenced = new Set<string>();
      collectReferencedNames(initializer, referenced);
      for (const reference of referenced) {
        if (declared.has(reference) && !unsafe.has(reference)) {
          unsafe.add(reference);
          changed = true;
        }
      }
    }
  }

  return { initializers, unsafe };
}

/** Inspect a `kit.files` object literal, reading only path-relevant keys. */
function inspectFilesObject(
  object: ts.ObjectLiteralExpression,
  scope: Scope,
): SvelteConfigInspection {
  let routesDir: string | null = null;
  let libDir: string | null = null;
  let srcDir: string | null = null;
  const seen = new Set<string>();
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      return unsupported(
        "`kit.files` contains a spread whose keys cannot be proven",
      );
    }
    const name = literalPropertyName(property.name);
    if (name === null) {
      return unsupported("`kit.files` contains a computed key");
    }
    if (seen.has(name)) {
      return unsupported(
        `\`kit.files\` declares ${JSON.stringify(name)} more than once, so the effective mapping cannot be proven`,
      );
    }
    seen.add(name);
    if (name !== "routes" && name !== "lib" && name !== "src") continue;
    if (!ts.isPropertyAssignment(property)) {
      return unsupported(
        `\`kit.files.${name}\` is not a static property assignment`,
      );
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (resolved.kind === "unsupported") return unsupported(resolved.reason);
    if (!isStringLiteralExpression(resolved.expression)) {
      return unsupported(
        `\`kit.files.${name}\` must be a literal string to prove the mapping`,
      );
    }
    if (name === "routes") routesDir = resolved.expression.text;
    else if (name === "lib") libDir = resolved.expression.text;
    else srcDir = resolved.expression.text;
  }
  return {
    kind: "static",
    mapping: {
      routesDir:
        routesDir ??
        (srcDir === null ? null : path.posix.join(srcDir, "routes")),
      libDir:
        libDir ?? (srcDir === null ? null : path.posix.join(srcDir, "lib")),
      ...(srcDir === null ? {} : { srcDir }),
    },
  };
}

/**
 * Inspect a `kit` object literal, collecting literal file mappings. A spread,
 * duplicate key or computed key makes the mapping unprovable.
 */
function inspectKitObject(
  object: ts.ObjectLiteralExpression,
  scope: Scope,
): SvelteConfigInspection {
  let mapping: StaticKitMapping | null = null;
  const seen = new Set<string>();
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      return unsupported("`kit` contains a spread whose keys cannot be proven");
    }
    const name = literalPropertyName(property.name);
    if (name === null) {
      return unsupported("`kit` contains a computed key");
    }
    if (seen.has(name)) {
      return unsupported(
        `\`kit\` declares ${JSON.stringify(name)} more than once, so the effective mapping cannot be proven`,
      );
    }
    seen.add(name);
    if (name !== "files") continue;
    if (!ts.isPropertyAssignment(property)) {
      return unsupported("`kit.files` is not a static property assignment");
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (resolved.kind === "unsupported") return unsupported(resolved.reason);
    if (!ts.isObjectLiteralExpression(resolved.expression)) {
      return unsupported("`kit.files` is not a static object literal");
    }
    const files = inspectFilesObject(resolved.expression, scope);
    if (files.kind === "unsupported") return files;
    mapping = files.mapping;
  }
  return { kind: "static", mapping: mapping ?? NO_MAPPING };
}

/** Inspect the complete top-level exported configuration object literal. */
function inspectRootObject(
  object: ts.ObjectLiteralExpression,
  scope: Scope,
): SvelteConfigInspection {
  let result: SvelteConfigInspection | null = null;
  const seen = new Set<string>();
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
    if (seen.has(name)) {
      return unsupported(
        `the exported config declares ${JSON.stringify(name)} more than once, so the effective mapping cannot be proven`,
      );
    }
    seen.add(name);
    if (name !== "kit") continue;
    if (!ts.isPropertyAssignment(property)) {
      return unsupported("`kit` is not a static property assignment");
    }
    const resolved = resolveExpression(property.initializer, scope, new Set());
    if (resolved.kind === "unsupported") return unsupported(resolved.reason);
    if (!ts.isObjectLiteralExpression(resolved.expression)) {
      return unsupported(
        "`kit` is not a static object literal; the mapping cannot be proven",
      );
    }
    result = inspectKitObject(resolved.expression, scope);
    if (result.kind === "unsupported") return result;
  }
  return result ?? { kind: "static", mapping: NO_MAPPING };
}

/** Find every default-export candidate (`export default` / `module.exports =`). */
function defaultExportExpressions(sourceFile: ts.SourceFile): ts.Expression[] {
  const found: ts.Expression[] = [];
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement)) {
      if (statement.isExportEquals) continue;
      found.push(statement.expression);
      continue;
    }
    if (!ts.isExpressionStatement(statement)) continue;
    const expression = statement.expression;
    if (
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(expression.left) &&
      ts.isIdentifier(expression.left.expression) &&
      expression.left.expression.text === "module" &&
      expression.left.name.text === "exports"
    ) {
      found.push(expression.right);
    }
  }
  return found;
}

function scriptKindFor(fileName: string): ts.ScriptKind {
  if (fileName.endsWith(".ts")) return ts.ScriptKind.TS;
  if (fileName.endsWith(".mts") || fileName.endsWith(".cts")) {
    return ts.ScriptKind.TS;
  }
  return ts.ScriptKind.JS;
}

/** Read the TypeScript parser's own recovered syntax diagnostics. */
function parseDiagnostics(sourceFile: ts.SourceFile): readonly ts.Diagnostic[] {
  const internal = sourceFile as ts.SourceFile & {
    parseDiagnostics?: readonly ts.Diagnostic[];
  };
  return internal.parseDiagnostics ?? [];
}

/**
 * Inspect a `svelte.config.*` source without executing it. Returns a literal
 * path mapping or an `unsupported` reason for anything that cannot be proven
 * statically.
 */
type ResolvedConfigSource =
  | {
      readonly kind: "object";
      readonly object: ts.ObjectLiteralExpression;
      readonly scope: Scope;
    }
  | Extract<SvelteConfigInspection, { kind: "unsupported" }>;
function resolveSvelteConfigSource(
  fileName: string,
  source: string,
): ResolvedConfigSource {
  if (Buffer.byteLength(source, "utf8") > 1024 * 1024)
    return unsupported(
      "configuration exceeds the supported 1 MiB bound",
    ) as Extract<SvelteConfigInspection, { kind: "unsupported" }>;
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
  const diagnostics = parseDiagnostics(sourceFile);
  if (diagnostics.length > 0) {
    const first = diagnostics[0];
    const detail =
      first === undefined
        ? "a syntax error"
        : ts.flattenDiagnosticMessageText(first.messageText, " ");
    return unsupported(`the configuration has a static parse error: ${detail}`);
  }
  if (hasLiteralPrototypeAssignment(sourceFile))
    return {
      kind: "unsupported",
      reason:
        "Prototype-producing literal configuration properties are unsupported",
      nativeBoundary: "prototype",
    };
  const expressions = defaultExportExpressions(sourceFile);
  if (expressions.length === 0) {
    return unsupported(
      "the configuration has no statically analysable default export",
    );
  }
  if (expressions.length > 1) {
    return unsupported(
      "the configuration assigns its default export more than once, so the effective mapping cannot be proven",
    );
  }
  const expression = expressions[0] as ts.Expression;
  const scope = collectScope(sourceFile);
  const resolved = resolveExpression(expression, scope, new Set());
  if (resolved.kind === "unsupported") return unsupported(resolved.reason);
  if (!ts.isObjectLiteralExpression(resolved.expression)) {
    return unsupported(
      "the default export is not a static object literal; the mapping cannot be proven",
    );
  }
  return { kind: "object", object: resolved.expression, scope };
}
export function inspectSvelteConfigSource(
  fileName: string,
  source: string,
): SvelteConfigInspection {
  const resolved = resolveSvelteConfigSource(fileName, source);
  return resolved.kind === "unsupported"
    ? resolved
    : inspectRootObject(resolved.object, resolved.scope);
}
type ObjectPropertyEvidence =
  | { kind: "absent" }
  | { kind: "unknown" }
  | { kind: "object"; object: ts.ObjectLiteralExpression };
function objectPropertyEvidence(
  object: ts.ObjectLiteralExpression,
  key: string,
  scope: Scope,
): ObjectPropertyEvidence {
  const seen = new Set<string>();
  let found: ts.ObjectLiteralElementLike | undefined;
  for (const property of object.properties) {
    const name = literalPropertyName(property.name);
    if (ts.isSpreadAssignment(property) || name === null || seen.has(name))
      return { kind: "unknown" };
    seen.add(name);
    if (name === key) found = property;
  }
  if (!found) return { kind: "absent" };
  if (!ts.isPropertyAssignment(found)) return { kind: "unknown" };
  const value = resolveExpression(found.initializer, scope, new Set());
  return value.kind === "expression" &&
    ts.isObjectLiteralExpression(value.expression)
    ? { kind: "object", object: value.expression }
    : { kind: "unknown" };
}
/** Prove absence before allowing old-version manual mapping; source order never drops feature requirements. */
function requiresSourceDirectorySupport(
  object: ts.ObjectLiteralExpression,
  scope: Scope,
): boolean {
  const kit = objectPropertyEvidence(object, "kit", scope);
  if (kit.kind !== "object") return kit.kind === "unknown";
  const files = objectPropertyEvidence(kit.object, "files", scope);
  if (files.kind !== "object") return files.kind === "unknown";
  const seen = new Set<string>();
  for (const property of files.object.properties) {
    const name = literalPropertyName(property.name);
    if (
      ts.isSpreadAssignment(property) ||
      name === null ||
      seen.has(name) ||
      name === "src"
    )
      return true;
    seen.add(name);
  }
  return false;
}
/** Native generation must prove that +layout.svelte is an active route extension. */
export function inspectNativeSvelteConfigSource(
  fileName: string,
  source: string,
): SvelteConfigInspection {
  const resolved = resolveSvelteConfigSource(fileName, source);
  if (resolved.kind === "unsupported")
    return {
      ...resolved,
      nativeBoundary: resolved.nativeBoundary ?? "extensions",
    };
  const refuse = (reason: string): SvelteConfigInspection => ({
    kind: "unsupported",
    reason,
    nativeBoundary: "extensions",
  });
  const seen = new Set<string>();
  for (const property of resolved.object.properties) {
    const name = literalPropertyName(property.name);
    if (ts.isSpreadAssignment(property) || name === null || seen.has(name))
      return refuse(
        "Native route extensions require unique statically proven root keys",
      );
    seen.add(name);
    if (name !== "extensions") continue;
    if (!ts.isPropertyAssignment(property))
      return refuse(
        "Native route extensions require a literal ['.svelte'] array",
      );
    const value = resolveExpression(
      property.initializer,
      resolved.scope,
      new Set(),
    );
    if (
      value.kind !== "expression" ||
      !ts.isArrayLiteralExpression(value.expression) ||
      value.expression.elements.length !== 1
    )
      return refuse("Only the default .svelte route extension is supported");
    const element = value.expression.elements[0];
    if (!ts.isStringLiteral(element) || element.text !== ".svelte")
      return refuse("Only the default .svelte route extension is supported");
  }
  return {
    ...inspectRootObject(resolved.object, resolved.scope),
    ...(requiresSourceDirectorySupport(resolved.object, resolved.scope)
      ? { minimumKitVersion: "2.29.0" as const }
      : {}),
  };
}
