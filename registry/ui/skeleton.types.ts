import type { SvelteHTMLElements } from "svelte/elements";

/** Empty decorative placeholder; loading meaning belongs to the owning region. */
export type SkeletonProps = SvelteHTMLElements["span"] & {
  children?: never;
  "aria-hidden"?: true | "true";
  "aria-live"?: never;
  role?: never;
  tabindex?: never;
  ref?: HTMLSpanElement | null;
};
