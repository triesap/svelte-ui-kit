/** One bounded physical read for every framework configuration candidate. */
import { createHash } from "node:crypto";
import { closeSync, constants, fstatSync, openSync, readSync } from "node:fs";
import path from "node:path";
import { TARGET_CONFIG_FILES } from "./config.js";
import { observeEntry } from "./io.js";
import { VITE_CONFIG_FILES } from "./sveltekit-vite-config.js";
export const CONFIGURATION_FILES = [
  ...TARGET_CONFIG_FILES,
  ...VITE_CONFIG_FILES,
] as const;
export const CONFIGURATION_MAX_BYTES = 1024 * 1024;
/** One physical regular file, at most the supported bound plus one refusal byte. */
export function readConfigurationBytes(absolute: string): Buffer {
  const tooLarge = () =>
    Object.assign(
      new Error("Framework configuration exceeds the supported byte bound"),
      { code: "CONFIGURATION_TOO_LARGE" },
    );
  const fd = openSync(
    absolute,
    constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK,
  );
  try {
    const opened = fstatSync(fd);
    if (!opened.isFile())
      throw Object.assign(new Error("Configuration must be a regular file"), {
        code: "CONFIGURATION_NOT_REGULAR",
      });
    if (opened.size > CONFIGURATION_MAX_BYTES) throw tooLarge();
    const bytes = Buffer.allocUnsafe(CONFIGURATION_MAX_BYTES + 1);
    let length = 0;
    while (length < bytes.length) {
      const count = readSync(fd, bytes, length, bytes.length - length, null);
      if (count === 0) break;
      length += count;
    }
    if (length > CONFIGURATION_MAX_BYTES) throw tooLarge();
    return bytes.subarray(0, length);
  } finally {
    closeSync(fd);
  }
}
export type ConfigurationInput =
  | {
      readonly path: string;
      readonly kind: "file";
      readonly source: string;
      readonly digest: string;
      readonly mode: number;
    }
  | { readonly path: string; readonly kind: "absent" }
  | {
      readonly path: string;
      readonly kind: "unsafe" | "unreadable" | "malformed";
      readonly code: string;
    };
export function captureConfigurationInputs(
  root: string,
): readonly ConfigurationInput[] {
  return CONFIGURATION_FILES.map((logical) => {
    const absolute = path.join(root, logical),
      entry = observeEntry(absolute);
    if (entry.kind === "absent") return { path: logical, kind: "absent" };
    if (entry.kind === "unreadable")
      return { path: logical, kind: "unreadable", code: entry.code };
    if (entry.kind !== "file")
      return { path: logical, kind: "unsafe", code: "UNSAFE" };
    if (entry.stats.size > CONFIGURATION_MAX_BYTES)
      return {
        path: logical,
        kind: "malformed",
        code: "CONFIGURATION_TOO_LARGE",
      };
    let bytes: Buffer;
    try {
      bytes = readConfigurationBytes(absolute);
    } catch (error) {
      return {
        path: logical,
        kind:
          (error as NodeJS.ErrnoException).code === "CONFIGURATION_TOO_LARGE"
            ? "malformed"
            : "unreadable",
        code: (error as NodeJS.ErrnoException).code ?? "EIO",
      };
    }
    if (bytes.length > CONFIGURATION_MAX_BYTES)
      return {
        path: logical,
        kind: "malformed",
        code: "CONFIGURATION_TOO_LARGE",
      };
    try {
      return {
        path: logical,
        kind: "file",
        source: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        digest: createHash("sha256").update(bytes).digest("hex"),
        mode: entry.stats.mode & 0o777,
      };
    } catch {
      return {
        path: logical,
        kind: "malformed",
        code: "CONFIGURATION_UTF8_INVALID",
      };
    }
  });
}
