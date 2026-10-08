import { readFileSync } from "node:fs";
import { parseCss } from "svelte/compiler";

export interface CssRule {
  file: string;
  selectors: string[];
  declarations: { property: string; value: string }[];
}
export function cssInventory(): CssRule[] {
  const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  const files: string[] = registry.items.flatMap(
    (item: { manifest: string }) => {
      const manifest = JSON.parse(
        readFileSync(`registry/${item.manifest}`, "utf8"),
      );
      return manifest.styles.map((style: { source: string }) => style.source);
    },
  );
  const rules: CssRule[] = [];
  for (const file of files.filter((file) => file !== "styles/tokens.css")) {
    const css = readFileSync(`registry/${file}`, "utf8");
    function walk(value: unknown): void {
      if (Array.isArray(value)) {
        value.forEach(walk);
        return;
      }
      if (!value || typeof value !== "object") return;
      const node = value as Record<string, unknown>;
      if (node["type"] === "Rule") {
        const prelude = node["prelude"] as { start: number; end: number };
        const selectors = css
          .slice(prelude.start, prelude.end)
          .split(",")
          .map((s) => s.trim());
        if (selectors.some((selector) => selector.includes(".kit-"))) {
          const block = node["block"] as {
            children: { property: string; value: string }[];
          };
          rules.push({
            file,
            selectors,
            declarations: block.children.filter(
              (d) => typeof d.property === "string",
            ),
          });
        }
      }
      if (node["block"])
        walk((node["block"] as { children: unknown[] }).children);
    }
    walk(parseCss(css).children);
  }
  return rules;
}
