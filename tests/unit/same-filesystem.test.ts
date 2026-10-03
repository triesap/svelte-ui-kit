import assert from "node:assert/strict";
import { test } from "node:test";

import {
  sameFilesystemIssues,
  type DeviceObservation,
} from "../../src/codegen/apply.js";

/**
 * RCLD04-R2-2: deterministic cross-device refusal coverage, including the
 * metadata-only state-directory path. The observation function is injected so a
 * single-volume host can still prove the typed refusal branch without a second
 * physical device.
 */

function observing(
  entries: Readonly<Record<string, DeviceObservation>>,
  fallback: DeviceObservation,
): (abs: string) => DeviceObservation {
  return (abs) => entries[abs] ?? fallback;
}

const ABSENT: DeviceObservation = { kind: "absent" };

test("a foreign-device ancestor is a typed cross-device refusal", () => {
  const issues = sameFilesystemIssues(
    1,
    "/root/a/b/c",
    "a/b/c",
    observing({ "/root/a/b": { kind: "directory", device: 2 } }, ABSENT),
  );
  assert.equal(issues.length, 1, JSON.stringify(issues));
  assert.equal(issues[0]?.code, "STAGE_CROSS_DEVICE");
});

test("a metadata-only state directory on a foreign device refuses", () => {
  const issues = sameFilesystemIssues(1, "/root/state", ".kit", () => ({
    kind: "directory",
    device: 7,
  }));
  assert.equal(issues.length, 1, JSON.stringify(issues));
  assert.equal(issues[0]?.code, "STAGE_CROSS_DEVICE");
});

test("a same-device ancestor chain has no cross-device issue", () => {
  const issues = sameFilesystemIssues(
    1,
    "/root/a/b/c",
    "a/b/c",
    observing({ "/root/a/b": { kind: "directory", device: 1 } }, ABSENT),
  );
  assert.deepEqual(issues, []);
});

test("an unsafe ancestor is refused before any device claim", () => {
  const issues = sameFilesystemIssues(1, "/root/a", "a", () => ({
    kind: "other",
    detail: "symlink",
  }));
  assert.equal(issues[0]?.code, "AUTHORITY_ANCESTOR_UNSAFE");
});

test("a fully absent ancestor chain has no cross-device evidence", () => {
  const issues = sameFilesystemIssues(1, "/root/a/b", "a/b", () => ABSENT);
  assert.deepEqual(issues, []);
});
