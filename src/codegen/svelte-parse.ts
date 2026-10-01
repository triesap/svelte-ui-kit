/**
 * Svelte layout parsing for minimal integration edits (S055).
 *
 * The pinned Svelte compiler parses a `+layout.svelte` source and locates the
 * instance and module script content spans. A caller can then insert the kit
 * imports into the instance script (or create one) without regex-replacing
 * route scripts or rendering. Existing import specifiers are reported so an
 * equivalent import is never duplicated. Parsing is pure and never mutates the
 * source; unsupported/ambiguous syntax is a typed failure.
 */
import { parse } from "svelte/compiler";

import { fail, issue, ok, type ModelResult } from "../registry/errors.js";

export interface ScriptSpan {
  /** Offset of the first character inside the script element. */
  readonly start: number;
  /** Offset of the `</script>` delimiter. */
  readonly end: number;
  readonly langTs: boolean;
}

export interface LayoutInfo {
  readonly kind: "no-script" | "instance" | "module-only";
  readonly instance: ScriptSpan | null;
  readonly module: ScriptSpan | null;
  /** Module specifiers imported by the instance script, in source order. */
  readonly instanceImports: readonly string[];
  /** Module specifiers imported by the module script, in source order. */
  readonly moduleImports: readonly string[];
}

const IMPORT_PATTERN = /import\s+(?:[^"'`;]*?\s+from\s+)?["']([^"']+)["']/g;

function importSpecifiers(source: string): readonly string[] {
  const found: string[] = [];
  for (const match of source.matchAll(IMPORT_PATTERN)) {
    found.push(match[1] as string);
  }
  return found;
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
 * Parse a Svelte layout source and return its script spans and existing
 * imports. A parse failure is a typed `LAYOUT_PARSE_UNSUPPORTED` issue.
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
  return ok({
    kind,
    instance,
    module,
    instanceImports:
      instance === null
        ? []
        : importSpecifiers(source.slice(instance.start, instance.end)),
    moduleImports:
      module === null
        ? []
        : importSpecifiers(source.slice(module.start, module.end)),
  });
}
