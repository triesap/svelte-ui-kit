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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-button-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/button.types.ts"),
      readFileSync("registry/ui/button.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { ButtonProps, ButtonSize, ButtonVariant } from "./button.types.js";\ndeclare const children: Snippet;\n' +
        body,
    );
    const program = ts.createProgram([fixture], {
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      module: ts.ModuleKind.NodeNext,
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      target: ts.ScriptTarget.ES2023,
      types: [],
      lib: ["lib.es2023.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
    });
    return ts.getPreEmitDiagnostics(program).map((diagnostic) => ({
      code: diagnostic.code,
      file: diagnostic.file?.fileName,
      message: ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"),
    }));
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}
test("actual native Button contract accepts form, attributes, loading, ref and children", () => {
  assert.deepEqual(
    diagnostics(`const variant: ButtonVariant = "ghost";
const size: ButtonSize = "lg";
const props: ButtonProps = { children, variant, size, type: "submit", name: "action", value: "save", form: "editor", disabled: false, loading: true, loadingLabel: "Saving", ref: null, class: ["caller", { active: true }], "data-state": "ready", "aria-label": "Save", onclick: event => { const button: HTMLButtonElement = event.currentTarget; button.focus(); } }; void props;`),
    [],
  );
});
for (const [name, body] of [
  ["unknown variant", 'const value: ButtonVariant = "danger";'],
  ["unknown size", 'const value: ButtonSize = "xl";'],
  [
    "link polymorphism",
    'const value: ButtonProps = { children, href: "/next" };',
  ],
  ["as polymorphism", 'const value: ButtonProps = { children, as: "a" };'],
  [
    "foreign ref",
    'const value: ButtonProps = { children, ref: document.createElement("a") };',
  ],
  ["non-snippet children", 'const value: ButtonProps = { children: "Save" };'],
  ["missing children", "const value: ButtonProps = {};"],
  [
    "contradictory busy",
    'const value: ButtonProps = { children, "aria-busy": false };',
  ],
  [
    "non-boolean loading",
    'const value: ButtonProps = { children, loading: "yes" };',
  ],
  [
    "non-string loading label",
    "const value: ButtonProps = { children, loadingLabel: 3 };",
  ],
  [
    "foreign event target",
    "const value: ButtonProps = { children, onclick: event => { const target: HTMLAnchorElement = event.currentTarget; void target; } };",
  ],
] as const)
  test(`actual native Button contract rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (diagnostic) =>
          diagnostic.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741].includes(diagnostic.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
