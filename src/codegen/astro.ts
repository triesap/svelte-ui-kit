/** Native Astro syntax and exact source offsets; never evaluate frontmatter. */
import { parse } from "@astrojs/compiler-rs";
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { parseScriptImports } from "./svelte-parse.js";
import {
  patchOrderedScriptImports,
  type IntegrationImport,
} from "./script-imports.js";

interface AstroStructure {
  readonly span: { readonly start: number; readonly end: number } | null;
  readonly imports: readonly string[];
  readonly rendersContent: boolean;
}
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function children(
  value: Record<string, unknown>,
  key: string,
): readonly unknown[] {
  return Array.isArray(value[key]) ? value[key] : [];
}

/** A default slot must occur in the actual unconditional native document tree. */
function rendersSlot(nodes: readonly unknown[]): boolean {
  return nodes.some((value) => {
    if (!record(value)) return false;
    if (value.type === "JSXFragment")
      return rendersSlot(children(value, "children"));
    if (value.type !== "JSXElement" || !record(value.openingElement))
      return false;
    const opening = value.openingElement;
    const name = opening.name;
    if (
      !record(name) ||
      name.type !== "JSXIdentifier" ||
      typeof name.name !== "string"
    )
      return false;
    const attributes = children(opening, "attributes");
    const attributeNames = attributes.map((attribute) =>
      record(attribute) && record(attribute.name) ? attribute.name.name : null,
    );
    if (name.name === "slot") return attributes.length === 0;
    // Components, template/raw/script bodies and replacing directives do not
    // independently prove that their lexical children reach the document.
    if (
      !/^[a-z][a-z0-9-]*$/.test(name.name) ||
      [
        "script",
        "style",
        "template",
        "textarea",
        "title",
        "noscript",
        "iframe",
        "xmp",
        "plaintext",
        "noembed",
        "noframes",
        "object",
        "audio",
        "video",
      ].includes(name.name) ||
      attributes.some(
        (attribute) =>
          record(attribute) && attribute.type === "JSXSpreadAttribute",
      ) ||
      attributeNames.some(
        (name) =>
          name === "set:html" || name === "set:text" || name === "is:raw",
      )
    )
      return false;
    return rendersSlot(children(value, "children"));
  });
}

function hasDynamicImport(value: unknown): boolean {
  if (!record(value))
    return Array.isArray(value) && value.some(hasDynamicImport);
  if (value.type === "ImportExpression") return true;
  return Object.values(value).some(
    (child) =>
      (record(child) || Array.isArray(child)) && hasDynamicImport(child),
  );
}

function hasPlaintextElement(value: unknown): boolean {
  if (!record(value))
    return Array.isArray(value) && value.some(hasPlaintextElement);
  if (
    value.type === "JSXElement" &&
    record(value.openingElement) &&
    record(value.openingElement.name) &&
    value.openingElement.name.type === "JSXIdentifier" &&
    value.openingElement.name.name === "plaintext"
  )
    return true;
  return Object.values(value).some(
    (child) =>
      (record(child) || Array.isArray(child)) && hasPlaintextElement(child),
  );
}

export function inspectAstroLayout(
  source: string,
): ModelResult<AstroStructure> {
  const invalid = (reason: string) =>
    fail([
      issue(
        "ASTRO_LAYOUT_UNSUPPORTED",
        `${reason}; keep an unconditional default <slot /> and static frontmatter imports, or reconcile the layout manually.`,
      ),
    ]);
  if (Buffer.byteLength(source, "utf8") > 1024 * 1024)
    return invalid("Astro layout exceeds the supported 1 MiB bound");
  try {
    const result = parse(source);
    if (result.diagnostics.length)
      return invalid("Astro syntax has compiler diagnostics");
    const root: unknown = result.ast;
    if (!record(root) || root.type !== "AstroRoot" || !Array.isArray(root.body))
      return invalid("Astro compiler returned an unsupported document");
    if (hasPlaintextElement(root.body))
      return invalid("HTML plaintext consumes following document content");
    let span: AstroStructure["span"] = null;
    if (root.frontmatter !== null && root.frontmatter !== undefined) {
      if (!record(root.frontmatter) || !record(root.frontmatter.program))
        return invalid("Astro frontmatter could not be proven");
      const program = root.frontmatter.program;
      if (
        !Number.isSafeInteger(program.start) ||
        !Number.isSafeInteger(program.end) ||
        (program.start as number) < 0 ||
        (program.end as number) < (program.start as number) ||
        (program.end as number) > source.length
      )
        return invalid("Astro source positions are invalid");
      if (hasDynamicImport(program))
        return invalid(
          "Dynamic frontmatter imports cannot establish stylesheet order",
        );
      // Native absence is a synthetic [0,0] frontmatter node; a real empty
      // delimiter block has a nonzero frontmatter end and remains patchable.
      if (root.frontmatter.end !== 0)
        span = { start: program.start as number, end: program.end as number };
    }
    return ok({
      span,
      imports:
        span === null
          ? []
          : parseScriptImports(source.slice(span.start, span.end))
              .filter((entry) => !entry.typeOnly)
              .map((entry) => entry.specifier),
      rendersContent: rendersSlot(root.body),
    });
  } catch {
    return invalid("Astro layout parsing failed");
  }
}

export function materializeAstroLayout(
  imports: readonly IntegrationImport[],
): string {
  return `---\n${imports.map((entry) => `import ${JSON.stringify(entry.specifier)};`).join("\n")}\n---\n<slot />\n`;
}

export function patchAstroLayout(
  source: string,
  imports: readonly IntegrationImport[],
): ModelResult<string> {
  const inspected = inspectAstroLayout(source);
  if (!inspected.ok) return inspected;
  if (!inspected.value.rendersContent)
    return fail([
      issue(
        "ASTRO_LAYOUT_CONTENT_UNPROVEN",
        "The Astro layout must preserve a statically proven default <slot />; no rendering is inserted into existing application content.",
      ),
    ]);
  let output: ModelResult<string>;
  if (inspected.value.span)
    output = patchOrderedScriptImports(source, inspected.value.span, imports);
  else {
    const offset = source.charCodeAt(0) === 0xfeff ? 1 : 0;
    const prefix = `---\n${imports.map((entry) => `import ${JSON.stringify(entry.specifier)};`).join("\n")}\n---\n`;
    output = ok(source.slice(0, offset) + prefix + source.slice(offset));
  }
  if (!output.ok) return output;
  const proven = inspectAstroLayout(output.value);
  if (!proven.ok) return proven;
  const expected = imports.map((entry) => entry.specifier);
  const indices = expected.map((value) => proven.value.imports.indexOf(value));
  if (
    !proven.value.rendersContent ||
    indices.some(
      (value, index) => value < 0 || (index > 0 && value <= indices[index - 1]),
    )
  )
    return fail([
      issue(
        "ASTRO_LAYOUT_INTEGRATION_INVALID",
        "Projected Astro layout does not preserve ordered kit/theme/app imports and default content",
      ),
    ]);
  return output;
}
