<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import * as UI from "__UI_MODULE__";
  import type { ButtonProps } from "__UI_MODULE__";
  import Catalog from "./Catalog.svelte";
  const seed = page.url.searchParams.get("request") ?? "default-request";
  const on = page.url.searchParams.get("on") === "1";
  const kind = page.url.searchParams.get("open");
  const openKind =
    kind === "dialog" || kind === "alert" || kind === "menu" ? kind : "";
  const host = page.url.searchParams.get("portal");
  const portal = host === "body" || host === "custom" ? host : "inline";
  let extra = $state(page.url.searchParams.get("extra") === "1");
  let mounted = $state(true);
  let ready = $state(false);
  const button: Pick<ButtonProps, "type"> = { type: "button" };
  onMount(() => {
    ready = true;
  });
</script>

<main
  data-ready={ready}
  data-request={seed}
  data-on={on}
  data-open={openKind}
  data-portal={portal}
>
  <h1>Full catalog SSR and hydration</h1>
  <UI.Button
    {...button}
    id="toggle-extra"
    onclick={() => {
      extra = !extra;
    }}>Toggle extra instance</UI.Button
  >
  <UI.Button
    {...button}
    id="toggle-mounted"
    onclick={() => {
      mounted = !mounted;
    }}>Toggle entire catalog</UI.Button
  >
  {#if mounted}
    <Catalog {seed} {on} {portal} {openKind} />
    {#if extra}<Catalog
        seed={seed + "-extra"}
        on={!on}
        {portal}
        openKind=""
      />{/if}
  {/if}
  <div id="catalog-host"></div>
</main>
