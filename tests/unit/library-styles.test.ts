import assert from "node:assert/strict";
import { test } from "node:test";
import {
  inspectLibraryStyles,
  materializeLibraryStyles,
  patchLibraryStyles,
} from "../../src/codegen/library-styles.js";
const imports = [
  "./styles/kit.css",
  "./styles/themes.css",
  "./styles/app.css",
].map((specifier) => ({ specifier }));
test("standalone CSS entry integrates native ordered imports without a layout rendering contract", () => {
  const source = materializeLibraryStyles(imports),
    parsed = inspectLibraryStyles(source);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value, { imports: imports.map((e) => e.specifier) });
  assert.equal("rendersContent" in parsed.value, false);
  const patched = patchLibraryStyles(source, imports);
  assert.ok(patched.ok);
  assert.equal(patched.value, source);
});
test("CSS insertion preserves exact BOM, charset, CRLF and unmanaged application bytes", () => {
  const source =
    '\ufeff@charset "utf-8";\r\n/* café */\r\np { color: red; }\r\n';
  const result = patchLibraryStyles(source, imports);
  assert.ok(result.ok, JSON.stringify(result));
  assert.equal(
    result.value,
    '\ufeff@charset "utf-8";\r\n' +
      imports.map((e) => `@import "${e.specifier}";`).join("\r\n") +
      "\r\n\r\n/* café */\r\np { color: red; }\r\n",
  );
  assert.deepEqual(patchLibraryStyles(result.value, imports), result);
});
test("partial stylesheet imports retain application code and insert in native cascade order", () => {
  for (const present of [[0], [1], [2], [0, 2]]) {
    const source =
      "/* owned application prelude */\n" +
      present.map((i) => `@import "${imports[i].specifier}";`).join("\n") +
      "\n:root { --application: yes; }";
    const result = patchLibraryStyles(source, imports);
    assert.ok(result.ok, JSON.stringify(result));
    assert.ok(result.value.startsWith("/* owned application prelude */"));
    assert.ok(result.value.endsWith(":root { --application: yes; }"));
    const checked = inspectLibraryStyles(result.value);
    assert.ok(checked.ok);
    assert.deepEqual(
      checked.value.imports,
      imports.map((e) => e.specifier),
    );
  }
});
test("validly parsed but late, conditional, layered, nested or escaped imports refuse", () => {
  for (const source of [
    'p{} @import "./styles/kit.css";',
    '@import "./styles/kit.css" screen;',
    '@import "./styles/kit.css" layer(a);',
    '@media screen { @import "./styles/kit.css"; }',
    '@import url("./styles/kit.css");',
    '@import "./sty\\6ces/kit.css";',
  ]) {
    const result = patchLibraryStyles(source, imports);
    assert.equal(result.ok, false, source);
    if (!result.ok)
      assert.equal(result.issues[0].code, "LIBRARY_STYLES_UNSUPPORTED");
  }
});
test("existing out-of-order and duplicate approved imports refuse without a rewrite", () => {
  for (const source of [
    '@import "./styles/app.css"; @import "./styles/kit.css";',
    '@import "./styles/kit.css"; @import "./styles/kit.css";',
  ]) {
    const result = patchLibraryStyles(source, imports);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.issues[0].code, "LIBRARY_STYLES_ORDER");
  }
});
test("comment and string examples cannot claim an actual imported stylesheet", () => {
  const source =
    '/* @import "./styles/kit.css"; */\np::before { content: "@import"; }';
  const parsed = inspectLibraryStyles(source);
  assert.ok(parsed.ok);
  assert.deepEqual(parsed.value.imports, []);
  const result = patchLibraryStyles(source, imports);
  assert.ok(result.ok);
  assert.ok(result.value.endsWith(source));
});
test("leading layer order survives and malformed or oversized stylesheet data refuses", () => {
  const source = "@layer application, svelte-ui-kit.components;\np{}";
  const result = patchLibraryStyles(source, imports);
  assert.ok(result.ok);
  assert.ok(
    result.value.startsWith("@layer application, svelte-ui-kit.components;\n"),
  );
  for (const bad of [
    "p {",
    '@charset "iso-8859-1";',
    '/* before */ @charset "utf-8";',
    "x".repeat(1024 * 1024 + 1),
  ])
    assert.equal(patchLibraryStyles(bad, imports).ok, false);
});
