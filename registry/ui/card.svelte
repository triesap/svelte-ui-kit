<script lang="ts">
  import type { CardProps } from "./card.types.js";
  let {
    children,
    ref = $bindable(null),
    class: className,
    ...rest
  }: CardProps = $props();
</script>

<section {...rest} bind:this={ref} class={["kit-card", className]}>
  {@render children()}
</section>
