<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogCloseProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: DialogCloseProps = $props();
</script>

<BitsDialog.Close
  {...rest}
  bind:ref
  {type}
  class={["kit-dialog-close", className]}
/>
