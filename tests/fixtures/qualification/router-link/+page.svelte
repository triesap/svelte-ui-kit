<script lang="ts">
  import { onMount } from "svelte";
  import { asset, resolve } from "$app/paths";
  import { page } from "$app/state";
  import { RouterLink } from "__UI_MODULE__";
  import type { RouterLinkProps } from "__UI_MODULE__";

  let ready = $state(false);
  let ref = $state<HTMLAnchorElement | null>(null);
  let mounted = $state(true);
  let clicks = $state(0);
  let nativeClicks = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let target = $state<RouterLinkProps["target"]>(undefined);
  let rel = $state<string | undefined>(undefined);
  let customized = $state(false);
  let rtl = $state(false);
  let navigations = $state(0);
  let stamp = $state("");
  const href = resolve("/qualification/router-link");
  onMount(() => {
    ready = true;
    stamp = crypto.randomUUID();
  });
</script>

<h1>Generated Router Link qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="arrival">{page.url.searchParams.get("arrival") ?? "none"}</p>
<p id="loaded">{page.data.loadedArrival}</p>
<p id="stamp">{stamp}</p>
<p id="navigations">{navigations}</p>
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

<div id="link-options">
  <RouterLink
    id="replace"
    href={`${href}?arrival=replace`}
    data-sveltekit-replacestate>Replace</RouterLink
  >
  <a
    id="raw-replace"
    href={resolve("/qualification/router-link?arrival=raw-replace")}
    data-sveltekit-replacestate>Native replace</a
  >
  <RouterLink
    id="keep"
    href={`${href}?arrival=keep`}
    data-sveltekit-keepfocus
    data-sveltekit-noscroll>Keep focus and scroll</RouterLink
  >
  <a
    id="raw-keep"
    href={resolve("/qualification/router-link?arrival=raw-keep")}
    data-sveltekit-keepfocus
    data-sveltekit-noscroll>Native keep</a
  >
  <RouterLink id="reload" href={`${href}?arrival=reload`} data-sveltekit-reload
    >Native reload</RouterLink
  >
  <RouterLink
    id="preload"
    href={`${href}?arrival=preload`}
    data-sveltekit-preload-data="hover">Preload data</RouterLink
  >
  <RouterLink
    id="code"
    href={resolve("/qualification/router-link-target")}
    data-sveltekit-preload-code="hover"
    data-sveltekit-preload-data="off">Preload code</RouterLink
  >
</div>
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
      <RouterLink
        id="cancel"
        {href}
        bind:ref
        class={["caller", { retained: true }]}
        data-caller="preserved"
        title="Native link title"
        onclick={(event) => {
          event.preventDefault();
          clicks += 1;
        }}><span id="child">Cancel navigation</span></RouterLink
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
    <RouterLink
      id="navigate"
      href={`${href}?arrival=internal#destination`}
      onclick={() => (navigations += 1)}>Navigate</RouterLink
    >
    <RouterLink id="dynamic" href={`${href}?arrival=popup`} {target} {rel}
      >Dynamic target</RouterLink
    >
    <RouterLink
      id="external"
      href="https://external.invalid/anchor?arrival=external"
      target="_blank">External target</RouterLink
    >
    <RouterLink
      id="download"
      href={asset("/anchor-download.txt")}
      download="report.txt">Download report</RouterLink
    >
    <RouterLink
      id="aria-disabled"
      href={`${href}?arrival=aria-disabled`}
      aria-disabled="true">Native aria disabled</RouterLink
    >
    <RouterLink
      id="named"
      href={`${href}?arrival=named`}
      target="report-context">Named context</RouterLink
    >
  </form>
  <p id="destination">Destination</p>
</div>

<style>
  #theme {
    min-height: 2000px;
  }
  #link-options {
    position: fixed;
    inset-block-end: 0;
    inset-inline-end: 0;
    background: white;
    z-index: 20;
    display: grid;
    gap: 4px;
  }
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
