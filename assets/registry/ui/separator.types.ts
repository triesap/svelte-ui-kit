import type { SvelteHTMLElements } from "svelte/elements";

export type SeparatorOrientation = "horizontal" | "vertical";

type NativeSeparatorProps = SvelteHTMLElements["div"] & {
  orientation?: SeparatorOrientation;
  ref?: HTMLDivElement | null;
  children?: never;
  "aria-orientation"?: never;
  "data-orientation"?: never;
};

/** Source separator geometry with an explicitly decorative catalog case. */
export type SeparatorProps = NativeSeparatorProps &
  (
    | { decorative?: false; role?: "separator" }
    | { decorative: true; role?: "none"; "aria-hidden"?: true | "true" }
  );
