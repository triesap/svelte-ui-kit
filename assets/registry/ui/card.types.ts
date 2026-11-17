import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

/** Native section surface; application content owns its structure and naming. */
export type CardProps = SvelteHTMLElements["section"] & {
  children: Snippet;
  ref?: HTMLElement | null;
};
