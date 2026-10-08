<script lang="ts">
  import { Collapsible as BitsCollapsible } from "bits-ui";
  import type { CollapsibleContentProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: CollapsibleContentProps = $props();
</script>

<BitsCollapsible.Content
  {...rest}
  hiddenUntilFound={false}
  bind:ref
  class={["kit-collapsible-content", className]}
/>
