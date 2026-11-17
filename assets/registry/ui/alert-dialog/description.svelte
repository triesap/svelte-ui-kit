<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogDescriptionProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: AlertDialogDescriptionProps = $props();
</script>

<BitsAlertDialog.Description
  {...rest}
  bind:ref
  class={["kit-alert-dialog-description", className]}
/>
