/**
 * Shared transaction-test constants and helpers.
 *
 * Recovery now requires the approved mapping from the caller rather than
 * trusting a journal's parsed shape, so tests supply the same default mapping
 * the guarded apply boundary uses. Recovery also binds the journal root
 * identity to the live project root, so hand-written journals must record the
 * live identity digest rather than a placeholder.
 */
import {
  identityDigest,
  observeRootIdentity,
} from "../../src/codegen/authority.js";

export const RECOVERY_ROOTS = {
  uiDir: "src/lib/components/ui",
  stylesDir: "src/styles",
  layoutFile: "src/routes/+layout.svelte",
} as const;

/** The live root identity digest a hand-written recovery journal must record. */
export function liveRootIdentity(root: string): string {
  const observed = observeRootIdentity(root);
  if (!observed.ok) throw new Error("live root identity observation failed");
  return identityDigest(observed.value);
}
