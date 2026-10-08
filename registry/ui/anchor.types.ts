import type { Snippet } from "svelte";
import type {
  HTMLAttributeAnchorTarget,
  SvelteHTMLElements,
} from "svelte/elements";

/** Native browsing-context targets, including caller-named contexts. */
export type AnchorTarget = HTMLAttributeAnchorTarget;

/** Source-required href and children with actual native link attributes/ref. */
export type AnchorProps = Omit<SvelteHTMLElements["a"], "href" | "children"> & {
  href: string;
  children: Snippet;
  ref?: HTMLAnchorElement | null;
};
