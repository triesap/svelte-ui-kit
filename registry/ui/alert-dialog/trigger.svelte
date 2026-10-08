<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogTriggerProps } from "./types.js";

  let {
    ref = $bindable(null),
    type = "button",
    class: className,
    ...rest
  }: AlertDialogTriggerProps = $props();
</script>

<BitsAlertDialog.Trigger
  {...rest}
  bind:ref
  {type}
  class={["kit-alert-dialog-trigger", className]}
/>
