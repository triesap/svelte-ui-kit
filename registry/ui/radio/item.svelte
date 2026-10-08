<script lang="ts">
  import { RadioGroup as BitsRadioGroup } from "bits-ui";
  import type { RadioItemProps } from "./types.js";
  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: RadioItemProps = $props();
</script>

<BitsRadioGroup.Item {...rest} bind:ref class={["kit-radio", className]} />
