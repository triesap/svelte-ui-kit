/** Development setup only: copy the public example, never a production runtime import. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

const members = [
  "Gallery.svelte",
  "Specimen.svelte",
  "showcase.css",
  "recipes.css",
  "avatar.svg",
] as const;
const digest = (bytes: string | Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
function regular(root: string, relative: string): Buffer {
  let current = realpathSync(root);
  const parts = relative.split("/");
  for (const [index, part] of parts.entries()) {
    assert.ok(part && part !== "." && part !== "..", "Invalid example member");
    current = path.join(current, part);
    const stat = lstatSync(current);
    assert.ok(!stat.isSymbolicLink(), "Example members cannot be symlinks");
    assert.ok(index === parts.length - 1 ? stat.isFile() : stat.isDirectory());
  }
  return readFileSync(current);
}
function binding(source: string, token: string, value: string): string {
  assert.ok(
    value.length > 0 && !/[<\r\n\0]/.test(value),
    "Invalid module binding",
  );
  const needle = JSON.stringify(token);
  assert.equal(
    source.split(needle).length,
    2,
    `Expected exactly one ${token} binding`,
  );
  return source.replace(needle, JSON.stringify(value));
}

/** Destination must be absent, within existing ordinary directories. No overwrite or manager execution. */
export function materializeShowcase(
  sourceRoot: string,
  destination: string,
  uiModule: string,
) {
  assert.ok(
    path.isAbsolute(destination),
    "Use an explicit absolute destination",
  );
  const parent = path.dirname(destination);
  assert.equal(
    realpathSync(parent),
    parent,
    "Destination ancestry must be canonical",
  );
  assert.equal(
    lstatSync(destination, { throwIfNoEntry: false }),
    undefined,
    "Destination already exists",
  );
  const files = members.map((name) => {
    const input = regular(sourceRoot, name);
    const output =
      name === "Gallery.svelte"
        ? Buffer.from(
            binding(input.toString("utf8"), "__UI_MODULE__", uiModule),
          )
        : input;
    return { name, input, output };
  });
  mkdirSync(destination);
  for (const file of files)
    writeFileSync(path.join(destination, file.name), file.output, {
      flag: "wx",
    });
  return {
    uiModule,
    members: files.map(({ name, input, output }) => ({
      name,
      inputSha256: digest(input),
      outputSha256: digest(output),
    })),
  };
}

/** Produce a thin page from the same authenticated package; caller owns route placement. */
export function showcaseHost(
  sourceRoot: string,
  framework: "astro" | "sveltekit",
  uiStyles: string,
  galleryModule: string,
) {
  assert.ok(framework === "astro" || framework === "sveltekit");
  const member =
    framework === "astro"
      ? "hosts/astro/index.astro"
      : "hosts/sveltekit/+page.svelte";
  const input = regular(sourceRoot, member);
  const output = binding(
    binding(input.toString("utf8"), "__UI_STYLES__", uiStyles),
    "__GALLERY_MODULE__",
    galleryModule,
  );
  return {
    text: output,
    source: member,
    inputSha256: digest(input),
    outputSha256: digest(output),
  };
}
