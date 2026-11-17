<script lang="ts">
  import type { AlertProps } from "./alert.types.js";
  let {
    children,
    ref = $bindable(null),
    class: className,
    ...rest
  }: AlertProps = $props();
</script>

<div {...rest} bind:this={ref} class={["kit-alert", className]} role="alert">
  {@render children()}
</div>
