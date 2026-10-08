import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { parse } from "svelte/compiler";
import ts from "typescript";

const read = (file: string) => readFileSync(file, "utf8");
const files = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? files(path.join(dir, entry.name))
      : [path.join(dir, entry.name)],
  );

test("original identity has an explicit non generated disposition without registry aliases exports or dependencies", () => {
  const registry = JSON.parse(read("registry/registry.json"));
  assert.equal(registry.items.length, 22);
  assert.equal(
    registry.items.some((item: { id: string }) => item.id === "identity"),
    false,
  );
  for (const item of registry.items) {
    const manifest = JSON.parse(read(path.join("registry", item.manifest)));
    assert.ok(!manifest.registryDependencies.includes("identity"));
    assert.ok(
      manifest.exports.every(
        (entry: { name: string; target: string }) =>
          !/(?:KitIdProvider|use_kit_id|IdentityProvider)/.test(entry.name) &&
          !entry.target.startsWith("identity"),
      ),
    );
  }
  assert.ok(
    !files("registry/ui").some((file) =>
      /[/\\]identity(?:[./\\]|$)/.test(file),
    ),
  );
  const map = read("specs/component-maps/identity.md");
  assert.match(map, /Disposition: deliberately non-generated/);
  assert.match(map, /Svelte5\.57\.1 and Bits2\.19\.3/);
  assert.match(map, /idPrefix/);
  assert.match(map, /FieldLabel/);
});

test("registered Svelte instances introduce no module level identity state or provider counter clone", () => {
  for (const file of files("registry/ui").filter((file) =>
    file.endsWith(".svelte"),
  )) {
    const source = read(file);
    const ast = parse(source, { modern: true });
    assert.equal(ast.module == null, true, file);
    assert.doesNotMatch(
      source,
      /KitIdProvider|use_kit_id|Math\.random\(|Date\.now\(|randomUUID\(/,
      file,
    );
  }
  for (const file of files("registry/ui").filter((file) =>
    file.endsWith(".ts"),
  )) {
    const source = ts.createSourceFile(
      file,
      read(file),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const statement of source.statements)
      if (ts.isVariableStatement(statement)) {
        assert.ok(statement.declarationList.flags & ts.NodeFlags.Const, file);
        for (const declaration of statement.declarationList.declarations)
          assert.doesNotMatch(
            declaration.name.getText(source),
            /counter|nextId|ordinal/i,
            file,
          );
      }
  }
});

test("module state audit distinguishes a real module scope from per instance code", () => {
  const moduleSource = parse(
    "<script module>let identityCounter=0;</script><span></span>",
    { modern: true },
  );
  const instanceSource = parse(
    "<script>let instanceValue=0;</script><span></span>",
    { modern: true },
  );
  assert.ok(moduleSource.module);
  assert.equal(instanceSource.module == null, true);
  const mutable = ts.createSourceFile(
    "counter.ts",
    "export let identityCounter=0;",
    ts.ScriptTarget.Latest,
    true,
  );
  const first = mutable.statements[0]!;
  assert.ok(ts.isVariableStatement(first));
  assert.equal(first.declarationList.flags & ts.NodeFlags.Const, 0);
});

test("Field native rune and context relationships retain exact caller precedence and deterministic message ownership", () => {
  const root = read("registry/ui/field/root.svelte");
  assert.match(root, /const generatedId = \$props\.id\(\)/);
  assert.match(root, /id \?\? generatedId/);
  assert.match(root, /controlId \?\? `\$\{base\}-control`/);
  assert.match(root, /encodeURIComponent\(key\)/);
  assert.match(root, /setContext\(FIELD_CONTEXT, context\)/);
  for (const name of ["text-input", "text-area", "native-select"]) {
    const source = read(`registry/ui/field/${name}.svelte`);
    assert.match(source, /const generatedId = \$props\.id\(\)/);
    assert.match(source, /id \?\? context\?\.controlId \?\? generatedId/);
  }
  const label = read("registry/ui/field/label.svelte");
  assert.match(label, /target === undefined \? context\?\.controlId : target/);
  assert.match(label, /for=\{controlTarget\}/);
  for (const name of ["text-field", "text-area-field", "select-field"]) {
    const source = read(`registry/ui/field/${name}.svelte`);
    assert.match(source, /<FieldRoot\s+\{id\}/);
  }
  assert.match(read("registry/ui/field/context.ts"), /FIELD_CONTEXT = Symbol/);
});

test("pinned Svelte SSR identity allocation is per renderer and client hydration consumes its native marker", () => {
  assert.equal(
    JSON.parse(read("node_modules/svelte/package.json")).version,
    "5.57.1",
  );
  const renderer = read("node_modules/svelte/src/internal/server/renderer.js");
  assert.match(
    renderer,
    /constructor\(mode, id_prefix[\s\S]*?let uid = 1;[\s\S]*?this\.uid = \(\) =>/,
  );
  const server = read("node_modules/svelte/src/internal/server/index.js");
  assert.match(
    server,
    /function props_id\(renderer\)[\s\S]*?renderer\.global\.uid\(\)[\s\S]*?renderer\.push\('<!--\$'/,
  );
  const client = read(
    "node_modules/svelte/src/internal/client/dom/template.js",
  );
  assert.match(
    client,
    /function props_id\(\)[\s\S]*?hydrate_node\.textContent\?\.startsWith\(`\$`\)[\s\S]*?hydrate_next\(\);[\s\S]*?return id;/,
  );
  assert.match(client, /window\.__svelte\.uid\+\+/);
});

test("actual Bits identity formatter and affected parts derive IDs from native component runes", () => {
  assert.equal(
    JSON.parse(read("node_modules/bits-ui/package.json")).version,
    "2.19.3",
  );
  const formatter = read("node_modules/bits-ui/dist/internal/create-id.js");
  assert.match(formatter, /export function createId\(prefixOrUid, uid\)/);
  assert.match(formatter, /return `bits-\$\{prefixOrUid\}`/);
  assert.doesNotMatch(formatter, /\+\+|Math\.random|Date\.now|new Map/);
  for (const file of [
    "switch/components/switch.svelte",
    "checkbox/components/checkbox.svelte",
    "radio-group/components/radio-group-item.svelte",
    "tabs/components/tabs-trigger.svelte",
    "tabs/components/tabs-content.svelte",
    "collapsible/components/collapsible-trigger.svelte",
    "collapsible/components/collapsible-content.svelte",
    "dialog/components/dialog-trigger.svelte",
    "dialog/components/dialog-content.svelte",
    "dialog/components/dialog-title.svelte",
    "dialog/components/dialog-description.svelte",
    "alert-dialog/components/alert-dialog-content.svelte",
    "menu/components/menu-trigger.svelte",
    "menu/components/menu-content.svelte",
  ]) {
    const source = read(`node_modules/bits-ui/dist/bits/${file}`);
    assert.match(source, /const uid = \$props\.id\(\)/, file);
    assert.match(source, /id = createId\(/, file);
  }
});
