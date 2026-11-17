<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogOverlayProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: DialogOverlayProps = $props();
</script>

<BitsDialog.Overlay
  {...rest}
  bind:ref
  class={["kit-dialog-overlay", className]}
/>
