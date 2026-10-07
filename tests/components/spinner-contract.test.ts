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

const contract = readFileSync("registry/ui/spinner.types.ts", "utf8");
const mapping = readFileSync("specs/component-maps/spinner.md", "utf8");
function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-spinner-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(path.join(root, "src/spinner.types.ts"), contract);
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { SpinnerProps, SpinnerMode } from "./spinner.types.js";\n' +
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
test("real native Spinner types accept both modes and supported caller attributes", () => {
  assert.deepEqual(
    diagnostics(`const mode: SpinnerMode = "decorative";
const defaults: SpinnerProps = {};
const status: SpinnerProps = { mode: "status", label: "Saving", id: "spinner", class: ["caller", { active: true }], style: "color:red", "data-operation": "save", onclick: event => { const target: HTMLSpanElement = event.currentTarget; target.focus(); } };
const decorative: SpinnerProps = { mode, title: "Decoration" };
void defaults;void status;void decorative;`),
    [],
  );
});
for (const [name, body] of [
  ["unknown mode", 'const value: SpinnerMode = "busy";'],
  [
    "decorative label",
    'const value: SpinnerProps = { mode: "decorative", label: "Duplicate" };',
  ],
  ["children", "const value: SpinnerProps = { children: () => {} };"],
  ["role", 'const value: SpinnerProps = { role: "alert" };'],
  ["aria-hidden", 'const value: SpinnerProps = { "aria-hidden": false };'],
  ["aria-label", 'const value: SpinnerProps = { "aria-label": "Duplicate" };'],
  ["aria-live", 'const value: SpinnerProps = { "aria-live": "assertive" };'],
  ["ref binding", "const value: SpinnerProps = { ref: null };"],
  [
    "foreign event target",
    "const value: SpinnerProps = { onclick: event => { const target: HTMLButtonElement = event.currentTarget; } };",
  ],
] as const)
  test(`real native Spinner contract rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (diagnostic) =>
          diagnostic.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2740].includes(diagnostic.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
test("mode ownership, circular CSS and omitted hooks are recorded explicitly", () => {
  for (const text of [
    "role=status",
    "aria-hidden",
    "kit-spinner-mark",
    "kit-spinner-label",
    "bindable ref",
    "--kit-spinner-radius",
    "var(--kit-radius-full)",
    "reduced-motion",
    "SvelteHTMLElements",
  ])
    assert.ok(mapping.includes(text), text);
});
