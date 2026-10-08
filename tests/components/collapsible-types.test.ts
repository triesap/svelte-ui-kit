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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-collapsible-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/collapsible.types.ts"),
      readFileSync("registry/ui/collapsible/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { CollapsibleRootProps, CollapsibleTriggerProps, CollapsibleContentProps } from "./collapsible.types.js";\n' +
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
test("exact pinned Collapsible state ref native presence and snippet types compile", () => {
  assert.deepEqual(
    diagnostics(
      'declare const children:Snippet;declare const child:Snippet<[{props:Record<string,unknown>}]>;declare const contentChild:Snippet<[{props:Record<string,unknown>,open:boolean}]>;\nconst initial:CollapsibleRootProps={open:true};const uncontrolled:CollapsibleRootProps={};\nconst root:CollapsibleRootProps={open:false,disabled:true,ref:document.createElement("div"),dir:"rtl",class:["caller"],style:{color:"red"},children,child,onOpenChange:open=>{const typed:boolean=open;void typed;},onOpenChangeComplete:open=>{const typed:boolean=open;void typed;}};\nconst trigger:CollapsibleTriggerProps={disabled:false,ref:document.createElement("button"),form:"editor",children,child,"aria-label":"Details",onclick:event=>{const typed:HTMLButtonElement=event.currentTarget;typed.focus();}};\nconst content:CollapsibleContentProps={forceMount:true,ref:document.createElement("div"),children,child:contentChild,id:"details","aria-label":"Details content",style:{"--caller":"value"}};void initial;void uncontrolled;void root;void trigger;void content;',
    ),
    [],
  );
});
for (const [name, body] of [
  ["numeric open", "const value:CollapsibleRootProps={open:1};"],
  ["string open", 'const value:CollapsibleRootProps={open:"true"};'],
  [
    "wrong callback",
    "const value:CollapsibleRootProps={onOpenChange:(open:string)=>{}};",
  ],
  [
    "wrong completion callback",
    "const value:CollapsibleRootProps={onOpenChangeComplete:(open:number)=>{}};",
  ],
  [
    "Rust default_open",
    "const value:CollapsibleRootProps={default_open:true};",
  ],
  [
    "Rust content_id",
    'const value:CollapsibleRootProps={content_id:"details"};',
  ],
  [
    "invented accordion policy",
    'const value:CollapsibleRootProps={type:"single"};',
  ],
  [
    "string forceMount",
    'const value:CollapsibleContentProps={forceMount:"yes"};',
  ],
  [
    "browser-find extension",
    "const value:CollapsibleContentProps={hiddenUntilFound:true};",
  ],
  [
    "invented presence callback",
    "const value:CollapsibleContentProps={onOpenChange:(open:boolean)=>{}};",
  ],
  [
    "open children argument",
    "declare const children:Snippet<[{open:boolean}]>;const value:CollapsibleContentProps={children};",
  ],
  [
    "wrong open child type",
    "declare const child:Snippet<[{props:Record<string,unknown>,open:string}]>;const value:CollapsibleContentProps={child};",
  ],
  ["link polymorphism", 'const value:CollapsibleTriggerProps={href:"/next"};'],
  [
    "foreign SVG ref",
    'const value:CollapsibleContentProps={ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "foreign event target",
    "const value:CollapsibleTriggerProps={onclick:event=>{const anchor:HTMLAnchorElement=event.currentTarget;void anchor;}};",
  ],
] as const)
  test(`exact Collapsible contracts reject ${name} causally`, () => {
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
