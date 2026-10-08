<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogTitleProps } from "./types.js";

  let {
    ref = $bindable(null),
    level = 2,
    class: className,
    ...rest
  }: AlertDialogTitleProps = $props();
</script>

<BitsAlertDialog.Title
  {...rest}
  bind:ref
  {level}
  class={["kit-alert-dialog-title", className]}
/>
