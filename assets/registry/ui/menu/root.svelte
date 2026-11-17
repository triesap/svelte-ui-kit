<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuRootProps } from "./types.js";

  let { open = $bindable(false), ...rest }: MenuRootProps = $props();
</script>

<BitsMenu.Root bind:open {...rest} />
