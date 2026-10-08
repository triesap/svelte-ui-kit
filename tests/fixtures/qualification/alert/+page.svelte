<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Alert } from "__UI_MODULE__";
  import type { AlertProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLDivElement | null>(null);
  let mounted = $state(true);
  let hidden = $state(false);
  let caption = $state(
    page.url.searchParams.get("label") ?? "Network request failed.",
  );
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let night = $state(false);
  let rtl = $state(false);
  let radius = $state(0);
  const radii = [
    "",
    "--kit-radius-surface:10px",
    "--kit-radius-default:6px",
    "--kit-radius-md:18px",
    "--kit-alert-radius:3px",
  ];
  const attrs: Pick<AlertProps, "title" | "data-caller"> = {
    title: "Connection state",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Alert qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<button onclick={() => (caption = "Connection restored.")}>Update label</button>
<button onclick={() => ref?.focus()}>Focus alert</button>
<button onclick={() => (mounted = !mounted)}>Toggle alert</button>
<button onclick={() => (hidden = !hidden)}>Toggle hiding</button>
<button onclick={() => (night = !night)}>Toggle theme</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>
<button onclick={() => (radius = (radius + 1) % radii.length)}
  >Next radius</button
>

<div id="theme" class:night dir={rtl ? "rtl" : "ltr"} style={radii[radius]}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
    }}
    onreset={() => {
      resets += 1;
    }}
  >
    <input type="hidden" name="native-field" value="preserved" />
    {#if mounted}
      <Alert
        id="main"
        bind:ref
        class={["caller", { retained: true }]}
        {...attrs}
        {hidden}
        tabindex={-1}
        data-state="caller-owned"
        onclick={(event) => {
          event.preventDefault();
          clicks += 1;
        }}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ") keys += 1;
        }}
        ><span aria-hidden="true">Decorative duplicate</span>
        <p id="label">{caption}</p></Alert
      >
    {/if}
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <Alert id="empty"
    >{#if caption === "Connection restored."}Later message{/if}</Alert
  >
  <Alert
    id="native-overrides"
    aria-live="off"
    aria-atomic="false"
    aria-relevant="removals">Caller native overrides</Alert
  >
  <div id="native-control" role="alert">
    <span aria-hidden="true">Decorative duplicate</span>
    <p>Native control message</p>
  </div>
  <div
    id="native-off-control"
    role="alert"
    aria-live="off"
    aria-atomic="false"
    aria-relevant="removals"
  >
    Native override control
  </div>
  <Alert
    id="styled"
    aria-labelledby="named-heading"
    style="border-radius:2px;color:rgb(120,20,40);background:rgb(250,240,230)"
    ><h2 id="named-heading">Connection problem</h2>
    <p>Needs review</p></Alert
  >
  <Alert id="until-found" hidden="until-found"
    >Searchable native hidden text</Alert
  >
</div>

<style>
  #theme {
    font-family: monospace;
    font-size: 20px;
  }
  #theme.night {
    --kit-color-surface-raised: rgb(35, 40, 50);
    --kit-color-text: rgb(240, 245, 250);
  }
</style>
