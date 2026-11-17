<script lang="ts">
  import type { AnchorProps } from "./anchor.types.js";

  let {
    href,
    children,
    ref = $bindable(null),
    class: className,
    target,
    rel,
    ...rest
  }: AnchorProps = $props();

  const effectiveRel = $derived(
    rel ?? (target === "_blank" ? "noopener noreferrer" : undefined),
  );
</script>

<a
  {...rest}
  bind:this={ref}
  {href}
  {target}
  rel={effectiveRel}
  class={["kit-anchor", className]}
>
  {@render children()}
</a>
