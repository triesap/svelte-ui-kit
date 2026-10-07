<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogDescriptionProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: DialogDescriptionProps = $props();
</script>

<BitsDialog.Description
  {...rest}
  bind:ref
  class={["kit-dialog-description", className]}
/>
