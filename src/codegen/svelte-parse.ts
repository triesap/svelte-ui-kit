/**
 * Svelte layout parsing for minimal integration edits (S055).
 *
 * The pinned Svelte compiler parses a `+layout.svelte` source and locates the
 * instance and module script content spans. A caller can then insert the kit
 * imports into the instance script (or create one) without regex-replacing
 * route scripts or rendering. Existing import specifiers are reported so an
 * equivalent import is never duplicated. Parsing is pure and never mutates the
 * source; unsupported/ambiguous syntax is a typed failure.
 *
 * Import proof is the actual TypeScript `ImportDeclaration` AST of each script
 * body, never a text scan: import-looking text inside a comment, string or
 * template literal is not an import. Child-rendering proof is the actual Svelte
 * template AST: a `{@render ...}` node whose rendered expression resolves to a
 * name bound to the `children` prop (including a destructuring alias such as
 * `let { children: content } = $props()`), or a legacy `<slot>` element. Text
 * inside an HTML comment is a `Comment` node, never a `RenderTag`.
 */
import { parse } from "svelte/compiler";
import ts from "typescript";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export interface ScriptSpan {
  /** Offset of the first character inside the script element. */
  readonly start: number;
  /** Offset of the `</script>` delimiter. */
  readonly end: number;
  readonly langTs: boolean;
}

/** One parsed import declaration from a script body. */
export interface ScriptImport {
  readonly specifier: string;
  /** Offset relative to the script body content. */
  readonly start: number;
  /** Offset relative to the script body content. */
  readonly end: number;
  readonly typeOnly: boolean;
}

export interface LayoutInfo {
  readonly kind: "no-script" | "instance" | "module-only";
  readonly instance: ScriptSpan | null;
  readonly module: ScriptSpan | null;
  /** Non-type-only module specifiers imported by the instance script, in order. */
  readonly instanceImports: readonly string[];
  /** Non-type-only module specifiers imported by the module script, in order. */
  readonly moduleImports: readonly string[];
  /**
   * True only when the template has an executable child-rendering node: a
   * `{@render ...}` of a name bound to the `children` prop, or a legacy
   * `<slot>`. Comments, unrelated render calls and undeclared names are not
   * proof.
   */
  readonly rendersChildren: boolean;
}

const SKIP_KEYS: ReadonlySet<string> = new Set([
  "parent",
  "metadata",
  "start",
  "end",
  "loc",
]);

/**
 * Parse real import declarations from one script body. The positions are
 * relative to the supplied content so callers can insert relative to a script
 * span.
 */
export function parseScriptImports(
  content: string,
  scriptKind: ts.ScriptKind = ts.ScriptKind.TS,
): readonly ScriptImport[] {
  const sourceFile = ts.createSourceFile(
    "layout-script.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    scriptKind,
  );
  const imports: ScriptImport[] = [];
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

/** The local names bound to the `children` prop by one script body. */
function childBindingNames(content: string): readonly string[] {
  const sourceFile = ts.createSourceFile(
    "layout-instance.ts",
    content,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const names: string[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const exported =
      ts
        .getModifiers(statement)
        ?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ??
      false;
    for (const declaration of statement.declarationList.declarations) {
      const initializer = declaration.initializer;
      if (
        initializer !== undefined &&
        ts.isCallExpression(initializer) &&
        ts.isIdentifier(initializer.expression) &&
        initializer.expression.text === "$props" &&
        ts.isObjectBindingPattern(declaration.name)
      ) {
        for (const element of declaration.name.elements) {
          let keyed: string | undefined;
          if (element.propertyName !== undefined) {
            keyed = ts.isIdentifier(element.propertyName)
              ? element.propertyName.text
              : ts.isStringLiteral(element.propertyName)
                ? element.propertyName.text
                : undefined;
          } else if (ts.isIdentifier(element.name)) {
            keyed = element.name.text;
          }
          if (keyed !== "children") continue;
          if (ts.isIdentifier(element.name)) names.push(element.name.text);
        }
        continue;
      }
      // Legacy Svelte 4 prop declaration: `export let children;`.
      if (
        exported &&
        initializer === undefined &&
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === "children"
      ) {
        names.push("children");
      }
    }
  }
  return names;
}

/** The identifier a rendered expression resolves to, following calls/chains. */
function renderTargetName(expression: unknown): string | null {
  if (expression === null || typeof expression !== "object") return null;
  const node = expression as {
    type?: unknown;
    name?: unknown;
    callee?: unknown;
    expression?: unknown;
  };
  if (node.type === "Identifier" && typeof node.name === "string") {
    return node.name;
  }
  if (node.type === "CallExpression") return renderTargetName(node.callee);
  if (node.type === "ChainExpression") return renderTargetName(node.expression);
  return null;
}

/**
 * Walk the Svelte template AST for an executable child render. Only an actual
 * `RenderTag` of a bound child name or a legacy `SlotElement` counts; comment
 * and string text are separate nodes and cannot satisfy this.
 */
function templateRendersChild(
  node: unknown,
  bindings: ReadonlySet<string>,
): boolean {
  if (node === null || typeof node !== "object") return false;
  const record = node as Record<string, unknown>;
  if (record["type"] === "SlotElement") return true;
  if (record["type"] === "RenderTag") {
    const name = renderTargetName(record["expression"]);
    if (name !== null && bindings.has(name)) return true;
  }
  for (const key of Object.keys(record)) {
    if (SKIP_KEYS.has(key)) continue;
    const value = record[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (templateRendersChild(child, bindings)) return true;
      }
    } else if (value !== null && typeof value === "object") {
      if (templateRendersChild(value, bindings)) return true;
    }
  }
  return false;
}

function scriptSpan(
  source: string,
  node: { start: number; end: number; content: { start: number; end: number } },
): ScriptSpan {
  const openTag = source.slice(node.start, node.content.start);
  return {
    start: node.content.start,
    end: node.content.end,
    langTs: /lang\s*=\s*["']?ts["']?/.test(openTag),
  };
}

/**
 * Parse a Svelte layout source and return its script spans, real imports and
 * executable child-rendering proof. A parse failure is a typed
 * `LAYOUT_PARSE_UNSUPPORTED` issue.
 */
export function parseSvelteLayout(source: string): ModelResult<LayoutInfo> {
  let ast: unknown;
  try {
    ast = parse(source, { modern: true });
  } catch (error) {
    return fail([
      issue(
        "LAYOUT_PARSE_UNSUPPORTED",
        `the layout could not be parsed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    ]);
  }
  const root = ast as {
    instance?: {
      start: number;
      end: number;
      content: { start: number; end: number };
    };
    module?: {
      start: number;
      end: number;
      content: { start: number; end: number };
    };
    fragment?: unknown;
  };
  const instance =
    root.instance === undefined ? null : scriptSpan(source, root.instance);
  const module =
    root.module === undefined ? null : scriptSpan(source, root.module);
  const kind =
    instance !== null
      ? "instance"
      : module !== null
        ? "module-only"
        : "no-script";
  const instanceImports =
    instance === null
      ? []
      : parseScriptImports(source.slice(instance.start, instance.end))
          .filter((entry) => !entry.typeOnly)
          .map((entry) => entry.specifier);
  const moduleImports =
    module === null
      ? []
      : parseScriptImports(source.slice(module.start, module.end))
          .filter((entry) => !entry.typeOnly)
          .map((entry) => entry.specifier);
  const bindings = new Set<string>();
  if (instance !== null) {
    for (const name of childBindingNames(
      source.slice(instance.start, instance.end),
    )) {
      bindings.add(name);
    }
  }
  const rendersChildren = templateRendersChild(root.fragment, bindings);
  return ok({
    kind,
    instance,
    module,
    instanceImports,
    moduleImports,
    rendersChildren,
  });
}
