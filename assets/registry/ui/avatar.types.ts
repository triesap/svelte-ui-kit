import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

/** Native source image semantics with the approved optional fallback snippet. */
export type AvatarProps = SvelteHTMLElements["img"] & {
  src: string;
  alt: string;
  fallback?: Snippet;
  children?: never;
  ref?: HTMLImageElement | null;
};
