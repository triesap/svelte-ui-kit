import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  materializeShowcase,
  showcaseHost,
} from "../../src/examples/showcase.js";
const source = path.resolve("examples/showcase");
test("public example materializes exact source with one explicit import binding and refuses overwrite", (t) => {
  const parent = mkdtempSync(path.join(tmpdir(), "showcase-materialize-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const destination = path.join(parent, "example");
  const proof = materializeShowcase(source, destination, "@example/ui");
  assert.equal(proof.members.length, 5);
  assert.ok(
    readFileSync(path.join(destination, "Gallery.svelte"), "utf8").includes(
      'from "@example/ui"',
    ),
  );
  for (const row of proof.members)
    assert.equal(
      row.inputSha256 === row.outputSha256,
      row.name !== "Gallery.svelte",
    );
  assert.throws(
    () => materializeShowcase(source, destination, "@example/other"),
    /already exists/,
  );
  for (const framework of ["astro", "sveltekit"] as const) {
    const host = showcaseHost(
      source,
      framework,
      "@example/ui/styles.css",
      "./Gallery.svelte",
    );
    assert.ok(!host.text.includes("__UI_"));
    assert.ok(host.text.includes('"./Gallery.svelte"'));
  }
});
test("invalid binding and redirected destination fail before any example writes", (t) => {
  const parent = mkdtempSync(path.join(tmpdir(), "showcase-refuse-"));
  t.after(() => rmSync(parent, { recursive: true, force: true }));
  const destination = path.join(parent, "example");
  assert.throws(() => materializeShowcase(source, destination, "bad\nmodule"));
  assert.throws(
    () => materializeShowcase(source, destination, "</script><script>"),
    /Invalid module binding/,
  );
  assert.equal(existsSync(destination), false);
  mkdirSync(path.join(parent, "real"));
  symlinkSync(path.join(parent, "real"), path.join(parent, "redirect"));
  assert.throws(
    () =>
      materializeShowcase(
        source,
        path.join(parent, "redirect/example"),
        "@example/ui",
      ),
    /canonical/,
  );
  assert.equal(existsSync(path.join(parent, "real/example")), false);
});
