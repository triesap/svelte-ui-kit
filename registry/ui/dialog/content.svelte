<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogContentProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: DialogContentProps = $props();
</script>

<BitsDialog.Content
  {...rest}
  bind:ref
  class={["kit-dialog-content", className]}
/>
