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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-badge-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/badge.types.ts"),
      readFileSync("registry/ui/badge.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { BadgeProps } from "./badge.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Badge accepts meaningful children exact native attrs events and span ref", () => {
  assert.deepEqual(
    diagnostics(
      'const props:BadgeProps={children,ref:document.createElement("span"),class:["caller",{retained:true}],style:"color:navy",id:"badge",title:"Queue state","aria-label":"Queued","data-state":"queued",dir:"rtl",tabindex:0,onclick:event=>{const span:HTMLSpanElement=event.currentTarget;event.preventDefault();span.focus();},onkeydown:event=>{const span:HTMLSpanElement=event.currentTarget;void span;}};const optional:BadgeProps={children,ref:null};void props;void optional;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["missing children", "{}"],
  ["non-snippet children", '{children:"Queued"}'],
  [
    "foreign SVG ref",
    '{children,ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  ["variant", '{children,variant:"success"}'],
  ["size", '{children,size:"sm"}'],
  ["disabled", "{children,disabled:true}"],
  ["loading", "{children,loading:true}"],
  ["link href", '{children,href:"/next"}'],
  ["button type", '{children,type:"submit"}'],
  ["replacement child", "{children,child:children}"],
  ["polymorphic as", '{children,as:"button"}'],
  [
    "foreign event target",
    "{children,onclick:event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}",
  ],
] as const)
  test(`native Badge rejects ${name} causally`, () => {
    const actual = diagnostics(`const value:BadgeProps=${body};void value;`);
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
