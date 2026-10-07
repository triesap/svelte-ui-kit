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
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-dialog-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/dialog.types.ts"),
      readFileSync("registry/ui/dialog/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { DialogRootProps, DialogTriggerProps, DialogPortalProps, DialogOverlayProps, DialogContentProps, DialogTitleProps, DialogDescriptionProps, DialogCloseProps } from "./dialog.types.js";\n' +
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
test("exact pinned Dialog contract preserves all eight native primitive and snippet types", () => {
  assert.deepEqual(
    diagnostics(`declare const simple: Snippet;declare const child:Snippet<[{props:Record<string,unknown>}]>;declare const overlayChildren:Snippet<[{open:boolean}]>;declare const contentChild:Snippet<[{props:Record<string,unknown>,open:boolean}]>;
const root:DialogRootProps={open:true,children:simple,onOpenChange:value=>{const open:boolean=value;void open;},onOpenChangeComplete:value=>{const open:boolean=value;void open;}};
const trigger:DialogTriggerProps={child,ref:document.createElement("button"),type:"button",class:["caller"],"data-operation":"open"};
const portal:DialogPortalProps={to:document.createElement("div"),disabled:false,children:simple};
const overlay:DialogOverlayProps={ref:null,forceMount:true,children:overlayChildren,child:contentChild};
const content:DialogContentProps={ref:document.createElement("div"),child:contentChild,children:simple,forceMount:true,trapFocus:true,preventScroll:true,restoreScrollDelay:0,preventOverflowTextSelection:true,onOpenAutoFocus:event=>event.preventDefault(),onCloseAutoFocus:event=>event.preventDefault(),onEscapeKeydown:event=>event.preventDefault(),onInteractOutside:event=>event.preventDefault()};
const title:DialogTitleProps={level:2,children:simple,child,ref:null};const description:DialogDescriptionProps={children:simple,child};const close:DialogCloseProps={child,ref:null,disabled:false};void root;void trigger;void portal;void overlay;void content;void title;void description;void close;`),
    [],
  );
});
for (const [name, body] of [
  ["Root DOM ref", "const value:DialogRootProps={ref:null};"],
  ["Root modal invention", "const value:DialogRootProps={modal:false};"],
  ["nonboolean open", 'const value:DialogRootProps={open:"yes"};'],
  [
    "wrong callback",
    "const value:DialogRootProps={onOpenChange:(value:number)=>{}};",
  ],
  [
    "Portal target alias",
    "const value:DialogPortalProps={target:document.body};",
  ],
  ["invalid Portal target", "const value:DialogPortalProps={to:5};"],
  ["invalid heading level", "const value:DialogTitleProps={level:7};"],
  [
    "wrong child shape",
    "declare const bad:Snippet<[string]>;const value:DialogTriggerProps={child:bad};",
  ],
  [
    "wrong Overlay children shape",
    "declare const bad:Snippet<[string]>;const value:DialogOverlayProps={children:bad};",
  ],
  [
    "wrong Content child open shape",
    "declare const bad:Snippet<[{props:Record<string,unknown>,open:string}]>;const value:DialogContentProps={child:bad};",
  ],
  [
    "foreign DOM ref",
    'const value:DialogContentProps={ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "Rust role variant",
    'const value:DialogContentProps={roleVariant:"alertdialog"};',
  ],
] as const)
  test(`exact pinned Dialog contract rejects ${name} causally`, () => {
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

test("Dialog candidate is not advertised or confused with a role-based Alert Dialog", () => {
  const root = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  assert.ok(
    root.items.every(
      (item: { id: string }) =>
        item.id !== "dialog" && item.id !== "alert-dialog",
    ),
  );
  const mapping = readFileSync("specs/component-maps/dialog.md", "utf8");
  assert.match(mapping, /actual distinct primitive/);
  assert.match(mapping, /single dialog compatibility cohort/);
});
