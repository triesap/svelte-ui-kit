import assert from "node:assert/strict";
import {
  cpSync,
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
import { refreshRegistryContent } from "../helpers/registry-content.js";
import { inspectView } from "../../src/cli/commands/view.js";

function diagnostics(body: string) {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-menu-types-"));
  try {
    symlinkSync(path.resolve("node_modules"), path.join(root, "node_modules"));
    mkdirSync(path.join(root, "src"));
    writeFileSync(path.join(root, "package.json"), '{"type":"module"}');
    writeFileSync(
      path.join(root, "src/menu.types.ts"),
      readFileSync("registry/ui/menu/types.ts"),
    );
    const fixture = path.join(root, "src/fixture.ts");
    writeFileSync(
      fixture,
      'import type { Snippet } from "svelte";\nimport type { MenuRootProps, MenuTriggerProps, MenuPortalProps, MenuContentProps, MenuItemProps, MenuRadioGroupProps, MenuRadioItemProps, MenuItemIndicatorProps } from "./menu.types.js";\n' +
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
test("source-required Menu native selection and floating contracts compile without widening", () => {
  assert.deepEqual(
    diagnostics(`declare const children:Snippet;declare const child:Snippet<[{props:Record<string,unknown>}]>;declare const floating:Snippet<[{props:Record<string,unknown>,wrapperProps:Record<string,unknown>,open:boolean}]>;declare const radioChildren:Snippet<[{checked:boolean}]>;declare const radioChild:Snippet<[{props:Record<string,unknown>,checked:boolean}]>;
const root:MenuRootProps={open:false,dir:"rtl",children,onOpenChange:value=>{const typed:boolean=value;void typed;},onOpenChangeComplete:value=>{const typed:boolean=value;void typed;}};
const trigger:MenuTriggerProps={ref:document.createElement("button"),child,type:"button",class:["caller"],disabled:true};
const portal:MenuPortalProps={to:document.body,disabled:true,children};const content:MenuContentProps={child:floating,side:"bottom",align:"start",sideOffset:4,collisionPadding:8,loop:true,strategy:"fixed",sticky:"partial",dir:"rtl",customAnchor:document.body,ref:null,onEscapeKeydown:event=>event.preventDefault(),onInteractOutside:event=>event.preventDefault()};
const item:MenuItemProps={child,disabled:false,textValue:"Ordinary",closeOnSelect:false,onSelect:event=>event.preventDefault()};
const group:MenuRadioGroupProps={value:"stable",child,ref:null,onValueChange:value=>{const typed:string=value;void typed;}};const radio:MenuRadioItemProps={value:"stable",children:radioChildren,child:radioChild,ref:null,disabled:false,onSelect:event=>event.preventDefault()};
const indicator:MenuItemIndicatorProps={checked:true,ref:document.createElement("span"),children,class:["caller"],"aria-hidden":true};void root;void trigger;void portal;void content;void item;void group;void radio;void indicator;`),
    [],
  );
});
for (const [name, body] of [
  ["Root Rust index", "const value:MenuRootProps={checked_index:0};"],
  [
    "Root custom keyboard state",
    'const value:MenuRootProps={loop_policy:"Wrap"};',
  ],
  ["Root DOM ref", "const value:MenuRootProps={ref:null};"],
  ["Root modal invention", "const value:MenuRootProps={modal:true};"],
  ["Root invalid direction", 'const value:MenuRootProps={dir:"auto"};'],
  ["invalid open", 'const value:MenuRootProps={open:"yes"};'],
  [
    "wrong open callback",
    "const value:MenuRootProps={onOpenChange:(value:number)=>{}};",
  ],
  [
    "Portal target alias",
    "const value:MenuPortalProps={portalTo:document.body};",
  ],
  ["invalid side", 'const value:MenuContentProps={side:"middle"};'],
  ["invalid align", 'const value:MenuContentProps={align:"stretch"};'],
  [
    "invalid floating wrapper",
    "declare const bad:Snippet<[{props:Record<string,unknown>,wrapperProps:number,open:boolean}]>;const value:MenuContentProps={child:bad};",
  ],
  [
    "invalid floating open",
    "declare const bad:Snippet<[{props:Record<string,unknown>,wrapperProps:Record<string,unknown>,open:string}]>;const value:MenuContentProps={child:bad};",
  ],
  ["Rust item kind", 'const value:MenuItemProps={kind:"radio"};'],
  [
    "wrong selection callback",
    "const value:MenuItemProps={onSelect:(value:number)=>{}};",
  ],
  ["nonstring group selection", "const value:MenuRadioGroupProps={value:4};"],
  ["missing radio value", "const value:MenuRadioItemProps={};"],
  ["nonstring radio value", "const value:MenuRadioItemProps={value:3};"],
  [
    "wrong radio checked snippet",
    'declare const bad:Snippet<[{checked:string}]>;const value:MenuRadioItemProps={value:"a",children:bad};',
  ],
  ["missing indicator checked", "const value:MenuItemIndicatorProps={};"],
  [
    "indicator hidden override",
    "const value:MenuItemIndicatorProps={checked:false,hidden:false};",
  ],
  [
    "indicator unsupported child",
    "declare const child:Snippet;const value:MenuItemIndicatorProps={checked:false,child};",
  ],
  [
    "indicator foreign ref",
    'const value:MenuItemIndicatorProps={checked:false,ref:document.createElementNS("http://www.w3.org/2000/svg","svg")};',
  ],
  [
    "unapproved checkbox export",
    'import type {MenuCheckboxItemProps} from "./menu.types.js";',
  ],
] as const)
  test(`source-parity Menu rejects ${name} causally`, () => {
    const actual = diagnostics(body);
    assert.ok(
      actual.some(
        (d) =>
          d.file?.endsWith("fixture.ts") &&
          [2305, 2322, 2353, 2561, 2724, 2740, 2741].includes(d.code),
      ),
      JSON.stringify(actual),
    );
    assert.ok(
      actual.every((d) => d.file?.endsWith("fixture.ts")),
      JSON.stringify(actual),
    );
  });
test("all seven primitive contracts equal actual pinned Dropdown Menu public types", () => {
  assert.deepEqual(
    diagnostics(
      'import type {DropdownMenu as Native} from "bits-ui";type Equal<A,B>=(<T>()=>T extends A?1:2) extends (<T>()=>T extends B?1:2)?true:false;const root:Equal<MenuRootProps,Native.RootProps>=true;void root;const trigger:Equal<MenuTriggerProps,Native.TriggerProps>=true;void trigger;const portal:Equal<MenuPortalProps,Native.PortalProps>=true;void portal;const content:Equal<MenuContentProps,Native.ContentProps>=true;void content;const item:Equal<MenuItemProps,Native.ItemProps>=true;void item;const radiogroup:Equal<MenuRadioGroupProps,Native.RadioGroupProps>=true;void radiogroup;const radioitem:Equal<MenuRadioItemProps,Native.RadioItemProps>=true;void radioitem;',
    ),
    [],
  );
});
test("Menu source selection is explicit and owned unadvertised candidate is refused", () => {
  const isolated = mkdtempSync(
    path.join(os.tmpdir(), "suik-unadvertised-menu-"),
  );
  try {
    for (const directory of ["registry", "schema"])
      cpSync(directory, path.join(isolated, directory), { recursive: true });
    const root = JSON.parse(readFileSync("registry/registry.json", "utf8"));
    assert.ok(root.items.some((item: { id: string }) => item.id === "menu"));
    root.items = root.items.filter(
      (item: { id: string }) => item.id !== "menu",
    );
    writeFileSync(
      path.join(isolated, "registry/registry.json"),
      JSON.stringify(root),
    );
    refreshRegistryContent(isolated);
    const viewed = inspectView(
      {
        kind: "command",
        command: "view",
        item: "menu",
        json: true,
        cwd: null,
        dryRun: false,
        source: true,
        strict: false,
      },
      isolated,
    );
    assert.equal(viewed.envelope.status, "error");
    assert.equal(viewed.failureClass, "registry_failure");
    assert.ok(
      viewed.envelope.diagnostics.some(
        (d) => d.code === "REGISTRY_ITEM_UNKNOWN",
      ),
    );
    const mapping = readFileSync("docs/reference/components/menu.md", "utf8");
    for (const boundary of [
      "RadioGroup",
      "RadioItem",
      "MenuItemIndicator",
      "wrapperProps",
      "checked index",
      "strict-CSP",
    ])
      assert.ok(mapping.includes(boundary), boundary);
  } finally {
    rmSync(isolated, { recursive: true, force: true });
  }
});
