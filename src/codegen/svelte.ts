import { patchOrderedScriptImports } from "./script-imports.js";
/**
 * Minimal Svelte layout import patching (S056).
 *
 * Inserts only the missing approved stylesheet imports into the instance script,
 * in the required order (kit, then themes, then app). Existing imports, comments
 * and rendering are preserved; the module script is never touched. When the
 * layout has no instance script, one is created.
 *
 * Import detection uses the actual TypeScript parsed import declarations of the
 * script content, not line regexes: an inline one-line import list is never
 * duplicated, and a marker-like `import` inside a comment or template literal
 * never suppresses a real insertion. Each missing import is placed in its
 * correct gap relative to the already-present approved imports; a genuinely
 * unsafe order, or an approved import that lives in the module script, is a
 * precise nonmutating conflict.
 */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { parseScriptImports, parseSvelteLayout } from "./svelte-parse.js";

export interface LayoutImport {
  readonly specifier: string;
}

function importLine(specifier: string): string {
  return `import "${specifier}";`;
}

/**
 * Materialize the minimal Svelte 5 passthrough layout for an absent target.
 *
 * When a consumer has no explicit layout, SvelteKit supplies implicit child
 * rendering. Materializing a layout only to add stylesheet imports must
 * preserve that behavior, so the generated file declares the `children`
 * snippet and renders it. Without this the page disappears even though the
 * application still builds and returns HTTP 200.
 */
export function materializePassthroughLayout(
  imports: readonly LayoutImport[],
): string {
  const importLines = imports.map((entry) => importLine(entry.specifier));
  const scriptBody = [...importLines, "", "let { children } = $props();"];
  return `<script>\n${scriptBody.join("\n")}\n</script>\n\n{@render children()}\n`;
}

/**
 * Patch the layout so every approved import is present in order. No instance
 * script means one is created before the document body.
 */
export function patchLayoutImports(
  source: string,
  imports: readonly LayoutImport[],
): ModelResult<string> {
  const desired = imports.map((entry) => entry.specifier);
  const parsed = parseSvelteLayout(source);
  if (!parsed.ok) return parsed;
  const info = parsed.value;

  const moduleImports =
    info.module === null
      ? []
      : parseScriptImports(
          source.slice(info.module.start, info.module.end),
        ).filter((entry) => !entry.typeOnly);
  const inModule = desired.filter((specifier) =>
    moduleImports.some((entry) => entry.specifier === specifier),
  );
  if (inModule.length > 0) {
    return fail([
      issue(
        "LAYOUT_IMPORT_MODULE_CONFLICT",
        `the approved stylesheet import ${JSON.stringify(inModule[0])} lives in the module script; move it into the instance script manually so the kit/themes/app order can be guaranteed`,
      ),
    ]);
  }

  if (info.instance === null) {
    if (desired.length === 0) return ok(source);
    const block = `<script>\n${desired.map(importLine).join("\n")}\n</script>\n`;
    return ok(block + source);
  }

  return patchOrderedScriptImports(source, info.instance, imports);
}
