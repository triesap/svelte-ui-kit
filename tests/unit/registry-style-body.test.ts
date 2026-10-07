import assert from "node:assert/strict";
import { test } from "node:test";
import {
  registryStyleBody,
  renderManagedBlock,
} from "../../src/codegen/css.js";

test("raw and exactly marked assets preserve identical body bytes and embedded notice", () => {
  const body = "\r\n/* Copyright retained */\r\n.sample { color: red; }\r\n";
  for (const text of [body, "  " + renderManagedBlock("sample", body) + "\n"]) {
    const result = registryStyleBody(text, "sample");
    assert.equal(result.ok, true, JSON.stringify(result));
    if (result.ok) assert.equal(result.value, body);
  }
  const literal =
    '.sample::after { content: "/* svelte-ui-kit:start fake */"; }';
  assert.deepEqual(registryStyleBody(literal, "sample"), {
    ok: true,
    value: literal,
  });
});
test("ambiguous marked assets refuse rather than nesting or discarding outside semantic or license bytes", () => {
  for (const text of [
    renderManagedBlock("other", ".sample{}"),
    renderManagedBlock("sample", ".sample{}") +
      renderManagedBlock("other", ".other{}"),
    renderManagedBlock("sample", renderManagedBlock("other", ".other{}")),
    "/* svelte-ui-kit:start sample */.sample{}",
    ".outside{}" + renderManagedBlock("sample", ".sample{}"),
    "/* Copyright outside */" + renderManagedBlock("sample", ".sample{}"),
  ]) {
    const result = registryStyleBody(text, "sample");
    assert.equal(result.ok, false, text);
  }
});
