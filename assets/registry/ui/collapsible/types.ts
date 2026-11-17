import type { Collapsible as BitsCollapsible } from "bits-ui";

export type CollapsibleRootProps = BitsCollapsible.RootProps;
export type CollapsibleTriggerProps = BitsCollapsible.TriggerProps;
/** Source disclosure has no browser-find expansion behavior. */
export type CollapsibleContentProps = Omit<
  BitsCollapsible.ContentProps,
  "hiddenUntilFound"
>;
