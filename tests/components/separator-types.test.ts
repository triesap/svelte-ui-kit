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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-separator-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/separator.types.ts"),
      readFileSync("registry/ui/separator.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { SeparatorProps } from "./separator.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Separator accepts exact orientations meaningful decorative native attrs events and div refs", () => {
  assert.deepEqual(
    diagnostics(
      'const props:SeparatorProps={orientation:"horizontal",role:"separator",ref:document.createElement("div"),class:["caller",{retained:true}],style:"height:80px",id:"separator",title:"Section boundary","aria-label":"Section boundary","data-caller":"yes",hidden:false,tabindex:-1,onclick:event=>{const element:HTMLDivElement=event.currentTarget;event.preventDefault();element.focus();}};const vertical:SeparatorProps={orientation:"vertical",ref:null};const decorative:SeparatorProps={decorative:true,role:"none","aria-hidden":"true"};const implied:SeparatorProps={};const hidden:SeparatorProps={decorative:false,"aria-hidden":true};void props;void vertical;void decorative;void implied;void hidden;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["unsupported orientation", '{orientation:"diagonal"}'],
  ["native ARIA orientation override", '{"aria-orientation":"horizontal"}'],
  ["native data orientation override", '{"data-orientation":"vertical"}'],
  ["caller children", "{children}"],
  ["string decorative", '{decorative:"true"}'],
  ["meaningful role replacement", '{role:"none"}'],
  ["decorative role replacement", '{decorative:true,role:"separator"}'],
  ["decorative hidden contradiction", '{decorative:true,"aria-hidden":false}'],
  [
    "decorative hidden string contradiction",
    '{decorative:true,"aria-hidden":"false"}',
  ],
  ["value state", "{value:25}"],
  ["splitter resizing", "{resizable:true}"],
  ["variant", '{variant:"primary"}'],
  ["size", '{size:"lg"}'],
  ["named part", "{thumb:children}"],
  ["replacement child", "{child:children}"],
  [
    "foreign SVG ref",
    '{ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  [
    "foreign event target",
    "{onclick:event=>{const input:HTMLInputElement=event.currentTarget;void input;}}",
  ],
  ["invalid native hidden", '{hidden:"collapsed"}'],
  ["invalid native live", '{"aria-live":"loud"}'],
] as const)
  test(`native Separator rejects ${name} causally`, () => {
    const actual = diagnostics(
      `const value:SeparatorProps=${body};void value;`,
    );
    assert.ok(
      actual.some(
        (d) =>
          d.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741].includes(d.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((d) => d.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
