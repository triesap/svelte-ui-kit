/** Native CSS syntax plus effective top-level import semantics; no application layout. */
import { parseCss } from "svelte/compiler";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import type { IntegrationImport } from "./script-imports.js";
interface CssImport {
  readonly specifier: string;
  readonly start: number;
  readonly end: number;
}
interface Structure {
  readonly imports: readonly CssImport[];
  readonly insertion: number;
}
function inspect(source: string): ModelResult<Structure> {
  const unsupported = (reason: string) =>
    fail<Structure>([
      issue(
        "LIBRARY_STYLES_UNSUPPORTED",
        `${reason}; use unconditional quoted top-level @imports before ordinary rules in the configured stylesheet entry.`,
      ),
    ]);
  if (Buffer.byteLength(source, "utf8") > 1024 * 1024)
    return unsupported("Stylesheet exceeds the finite inspection bound");
  try {
    const bom = source.startsWith("\ufeff") ? 1 : 0;
    const parsed = parseCss(source);
    const imports: CssImport[] = [];
    let allowed = true,
      insertion = bom,
      sawImport = false;
    for (const [index, node] of parsed.children.entries()) {
      if (node.type === "Atrule" && node.name.toLowerCase() === "charset") {
        if (
          index !== 0 ||
          node.start !== 0 ||
          node.block !== null ||
          !/^['"]utf-8['"]$/i.test(node.prelude)
        )
          return unsupported(
            "Only a leading UTF-8 charset declaration is supported",
          );
        insertion = node.end + bom;
        continue;
      }
      if (
        node.type === "Atrule" &&
        node.name.toLowerCase() === "layer" &&
        node.block === null
      ) {
        if (!sawImport && allowed) insertion = node.end + bom;
        continue;
      }
      if (node.type === "Atrule" && node.name.toLowerCase() === "import") {
        if (!allowed || node.block !== null)
          return unsupported(
            "Late or nested imports do not establish browser integration",
          );
        const match = /^(?:"([^"\\\n\r]+)"|'([^'\\\n\r]+)')$/.exec(
          node.prelude,
        );
        if (!match)
          return unsupported(
            "Conditional, layered, escaped or computed imports cannot be proven",
          );
        imports.push({
          specifier: match[1] ?? match[2],
          start: node.start + bom,
          end: node.end + bom,
        });
        sawImport = true;
        continue;
      }
      allowed = false;
    }
    // Nested import nodes are semantically invalid even if the native grammar accepts them.
    const nested = (value: unknown, depth = 0): boolean => {
      if (!value || typeof value !== "object") return false;
      if (Array.isArray(value)) return value.some((v) => nested(v, depth));
      const item = value as Record<string, unknown>;
      if (
        depth > 0 &&
        item.type === "Atrule" &&
        String(item.name).toLowerCase() === "import"
      )
        return true;
      return (
        item.block !== null &&
        typeof item.block === "object" &&
        nested((item.block as { children?: unknown }).children, depth + 1)
      );
    };
    if (parsed.children.some((node) => nested(node)))
      return unsupported(
        "Nested imports cannot establish stylesheet integration",
      );
    return ok({ imports, insertion });
  } catch {
    return unsupported("Stylesheet syntax is malformed");
  }
}
export function inspectLibraryStyles(
  source: string,
): ModelResult<{ readonly imports: readonly string[] }> {
  const parsed = inspect(source);
  return parsed.ok
    ? ok({ imports: parsed.value.imports.map((e) => e.specifier) })
    : parsed;
}
export function materializeLibraryStyles(
  imports: readonly IntegrationImport[],
): string {
  return imports.map((e) => `@import "${e.specifier}";`).join("\n") + "\n";
}
export function patchLibraryStyles(
  source: string,
  imports: readonly IntegrationImport[],
): ModelResult<string> {
  const parsed = inspect(source);
  if (!parsed.ok) return parsed;
  const desired = imports.map((e) => e.specifier);
  const approved = parsed.value.imports
    .map((e) => ({ ...e, index: desired.indexOf(e.specifier) }))
    .filter((e) => e.index >= 0);
  if (
    new Set(approved.map((e) => e.index)).size !== approved.length ||
    approved.some((e, i) => i > 0 && e.index < approved[i - 1].index)
  )
    return fail([
      issue(
        "LIBRARY_STYLES_ORDER",
        "Existing approved imports must be unique and in kit/themes/app order; reconcile them without rewriting unrelated CSS",
      ),
    ]);
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const groups = new Map<number, { before: boolean; lines: string[] }>();
  for (const [index, specifier] of desired.entries()) {
    if (approved.some((e) => e.index === index)) continue;
    const next = approved.find((e) => e.index > index),
      previous = approved.filter((e) => e.index < index).at(-1);
    const at = next?.start ?? previous?.end ?? parsed.value.insertion;
    const group = groups.get(at) ?? { before: next !== undefined, lines: [] };
    group.lines.push(`@import "${specifier}";`);
    groups.set(at, group);
  }
  let result = source;
  for (const [at, group] of [...groups.entries()].sort((a, b) => b[0] - a[0])) {
    const content = group.lines.join(eol);
    const text = group.before
      ? content + eol
      : (at > 0 && !["\n", "\r", "\ufeff"].includes(source[at - 1])
          ? eol
          : "") +
        content +
        eol;
    result = result.slice(0, at) + text + result.slice(at);
  }
  const checked = inspectLibraryStyles(result);
  if (!checked.ok) return checked;
  const indices = desired.map((s) => checked.value.imports.indexOf(s));
  if (indices.some((v, i) => v < 0 || (i > 0 && v <= indices[i - 1])))
    return fail([
      issue(
        "LIBRARY_STYLES_ORDER",
        "Projected stylesheet import order could not be proven",
      ),
    ]);
  return ok(result);
}
