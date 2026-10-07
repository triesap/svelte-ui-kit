import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parseCss } from "svelte/compiler";
import { buildDialogCandidate } from "../helpers/dialog-candidate.js";

interface Declaration {
  property: string;
  value: string;
}
interface Rule {
  selectors: string[];
  declarations: Declaration[];
}
const css = readFileSync("registry/styles/dialog.css", "utf8");
const source = JSON.parse(
  readFileSync("tests/fixtures/dialog-candidate/source-css.json", "utf8"),
) as { source: { revision: string; sha256: string }; rules: Rule[] };
const rules: Rule[] = [];
const collect = (value: unknown): void => {
  if (Array.isArray(value)) {
    value.forEach(collect);
    return;
  }
  if (!value || typeof value !== "object") return;
  const node = value as Record<string, unknown>;
  if (node["type"] === "Rule") {
    const prelude = node["prelude"] as { start: number; end: number };
    const block = node["block"] as { children: Declaration[] };
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
};
collect(parseCss(css).children);
const normalize = (value: string) => value.replace(/\s+/g, "");
test("all58 immutable source Dialog declarations retain fallbacks with only documented centering adaptation", () => {
  assert.equal(
    source.source.revision,
    "a10fbf06334f4648f5755e05a7147414e4e5fc98",
  );
  assert.match(source.source.sha256, /^[a-f0-9]{64}$/);
  assert.equal(
    source.rules.reduce((n, r) => n + r.declarations.length, 0),
    58,
  );
  for (const rule of source.rules)
    for (const selector of rule.selectors)
      for (const declaration of rule.declarations) {
        const property =
          selector === ".kit-dialog-content" &&
          declaration.property === "inset-inline-start"
            ? "inset-inline"
            : declaration.property;
        const value =
          property === "inset-inline"
            ? "0"
            : declaration.property === "transform"
              ? selector === ".kit-dialog-content"
                ? "translateY(-50%)"
                : "translateY(calc(-50% + 0.5rem)) scale(0.98)"
              : declaration.value;
        assert.ok(
          rules
            .filter((r) => r.selectors.includes(selector))
            .flatMap((r) => r.declarations)
            .some(
              (d) =>
                d.property === property &&
                normalize(d.value) === normalize(value),
            ),
          `${selector}: ${property}=${value}`,
        );
      }
});
test("all45 source Dialog customization hooks remain in actual CSS and portable v1 metadata", () => {
  const metadata = JSON.parse(
    readFileSync("registry/contracts/component-customization-v1.json", "utf8"),
  ) as { properties: { name: string; scope: string; fallback: string }[] };
  const properties = metadata.properties.filter((p) => p.scope === "dialog");
  assert.equal(properties.length, 45);
  const values = rules.flatMap((r) =>
    r.declarations.map((d) => normalize(d.value)),
  );
  for (const p of properties)
    assert.ok(
      values.some((value) =>
        value.includes(normalize(`var(${p.name},${p.fallback})`)),
      ),
      p.name,
    );
  for (const r of rules)
    for (const selector of r.selectors)
      assert.match(selector, /^\.kit-dialog-/);
  assert.match(css, /data-starting-style/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.doesNotMatch(css, /@tailwind|@apply|data-dialog-|:dir\(/);
});
test("actual complete styled candidate compiles the owned classes and real CSS assets", () => {
  const candidate = buildDialogCandidate("styles");
  try {
    assert.ok(candidate.evidence.files["src/lib/candidate/styles/dialog.css"]);
    assert.ok(candidate.evidence.files["src/lib/candidate/styles/tokens.css"]);
  } finally {
    candidate.cleanup();
  }
});
