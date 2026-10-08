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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-tabs-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/tabs.types.ts"),
      readFileSync("registry/ui/tabs/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { TabsRootProps, TabsListProps, TabsTriggerProps, TabsContentProps } from "./tabs.types.js";\n' +
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
test("exact pinned Tabs activation value ref and snippet types compile", () => {
  assert.deepEqual(
    diagnostics(
      'declare const children:Snippet;declare const child:Snippet<[{props:Record<string,unknown>}]>;\nconst root:TabsRootProps={value:"account",orientation:"vertical",activationMode:"manual",loop:false,disabled:false,dir:"rtl",ref:document.createElement("div"),class:["caller"],style:{color:"red"},children,child,onValueChange:value=>{const typed:string=value;void typed;}};\nconst list:TabsListProps={ref:document.createElement("div"),children,child,"aria-label":"Settings"};\nconst trigger:TabsTriggerProps={value:"account",disabled:null,ref:document.createElement("button"),form:"editor",children,child,onclick:event=>{const typed:HTMLButtonElement=event.currentTarget;typed.focus();}};\nconst content:TabsContentProps={value:"account",ref:document.createElement("div"),tabindex:-1,children,child,"aria-label":"Account"};void root;void list;void trigger;void content;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["numeric selection", "const value:TabsRootProps={value:0};"],
  ["numeric trigger", "const value:TabsTriggerProps={value:0};"],
  ["missing trigger value", "const value:TabsTriggerProps={};"],
  ["missing content value", "const value:TabsContentProps={};"],
  ["Rust index", 'const value:TabsTriggerProps={value:"a",index:0};'],
  [
    "invalid activation",
    'const value:TabsRootProps={activationMode:"Automatic"};',
  ],
  [
    "invalid orientation",
    'const value:TabsRootProps={orientation:"diagonal"};',
  ],
  ["Rust loop policy", 'const value:TabsRootProps={loop_policy:"Wrap"};'],
  [
    "wrong selection callback",
    "const value:TabsRootProps={onValueChange:(value:number)=>{}};",
  ],
  [
    "invented forceMount",
    'const value:TabsContentProps={value:"a",forceMount:true};',
  ],
  [
    "invented presence hook",
    'const value:TabsContentProps={value:"a",onOpenChange:(value:boolean)=>{}};',
  ],
  [
    "link polymorphism",
    'const value:TabsTriggerProps={value:"a",href:"/next"};',
  ],
  [
    "foreign SVG ref",
    'const value:TabsListProps={ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "unsupported checked snippet",
    'declare const child:Snippet<[{props:Record<string,unknown>,checked:boolean}]>;const value:TabsTriggerProps={value:"a",child};',
  ],
  [
    "foreign event target",
    'const value:TabsTriggerProps={value:"a",onclick:event=>{const anchor:HTMLAnchorElement=event.currentTarget;void anchor;}};',
  ],
] as const)
  test(`exact Tabs contracts reject ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (d) =>
          d.file?.endsWith("fixture.ts") &&
          [2322, 2353, 2561, 2740, 2741, 2820].includes(d.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((d) => d.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
