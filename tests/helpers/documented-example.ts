import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import path from "node:path";

// Typed suites emit their own TS sources, not tool JS. Resolve the shared
// authoring parser explicitly from the repository cwd used by the runner.
const parser = createRequire(import.meta.url)(
  path.resolve("tools/markdown-docs.mjs"),
) as typeof import("../../tools/markdown-docs.mjs");
export function documentedExample(
  file: string,
  marker: string,
  language: string,
): string {
  return parser.readMarkedExample(readFileSync(file, "utf8"), marker, language);
}
