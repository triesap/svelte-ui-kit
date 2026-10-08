<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogActionProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: AlertDialogActionProps = $props();
</script>

<BitsAlertDialog.Action
  {...rest}
  bind:ref
  {type}
  class={["kit-alert-dialog-action", className]}
/>
