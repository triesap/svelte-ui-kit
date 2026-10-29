/** Shared preparation I/O; installed consumers never execute these tools. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";

export const MAINTAINED_NATIVE_FIXTURES = Object.freeze([
  "tests/fixtures/consumer",
  "tests/fixtures/astro-consumer",
  "tests/fixtures/library",
  "tests/fixtures/library-kit-consumer",
]);

export function nativeFixtureRoots(packageRoot: string): readonly string[] {
  return MAINTAINED_NATIVE_FIXTURES.flatMap((relative, index) => {
    if (
      index > 0 &&
      lstatSync(path.join(packageRoot, relative), { throwIfNoEntry: false }) ===
        undefined
    )
      return [];
    return [artifactDirectory(packageRoot, relative)];
  });
}

export function artifactDigest(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function regularArtifact(file: string): Buffer {
  const entry = lstatSync(file);
  assert.ok(
    entry.isFile() && !entry.isSymbolicLink(),
    "regular artifact file required",
  );
  return readFileSync(file);
}

function artifactSegments(logical: string): string[] {
  const segments = logical.split("/");
  assert.ok(
    segments.every(
      (segment) =>
        segment &&
        segment !== "." &&
        segment !== ".." &&
        !segment.includes("\\"),
    ),
    "contained artifact directory required",
  );
  return segments;
}

/** Inspect existing state without creating missing delivery ancestors. */
export function assertArtifactDestination(
  root: string,
  logical: string,
  expected: string,
): void {
  const segments = artifactSegments(logical);
  let current = root;
  for (const [index, segment] of segments.entries()) {
    current = path.join(current, segment);
    const entry = lstatSync(current, { throwIfNoEntry: false });
    if (entry === undefined) return;
    if (index === segments.length - 1) {
      assert.ok(
        entry.isFile() && !entry.isSymbolicLink(),
        "existing artifact must be regular",
      );
      assert.equal(
        artifactDigest(regularArtifact(current)),
        expected,
        "existing artifact must match before delivery",
      );
    } else
      assert.ok(
        entry.isDirectory() && !entry.isSymbolicLink(),
        "existing artifact ancestry must be real",
      );
  }
}

export function artifactDirectory(
  root: string,
  logical: string,
  create = false,
): string {
  const segments = artifactSegments(logical);
  let current = root;
  for (const segment of segments) {
    current = path.join(current, segment);
    if (!existsSync(current) && create) mkdirSync(current);
    const entry = lstatSync(current);
    assert.ok(
      entry.isDirectory() && !entry.isSymbolicLink(),
      "regular artifact directory required",
    );
  }
  return current;
}

export function copyAuthenticatedArtifact(
  bytes: Uint8Array,
  target: string,
  expected: string,
): void {
  assert.equal(artifactDigest(bytes), expected, "authenticated artifact bytes");
  if (existsSync(target))
    assert.equal(
      artifactDigest(regularArtifact(target)),
      expected,
      "existing artifact must match; refusing overwrite",
    );
  else writeFileSync(target, bytes, { flag: "wx", mode: 0o644 });
}
