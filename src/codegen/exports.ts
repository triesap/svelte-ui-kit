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
import path from "node:path";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { isCompoundComponent, type RegistryItem } from "../registry/item.js";
import {
  EXPORT_END,
  EXPORT_START,
  findExportCollisions,
  parseExportRegion,
  type AppExport,
} from "./export-parse.js";
import { parseSvelteLayout } from "./svelte-parse.js";

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

/**
 * The runtime module specifier for a generated target. A `.ts`/`.tsx` source
 * compiles to `.js` (`.mts`/`.cts` to `.mjs`/`.cjs`), so an emitted re-export
 * uses a spelling the consumer's TypeScript accepts without
 * `allowImportingTsExtensions`. Non-TS targets are unchanged.
 */
export function runtimeSpecifier(target: string): string {
  return target
    .replace(/\.tsx?$/i, ".js")
    .replace(/\.mts$/i, ".mjs")
    .replace(/\.cts$/i, ".cjs");
}

/** Render deterministic `export ... from` lines for the given declarations. */
export function renderExportLines(
  declarations: readonly ExportDeclaration[],
): string {
  return [...declarations]
    .sort(compareDeclarations)
    .map((declaration) => {
      const target = runtimeSpecifier(declaration.target);
      if (declaration.kind === "type") {
        return `export type { ${declaration.name} } from "${target}";`;
      }
      // An ordinary Svelte component module exports the component as its
      // default binding, so the public name is an alias of `default`.
      if (declaration.target.endsWith(".svelte")) {
        return `export { default as ${declaration.name} } from "${target}";`;
      }
      return `export { ${declaration.name} } from "${target}";`;
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
 * The exact bytes of the managed export region, or the empty string when the
 * source has no managed region. `null` reports a parse failure. The exports
 * integration baseline is computed over this region alone, so application bytes
 * outside the markers never mark the owned region customized.
 */
export function exportRegionContent(
  fileName: string,
  source: string,
): string | null {
  const parsed = parseExportRegion(fileName, source);
  if (!parsed.ok) return null;
  const region = parsed.value.region;
  if (region === null) return "";
  return source.slice(region.contentStart, region.contentEnd);
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

const MODULE_EXTENSIONS = [
  ".js",
  ".ts",
  ".mjs",
  ".cjs",
  ".jsx",
  ".tsx",
] as const;

function addBarrelForms(target: Set<string>, stem: string): void {
  target.add(stem);
  for (const extension of MODULE_EXTENSIONS) target.add(`${stem}${extension}`);
}

/**
 * Every supported resolved spelling of the generated root UI barrel as seen
 * from `fromPath`: the relative directory/index forms with module-extension
 * variants, the bare relative directory, and the `$lib` SvelteKit alias when
 * the configured UI root lives under `src/lib`. Custom UI mappings are honored
 * because the relative forms are computed from the actual configured paths.
 */
export function rootBarrelSpecifiers(
  fromPath: string,
  rootExports: string,
): ReadonlySet<string> {
  const specifiers = new Set<string>();
  const relative = path.posix
    .relative(path.posix.dirname(fromPath), rootExports)
    .replace(/\.ts$/, "");
  const relativeStem = relative.startsWith(".") ? relative : `./${relative}`;
  addBarrelForms(specifiers, relativeStem);
  if (relativeStem === "./index") specifiers.add(".");
  else specifiers.add(relativeStem.replace(/\/index$/, ""));

  if (rootExports.startsWith("src/lib/")) {
    const aliasStem = rootExports
      .replace(/^src\/lib\//, "$lib/")
      .replace(/\.ts$/, "");
    addBarrelForms(specifiers, aliasStem);
    specifiers.add(aliasStem.replace(/\/index$/, ""));
  }
  return specifiers;
}

function scriptBodies(fileName: string, source: string): readonly string[] {
  if (!fileName.endsWith(".svelte")) return [source];
  const parsed = parseSvelteLayout(source);
  if (!parsed.ok) return [source];
  const bodies: string[] = [];
  if (parsed.value.instance !== null) {
    bodies.push(
      source.slice(parsed.value.instance.start, parsed.value.instance.end),
    );
  }
  if (parsed.value.module !== null) {
    bodies.push(
      source.slice(parsed.value.module.start, parsed.value.module.end),
    );
  }
  return bodies;
}

/**
 * Find root-barrel references using the actual script structure: a `.svelte`
 * source is reduced to its instance/module script bodies before the TypeScript
 * scanner runs, so markup text can never create or hide a cycle finding.
 */
export function findRootBarrelImportsInSource(
  fileName: string,
  source: string,
  rootBarrelSpecifiers: ReadonlySet<string>,
): readonly string[] {
  const offenders = new Set<string>();
  for (const body of scriptBodies(fileName, source)) {
    for (const specifier of findRootBarrelImports(body, rootBarrelSpecifiers)) {
      offenders.add(specifier);
    }
  }
  return [...offenders].sort();
}
