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
import { inspectView } from "../../src/cli/commands/view.js";

function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-alert-dialog-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/alert-dialog.types.ts"),
      readFileSync("registry/ui/alert-dialog/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { AlertDialogRootProps, AlertDialogTriggerProps, AlertDialogPortalProps, AlertDialogOverlayProps, AlertDialogContentProps, AlertDialogTitleProps, AlertDialogDescriptionProps, AlertDialogActionProps, AlertDialogCancelProps } from "./alert-dialog.types.js";\n' +
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
test("exact distinct Alert Dialog contract preserves all nine public native primitive and snippet types", () => {
  assert.deepEqual(
    diagnostics(`declare const simple: Snippet;declare const child:Snippet<[{props:Record<string,unknown>}]>;declare const overlayChildren:Snippet<[{open:boolean}]>;declare const contentChild:Snippet<[{props:Record<string,unknown>,open:boolean}]>;
const root:AlertDialogRootProps={open:true,children:simple,onOpenChange:value=>{const open:boolean=value;void open;},onOpenChangeComplete:value=>{const open:boolean=value;void open;}};
const trigger:AlertDialogTriggerProps={child,ref:document.createElement("button"),type:"button",class:["caller"],"data-operation":"open"};
const portal:AlertDialogPortalProps={to:document.createElement("div"),disabled:false,children:simple};
const overlay:AlertDialogOverlayProps={ref:null,forceMount:true,children:overlayChildren,child:contentChild};
const content:AlertDialogContentProps={ref:document.createElement("div"),child:contentChild,children:simple,forceMount:true,trapFocus:true,preventScroll:true,restoreScrollDelay:0,preventOverflowTextSelection:true,onOpenAutoFocus:event=>event.preventDefault(),onCloseAutoFocus:event=>event.preventDefault(),onEscapeKeydown:event=>event.preventDefault(),onInteractOutside:event=>event.preventDefault()};
const title:AlertDialogTitleProps={level:2,children:simple,child,ref:null};const description:AlertDialogDescriptionProps={children:simple,child};const action:AlertDialogActionProps={child,ref:null,disabled:false,onclick:event=>event.preventDefault()};const cancel:AlertDialogCancelProps={child,ref:null,disabled:false};void root;void trigger;void portal;void overlay;void content;void title;void description;void action;void cancel;`),
    [],
  );
});
for (const [name, body] of [
  [
    "invented confirmation state",
    "const value:AlertDialogRootProps={confirmed:true};",
  ],
  [
    "Root role switch",
    'const value:AlertDialogRootProps={role:"alertdialog"};',
  ],
  [
    "wrong Cancel callback",
    "const value:AlertDialogCancelProps={onclick:(event:number)=>{}};",
  ],
  [
    "non-native Close export",
    'import type { AlertDialogCloseProps } from "./alert-dialog.types.js";',
  ],
  ["Root DOM ref", "const value:AlertDialogRootProps={ref:null};"],
  ["Root modal invention", "const value:AlertDialogRootProps={modal:false};"],
  ["nonboolean open", 'const value:AlertDialogRootProps={open:"yes"};'],
  [
    "wrong callback",
    "const value:AlertDialogRootProps={onOpenChange:(value:number)=>{}};",
  ],
  [
    "Portal target alias",
    "const value:AlertDialogPortalProps={target:document.body};",
  ],
  ["invalid Portal target", "const value:AlertDialogPortalProps={to:5};"],
  ["invalid heading level", "const value:AlertDialogTitleProps={level:7};"],
  [
    "wrong child shape",
    "declare const bad:Snippet<[string]>;const value:AlertDialogTriggerProps={child:bad};",
  ],
  [
    "wrong Overlay children shape",
    "declare const bad:Snippet<[string]>;const value:AlertDialogOverlayProps={children:bad};",
  ],
  [
    "wrong Content child open shape",
    "declare const bad:Snippet<[{props:Record<string,unknown>,open:string}]>;const value:AlertDialogContentProps={child:bad};",
  ],
  [
    "foreign DOM ref",
    'const value:AlertDialogContentProps={ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "Rust role variant",
    'const value:AlertDialogContentProps={roleVariant:"alertdialog"};',
  ],
] as const)
  test(`exact distinct Alert Dialog contract rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (diagnostic) =>
          diagnostic.file?.endsWith("fixture.ts") &&
          [2305, 2322, 2353, 2561, 2724, 2740, 2741].includes(diagnostic.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((diagnostic) => diagnostic.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });

test("incomplete Alert Dialog candidate is not registered or aliased through Dialog", () => {
  const root = JSON.parse(readFileSync("registry/registry.json", "utf8"));
  assert.ok(root.items.some((item: { id: string }) => item.id === "dialog"));
  assert.ok(
    root.items.every((item: { id: string }) => item.id !== "alert-dialog"),
  );
  const item = JSON.parse(readFileSync("registry/ui/dialog.json", "utf8"));
  assert.equal(item.files.length, 10);
  assert.equal(item.exports.length, 16);
  assert.ok(
    [...item.files, ...item.styles].every(
      (file: { cohort: string }) => file.cohort === "dialog",
    ),
  );
  const viewed = inspectView(
    {
      kind: "command",
      command: "view",
      item: "alert-dialog",
      json: true,
      cwd: null,
      dryRun: false,
      source: true,
      strict: false,
    },
    process.cwd(),
  );
  assert.equal(viewed.envelope.status, "error");
  assert.equal(viewed.failureClass, "registry_failure");
  assert.ok(
    viewed.envelope.diagnostics.some(
      (diagnostic) => diagnostic.code === "REGISTRY_ITEM_UNKNOWN",
    ),
  );
});

test("all nine target types equal the pinned distinct public types without narrowing or widening", () => {
  assert.deepEqual(
    diagnostics(
      'import type {AlertDialog as Native} from "bits-ui";type Equal<A,B>=(<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;const rootEqual:Equal<AlertDialogRootProps,Native.RootProps>=true;void rootEqual;const triggerEqual:Equal<AlertDialogTriggerProps,Native.TriggerProps>=true;void triggerEqual;const portalEqual:Equal<AlertDialogPortalProps,Native.PortalProps>=true;void portalEqual;const overlayEqual:Equal<AlertDialogOverlayProps,Native.OverlayProps>=true;void overlayEqual;const contentEqual:Equal<AlertDialogContentProps,Native.ContentProps>=true;void contentEqual;const titleEqual:Equal<AlertDialogTitleProps,Native.TitleProps>=true;void titleEqual;const descriptionEqual:Equal<AlertDialogDescriptionProps,Native.DescriptionProps>=true;void descriptionEqual;const actionEqual:Equal<AlertDialogActionProps,Native.ActionProps>=true;void actionEqual;const cancelEqual:Equal<AlertDialogCancelProps,Native.CancelProps>=true;void cancelEqual;',
    ),
    [],
  );
});
