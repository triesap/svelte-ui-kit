/** One bounded physical read for every framework configuration candidate. */
import { readFileSync } from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { observeEntry } from "./io.js";
import { TARGET_CONFIG_FILES } from "./target-config.js";
import { VITE_CONFIG_FILES } from "./sveltekit-vite-config.js";
export const CONFIGURATION_FILES = [
  ...TARGET_CONFIG_FILES,
  ...VITE_CONFIG_FILES,
] as const;
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
    if (entry.stats.size > 1024 * 1024)
      return {
        path: logical,
        kind: "malformed",
        code: "CONFIGURATION_TOO_LARGE",
      };
    let bytes: Buffer;
    try {
      bytes = readFileSync(absolute);
    } catch (error) {
      return {
        path: logical,
        kind: "unreadable",
        code: (error as NodeJS.ErrnoException).code ?? "EIO",
      };
    }
    if (bytes.length > 1024 * 1024)
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
