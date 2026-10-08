import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";

function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-checkbox-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/checkbox.types.ts"),
      readFileSync("registry/ui/checkbox.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { CheckboxProps } from "./checkbox.types.js";\ndeclare const children: Snippet;\n' +
        body,
    );
    const program = ts.createProgram(
      [
        fixture,
        path.resolve(
          "tests/fixtures/consumer/node_modules/svelte-check/dist/src/svelte-shims-v4.d.ts",
        ),
      ],
      {
        strict: true,
        noEmit: true,
        skipLibCheck: false,
        module: ts.ModuleKind.NodeNext,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        target: ts.ScriptTarget.ES2023,
        types: ["node"],
        lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
      },
    );
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
      code: diagnostic.code,
      file: diagnostic.file?.fileName,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("exact pinned Checkbox props accept checked/ref/native form/style/event contracts", () => {
  assert.deepEqual(
    diagnostics(
      `const props: CheckboxProps = { checked: true, indeterminate: false, readonly: false, onIndeterminateChange: mixed => { const value: boolean = mixed; void value; }, ref: document.createElement("button"), required: true, disabled: false, name: "enabled", value: "on", form: "editor", id: "checkbox", "aria-label": "Enabled", "data-caller": "yes", class: ["caller", { retained: true }], style: { color: "red" }, onCheckedChange: checked => { const value: boolean = checked; void value; }, onclick: event => { const button: HTMLButtonElement = event.currentTarget; button.focus(); } }; void props;`,
    ),
    [],
  );
});
for (const [name, body] of [
  [
    "non-boolean indeterminate",
    'const value: CheckboxProps = { indeterminate: "mixed" };',
  ],
  [
    "wrong indeterminate callback",
    "const value: CheckboxProps = { onIndeterminateChange: (value: string) => {} };",
  ],
  ["invalid native value", "const value: CheckboxProps = { value: false };"],
  [
    "invented checked union",
    'const value: CheckboxProps = { checked: "indeterminate" };',
  ],
  ["unmapped group API", 'const value: CheckboxProps = { values: ["a"] };'],
  ["owned child", "const value: CheckboxProps = { child: children };"],
  ["owned children", "const value: CheckboxProps = { children };"],
  ["non-boolean checked", 'const value: CheckboxProps = { checked: "yes" };'],
  [
    "wrong callback",
    "const value: CheckboxProps = { onCheckedChange: (value: number) => {} };",
  ],
  [
    "foreign SVG ref",
    'const value: CheckboxProps = { ref: document.createElementNS("http://www.w3.org/2000/svg", "svg") };',
  ],
  ["link polymorphism", 'const value: CheckboxProps = { href: "/next" };'],
  [
    "foreign event target",
    "const value: CheckboxProps = { onclick: event => { const anchor: HTMLAnchorElement = event.currentTarget; void anchor; } };",
  ],
] as const)
  test(`pinned Checkbox contract rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (diagnostic) =>
          diagnostic.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740].includes(diagnostic.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });

test("checked unchecked and independent mixed state compile with pinned callbacks", () => {
  assert.deepEqual(
    diagnostics(
      'const unchecked: CheckboxProps = { checked: false, indeterminate: false }; const checked: CheckboxProps = { checked: true, indeterminate: false }; const mixed: CheckboxProps = { checked: false, indeterminate: true, required: true, form: "editor", disabled: false }; void unchecked; void checked; void mixed;',
    ),
    [],
  );
});
