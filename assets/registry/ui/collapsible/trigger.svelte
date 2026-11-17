<script lang="ts">
  import { Collapsible as BitsCollapsible } from "bits-ui";
  import type { CollapsibleTriggerProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: CollapsibleTriggerProps = $props();
</script>

<BitsCollapsible.Trigger
  {...rest}
  bind:ref
  class={["kit-collapsible-trigger", className]}
/>
