<script lang="ts">
  import { onMount } from "svelte";
  import { asset, resolve } from "$app/paths";
  import { page } from "$app/state";
  import { Anchor } from "__UI_MODULE__";
  import type { AnchorTarget } from "__UI_MODULE__";

  let ready = $state(false);
  let ref = $state<HTMLAnchorElement | null>(null);
  let mounted = $state(true);
  let clicks = $state(0);
  let nativeClicks = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let target = $state<AnchorTarget | undefined>(undefined);
  let rel = $state<string | undefined>(undefined);
  let customized = $state(false);
  let rtl = $state(false);
  const href = resolve("/qualification/anchor");
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Anchor qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="arrival">{page.url.searchParams.get("arrival") ?? "none"}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Kit {clicks}; native {nativeClicks}; submits {submits}; resets {resets}
</p>
<button onclick={() => ref?.focus()}>Focus bound link</button>
<button onclick={() => (mounted = !mounted)}>Toggle link</button>
<button onclick={() => (target = target ? undefined : "_blank")}
  >Toggle target</button
>
<button
  onclick={() =>
    (rel = rel === undefined ? "opener" : rel === "opener" ? "" : undefined)}
  >Cycle rel</button
>
<button onclick={() => (customized = !customized)}>Toggle customization</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>

<div class:customized dir={rtl ? "rtl" : "ltr"} id="theme">
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
    }}
    onreset={() => {
      resets += 1;
    }}
  >
    {#if mounted}
      <Anchor
        id="cancel"
        {href}
        bind:ref
        class={["caller", { retained: true }]}
        data-caller="preserved"
        title="Native link title"
        onclick={(event) => {
          event.preventDefault();
          clicks += 1;
        }}><span id="child">Cancel navigation</span></Anchor
      >
    {/if}
    <a
      id="native"
      {href}
      onclick={(event) => {
        event.preventDefault();
        nativeClicks += 1;
      }}>Native control</a
    >
    <Anchor id="navigate" href={`${href}?arrival=internal#destination`}
      >Navigate</Anchor
    >
    <Anchor id="dynamic" href={`${href}?arrival=popup`} {target} {rel}
      >Dynamic target</Anchor
    >
    <Anchor
      id="external"
      href="https://external.invalid/anchor?arrival=external"
      target="_blank">External target</Anchor
    >
    <Anchor
      id="download"
      href={asset("/anchor-download.txt")}
      download="report.txt">Download report</Anchor
    >
    <Anchor
      id="aria-disabled"
      href={`${href}?arrival=aria-disabled`}
      aria-disabled="true">Native aria disabled</Anchor
    >
    <Anchor id="named" href={`${href}?arrival=named`} target="report-context"
      >Named context</Anchor
    >
  </form>
  <p id="destination">Destination</p>
</div>

<style>
  #theme {
    --kit-color-link: rgb(20, 80, 160);
    --kit-color-link-hover: rgb(10, 50, 120);
    --kit-focus-ring: rgb(80, 30, 170);
  }
  #theme.customized {
    --kit-anchor-color: rgb(170, 30, 60);
    --kit-anchor-color-hover: rgb(120, 10, 40);
    --kit-anchor-text-decoration-color: rgb(30, 120, 70);
    --kit-anchor-text-decoration-line: overline;
    --kit-anchor-text-decoration-thickness: 3px;
    --kit-anchor-text-underline-offset: 5px;
    --kit-anchor-focus-outline-width: 4px;
    --kit-anchor-focus-outline-color: rgb(30, 100, 80);
    --kit-anchor-focus-outline-offset: 6px;
  }
</style>
