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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-radio-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/radio.types.ts"),
      readFileSync("registry/ui/radio/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { RadioGroupProps, RadioItemProps } from "./radio.types.js";\n' +
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
test("exact pinned Radio group value form navigation and item snippets compile", () => {
  assert.deepEqual(
    diagnostics(`declare const groupChildren:Snippet;declare const groupChild:Snippet<[{props:Record<string,unknown>}]>;declare const itemChildren:Snippet<[{checked:boolean}]>;declare const itemChild:Snippet<[{props:Record<string,unknown>,checked:boolean}]>;
const group:RadioGroupProps={value:"stable",name:"choice",required:true,disabled:false,readonly:false,orientation:"horizontal",loop:false,dir:"rtl",ref:document.createElement("div"),id:"group",class:["caller"],style:{color:"red"},children:groupChildren,child:groupChild,"aria-labelledby":"legend",onValueChange:value=>{const typed:string=value;void typed;}};
const item:RadioItemProps={value:"stable",ref:document.createElement("button"),children:itemChildren,child:itemChild,disabled:false,"aria-labelledby":"choice-label",class:["caller"],form:"editor",onclick:event=>{const typed:HTMLButtonElement=event.currentTarget;typed.focus();}};void group;void item;`),
    [],
  );
});
for (const [name, body] of [
  ["numeric group value", "const value:RadioGroupProps={value:1};"],
  ["numeric item value", "const value:RadioItemProps={value:1};"],
  ["missing required item value", "const value:RadioItemProps={};"],
  [
    "checkbox checked API",
    'const value:RadioItemProps={value:"a",checked:true};',
  ],
  [
    "group form convenience alias",
    'const value:RadioGroupProps={form:"editor"};',
  ],
  ["array selection", 'const value:RadioGroupProps={value:["a"]};'],
  [
    "wrong selection callback",
    "const value:RadioGroupProps={onValueChange:(value:number)=>{}};",
  ],
  [
    "invalid orientation",
    'const value:RadioGroupProps={orientation:"diagonal"};',
  ],
  [
    "unknown group option",
    'const value:RadioGroupProps={selection_policy:"Automatic"};',
  ],
  [
    "foreign SVG ref",
    'const value:RadioItemProps={value:"a",ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "wrong child checked type",
    'const child:Snippet<[{props:Record<string,unknown>,checked:string}]>=undefined!;const value:RadioItemProps={value:"a",child};',
  ],
  ["link polymorphism", 'const value:RadioItemProps={value:"a",href:"/next"};'],
  [
    "foreign event target",
    'const value:RadioItemProps={value:"a",onclick:event=>{const anchor:HTMLAnchorElement=event.currentTarget;void anchor;}};',
  ],
] as const)
  test(`exact Radio contracts reject ${name} causally`, () => {
    const actual = diagnostics(body);
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
