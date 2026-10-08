<script lang="ts">
  import { Tabs as BitsTabs } from "bits-ui";
  import type { TabsTriggerProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: TabsTriggerProps = $props();
</script>

<BitsTabs.Trigger {...rest} bind:ref class={["kit-tabs-trigger", className]} />
