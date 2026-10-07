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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-switch-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/switch.types.ts"),
      readFileSync("registry/ui/switch.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { SwitchProps } from "./switch.types.js";\ndeclare const children: Snippet;\n' +
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
test("exact pinned Switch props accept checked/ref/native form/style/event contracts", () => {
  assert.deepEqual(
    diagnostics(
      `const props: SwitchProps = { checked: true, ref: document.createElement("button"), required: true, disabled: false, name: "enabled", value: "on", form: "editor", id: "switch", "aria-label": "Enabled", "data-caller": "yes", class: ["caller", { retained: true }], style: { color: "red" }, onCheckedChange: checked => { const value: boolean = checked; void value; }, onclick: event => { const button: HTMLButtonElement = event.currentTarget; button.focus(); } }; void props;`,
    ),
    [],
  );
});
for (const [name, body] of [
  ["owned child", "const value: SwitchProps = { child: children };"],
  ["owned children", "const value: SwitchProps = { children };"],
  ["non-boolean checked", 'const value: SwitchProps = { checked: "yes" };'],
  [
    "wrong callback",
    "const value: SwitchProps = { onCheckedChange: (value: number) => {} };",
  ],
  [
    "foreign SVG ref",
    'const value: SwitchProps = { ref: document.createElementNS("http://www.w3.org/2000/svg", "svg") };',
  ],
  ["link polymorphism", 'const value: SwitchProps = { href: "/next" };'],
  [
    "foreign event target",
    "const value: SwitchProps = { onclick: event => { const anchor: HTMLAnchorElement = event.currentTarget; void anchor; } };",
  ],
] as const)
  test(`pinned Switch contract rejects ${name} causally`, () => {
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
