<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Separator } from "__UI_MODULE__";
  import type { SeparatorProps, SeparatorOrientation } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLDivElement | null>(null);
  let orientation = $state<SeparatorOrientation>("horizontal");
  let decorative = $state(false);
  let mounted = $state(true);
  let hidden = $state(false);
  let night = $state(false);
  let rtl = $state(false);
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  const caption = page.url.searchParams.get("label") ?? "Section boundary";
  const attrs: Pick<SeparatorProps, "title" | "data-caller"> = {
    title: "Source boundary",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Separator qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<p id="boundary-description">Application section boundary description</p>
<button
  onclick={() =>
    (orientation = orientation === "horizontal" ? "vertical" : "horizontal")}
  >Toggle orientation</button
>
<button onclick={() => (decorative = !decorative)}>Toggle decoration</button>
<button onclick={() => ref?.focus()}>Focus separator</button>
<button onclick={() => (mounted = !mounted)}>Toggle separator</button>
<button onclick={() => (hidden = !hidden)}>Toggle hiding</button>
<button onclick={() => (night = !night)}>Toggle theme</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>
<div id="theme" class:night dir={rtl ? "rtl" : "ltr"}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
    }}
    onreset={() => (resets += 1)}
  >
    <input type="hidden" name="native-field" value="preserved" />
    <div id="viewport">
      {#if mounted}
        <Separator
          id="main"
          bind:ref
          class={["caller", { retained: true }]}
          {...attrs}
          {orientation}
          {decorative}
          {hidden}
          tabindex={-1}
          aria-label={caption}
          aria-describedby="boundary-description"
          data-state="caller-owned"
          onclick={(event) => {
            event.preventDefault();
            clicks += 1;
          }}
          onkeydown={(event) => {
            if (event.key === "Enter" || event.key === " ") keys += 1;
          }}
        />
      {/if}
    </div>
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <div
    id="native-control"
    role="separator"
    aria-orientation={orientation}
    aria-label="Native boundary"
  ></div>
  <div id="styled-viewport">
    <Separator
      id="styled"
      orientation="vertical"
      aria-label="Caller boundary"
      style="background:rgb(80,90,100);block-size:48px;inline-size:3px"
    />
  </div>
  <Separator
    id="decorative"
    decorative
    orientation="vertical"
    aria-label="Decorative duplicate"
  />
  <Separator
    id="concealed"
    aria-hidden="true"
    aria-label="Caller concealed boundary"
  />
  <Separator
    id="until-found"
    hidden="until-found"
    aria-label="Searchable boundary"
  />
</div>

<style>
  #theme {
    width: 320px;
    background: white;
  }
  #viewport {
    width: 320px;
    height: 80px;
  }
  #styled-viewport {
    height: 64px;
  }
  #theme.night {
    background: rgb(25, 30, 40);
    --kit-color-border: rgb(140, 150, 170);
    --kit-border-width: 3px;
  }
</style>
