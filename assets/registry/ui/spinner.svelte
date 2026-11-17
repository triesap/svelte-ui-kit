<script lang="ts">
  import type { SpinnerProps } from "./spinner.types.js";

  let {
    mode = "status",
    label = "Loading",
    class: className,
    ...rest
  }: SpinnerProps = $props();
</script>

<span
  {...rest}
  class={["kit-spinner", className]}
  role={mode === "status" ? "status" : undefined}
  aria-hidden={mode === "decorative" ? "true" : undefined}
>
  <span class="kit-spinner-mark" aria-hidden="true"></span>
  {#if mode === "status"}
    <span class="kit-spinner-label">{label}</span>
  {/if}
</span>
