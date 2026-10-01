/**
 * Root export-surface generation (S053).
 *
 * Renders the public flat export region from manifest export declarations only,
 * using direct relative targets. The managed region is the sole thing patched;
 * unrelated application exports, imports and comments are preserved. A generated
 * name that collides with an application-owned declaration is a nonmutating
 * conflict.
 */
import ts from "typescript";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isCompoundComponent, type RegistryItem } from "../registry/item.js";
import {
  EXPORT_END,
  EXPORT_START,
  findExportCollisions,
  parseExportRegion,
  type AppExport,
} from "./export-parse.js";

export interface ExportDeclaration {
  readonly name: string;
  /** Direct relative target, for example `./button.svelte`. */
  readonly target: string;
  readonly kind: "value" | "type";
}

function compareDeclarations(
  left: ExportDeclaration,
  right: ExportDeclaration,
): number {
  if (left.name !== right.name) return left.name < right.name ? -1 : 1;
  if (left.target !== right.target) return left.target < right.target ? -1 : 1;
  return 0;
}

/** Render deterministic `export ... from` lines for the given declarations. */
export function renderExportLines(
  declarations: readonly ExportDeclaration[],
): string {
  return [...declarations]
    .sort(compareDeclarations)
    .map((declaration) => {
      if (declaration.kind === "type") {
        return `export type { ${declaration.name} } from "${declaration.target}";`;
      }
      // An ordinary Svelte component module exports the component as its
      // default binding, so the public name is an alias of `default`.
      if (declaration.target.endsWith(".svelte")) {
        return `export { default as ${declaration.name} } from "${declaration.target}";`;
      }
      return `export { ${declaration.name} } from "${declaration.target}";`;
    })
    .join("\n")
    .concat("\n");
}

/**
 * Parse the generated declarations currently present inside a managed export
 * region. Used to compare the *effective* export surface of an installed owner
 * with its incoming declarations, rather than trusting item-version inequality.
 */
export function parseGeneratedDeclarations(
  regionContent: string,
): ExportDeclaration[] {
  const sourceFile = ts.createSourceFile(
    "export-region.ts",
    regionContent,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const declarations: ExportDeclaration[] = [];
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement)) continue;
    const specifier = statement.moduleSpecifier;
    if (specifier === undefined || !ts.isStringLiteral(specifier)) continue;
    if (
      statement.exportClause !== undefined &&
      ts.isNamedExports(statement.exportClause)
    ) {
      for (const element of statement.exportClause.elements) {
        declarations.push({
          name: element.name.text,
          target: specifier.text,
          kind: statement.isTypeOnly || element.isTypeOnly ? "type" : "value",
        });
      }
    }
  }
  return declarations;
}

/** Canonical comparability key for one export declaration. */
export function exportDeclarationKey(declaration: ExportDeclaration): string {
  return `${declaration.name}|${declaration.kind}|${declaration.target}`;
}

/**
 * Patch only the managed export region of `source` with the rendered
 * declarations. When no region exists, a minimal managed region is appended;
 * application bytes are never reformatted.
 */
export function patchExportRegion(
  fileName: string,
  source: string,
  declarations: readonly ExportDeclaration[],
): ModelResult<string> {
  const parsed = parseExportRegion(fileName, source);
  if (!parsed.ok) return parsed;

  if (parsed.value.hasWildcardReexport && declarations.length > 0) {
    return fail([
      issue(
        "EXPORT_WILDCARD_AMBIGUOUS",
        "the source has a bare `export *` re-export, so generated names cannot be proven collision-free; remove the wildcard or declare explicit exports",
        fileName,
      ),
    ]);
  }

  const generated: AppExport[] = declarations.map((declaration) => ({
    name: declaration.name,
    kind: declaration.kind,
  }));
  const collisions = findExportCollisions(parsed.value.appExports, generated);
  if (collisions.length > 0) {
    return fail([
      issue(
        "EXPORT_SYMBOL_COLLISION",
        `generated exports collide with application-owned declarations: ${collisions.join(", ")}`,
        fileName,
      ),
    ]);
  }

  const lines = renderExportLines(declarations);
  const region = parsed.value.region;
  if (region === null) {
    const base =
      source.endsWith("\n") || source.length === 0 ? source : `${source}\n`;
    return ok(`${base}${EXPORT_START}\n${lines}${EXPORT_END}\n`);
  }
  return ok(
    source.slice(0, region.contentStart) +
      lines +
      source.slice(region.contentEnd),
  );
}

/**
 * Whether a compound barrel should be generated for an item. The decision is
 * manifest-authoritative: it uses the item's declared file layout
 * (`isCompoundComponent`) and public exports, never an inferred count of
 * export declarations or a heuristic on their targets. A flat component plus
 * its type export stays simple; a directory-layout family gets a barrel.
 */
export function shouldGenerateCompoundBarrel(item: RegistryItem): boolean {
  return isCompoundComponent(item) && item.exports.length > 0;
}

/**
 * Render a compound item's own barrel from its declared part exports. Targets
 * are direct sibling files, never the root UI barrel, so no import cycle is
 * introduced.
 */
export function renderCompoundBarrel(
  parts: readonly ExportDeclaration[],
): string {
  return renderExportLines(parts);
}

/**
 * Find import/export specifiers that reference the root UI barrel, using the
 * parsed TypeScript nodes so text inside comments, strings or templates cannot
 * create a false cycle finding. Generated sources must use direct sibling
 * imports; a root-barrel reference is reported so the caller can fail before
 * writing.
 */
export function findRootBarrelImports(
  source: string,
  rootBarrelSpecifiers: ReadonlySet<string>,
): readonly string[] {
  const sourceFile = ts.createSourceFile(
    "module.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const offenders = new Set<string>();
  const consider = (expression: ts.Expression | undefined): void => {
    if (expression !== undefined && ts.isStringLiteral(expression)) {
      if (rootBarrelSpecifiers.has(expression.text)) {
        offenders.add(expression.text);
      }
    }
  };
  const visit = (node: ts.Node): void => {
    if (ts.isImportDeclaration(node)) {
      consider(node.moduleSpecifier);
    } else if (ts.isExportDeclaration(node)) {
      consider(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === "require"
    ) {
      consider(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return [...offenders].sort();
}
