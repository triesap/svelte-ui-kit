import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { cssInventory } from "../helpers/css-inventory.js";

const registry = JSON.parse(readFileSync("registry/registry.json", "utf8"));
const manifests = registry.items.map((item: { manifest: string }) =>
  JSON.parse(readFileSync(`registry/${item.manifest}`, "utf8")),
);
const rules = cssInventory();
const contract = JSON.parse(
  readFileSync("registry/contracts/component-customization-v1.json", "utf8"),
);

test("all 278 public properties have an authoritative parsed declaration use", () => {
  assert.equal(contract.properties.length, 278);
  for (const { name } of contract.properties) {
    assert.ok(
      rules.some((rule) =>
        rule.declarations.some((d) =>
          new RegExp(`var\\(\\s*${name}(?:\\s*[,)]|\\s*$)`).test(d.value),
        ),
      ),
      name,
    );
  }
  const publicNames = new Set(
    contract.properties.map((p: { name: string }) => p.name),
  );
  const theme = readFileSync("registry/styles/tokens.css", "utf8");
  const optionalSourceTokens = new Set([
    "--kit-color-ghost",
    "--kit-color-ghost-foreground",
    "--kit-color-ghost-hover",
    "--kit-color-ghost-hover-foreground",
  ]);
  for (const rule of rules)
    for (const declaration of rule.declarations)
      for (const [, name] of declaration.value.matchAll(
        /var\(\s*(--kit-[\w-]+)/g,
      ))
        assert.ok(
          publicNames.has(name) ||
            rules.some((r) =>
              r.declarations.some((d) => d.property === name),
            ) ||
            theme.includes(`${name}:`) ||
            (optionalSourceTokens.has(name!) &&
              new RegExp(`var\\(\\s*${name}\\s*,`).test(declaration.value)),
          `${rule.file}: ${name}`,
        );
});

test("every authoritative kit class maps to component markup or the documented Menu snippet", () => {
  const markup = manifests
    .flatMap((manifest: { files: { source: string }[] }) =>
      manifest.files
        .filter((f) => f.source.endsWith(".svelte"))
        .map((f) => readFileSync(`registry/${f.source}`, "utf8")),
    )
    .join("\n");
  const map = readFileSync("docs/reference/components/menu.md", "utf8");
  for (const rule of rules)
    for (const selector of rule.selectors) {
      for (const [, name] of selector.matchAll(/\.(kit-[\w-]+)/g)) {
        assert.ok(name);
        if (/^kit-button--(primary|secondary|ghost|sm|md|lg)$/.test(name)) {
          assert.ok(
            markup.includes("`kit-button--${variant}`") &&
              markup.includes("`kit-button--${size}`"),
          );
        } else if (name === "kit-menu-radio-item-label") {
          assert.ok(
            map.includes(name),
            "caller-owned label hook must be mapped",
          );
          assert.ok(
            readFileSync(
              "tests/fixtures/qualification/css-contracts/+page.svelte",
              "utf8",
            ).includes(name),
          );
        } else
          assert.ok(markup.includes(name), `${rule.file}: nonexistent ${name}`);
      }
    }
});

test("catalog owns each CSS source once and forbids parallel component pipelines", () => {
  const styles: { source: string }[] = manifests.flatMap(
    (manifest: { styles: { source: string }[] }) => manifest.styles,
  );
  assert.equal(styles.length, 21);
  assert.equal(new Set(styles.map((s) => s.source)).size, styles.length);
  for (const style of styles) {
    const css = readFileSync(`registry/${style.source}`, "utf8");
    assert.doesNotMatch(css, /@tailwind|@apply|@import|styled\(|css`/);
    assert.equal([...css.matchAll(/svelte-ui-kit:start /g)].length, 1);
  }
  for (const manifest of manifests)
    for (const file of manifest.files) {
      if (!file.source.endsWith(".svelte")) continue;
      const source = readFileSync(`registry/${file.source}`, "utf8");
      assert.doesNotMatch(
        source,
        /<style|import\s+["'][^"']*\.css["']|@tailwind|@apply/,
      );
    }
});
