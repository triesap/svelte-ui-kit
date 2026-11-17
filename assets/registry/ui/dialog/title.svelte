<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogTitleProps } from "./types.js";

  let {
    ref = $bindable(null),
    level = 2,
    class: className,
    ...rest
  }: DialogTitleProps = $props();
</script>

<BitsDialog.Title
  {...rest}
  bind:ref
  {level}
  class={["kit-dialog-title", className]}
/>
