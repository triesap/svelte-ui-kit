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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-alert-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/alert.types.ts"),
      readFileSync("registry/ui/alert.types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { AlertProps } from "./alert.types.js";\ndeclare const children: Snippet;\n' +
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
test("native Alert accepts exact source role message content native ARIA attributes and div ref", () => {
  assert.deepEqual(
    diagnostics(
      'const props:AlertProps={children,role:"alert",ref:document.createElement("div"),class:["caller",{retained:true}],style:"padding:2rem",id:"alert",title:"Urgent message","aria-label":"Network failure","aria-live":"assertive","aria-atomic":true,"aria-relevant":"additions text","data-caller":"yes",hidden:false,tabindex:-1,onclick:event=>{const div:HTMLDivElement=event.currentTarget;event.preventDefault();div.focus();}};const native:AlertProps={children,ref:null,"aria-live":"off","aria-atomic":false,"aria-hidden":true};void props;void native;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["missing children", "{}"],
  ["non-snippet children", '{children:"Error"}'],
  [
    "foreign SVG ref",
    '{children,ref:document.createElementNS("http://www.w3.org/2000/svg","svg")}',
  ],
  ["status role", '{children,role:"status"}'],
  ["dialog role", '{children,role:"alertdialog"}'],
  ["action role", '{children,role:"button"}'],
  ["severity variant", '{children,variant:"danger"}'],
  ["size", '{children,size:"lg"}'],
  ["dismiss state", "{children,dismissible:true}"],
  ["notification delay", "{children,delay:1000}"],
  ["named title part", "{children,title:children}"],
  ["named icon part", "{children,icon:children}"],
  ["link href", '{children,href:"/next"}'],
  ["replacement child", "{children,child:children}"],
  ["polymorphic as", '{children,as:"aside"}'],
  ["invalid native live value", '{children,"aria-live":"loud"}'],
  ["invalid native atomic value", '{children,"aria-atomic":"maybe"}'],
  [
    "foreign event target",
    "{children,onclick:event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}",
  ],
] as const)
  test(`native Alert rejects ${name} causally`, () => {
    const actual = diagnostics(`const value:AlertProps=${body};void value;`);
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
