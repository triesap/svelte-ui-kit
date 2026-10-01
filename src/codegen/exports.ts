/**
 * Root export-surface generation (S053).
 *
 * Renders the public flat export region from manifest export declarations only,
 * using direct relative targets. The managed region is the sole thing patched;
 * unrelated application exports, imports and comments are preserved. A generated
 * name that collides with an application-owned declaration is a nonmutating
 * conflict.
 */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
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
    .map((declaration) =>
      declaration.kind === "type"
        ? `export type { ${declaration.name} } from "${declaration.target}";`
        : `export { ${declaration.name} } from "${declaration.target}";`,
    )
    .join("\n")
    .concat("\n");
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
