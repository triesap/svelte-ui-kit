<script lang="ts">
  import { onMount } from "svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let clickCount = $state(0);
  // A hydration marker: SSR renders "false"; the client sets it once mounted.
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
</script>

<main data-hydrated={hydrated}>
  <h1>Consumer fixture qualification</h1>
  <p data-testid="server-value">Server value: {data.serverValue}</p>

  <form method="get">
    <label for="name-input">Name</label>
    <input id="name-input" name="name" type="text" autocomplete="off" />
    <button type="submit">Render name</button>
  </form>

  <p>
    <label>
      <input type="checkbox" checked />
      Enable notifications
    </label>
  </p>

  <button
    type="button"
    data-testid="counter"
    onclick={() => {
      clickCount += 1;
    }}
  >
    Increment
  </button>
  <p data-testid="click-count">Clicks: {clickCount}</p>
</main>
