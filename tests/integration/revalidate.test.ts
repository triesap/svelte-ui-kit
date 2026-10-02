import assert from "node:assert/strict";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";

import {
  capturePreimage,
  revalidatePreimages,
  type TargetPreimage,
} from "../../src/codegen/revalidate.js";

function withRoot(body: (root: string) => void): void {
  const root = mkdtempSync(path.join(os.tmpdir(), "suik-revalidate-"));
  try {
    body(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function write(root: string, logical: string, text: string): void {
  const abs = path.join(root, ...logical.split("/"));
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, text);
}

function issues(result: ReturnType<typeof revalidatePreimages>): string {
  assert.equal(result.ok, false);
  return result.ok
    ? ""
    : result.issues.map((entry) => entry.message).join("; ");
}

test("changed source, config and CSS preimages fail before staging", () => {
  withRoot((root) => {
    write(root, "src/styles/kit.css", "old css");
    write(root, "src/lib/components/ui/_kit/kit.json", "old config");
    write(root, "src/lib/components/ui/button.svelte", "old source");

    const expected: TargetPreimage[] = [
      capturePreimage(root, "src/styles/kit.css"),
      capturePreimage(root, "src/lib/components/ui/_kit/kit.json"),
      capturePreimage(root, "src/lib/components/ui/button.svelte"),
      capturePreimage(root, "src/lib/components/ui/new.svelte"),
    ];
    assert.equal(revalidatePreimages(root, expected).ok, true);

    write(root, "src/styles/kit.css", "edited css");
    const cssChanged = issues(revalidatePreimages(root, expected));
    assert.match(cssChanged, /src\/styles\/kit\.css changed since planning/);

    write(root, "src/lib/components/ui/new.svelte", "now exists");
    const absentChanged = issues(revalidatePreimages(root, [expected[3]]));
    assert.match(absentChanged, /expected absent but is now file/);

    // Restore the CSS and prove the other targets still pass.
    write(root, "src/styles/kit.css", "old css");
    rmSync(path.join(root, "src/lib/components/ui/new.svelte"));
    assert.equal(revalidatePreimages(root, expected).ok, true);
  });
});

test("a replaced or symlinked ancestor is detected", () => {
  withRoot((root) => {
    const dir = path.join(root, "src/lib/components/ui");
    mkdirSync(dir, { recursive: true });
    const expected = [
      capturePreimage(root, "src/lib/components/ui/button.svelte"),
    ];
    assert.equal(revalidatePreimages(root, expected).ok, true);

    rmSync(dir, { recursive: true, force: true });
    const elsewhere = path.join(root, "elsewhere");
    mkdirSync(elsewhere, { recursive: true });
    symlinkSync(elsewhere, dir, "dir");

    const result = issues(revalidatePreimages(root, expected));
    assert.match(
      result,
      /ancestor src\/lib\/components\/ui is not a real directory/,
    );
  });
});

test("unchanged preimages pass repeatedly", () => {
  withRoot((root) => {
    write(root, "src/routes/+layout.svelte", "<script></script>");
    const expected = [capturePreimage(root, "src/routes/+layout.svelte")];
    assert.equal(revalidatePreimages(root, expected).ok, true);
    assert.equal(revalidatePreimages(root, expected).ok, true);
  });
});
