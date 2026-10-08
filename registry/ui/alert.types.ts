import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

/** Source assertive message presentation with native caller content/attributes. */
export type AlertProps = SvelteHTMLElements["div"] & {
  children: Snippet;
  role?: "alert";
  ref?: HTMLDivElement | null;
};
