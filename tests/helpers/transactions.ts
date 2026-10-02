/**
 * Shared transaction-test constants.
 *
 * Recovery now requires the approved mapping from the caller rather than
 * trusting a journal's parsed shape, so tests supply the same default mapping
 * the guarded apply boundary uses.
 */
export const RECOVERY_ROOTS = {
  uiDir: "src/lib/components/ui",
  stylesDir: "src/styles",
  layoutFile: "src/routes/+layout.svelte",
} as const;
