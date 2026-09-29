<script lang="ts">
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<main>
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
</main>
