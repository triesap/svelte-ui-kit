<script lang="ts">
  import { Tabs as BitsTabs } from "bits-ui";
  import type { TabsListProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: TabsListProps = $props();
</script>

<BitsTabs.List {...rest} bind:ref class={["kit-tabs-list", className]} />
