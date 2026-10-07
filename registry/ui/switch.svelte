<script lang="ts">
  import { Switch as BitsSwitch } from "bits-ui";
  import type { SwitchProps } from "./switch.types.js";

  let {
    checked = $bindable(false),
    ref = $bindable(null),
    class: className,
    ...rest
  }: SwitchProps = $props();
</script>

<BitsSwitch.Root
  {...rest}
  bind:checked
  bind:ref
  class={["kit-switch", className]}
>
  <BitsSwitch.Thumb class="kit-switch-thumb" aria-hidden="true" />
</BitsSwitch.Root>
