<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogTriggerProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: DialogTriggerProps = $props();
</script>

<BitsDialog.Trigger
  {...rest}
  bind:ref
  {type}
  class={["kit-dialog-trigger", className]}
/>
