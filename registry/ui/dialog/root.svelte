<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogRootProps } from "./types.js";

  let { open = $bindable(false), ...rest }: DialogRootProps = $props();
</script>

<BitsDialog.Root bind:open {...rest} />
