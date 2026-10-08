import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

/** Source-supported live-region roles, without an announcement service. */
export type StatusRole = "status" | "alert";
export type StatusPoliteness = "polite" | "assertive";

/** Native paragraph presentation with source live-region defaults. */
export type StatusProps = SvelteHTMLElements["p"] & {
  children: Snippet;
  role?: StatusRole;
  politeness?: StatusPoliteness;
  atomic?: boolean;
  ref?: HTMLParagraphElement | null;
};
