import { hasLiteralPrototypeAssignment } from "./literal-config.js";
/** Shared bounded literal plugin configuration proof; consumer code is never loaded. */
import ts from "typescript";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export interface StaticPluginConfigContract {
  readonly title: string;
  readonly code: string;
  readonly help: string;
  readonly factoryModule: string;
  readonly factoryName: string;
  readonly pluginModule: string;
  readonly pluginName: string;
  readonly arrayProperty: string;
}
export function inspectStaticPluginConfig(
  source: string,
  file: string,
  contract: StaticPluginConfigContract,
): ModelResult<null> {
  const unsupported = (reason: string) =>
    fail([issue(contract.code, `${reason}; ${contract.help}`, file)]);
  if (Buffer.byteLength(source, "utf8") > 1024 * 1024)
    return unsupported("Configuration exceeds the supported 1 MiB bound");
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
    return unsupported(`${contract.title} configuration is malformed`);
  if (hasLiteralPrototypeAssignment(parsed))
    return unsupported(
      "Prototype-producing literal configuration properties are unsupported",
    );
  const factories = new Set<string>(),
    integrations = new Set<string>();
  const exports: ts.Expression[] = [];
  const runtimeBindings = new Set<string>();
  for (const statement of parsed.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteral(statement.moduleSpecifier)
    ) {
      const clause = statement.importClause;
      if (clause?.isTypeOnly) continue;
      const moduleName = statement.moduleSpecifier.text;
      const bind = (local: string, exported: string) => {
        if (runtimeBindings.has(local)) return false;
        runtimeBindings.add(local);
        if (
          moduleName === contract.pluginModule &&
          exported === contract.pluginName
        )
          integrations.add(local);
        if (
          moduleName === contract.factoryModule &&
          exported === contract.factoryName
        )
          factories.add(local);
        return true;
      };
      if (clause?.name && !bind(clause.name.text, "default"))
        return unsupported("Duplicate runtime import bindings are ambiguous");
      if (clause?.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings)) {
          for (const binding of clause.namedBindings.elements)
            if (
              !binding.isTypeOnly &&
              !bind(
                binding.name.text,
                (binding.propertyName ?? binding.name).text,
              )
            )
              return unsupported(
                "Duplicate runtime import bindings are ambiguous",
              );
        } else if (!bind(clause.namedBindings.name.text, "*"))
          return unsupported("Duplicate runtime import bindings are ambiguous");
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
    if (key === contract.arrayProperty) {
      if (!ts.isArrayLiteralExpression(property.initializer))
        return unsupported(`${contract.arrayProperty} must be a literal array`);
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
