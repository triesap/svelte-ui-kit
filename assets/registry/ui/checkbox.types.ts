import type { Checkbox as BitsCheckbox } from "bits-ui";

/** Checkbox owns its fixed SVG indicator; rendering snippets are excluded. */
export type CheckboxProps = Omit<BitsCheckbox.RootProps, "child" | "children">;
