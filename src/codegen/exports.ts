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
import {
  isValidatedRegistrySnapshot,
  type RegistrySnapshot,
} from "../registry/load.js";
import { deriveKitPaths, type KitConfig } from "../project/config.js";
import type { KitLock } from "./lock.js";

export interface ExportDeclaration {
  readonly name: string;
  /**
   * The source binding re-exported under `name`, for example `default` for a
   * Svelte component module or the public name itself for a plain module/type.
   * Optional for convenience at construction time; the effective binding is
   * resolved deterministically by {@link exportSource} so a declaration can
   * never silently omit its original owner/export relationship.
   */
  readonly source?: string;
  /** Direct relative target, for example `./button.svelte`. */
  readonly target: string;
  readonly kind: "value" | "type";
}

/**
 * The source binding a generated re-export must carry for a public name. A
 * Svelte component module exposes its component as the `default` binding; every
 * other value target and every type target uses the public name directly. This
 * is the established rendering contract, not a filename guess about which names
 * exist: the declared public names still come from the manifest/registry.
 */
export function expectedExportSource(
  name: string,
  target: string,
  kind: "value" | "type",
): string {
  return kind === "value" && target.endsWith(".svelte") ? "default" : name;
}

/** The effective source binding of a declaration. */
export function exportSource(declaration: ExportDeclaration): string {
  return (
    declaration.source ??
    expectedExportSource(declaration.name, declaration.target, declaration.kind)
  );
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
      const source = exportSource(declaration);
      if (declaration.kind === "type") {
        return source === declaration.name
          ? `export type { ${declaration.name} } from "${target}";`
          : `export type { ${source} as ${declaration.name} } from "${target}";`;
      }
      // An ordinary Svelte component module exports the component as its
      // default binding, so the public name is an alias of `default`.
      return source === declaration.name
        ? `export { ${declaration.name} } from "${target}";`
        : `export { ${source} as ${declaration.name} } from "${target}";`;
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
          // The original source binding is carried, never discarded: a
          // replacement `export { missing as Button }` must be distinguishable
          // from the approved `export { default as Button }`.
          source:
            element.propertyName !== undefined &&
            ts.isIdentifier(element.propertyName)
              ? element.propertyName.text
              : element.name.text,
          target: specifier.text,
          kind: statement.isTypeOnly || element.isTypeOnly ? "type" : "value",
        });
      }
    }
  }
  return declarations;
}

/**
 * One registry-declared export relationship carried as independent planning
 * authority: the owning item, the source binding, the runtime target, the
 * public name and the value/type role. The guarded boundary proves an effective
 * managed region against these relationships, never against candidate output
 * or a filename guess.
 */
export interface AuthoritativeExport {
  readonly owner: string;
  readonly name: string;
  readonly source: string;
  readonly target: string;
  readonly kind: "value" | "type";
}

/**
 * The complete registry-declared export cohort one managed barrel must carry,
 * sourced from the original validated planning context. `registryVersion` and
 * `registryHash` bind the authority to the exact registry closure it was
 * derived from so a stale or mismatched authority cannot be substituted.
 */
export interface BarrelExportAuthority {
  readonly path: string;
  readonly contract: "exports-v1";
  readonly registryVersion: string;
  readonly registryHash: string;
  readonly declarations: readonly AuthoritativeExport[];
}

// Receipts are process-local capabilities, not serialized or caller-recreated
// authority. Frozen declarations are derived directly from the validated
// registry, independently of candidate writes. Weak keys avoid retaining plans.
const EXPORT_RECEIPTS = new WeakMap<object, readonly string[]>();

export function createExportAuthority(
  registry: RegistrySnapshot,
  config: KitConfig,
  owners: readonly string[],
): ModelResult<readonly BarrelExportAuthority[]> {
  const byOwner = new Map<string, ExportDeclaration[]>();
  for (const owner of owners) {
    const item = registry.items.find((entry) => entry.id === owner);
    if (item === undefined)
      return fail([
        issue("EXPORT_OWNER_MISSING", `registry does not declare ${owner}`),
      ]);
    const compound = isCompoundComponent(item.manifest)
      ? item.files.find(
          (file) => file.blockId === null && file.target.endsWith("/index.ts"),
        )
      : undefined;
    const barrel =
      compound === undefined ? null : runtimeSpecifier(`./${compound.target}`);
    const generated =
      barrel !== null &&
      item.manifest.exports.length > 0 &&
      item.manifest.exports.every(
        (entry) =>
          runtimeSpecifier(
            entry.target.startsWith(".") ? entry.target : `./${entry.target}`,
          ) !== barrel,
      );
    byOwner.set(
      owner,
      item.manifest.exports.map((entry) => ({
        name: entry.name,
        target: generated
          ? barrel!
          : runtimeSpecifier(
              entry.target.startsWith(".") ? entry.target : `./${entry.target}`,
            ),
        kind: entry.kind,
      })),
    );
  }
  const authority = Object.freeze([
    Object.freeze({
      path: deriveKitPaths(config).rootExports,
      contract: "exports-v1" as const,
      registryVersion: registry.root.registryVersion,
      registryHash: registry.root.contentHash,
      declarations: Object.freeze(
        authoritativeExports(byOwner, owners).map((entry) =>
          Object.freeze(entry),
        ),
      ),
    }),
  ]);
  // Pure planner fixtures can describe candidate registries. Only the loader's
  // integrity-validated snapshot can grant authority at the mutation boundary.
  if (isValidatedRegistrySnapshot(registry)) {
    EXPORT_RECEIPTS.set(authority, Object.freeze([...owners].sort()));
  }
  return ok(authority);
}

/** Shape, hashes and copyable fields alone cannot authenticate expectations. */
export function validateExportReceipt(
  authority: unknown,
  lock?: KitLock,
): boolean {
  if (typeof authority !== "object" || authority === null) return false;
  const owners = EXPORT_RECEIPTS.get(authority);
  if (owners === undefined) return false;
  if (lock === undefined) return true;
  const entries = authority as readonly BarrelExportAuthority[];
  return (
    entries.every(
      (entry) =>
        entry.registryVersion === lock.registryVersion &&
        entry.registryHash === lock.registryHash,
    ) &&
    JSON.stringify(owners) ===
      JSON.stringify(lock.items.map((entry) => entry.id).sort())
  );
}

/** Stable comparability key over every field of an export relationship. */
export function authoritativeExportKey(
  declaration: AuthoritativeExport,
): string {
  return `${declaration.name}|${declaration.source}|${declaration.kind}|${runtimeSpecifier(declaration.target)}`;
}

/**
 * The relationships an effective managed region must carry. Compared by
 * public name, source binding, value/type role and runtime target; the owning
 * item is bound through the target in the original registry closure.
 */
export function effectiveExportKey(declaration: ExportDeclaration): string {
  return `${declaration.name}|${exportSource(declaration)}|${declaration.kind}|${runtimeSpecifier(declaration.target)}`;
}

/**
 * Resolve one barrel's declared relationships from a registry closure. Each
 * owner contributes only the root-level declarations it owns; the closure is
 * the source of truth, never the currently installed region.
 */
export function authoritativeExports(
  byOwner: ReadonlyMap<string, readonly ExportDeclaration[]>,
  owners: readonly string[],
): AuthoritativeExport[] {
  const out: AuthoritativeExport[] = [];
  for (const owner of owners) {
    for (const declaration of byOwner.get(owner) ?? []) {
      out.push({
        owner,
        name: declaration.name,
        source: exportSource(declaration),
        target: runtimeSpecifier(declaration.target),
        kind: declaration.kind,
      });
    }
  }
  return out;
}

/** Canonical comparability key for one export declaration. */
export function exportDeclarationKey(declaration: ExportDeclaration): string {
  return effectiveExportKey(declaration);
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
