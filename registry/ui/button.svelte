<script lang="ts">
  import Spinner from "./spinner.svelte";
  import type { ButtonProps } from "./button.types.js";

  let {
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    loadingLabel = "Loading",
    ref = $bindable(null),
    children,
    class: className,
    ...rest
  }: ButtonProps = $props();
</script>

<button
  {...rest}
  bind:this={ref}
  {type}
  disabled={disabled || loading}
  aria-busy={loading ? "true" : undefined}
  class={[
    "kit-button",
    `kit-button--${variant}`,
    `kit-button--${size}`,
    className,
  ]}
>
  {#if loading}
    <Spinner mode="decorative" class="kit-button-spinner" />
    <span class="kit-button-loading-label">{loadingLabel}</span>
  {/if}
  <span class="kit-button-content" data-loading={loading ? "" : undefined}>
    {@render children()}
  </span>
</button>
