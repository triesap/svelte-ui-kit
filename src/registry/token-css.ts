import { parseCss } from "svelte/compiler";
import { fail, issue, ok, type ModelResult } from "./errors.js";
import { KIT_LAYERS, type TokenContract } from "./theme.js";

/** Prove the authored default declarations, rather than matching comments. */
export function validateTokenDefaults(
  text: string,
  contract: TokenContract,
  locator: string,
): ModelResult<true> {
  try {
    const ast = parseCss(text);
    const declarations = new Map<string, string[]>();
    const declaredStarts = new Set<number>();
    const order = ast.children.find(
      (node) =>
        node.type === "Atrule" && node.name === "layer" && node.block === null,
    );
    if (
      order?.type !== "Atrule" ||
      order.prelude
        .split(",")
        .map((value) => value.trim())
        .join(",") !== KIT_LAYERS.join(",")
    )
      return fail([
        issue(
          "REGISTRY_TOKEN_CSS_MISMATCH",
          "Token stylesheet must declare the exact three contract layers in order.",
          locator,
        ),
      ]);
    for (const layer of ast.children) {
      if (
        layer.type !== "Atrule" ||
        layer.name !== "layer" ||
        layer.prelude.trim() !== KIT_LAYERS[0] ||
        layer.block === null
      )
        continue;
      for (const rule of layer.block.children) {
        if (
          rule.type !== "Rule" ||
          text.slice(rule.prelude.start, rule.prelude.end).trim() !== ":root"
        )
          continue;
        for (const declaration of rule.block.children) {
          if (declaration.type !== "Declaration") continue;
          const values = declarations.get(declaration.property) ?? [];
          values.push(declaration.value.trim());
          declaredStarts.add(declaration.start);
          declarations.set(declaration.property, values);
        }
      }
    }
    const mismatches = contract.tokens.filter((token) => {
      const values = declarations.get(token.name);
      return values?.length !== 1 || values[0] !== token.fallback;
    });
    const names = new Set(contract.tokens.map((token) => token.name));
    let outsideDefault = false;
    const visit = (value: unknown): void => {
      if (Array.isArray(value)) {
        value.forEach(visit);
        return;
      }
      if (value === null || typeof value !== "object") return;
      const node = value as Record<string, unknown>;
      if (
        node["type"] === "Declaration" &&
        typeof node["property"] === "string" &&
        names.has(node["property"]) &&
        !declaredStarts.has(node["start"] as number)
      )
        outsideDefault = true;
      for (const [key, child] of Object.entries(node))
        if (key !== "metadata") visit(child);
    };
    visit(ast.children);
    if (outsideDefault)
      return fail([
        issue(
          "REGISTRY_TOKEN_CSS_MISMATCH",
          "Semantic defaults may not be overridden outside the authenticated tokens-layer :root rule.",
          locator,
        ),
      ]);
    if (mismatches.length > 0)
      return fail([
        issue(
          "REGISTRY_TOKEN_CSS_MISMATCH",
          "Every semantic token must have exactly its declared default in the tokens-layer :root rule.",
          locator,
        ),
      ]);
    return ok(true);
  } catch {
    return fail([
      issue(
        "REGISTRY_TOKEN_CSS_INVALID",
        "Token stylesheet must parse with the pinned CSS compiler.",
        locator,
      ),
    ]);
  }
}
