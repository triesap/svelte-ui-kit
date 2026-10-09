import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { createAssetProvider } from "../../src/registry/assets.js";
import { loadRegistrySnapshot } from "../../src/registry/load.js";
import { validateResolvedTargets } from "../../src/registry/validate-targets.js";
import { buildCatalogConsumer } from "../helpers/generated-consumer.js";
import { sha256Hex } from "../../src/codegen/digest.js";

const original = [
  "alert",
  "anchor",
  "avatar",
  "badge",
  "button",
  "card",
  "checkbox",
  "collapsible",
  "dialog",
  "field",
  "identity",
  "menu",
  "progress",
  "radio",
  "router-link",
  "separator",
  "skeleton",
  "spinner",
  "status",
  "switch",
  "tabs",
  "tokens",
];
const generated = [
  ...original.filter((id) => id !== "identity"),
  "alert-dialog",
].sort();
const source = JSON.parse(
  readFileSync("tests/fixtures/catalog-source.json", "utf8"),
) as {
  source: { revision: string; sha256: string };
  items: {
    id: string;
    exports: string[];
    sha256: string;
    files: { source: string; sha256: string }[];
    styles: { source: string; sha256: string }[];
  }[];
};
const exact = (ids: string[]) => assert.deepEqual([...ids].sort(), generated);
const parts: Record<string, string[]> = {
  "alert-dialog": [
    "Root",
    "Trigger",
    "Portal",
    "Overlay",
    "Content",
    "Title",
    "Description",
    "Action",
    "Cancel",
  ].map((part) => `AlertDialog${part}`),
  collapsible: ["Root", "Trigger", "Content"].map(
    (part) => `Collapsible${part}`,
  ),
  dialog: [
    "Root",
    "Trigger",
    "Portal",
    "Overlay",
    "Content",
    "Title",
    "Description",
    "Close",
  ].map((part) => `Dialog${part}`),
  field: [
    "FieldRoot",
    "FieldSurface",
    "FieldLabel",
    "FieldMessage",
    "FieldRequired",
    "TextInput",
    "TextArea",
    "NativeSelect",
    "SelectIcon",
    "TextField",
    "TextAreaField",
    "SelectField",
  ],
  menu: [
    "Root",
    "Trigger",
    "Portal",
    "Content",
    "Item",
    "RadioGroup",
    "RadioItem",
    "ItemIndicator",
  ].map((part) => `Menu${part}`),
  radio: ["RadioGroup", "RadioItem"],
  tabs: ["TabsRoot", "TabsList", "TabsTrigger", "TabsContent"],
};
const aliases: Record<string, string[]> = {
  anchor: ["AnchorTarget"],
  button: ["ButtonVariant", "ButtonSize"],
  field: ["FieldSlot", "TextInputType"],
  separator: ["SeparatorOrientation"],
  spinner: ["SpinnerMode"],
  status: ["StatusRole", "StatusPoliteness"],
};
function expectedExports(id: string) {
  const values =
    id === "tokens"
      ? []
      : (parts[id] ?? [
          id === "router-link"
            ? "RouterLink"
            : id[0]!.toUpperCase() + id.slice(1),
        ]);
  return [
    ...values.map((name) => `${name}:value`),
    ...values.map((name) => `${name}Props:type`),
    ...(aliases[id] ?? []).map((name) => `${name}:type`),
  ].sort();
}
function exactExports(
  id: string,
  exports: readonly { name: string; kind: string }[],
) {
  assert.deepEqual(
    exports.map((entry) => `${entry.name}:${entry.kind}`).sort(),
    expectedExports(id),
    id,
  );
}

test("immutable original catalog inventory has exactly twenty two explicit dispositions and authenticated source asset hashes", () => {
  assert.equal(
    source.source.revision,
    "a10fbf06334f4648f5755e05a7147414e4e5fc98",
  );
  assert.equal(
    source.source.sha256,
    "d611024559ef85d1215484f3208f4cfcdaadcd1efe35a0068a720b5cd03db705",
  );
  assert.deepEqual(
    source.items.map((item) => item.id),
    original,
  );
  const catalog = readFileSync("docs/reference/components/README.md", "utf8");
  for (const item of source.items) {
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    for (const asset of [...item.files, ...item.styles])
      assert.match(asset.sha256, /^[a-f0-9]{64}$/);
    const file =
      item.id === "identity"
        ? "docs/reference/compatibility.md"
        : `docs/reference/components/${item.id}.md`;
    if (item.id !== "identity")
      assert.ok(catalog.includes(`](${item.id}.md)`), item.id);
    const worksheet = readFileSync(file, "utf8");
    for (const name of item.exports)
      assert.ok(
        catalog.includes(name) || worksheet.includes(name),
        `${item.id}: source export ${name} needs explicit target/disposition`,
      );
    if (item.id !== "identity") assert.ok(catalog.includes(`${item.id}.md`));
  }
  assert.match(catalog, /deliberately non-generated/);
  assert.match(catalog, /sole additional component/);
});

test("complete advertised root resolves every source style export and dependency without placeholders or extra families", () => {
  const loaded = loadRegistrySnapshot(createAssetProvider(process.cwd()));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  if (!loaded.ok) return;
  exact(loaded.value.items.map((item) => item.id));
  const result = validateResolvedTargets(loaded.value, generated);
  assert.equal(result.ok, true, JSON.stringify(result));
  for (const item of loaded.value.items) {
    exactExports(item.id, item.manifest.exports);
    if (item.id !== "tokens")
      assert.ok(
        item.manifest.exports.some((entry) => entry.kind === "value"),
        item.id,
      );
    for (const file of item.files)
      assert.equal(file.digest, sha256Hex(file.bytes), file.logicalSource);
    for (const dependency of item.manifest.registryDependencies)
      assert.ok(generated.includes(dependency), `${item.id}: ${dependency}`);
    assert.equal(
      item.manifest.styles.length,
      item.id === "router-link" ? 0 : 1,
      item.id,
    );
    assert.ok(
      !item.manifest.exports.some((entry) =>
        /KitIdProvider|IdentityProvider|use_kit_id/.test(entry.name),
      ),
    );
  }
  assert.equal(
    loaded.value.items.find((item) => item.id === "router-link")!.manifest.kind,
    "component",
  );
  assert.deepEqual(
    loaded.value.items.find((item) => item.id === "router-link")!.manifest
      .registryDependencies,
    ["anchor"],
  );
  assert.match(
    readFileSync("registry/ui/alert-dialog/root.svelte", "utf8"),
    /AlertDialog as BitsAlertDialog/,
  );
  assert.doesNotMatch(
    readFileSync("registry/ui/alert-dialog/root.svelte", "utf8"),
    /Dialog as BitsDialog/,
  );
});

test("catalog boundary causally refuses missing original generated items fake identity aliases and unapproved components", () => {
  assert.throws(() => exact(generated.filter((id) => id !== "progress")));
  assert.throws(() => exact([...generated, "identity"]));
  assert.throws(() => exact([...generated, "combobox"]));
  assert.throws(() => exact([...generated, "alert-dialog"]));
  exact(generated);
  const fieldExports = expectedExports("field").map((entry) => {
    const [name, kind] = entry.split(":");
    return { name: name!, kind: kind! };
  });
  assert.throws(() =>
    exactExports(
      "field",
      fieldExports.filter((entry) => entry.name !== "NativeSelect"),
    ),
  );
  assert.throws(() =>
    exactExports("field", [
      ...fieldExports,
      { name: "FieldSchemaEngine", kind: "value" },
    ]),
  );
  exactExports("field", fieldExports);
});

for (const custom of [false, true])
  test(`complete catalog actual source exports compile install and SSR ${custom ? "custom" : "default"}`, () => {
    const consumer = buildCatalogConsumer(custom);
    try {
      assert.equal(consumer.evidence.coinstalled.length, 22);
      exact(consumer.evidence.coinstalled);
      const result = spawnSync(
        process.execPath,
        [
          "tests/helpers/render-built-consumer.mjs",
          consumer.handler,
          `/${consumer.route}`,
        ],
        { encoding: "utf8", timeout: 90000 },
      );
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.equal(result.stderr, "");
      const rendered = JSON.parse(result.stdout);
      assert.equal(rendered.status, 200);
      assert.equal(
        rendered.handlerSha256,
        sha256Hex(readFileSync(consumer.handler)),
      );
      for (const text of [
        "Complete installed catalog",
        "Anchor",
        "Recipe",
        "Badge",
        "Button",
        "Card",
        "Alert",
        "Status",
        "Catalog progress",
      ])
        assert.ok(rendered.body.includes(text), text);
      for (const className of [
        "kit-avatar",
        "kit-badge",
        "kit-button",
        "kit-card",
        "kit-alert",
        "kit-status",
        "kit-progress",
        "kit-separator",
        "kit-skeleton",
        "kit-spinner",
      ])
        assert.ok(rendered.body.includes(className), className);
      assert.ok(consumer.evidence.files["src/catalog-exports.ts"]);
      mkdirSync("implementation/evidence/logs/catalog-parity", {
        recursive: true,
      });
      writeFileSync(
        `implementation/evidence/logs/catalog-parity/${custom ? "custom" : "default"}-${process.pid}.json`,
        JSON.stringify({ evidence: consumer.evidence, rendered }, null, 2),
      );
    } finally {
      consumer.cleanup();
    }
  });
