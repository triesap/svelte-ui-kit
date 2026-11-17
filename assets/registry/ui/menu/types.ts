import type { DropdownMenu as BitsMenu } from "bits-ui";
import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";

export type MenuRootProps = BitsMenu.RootProps;
export type MenuTriggerProps = BitsMenu.TriggerProps;
export type MenuPortalProps = BitsMenu.PortalProps;
export type MenuContentProps = BitsMenu.ContentProps;
export type MenuItemProps = BitsMenu.ItemProps;
export type MenuRadioGroupProps = BitsMenu.RadioGroupProps;
export type MenuRadioItemProps = BitsMenu.RadioItemProps;

/** Stateless native indicator; checked comes from the native RadioItem snippet. */
export type MenuItemIndicatorProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  "children" | "hidden"
> & {
  checked: boolean;
  ref?: HTMLSpanElement | null;
  children?: Snippet;
};
