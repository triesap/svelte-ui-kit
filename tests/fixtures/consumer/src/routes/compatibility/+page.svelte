<script lang="ts">
  import { onMount } from "svelte";
  import SwitchFixture from "$lib/compatibility/SwitchFixture.svelte";

  // Client-mount marker so the browser harness can wait for hydration without
  // a fixed sleep.
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
</script>

<main data-hydrated={hydrated}>
  <h1>Compatibility qualification</h1>
  <SwitchFixture label="Enable compatibility notifications" />
</main>
