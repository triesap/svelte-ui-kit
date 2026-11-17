<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogPortalProps } from "./types.js";

  let props: AlertDialogPortalProps = $props();
</script>

<BitsAlertDialog.Portal {...props} />
