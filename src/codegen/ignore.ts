/** Pure, byte-preserving ignore text transformation shared by planning and effects. */
const MANAGED_HEADER = "# svelte-ui-kit transient transaction state";

/**
 * Append the managed ignore block to existing ignore content, preserving every
 * existing rule byte-for-byte. Exported so the planner can compute the exact
 * bytes of a guarded ignore-file change without writing.
 */
export function ignoreBlockWithEntry(existing: string, entry: string): string {
  const prefix = existing.length === 0 || existing.endsWith("\n") ? "" : "\n";
  return `${existing}${prefix}${MANAGED_HEADER}\n${entry}\n`;
}

/** True when the managed entry is already present as a whole line. */
export function hasIgnoreEntry(existing: string, entry: string): boolean {
  return existing.split("\n").some((line) => line.trim() === entry);
}
