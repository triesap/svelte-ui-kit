<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogPortalProps } from "./types.js";

  let props: DialogPortalProps = $props();
</script>

<BitsDialog.Portal {...props} />
