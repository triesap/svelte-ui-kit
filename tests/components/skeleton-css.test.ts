import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseCss } from "svelte/compiler";
interface Rule {
  selectors: string[];
  declarations: { property: string; value: string }[];
}
const source = JSON.parse(
  readFileSync("tests/fixtures/skeleton-candidate/source-css.json", "utf8"),
) as { source: { revision: string; sha256: string }; rules: Rule[] };
const css = readFileSync("registry/styles/skeleton.css", "utf8");
const rules: Rule[] = [];
function collect(value: unknown): void {
  if (Array.isArray(value)) {
    value.forEach(collect);
    return;
  }
  if (!value || typeof value !== "object") return;
  const node = value as Record<string, unknown>;
  if (node["type"] === "Rule") {
    const prelude = node["prelude"] as { start: number; end: number };
    const block = node["block"] as {
      children: { property: string; value: string }[];
    };
    rules.push({
      selectors: css
        .slice(prelude.start, prelude.end)
        .split(",")
        .map((s) => s.trim()),
      declarations: block.children.filter(
        (d) => typeof d.property === "string",
      ),
    });
  }
  if (node["block"])
    collect((node["block"] as { children: unknown[] }).children);
}
collect(parseCss(css).children);
const normalize = (v: string) => v.replace(/\s+/g, "");
test("immutable Skeleton declarations preserve all 4 source layout control and state declarations", () => {
  assert.equal(
    source.source.revision,
    "a10fbf06334f4648f5755e05a7147414e4e5fc98",
  );
  assert.match(source.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(
    source.rules.reduce((n, r) => n + r.declarations.length, 0),
    4,
  );
  for (const r of source.rules)
    for (const selector of r.selectors)
      for (const d of r.declarations) {
        const mapped = selector;
        assert.ok(
          rules
            .filter((r) => r.selectors.includes(mapped))
            .flatMap((r) => r.declarations)
            .some(
              (a) =>
                a.property === d.property &&
                normalize(a.value) === normalize(d.value),
            ),
          `${mapped}: ${d.property}=${d.value}`,
        );
      }
  assert.doesNotMatch(css, /@tailwind|@apply|.kit-skeleton:checked/);
});

test("Skeleton scoped native hidden exception retains until-found", () => {
  assert.equal(rules.length, 2);
  assert.deepEqual(rules[1]!.selectors, [
    '.kit-skeleton[hidden]:not([hidden="until-found"])',
  ]);
  assert.deepEqual(
    rules[1]!.declarations.map(({ property, value }) => ({ property, value })),
    [{ property: "display", value: "none" }],
  );
});
