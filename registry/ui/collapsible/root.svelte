<script lang="ts">
  import { Collapsible as BitsCollapsible } from "bits-ui";
  import type { CollapsibleRootProps } from "./types.js";
  let {
    open = $bindable(false),
    ref = $bindable(null),
    class: className,
    ...rest
  }: CollapsibleRootProps = $props();
</script>

<BitsCollapsible.Root
  {...rest}
  bind:open
  bind:ref
  class={["kit-collapsible", className]}
/>
