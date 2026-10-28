/** Source-preserving ordered side-effect imports shared by target adapters. */
import { fail, issue, ok, type ModelResult } from "../registry/errors.js";
import { parseScriptImports, type ScriptImport } from "./svelte-parse.js";
export interface IntegrationImport {
  readonly specifier: string;
}
function importLine(specifier: string): string {
  return `import "${specifier}";`;
}
export function patchOrderedScriptImports(
  source: string,
  span: { readonly start: number; readonly end: number },
  imports: readonly IntegrationImport[],
): ModelResult<string> {
  const desired = imports.map((entry) => entry.specifier);
  const content = source.slice(span.start, span.end);
  const instanceImports = parseScriptImports(content).filter(
    (entry) => !entry.typeOnly,
  );
  const approved = desired
    .map((specifier, index) => ({ specifier, index }))
    .map((entry) => ({
      ...entry,
      statement: instanceImports.find(
        (candidate) => candidate.specifier === entry.specifier,
      ),
    }))
    .filter(
      (
        entry,
      ): entry is {
        specifier: string;
        index: number;
        statement: ScriptImport;
      } => entry.statement !== undefined,
    )
    .sort((left, right) => left.statement.start - right.statement.start);

  // Present approved imports must appear in the required relative order.
  let cursor = -1;
  for (const entry of approved) {
    if (entry.index < cursor) {
      return fail([
        issue(
          "LAYOUT_IMPORT_ORDER",
          `existing layout imports place ${JSON.stringify(entry.specifier)} out of the required kit/themes/app order; correct the order manually rather than reordering unrelated application code`,
        ),
      ]);
    }
    cursor = entry.index;
  }

  const presentIndices = new Set(approved.map((entry) => entry.index));
  const missing = desired
    .map((specifier, index) => ({ specifier, index }))
    .filter((entry) => !presentIndices.has(entry.index));
  if (missing.length === 0) return ok(source);

  const beforeGroups = new Map<number, string[]>();
  const afterGroups = new Map<number, string[]>();
  const leading: string[] = [];
  const appendGroup = (
    groups: Map<number, string[]>,
    key: number,
    specifier: string,
  ): void => {
    const existing = groups.get(key);
    if (existing === undefined) groups.set(key, [specifier]);
    else existing.push(specifier);
  };

  for (const entry of missing) {
    const before = approved.find(
      (candidate) =>
        candidate.index > entry.index && candidate.statement.start >= 0,
    );
    if (before !== undefined) {
      appendGroup(
        beforeGroups,
        span.start + before.statement.start,
        entry.specifier,
      );
      continue;
    }
    const after = [...approved]
      .reverse()
      .find((candidate) => candidate.index < entry.index);
    if (after !== undefined) {
      appendGroup(
        afterGroups,
        span.start + after.statement.end,
        entry.specifier,
      );
      continue;
    }
    leading.push(entry.specifier);
  }

  const insertions: { at: number; text: string }[] = [];
  for (const [start, specs] of beforeGroups) {
    insertions.push({
      at: start,
      text: `${specs.map(importLine).join("\n")}\n`,
    });
  }
  for (const [end, specs] of afterGroups) {
    insertions.push({
      at: end,
      text: `\n${specs.map(importLine).join("\n")}`,
    });
  }
  if (leading.length > 0) {
    insertions.push({
      at: span.start,
      text: `${leading.map(importLine).join("\n")}\n`,
    });
  }

  let output = source;
  for (const insertion of [...insertions].sort(
    (left, right) => right.at - left.at,
  )) {
    output =
      output.slice(0, insertion.at) +
      insertion.text +
      output.slice(insertion.at);
  }
  return ok(output);
}
