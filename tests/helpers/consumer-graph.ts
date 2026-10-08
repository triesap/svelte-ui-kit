import assert from "node:assert/strict";
import path from "node:path";
import ts from "typescript";
import { parseSvelteLayout } from "../../src/codegen/svelte-parse.js";

export interface ConsumerEdge {
  from: string;
  specifier: string;
  typeOnly: boolean;
  target?: string;
}

/** Inspect executable syntax, including re-exports, type imports and dynamic loads. */
export function consumerEdges(file: string, source: string): ConsumerEdge[] {
  let scripts = [source];
  if (file.endsWith(".svelte")) {
    const parsed = parseSvelteLayout(source);
    assert.ok(parsed.ok, `${file}: ${JSON.stringify(parsed)}`);
    if (!parsed.ok) return [];
    scripts = [parsed.value.instance, parsed.value.module]
      .filter((span) => span !== null)
      .map((span) => source.slice(span.start, span.end));
  }
  const edges: ConsumerEdge[] = [];
  for (const script of scripts) {
    const ast = ts.createSourceFile(file, script, ts.ScriptTarget.Latest, true);
    const add = (specifier: ts.Node | undefined, typeOnly: boolean) => {
      assert.ok(
        specifier && ts.isStringLiteralLike(specifier),
        `${file}: opaque module load`,
      );
      if (specifier && ts.isStringLiteralLike(specifier))
        edges.push({ from: file, specifier: specifier.text, typeOnly });
    };
    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const bindings = node.importClause?.namedBindings;
        add(
          node.moduleSpecifier,
          Boolean(
            node.importClause?.isTypeOnly ||
            (!node.importClause?.name &&
              bindings &&
              ts.isNamedImports(bindings) &&
              bindings.elements.length &&
              bindings.elements.every((entry) => entry.isTypeOnly)),
          ),
        );
      } else if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
        add(
          node.moduleSpecifier,
          node.isTypeOnly ||
            Boolean(
              node.exportClause &&
              ts.isNamedExports(node.exportClause) &&
              node.exportClause.elements.length &&
              node.exportClause.elements.every((entry) => entry.isTypeOnly),
            ),
        );
      } else if (ts.isImportTypeNode(node)) {
        assert.ok(
          ts.isLiteralTypeNode(node.argument),
          `${file}: opaque type import`,
        );
        if (ts.isLiteralTypeNode(node.argument))
          add(node.argument.literal, true);
      } else if (
        ts.isCallExpression(node) &&
        (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
          (ts.isIdentifier(node.expression) &&
            node.expression.text === "require"))
      ) {
        add(node.arguments[0], false);
      } else if (ts.isImportEqualsDeclaration(node)) {
        assert.fail(
          `${file}: require-style import is outside the consumer contract`,
        );
      }
      ts.forEachChild(node, visit);
    };
    visit(ast);
  }
  return edges;
}

/** Closed app-owned graph: external runtime belongs only to pinned Svelte/Bits. */
export function auditConsumerGraph(files: ReadonlyMap<string, string>) {
  const edges = [...files].flatMap(([file, source]) =>
    consumerEdges(file, source),
  );
  for (const edge of edges) {
    if (!edge.specifier.startsWith(".")) {
      assert.ok(
        edge.specifier === "bits-ui" ||
          edge.specifier === "svelte" ||
          edge.specifier.startsWith("svelte/"),
        `${edge.from}: forbidden dependency ${edge.specifier}`,
      );
      continue;
    }
    const logical = path.posix.normalize(
      path.posix.join(path.posix.dirname(edge.from), edge.specifier),
    );
    const candidates = [
      logical,
      logical.replace(/\.js$/, ".ts"),
      `${logical}.ts`,
      `${logical}.svelte`,
      `${logical}/index.ts`,
    ];
    edge.target = candidates.find((candidate) => files.has(candidate));
    assert.ok(
      edge.target,
      `${edge.from}: unresolved or escaped dependency ${edge.specifier}`,
    );
    assert.ok(
      edge.from === "index.ts" || edge.target !== "index.ts",
      `${edge.from}: root barrel cycle`,
    );
  }
  const active = new Set<string>();
  const done = new Set<string>();
  const walk = (file: string) => {
    assert.ok(!active.has(file), `runtime cycle at ${file}`);
    if (done.has(file)) return;
    active.add(file);
    for (const edge of edges.filter(
      (edge) => edge.from === file && !edge.typeOnly && edge.target,
    ))
      walk(edge.target!);
    active.delete(file);
    done.add(file);
  };
  for (const file of files.keys()) walk(file);
  return edges;
}
