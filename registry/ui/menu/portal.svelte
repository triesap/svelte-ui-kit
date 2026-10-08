<script lang="ts">
  import { DropdownMenu as BitsMenu } from "bits-ui";
  import type { MenuPortalProps } from "./types.js";

  let props: MenuPortalProps = $props();
</script>

<BitsMenu.Portal {...props} />
