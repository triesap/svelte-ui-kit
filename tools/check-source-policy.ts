/** Enforce authored TypeScript entrypoints and their strict compiler coverage. */
import { lstatSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const generatedDirectories = new Set([
  "node_modules",
  ".pnpm-store",
  ".native-build",
  "dist",
  "build",
  ".svelte-kit",
  "coverage",
  ".unit-test-build",
  ".output",
  "playwright-report",
]);
export function checkSourcePolicy(directory: string): string[] {
  const issues: string[] = [];
  const read = (name: string) =>
    JSON.parse(readFileSync(path.join(directory, name), "utf8")) as {
      extends?: string;
      include?: unknown;
      exclude?: unknown;
      compilerOptions?: Record<string, unknown>;
    };
  try {
    const base = read("tsconfig.json");
    const tooling = read("tsconfig.tooling.json");
    if (
      base.compilerOptions?.strict !== true ||
      base.compilerOptions.noEmitOnError !== true ||
      base.compilerOptions.rewriteRelativeImportExtensions !== true ||
      base.compilerOptions.skipLibCheck === true
    )
      issues.push(
        "Root compiler must preserve strict checked emission and source-extension rewriting.",
      );
    if (
      tooling.extends !== "./tsconfig.json" ||
      JSON.stringify(tooling.include) !==
        JSON.stringify(["tools/**/*.ts", "tests/**/*.ts"]) ||
      JSON.stringify(tooling.exclude) !==
        JSON.stringify(["tests/fixtures/**"]) ||
      !tooling.compilerOptions ||
      Object.keys(tooling.compilerOptions).length !== 3 ||
      tooling.compilerOptions.rootDir !== "." ||
      tooling.compilerOptions.noEmit !== true ||
      tooling.compilerOptions.allowImportingTsExtensions !== true
    )
      issues.push(
        "Tooling compiler must cover every authored test/tool with inherited strictness; fixtures have their own framework checks.",
      );
  } catch (error) {
    issues.push(`Compiler configuration cannot be checked: ${String(error)}`);
  }
  const walk = (relative: string): void => {
    for (const name of readdirSync(path.join(directory, relative)).sort()) {
      if (
        generatedDirectories.has(name) ||
        (relative === "tests/fixtures" && name === "generated")
      )
        continue;
      const logical = `${relative}/${name}`;
      const stat = lstatSync(path.join(directory, logical));
      if (stat.isSymbolicLink()) {
        issues.push(`Authored source cannot be a symlink: ${logical}`);
        continue;
      }
      if (stat.isDirectory()) walk(logical);
      else if (/\.(?:js|mjs|cjs|mts|cts)$/.test(name))
        issues.push(`Authored test/tool modules must use .ts: ${logical}`);
    }
  };
  try {
    walk("tests");
    walk("tools");
  } catch (error) {
    issues.push(`Source inventory cannot be checked: ${String(error)}`);
  }
  return issues;
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const issues = checkSourcePolicy(root);
  for (const issue of issues) console.error(issue);
  if (issues.length) process.exitCode = 1;
  else console.log("Authored TypeScript coverage: PASS");
}
