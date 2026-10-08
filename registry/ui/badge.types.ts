import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

/** Source Badge is a native text-bearing span, without variant or action APIs. */
export type BadgeProps = SvelteHTMLElements["span"] & {
  children: Snippet;
  ref?: HTMLSpanElement | null;
};
