<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogCancelProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: AlertDialogCancelProps = $props();
</script>

<BitsAlertDialog.Cancel
  {...rest}
  bind:ref
  {type}
  class={["kit-alert-dialog-cancel", className]}
/>
