<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogRootProps } from "./types.js";

  let { open = $bindable(false), ...rest }: AlertDialogRootProps = $props();
</script>

<BitsAlertDialog.Root bind:open {...rest} />
