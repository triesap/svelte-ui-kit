<script lang="ts">
  import { Tabs as BitsTabs } from "bits-ui";
  import type { TabsContentProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: TabsContentProps = $props();
</script>

<BitsTabs.Content {...rest} bind:ref class={["kit-tabs-panel", className]} />
