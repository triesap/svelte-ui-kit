import assert from "node:assert/strict";
import { test } from "node:test";

import { parseKitConfig } from "../../src/project/config.js";
import {
  asciiFold,
  isPortableLogicalSegment,
  isSafeLogicalRelativePath,
  isSameOrBelow,
  logicalSegments,
  pathsOverlap,
  unsafeLogicalSegment,
} from "../../src/project/paths.js";

/**
 * S033 tests: logical output paths are validated segment by segment before any
 * filesystem resolution. Absolute/drive/UNC forms, traversal, separator
 * confusion, invalid/reserved segments and case aliases are rejected, while
 * safe nested and prefix-sibling paths pass. Unsafe input never reaches a
 * diagnostic as an unsanitized locator.
 */

test("safe nested UI, style and state paths pass", () => {
  const safe = [
    "src/lib/components/ui",
    "src/lib/components/ui/index.ts",
    "src/lib/components/ui/_kit",
    "src/lib/components/ui/_kit/kit.lock.json",
    "src/styles",
    "src/styles/kit.css",
    "src/routes/+layout.svelte",
    "app/lib/components/ui",
    "app/lib/components/ui/index.ts",
  ];
  for (const value of safe) {
    assert.equal(isSafeLogicalRelativePath(value), true, value);
    assert.equal(unsafeLogicalSegment(value), null, value);
  }
  assert.deepEqual(logicalSegments("src/lib/ui"), ["src", "lib", "ui"]);
});

test("absolute, drive and UNC forms fail", () => {
  const unsafe = [
    "/tmp/out",
    "/",
    "C:/out",
    "C:\\out",
    "\\\\server\\share",
    "//server/share",
    "\\out",
  ];
  for (const value of unsafe) {
    assert.equal(isSafeLogicalRelativePath(value), false, value);
    assert.notEqual(unsafeLogicalSegment(value), null, value);
  }
});

test("traversal and empty/`.`/`..` segments fail", () => {
  const unsafe = [
    "../outside",
    "a/../b",
    "./a",
    "a/./b",
    "a//b",
    "",
    "a/",
    "/a",
  ];
  for (const value of unsafe) {
    assert.equal(isSafeLogicalRelativePath(value), false, value);
  }
});

test("separator confusion and control characters fail", () => {
  const unsafe = [
    "a\\b",
    "src\\routes\\+layout.svelte",
    "a\u0000b",
    "a\nb",
    "a\tb",
    "a\u007fb",
  ];
  for (const value of unsafe) {
    assert.equal(
      isSafeLogicalRelativePath(value),
      false,
      JSON.stringify(value),
    );
  }
});

test("invalid and reserved segments fail portably", () => {
  const reserved = [
    "con",
    "CON",
    "Con.txt",
    "prn",
    "aux",
    "nul",
    "com1",
    "COM9.log",
    "lpt1",
    "LPT9.txt",
  ];
  for (const segment of reserved) {
    assert.equal(isPortableLogicalSegment(segment), false, segment);
    assert.equal(isSafeLogicalRelativePath(`src/${segment}`), false, segment);
  }
  for (const segment of ["name.", "name ", "a:b"]) {
    assert.equal(isPortableLogicalSegment(segment), false, segment);
  }
  for (const segment of ["console", "com0", "lpt10", "auxiliary", "a.b"]) {
    assert.equal(isPortableLogicalSegment(segment), true, segment);
  }
});

test("unsafe segments are not emitted as raw locators", () => {
  const described = unsafeLogicalSegment("src/\u0007bad");
  assert.equal(described, JSON.stringify("\u0007bad"));
  // The unsafe control byte is absent from the JSON-quoted description.
  assert.ok(!described?.includes("\u0007"));
  assert.equal(unsafeLogicalSegment("a\nb"), JSON.stringify("a\nb"));
  assert.ok(!JSON.stringify("a\nb").includes("\n"));
});

test("case aliases are detected with ASCII folding, not locale", () => {
  assert.equal(asciiFold("Kit"), "kit");
  assert.equal(asciiFold("K\u0130T"), "k\u0130t");
  assert.equal(isSameOrBelow("src/UI/Index.ts", "src/ui/index.ts"), true);
  assert.equal(pathsOverlap("src/ui", "src/ui/index.ts"), true);
});

test("prefix siblings are not treated as overlapping or nested", () => {
  assert.equal(
    isSameOrBelow("src/lib/components/ui-kit", "src/lib/components/ui"),
    false,
  );
  assert.equal(
    pathsOverlap("src/lib/components/ui", "src/lib/components/ui-kit"),
    false,
  );
  assert.equal(pathsOverlap("src/styles", "src/styles-extra"), false);
});

test("config parsing rejects reserved and case-aliased target roots", () => {
  const reserved = parseKitConfig({ schemaVersion: 1, uiDir: "src/CON" });
  assert.equal(reserved.ok, false);
  if (!reserved.ok) assert.equal(reserved.issues[0]?.code, "PATH_UNSAFE");

  const trailing = parseKitConfig({ schemaVersion: 1, uiDir: "src/ui." });
  assert.equal(trailing.ok, false);
  if (!trailing.ok) assert.equal(trailing.issues[0]?.code, "PATH_UNSAFE");

  const colon = parseKitConfig({
    schemaVersion: 1,
    layoutFile: "src/a:b.svelte",
  });
  assert.equal(colon.ok, false);
  if (!colon.ok) assert.equal(colon.issues[0]?.code, "PATH_UNSAFE");
});

test("config diagnostics never echo an unsafe raw locator", () => {
  const value = "src/\u0007bad";
  const result = parseKitConfig({ schemaVersion: 1, uiDir: value });
  assert.equal(result.ok, false);
  if (result.ok) return;
  const issue = result.issues[0];
  assert.equal(issue?.code, "PATH_UNSAFE");
  assert.ok(!issue?.message.includes("\u0007"));
  assert.ok(issue?.message.includes("\\u0007"));
});
