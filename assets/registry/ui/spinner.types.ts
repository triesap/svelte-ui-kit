import type { SvelteHTMLElements } from "svelte/elements";

/** Native presentation modes; no primitive or identity runtime is introduced. */
export type SpinnerMode = "status" | "decorative";

type NativeSpinnerAttributes = Omit<
  SvelteHTMLElements["span"],
  "children" | "role" | "aria-hidden" | "aria-label" | "aria-live"
>;

/** Internal markup and announcements are owned by the spinner. */
export type SpinnerProps = NativeSpinnerAttributes &
  ({ mode?: "status"; label?: string } | { mode: "decorative"; label?: never });
