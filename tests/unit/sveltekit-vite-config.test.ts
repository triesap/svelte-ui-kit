import assert from "node:assert/strict";
import { test } from "node:test";
import { inspectSvelteKitViteConfig } from "../../src/project/sveltekit-vite-config.js";
const imports =
  'import {defineConfig} from "vite";import {sveltekit} from "@sveltejs/kit/vite";';
test("literal Vite configuration proves direct zero-argument Kit calls without execution", () => {
  for (const source of [
    imports + "export default defineConfig({plugins:[sveltekit()]});",
    imports +
      'export default ({root:".",plugins:[sveltekit()]}) satisfies object;',
    'import {sveltekit as kit} from "@sveltejs/kit/vite";export default {plugins:[kit()]};',
  ])
    assert.ok(inspectSvelteKitViteConfig(source, "vite.config.ts").ok, source);
});
test("empty and overriding Kit options cannot inherit legacy mapping proof", () => {
  for (const args of [
    "{}",
    '{files:{routes:"elsewhere"}}',
    "undefined",
    "...args",
  ])
    assert.equal(
      inspectSvelteKitViteConfig(
        imports +
          `export default defineConfig({plugins:[sveltekit(${args})]});`,
        "vite.config.ts",
      ).ok,
      false,
      args,
    );
});
test("dynamic, ambiguous and relocated Vite configurations refuse", () => {
  for (const body of [
    "export default () => ({plugins:[sveltekit()]});",
    "const value={plugins:[sveltekit()]};export default value;",
    "export default defineConfig({...other,plugins:[sveltekit()]});",
    "export default {plugins:[sveltekit(),other()]};",
    "export default {plugins:[enabled?sveltekit():other()]};",
    'export default {root:"other",plugins:[sveltekit()]};',
    "export default {plugins:[sveltekit()],plugins:[]};",
    "export default {plugins:[alias()]};",
    "export default {plugins:[sveltekit()]",
  ])
    assert.equal(
      inspectSvelteKitViteConfig(imports + body, "vite.config.ts").ok,
      false,
      body,
    );
});
test("duplicate imported bindings cannot impersonate the known factory and plugin", () => {
  assert.equal(
    inspectSvelteKitViteConfig(
      'import {defineConfig as shared} from "vite";import {sveltekit as shared} from "@sveltejs/kit/vite";export default shared({plugins:[shared()]});',
      "vite.config.ts",
    ).ok,
    false,
  );
});
test("Vite parsing refuses oversized source before native AST work", () => {
  assert.equal(
    inspectSvelteKitViteConfig(" ".repeat(1024 * 1024 + 1), "vite.config.ts")
      .ok,
    false,
  );
});

test("prototype-producing literals cannot supply inherited plugin configuration", () => {
  for (const source of [
    imports +
      'export default {__proto__:{root:"elsewhere"},plugins:[sveltekit()]};',
    imports +
      'const hidden={"__proto__":{root:"elsewhere"}};export default {plugins:[sveltekit()]};',
  ])
    assert.equal(
      inspectSvelteKitViteConfig(source, "vite.config.ts").ok,
      false,
      source,
    );
});
