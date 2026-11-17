<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogOverlayProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: AlertDialogOverlayProps = $props();
</script>

<BitsAlertDialog.Overlay
  {...rest}
  bind:ref
  class={["kit-alert-dialog-overlay", className]}
/>
