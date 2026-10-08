<script lang="ts">
  import { Tabs as BitsTabs } from "bits-ui";
  import type { TabsRootProps } from "./types.js";
  let {
    value = $bindable(""),
    ref = $bindable(null),
    class: className,
    ...rest
  }: TabsRootProps = $props();
</script>

<BitsTabs.Root {...rest} bind:value bind:ref class={["kit-tabs", className]} />
