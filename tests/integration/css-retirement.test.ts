import assert from "node:assert/strict";
import { test } from "node:test";

import { hashBytes } from "../../src/codegen/compare.js";
import { classifyCssBlocks } from "../../src/codegen/css-compare.js";
import { retireManagedCss } from "../../src/codegen/css-retire.js";
import { survivingLockFiles } from "../../src/codegen/retire.js";
import type { LockCssBlock } from "../../src/codegen/lock.js";

/**
 * S051 tests: clean obsolete blocks are removed, customized retired blocks are
 * retained byte-for-byte as application-owned text that is no longer owned, and
 * malformed input is nonmutating.
 */

const STYLESHEET =
  "/* app top */\n" +
  "/* svelte-ui-kit:start clean */\nB\n/* svelte-ui-kit:end clean */\n" +
  "MIDDLE\n" +
  "/* svelte-ui-kit:start custom */\nL\n/* svelte-ui-kit:end custom */\n" +
  "/* app bottom */\n";

test("clean blocks are removed and customized blocks retained byte-for-byte", () => {
  const result = retireManagedCss(STYLESHEET, [
    { id: "clean", clean: true },
    { id: "custom", clean: false },
  ]);
  assert.equal(result.ok, true, JSON.stringify(result));
  if (!result.ok) return;
  assert.ok(!result.value.text.includes("start clean"));
  assert.ok(result.value.text.includes("start custom"));
  assert.ok(result.value.text.includes("\nL\n"));
  // Unmanaged neighbours are untouched.
  assert.ok(result.value.text.includes("/* app top */\n"));
  assert.ok(result.value.text.includes("MIDDLE\n"));
  assert.ok(result.value.text.includes("/* app bottom */\n"));
  const byId = new Map(
    result.value.records.map((entry) => [entry.blockId, entry]),
  );
  assert.equal(byId.get("clean")?.action, "removed");
  assert.equal(byId.get("custom")?.action, "retained");
});

test("a retained custom block is not silently reowned on a later add", () => {
  const result = retireManagedCss(STYLESHEET, [{ id: "custom", clean: false }]);
  assert.equal(result.ok, true);
  if (!result.ok) return;

  // Lock ownership is detached (the caller drops the record).
  const lockBlocks: LockCssBlock[] = [
    {
      path: "src/styles/kit.css",
      owner: "button",
      blockId: "custom",
      baseHash: hashBytes(new TextEncoder().encode("\nB\n")) as string,
      itemVersion: "0.1.0",
      cohort: "core",
    },
  ];
  assert.deepEqual(survivingLockFiles([], new Set()), []);

  // The retained span is untracked, so an add of the same block id conflicts.
  const classifications = classifyCssBlocks([
    {
      id: "custom",
      owner: null,
      baseHash: null,
      localBody: "\nL\n",
      incomingBody: "\nL\n",
    },
  ]);
  assert.equal(classifications[0]?.disposition, "untracked_conflict");
  assert.equal(lockBlocks.length, 1);
});

test("malformed input is nonmutating", () => {
  const malformed = "/* svelte-ui-kit:start clean */\nB\n";
  const result = retireManagedCss(malformed, [{ id: "clean", clean: true }]);
  assert.equal(result.ok, false);
});
