<script lang="ts">
  import { onMount } from "svelte";
  import Catalog from "./Catalog.svelte";
  let ready = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Actual packed complete catalog</h1>
  <Catalog seed="packed-request" on={false} portal="body" openKind="" />
  <div id="catalog-host"></div>
</main>
