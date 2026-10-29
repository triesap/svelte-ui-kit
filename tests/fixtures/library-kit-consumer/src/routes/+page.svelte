<script lang="ts">
  import "@example/generated-ui-library/styles.css";
  import Island from "$lib/Island.svelte";
  import type { PageData } from "./$types";
  let { data }: { data: PageData } = $props();
</script>

<svelte:head
  ><title>Packed library SvelteKit consumer</title><meta
    name="fixture-witness"
    content={data.fixtureWitness}
  /></svelte:head
>
<header><p data-testid="named-slot">Application-owned banner</p></header>
<main>
  <h1>Packed Svelte library consumer</h1>
  <p data-testid="server-value">{data.serverValue}</p>
  <p data-testid="style-order">Ordered kit, theme and application styles</p>
  <Island label="First" /><Island label="Second" />
</main>
<footer data-testid="layout-footer">Application-owned footer</footer>
