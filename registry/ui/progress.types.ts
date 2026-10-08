import type { SvelteHTMLElements } from "svelte/elements";

/** Native progress bounds and indeterminate omission, without a task engine. */
export type ProgressProps = SvelteHTMLElements["progress"] & {
  value?: number | null;
  max?: number | null;
  role?: "progressbar";
  children?: never;
  ref?: HTMLProgressElement | null;
};
