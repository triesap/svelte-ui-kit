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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-card-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/card.types.ts"),
      readFileSync("registry/ui/card.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { CardProps } from "./card.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Card accepts exact section content attributes naming events and ref", () => {
  assert.deepEqual(
    diagnostics(
      'const props:CardProps={children,ref:document.createElement("section"),class:["caller",{retained:true}],style:"padding:2rem",id:"card",title:"Section description","aria-labelledby":"heading","data-caller":"yes",role:"region",hidden:false,tabindex:-1,dir:"rtl",onclick:event=>{const section:HTMLElement=event.currentTarget;section.focus();},onkeydown:event=>{const section:HTMLElement=event.currentTarget;event.preventDefault();void section;}};const optional:CardProps={children,ref:null};void props;void optional;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["missing children", "{}"],
  ["non-snippet children", '{children:"Card text"}'],
  [
    "foreign SVG ref",
    '{children,ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  ["variant", '{children,variant:"elevated"}'],
  ["size", '{children,size:"lg"}'],
  ["disabled", "{children,disabled:true}"],
  ["loading", "{children,loading:true}"],
  ["link href", '{children,href:"/next"}'],
  ["image src", '{children,src:"/image.png"}'],
  ["named header part", "{children,header:children}"],
  ["named footer part", "{children,footer:children}"],
  ["replacement child", "{children,child:children}"],
  ["polymorphic as", '{children,as:"article"}'],
  ["invalid native hidden", '{children,hidden:"always"}'],
  [
    "foreign event target",
    "{children,onclick:event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}",
  ],
] as const)
  test(`native Card rejects ${name} causally`, () => {
    const actual = diagnostics(`const value:CardProps=${body};void value;`);
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
