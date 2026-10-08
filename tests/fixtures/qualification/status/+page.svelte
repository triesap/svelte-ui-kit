<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Status } from "__UI_MODULE__";
  import type { StatusProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLParagraphElement | null>(null);
  let mounted = $state(true);
  let hidden = $state(false);
  let caption = $state(page.url.searchParams.get("label") ?? "Saved changes.");
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let night = $state(false);
  let rtl = $state(false);
  let urgent = $state(false);
  const attrs: Pick<StatusProps, "title" | "data-caller"> = {
    title: "Save state",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Status qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<button onclick={() => (caption = "Updated message.")}>Update label</button>
<button onclick={() => ref?.focus()}>Focus status</button>
<button onclick={() => (mounted = !mounted)}>Toggle status</button>
<button onclick={() => (hidden = !hidden)}>Toggle hiding</button>
<button onclick={() => (night = !night)}>Toggle theme</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>
<button onclick={() => (urgent = !urgent)}>Toggle source options</button>

<div id="theme" class:night dir={rtl ? "rtl" : "ltr"}>
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
      <Status
        id="main"
        bind:ref
        class={["caller", { retained: true }]}
        {...attrs}
        {hidden}
        tabindex={-1}
        role={urgent ? "alert" : "status"}
        politeness={urgent ? "assertive" : "polite"}
        atomic={!urgent}
        data-state="caller-owned"
        onclick={(event) => {
          event.preventDefault();
          clicks += 1;
        }}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ") keys += 1;
        }}
        ><span aria-hidden="true">Decorative duplicate</span>
        <span id="label">{caption}</span></Status
      >
    {/if}
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <Status id="empty"
    >{#if caption === "Updated message."}Later message{/if}</Status
  >
  <Status
    id="native-overrides"
    aria-live="off"
    aria-atomic="false"
    aria-relevant="removals">Caller native overrides</Status
  >
  <p id="native-control" role="status" aria-live="polite" aria-atomic="true">
    <span aria-hidden="true">Decorative duplicate</span>
    <span>Native control message</span>
  </p>
  <p
    id="native-off-control"
    role="status"
    aria-live="off"
    aria-atomic="false"
    aria-relevant="removals"
  >
    Native override control
  </p>
  <Status
    id="styled"
    aria-labelledby="named-heading"
    style="border-radius:2px;color:rgb(120,20,40);background:rgb(250,240,230)"
    ><span id="named-heading">Save feedback</span>
    <span>Needs review</span></Status
  >
  <Status id="decorative" aria-hidden="true"
    >Decorative feedback duplicate</Status
  >
  <Status id="until-found" hidden="until-found"
    >Searchable native hidden text</Status
  >
</div>

<style>
  #theme {
    background: white;
    font-family: monospace;
    font-size: 20px;
  }
  #theme.night {
    background: rgb(35, 40, 50);
    --kit-color-text: rgb(240, 245, 250);
  }
</style>
