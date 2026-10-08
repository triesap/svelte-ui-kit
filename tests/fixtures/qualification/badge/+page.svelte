<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Badge } from "__UI_MODULE__";
  import type { BadgeProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLSpanElement | null>(null);
  let mounted = $state(true);
  let hidden = $state(false);
  let caption = $state(page.url.searchParams.get("label") ?? "Queued");
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let night = $state(false);
  let rtl = $state(false);
  let radius = $state(0);
  const radii = [
    "",
    "--kit-radius-indicator:10px",
    "--kit-radius-default:6px",
    "--kit-radius-full:18px",
    "--kit-badge-radius:3px",
  ];
  const attrs: Pick<BadgeProps, "title" | "data-caller"> = {
    title: "Queue state",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Badge qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<button onclick={() => (caption = "Ready")}>Update label</button>
<button onclick={() => ref?.focus()}>Focus badge</button>
<button onclick={() => (mounted = !mounted)}>Toggle badge</button>
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
      <Badge
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
        }}><span id="label">{caption}</span></Badge
      >
    {/if}
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <Badge
    id="styled"
    aria-label="Caller status"
    style="border-radius:2px;color:rgb(120,20,40);background:rgb(250,240,230)"
    >Needs review</Badge
  >
  <Badge id="until-found" hidden="until-found"
    >Searchable native hidden text</Badge
  >
</div>

<style>
  #theme {
    font-family: monospace;
    font-size: 20px;
  }
  #theme.night {
    --kit-color-surface-hover: rgb(35, 40, 50);
    --kit-color-text: rgb(240, 245, 250);
  }
</style>
