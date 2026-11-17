<script lang="ts">
  import Anchor from "./anchor.svelte";
  import type { RouterLinkProps } from "./router-link.types.js";

  let { ref = $bindable(null), ...rest }: RouterLinkProps = $props();
</script>

<Anchor {...rest} bind:ref />
