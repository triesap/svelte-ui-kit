import type { Snippet } from "svelte";
import type { SvelteHTMLElements } from "svelte/elements";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

/** Native button semantics with explicit owned loading and binding contracts. */
export type ButtonProps = Omit<
  SvelteHTMLElements["button"],
  "children" | "aria-busy"
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingLabel?: string;
  ref?: HTMLButtonElement | null;
  children: Snippet;
};
