import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

export interface TarFile {
  readonly bytes: Buffer;
  readonly mode: number;
}

/** Bounded regular-file USTAR input. Links, extensions and unsafe names refuse. */
export function readPackedFiles(packed: Uint8Array): Map<string, TarFile> {
  assert.ok(packed.byteLength <= 8 * 1024 * 1024, "bounded packed input");
  const tar = gunzipSync(packed, { maxOutputLength: 32 * 1024 * 1024 });
  const files = new Map<string, TarFile>();
  const names = new Set<string>();
  let offset = 0;
  let complete = false;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) {
      assert.ok(
        tar.length - offset >= 1024 &&
          tar.subarray(offset).every((byte) => byte === 0),
        "complete empty tar tail",
      );
      complete = true;
      break;
    }
    const text = (start: number, end: number): string => {
      const field = header.subarray(start, end);
      const zero = field.indexOf(0);
      if (zero >= 0)
        assert.ok(
          field.subarray(zero).every((byte) => byte === 0),
          "ordinary tar field",
        );
      return new TextDecoder("utf-8", { fatal: true }).decode(
        zero < 0 ? field : field.subarray(0, zero),
      );
    };
    const octal = (start: number, end: number): number => {
      const value = new TextDecoder("utf-8", { fatal: true })
        .decode(header.subarray(start, end))
        .replaceAll("\0", " ")
        .trim();
      assert.match(value, /^[0-7]+$/, "ordinary octal field");
      const parsed = Number.parseInt(value, 8);
      assert.ok(Number.isSafeInteger(parsed), "finite tar number");
      return parsed;
    };
    const checksum = [...header].reduce(
      (sum, byte, index) => sum + (index >= 148 && index < 156 ? 32 : byte),
      0,
    );
    assert.equal(octal(148, 156), checksum, "genuine tar checksum");
    const path = [text(345, 500), text(0, 100)]
      .filter(Boolean)
      .join("/")
      .replace(/\/$/, "");
    assert.ok(
      path.startsWith("package/") &&
        !Array.from(path).some(
          (character) =>
            character === "\\" ||
            character.charCodeAt(0) < 32 ||
            character.charCodeAt(0) === 127,
        ) &&
        !path.split("/").some((part) => !part || part === "." || part === ".."),
      "safe package path",
    );
    assert.ok(!names.has(path), "unique tar entry");
    names.add(path);
    assert.ok(names.size <= 1024, "bounded tar inventory");
    const size = octal(124, 136);
    assert.ok(
      size <= 8 * 1024 * 1024 && offset + 512 + size <= tar.length,
      "complete bounded tar member",
    );
    const type = text(156, 157) || "0";
    assert.ok(type === "0" || type === "5", "regular file or directory only");
    if (type === "5") assert.equal(size, 0, "empty directory entry");
    else
      files.set(path.slice("package/".length), {
        bytes: Buffer.from(tar.subarray(offset + 512, offset + 512 + size)),
        mode: octal(100, 108) & 0o777,
      });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  assert.ok(complete && files.size > 0, "nonempty complete package");
  return files;
}

export function normalizeGzip(file: string): void {
  const bytes = readFileSync(file);
  assert.ok(bytes.length >= 18);
  assert.deepEqual([...bytes.subarray(0, 8)], [31, 139, 8, 0, 0, 0, 0, 0]);
  const raw = gunzipSync(bytes);
  bytes[9] = 255;
  assert.deepEqual(gunzipSync(bytes), raw);
  writeFileSync(file, bytes);
}
