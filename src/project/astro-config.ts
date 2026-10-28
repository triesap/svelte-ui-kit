/** Bounded static Astro integration evidence; application modules are never loaded. */
import ts from "typescript";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export function inspectAstroConfig(
  source: string,
  file: string,
): ModelResult<null> {
  const unsupported = (reason: string) =>
    fail([
      issue(
        "PROJECT_ASTRO_CONFIG_UNSUPPORTED",
        `${reason}; use a direct literal default object or defineConfig({ integrations: [svelte()] }) with imports from astro/config and @astrojs/svelte.`,
        file,
      ),
    ]);
  const parsed = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (
    (parsed as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] })
      .parseDiagnostics.length
  )
    return unsupported("Astro configuration is malformed");
  const factories = new Set<string>(),
    integrations = new Set<string>();
  const exports: ts.Expression[] = [];
  for (const statement of parsed.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      if (statement.moduleSpecifier.text === "@astrojs/svelte" && clause?.name)
        integrations.add(clause.name.text);
      if (
        statement.moduleSpecifier.text === "astro/config" &&
        clause?.namedBindings &&
        ts.isNamedImports(clause.namedBindings)
      ) {
        for (const binding of clause.namedBindings.elements)
          if (
            !binding.isTypeOnly &&
            (binding.propertyName ?? binding.name).text === "defineConfig"
          )
            factories.add(binding.name.text);
      }
    } else if (ts.isExportAssignment(statement) && !statement.isExportEquals)
      exports.push(statement.expression);
    else if (
      !ts.isInterfaceDeclaration(statement) &&
      !ts.isTypeAliasDeclaration(statement) &&
      !ts.isEmptyStatement(statement)
    )
      return unsupported(
        "Top-level computed or executable configuration is not statically supported",
      );
  }
  if (exports.length !== 1 || integrations.size !== 1)
    return unsupported(
      "A unique default export and Svelte integration import are required",
    );
  let expression = exports[0];
  const unwrap = (value: ts.Expression): ts.Expression => {
    while (
      ts.isParenthesizedExpression(value) ||
      ts.isAsExpression(value) ||
      ts.isSatisfiesExpression(value)
    )
      value = value.expression;
    return value;
  };
  expression = unwrap(expression);
  if (ts.isCallExpression(expression)) {
    if (
      !ts.isIdentifier(expression.expression) ||
      !factories.has(expression.expression.text) ||
      expression.arguments.length !== 1
    )
      return unsupported("The default configuration factory cannot be proven");
    expression = unwrap(expression.arguments[0]);
  }
  if (!ts.isObjectLiteralExpression(expression))
    return unsupported("The default configuration is not a literal object");
  let array: ts.ArrayLiteralExpression | undefined;
  const keys = new Set<string>();
  for (const property of expression.properties) {
    if (
      !ts.isPropertyAssignment(property) ||
      (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
    )
      return unsupported(
        "Spread, computed or shorthand configuration properties are unsupported",
      );
    const key = property.name.text;
    if (keys.has(key))
      return unsupported("Duplicate configuration properties are ambiguous");
    keys.add(key);
    if (
      key === "root" &&
      (!ts.isStringLiteral(property.initializer) ||
        ![".", "./"].includes(property.initializer.text))
    )
      return unsupported(
        "A root outside the selected package cannot be proven",
      );
    if (key === "integrations") {
      if (!ts.isArrayLiteralExpression(property.initializer))
        return unsupported("integrations must be a literal array");
      array = property.initializer;
    }
  }
  if (!array || array.elements.length !== 1)
    return unsupported(
      "Exactly one statically supported Svelte integration is required",
    );
  const element = array.elements[0];
  if (
    !ts.isCallExpression(element) ||
    !ts.isIdentifier(element.expression) ||
    !integrations.has(element.expression.text) ||
    element.arguments.length !== 0
  )
    return unsupported(
      "The Svelte integration must be a direct imported call without computed options",
    );
  return ok(null);
}
