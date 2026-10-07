import type { Switch as BitsSwitch } from "bits-ui";

/** Root owns one internal Thumb; delegated rendering hooks are unsupported. */
export type SwitchProps = Omit<BitsSwitch.RootProps, "child" | "children">;
