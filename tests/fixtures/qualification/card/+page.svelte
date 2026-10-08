<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Card } from "__UI_MODULE__";
  import type { CardProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLElement | null>(null);
  let innerRef = $state<HTMLElement | null>(null);
  let mounted = $state(true);
  let hidden = $state(false);
  let cancel = $state(false);
  let caption = $state(
    page.url.searchParams.get("label") ?? "Application content",
  );
  let actions = $state(0);
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let night = $state(false);
  let rtl = $state(false);
  let radius = $state(0);
  const radii = [
    "",
    "--kit-radius-surface:12px",
    "--kit-radius-default:6px",
    "--kit-radius-lg:10px",
    "--kit-card-radius:3px",
  ];
  const attrs: Pick<CardProps, "title" | "data-caller"> = {
    title: "Section description",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Card qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">
  Outer {ref?.tagName ?? "none"}; inner {innerRef?.tagName ?? "none"}
</p>
<p id="counts">
  Actions {actions}; clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<button onclick={() => (caption = "Updated content")}>Update content</button>
<button onclick={() => ref?.focus()}>Focus card</button>
<button onclick={() => (mounted = !mounted)}>Toggle cards</button>
<button onclick={() => (hidden = !hidden)}>Toggle hiding</button>
<button onclick={() => (cancel = !cancel)}>Toggle cancellation</button>
<button onclick={() => (night = !night)}>Toggle theme</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>
<button onclick={() => (radius = (radius + 1) % radii.length)}
  >Next radius</button
>

<div id="theme" class:night dir={rtl ? "rtl" : "ltr"} style={radii[radius]}>
  {#if mounted}
    <Card
      id="outer"
      class={["caller", { retained: true }]}
      {...attrs}
      bind:ref
      aria-labelledby="outer-heading"
      tabindex={-1}
      {hidden}
      data-state="caller-owned"
      onclick={(event) => {
        clicks += 1;
        if (cancel) event.preventDefault();
      }}
      onkeydown={(event) => {
        if (event.key === "Enter" || event.key === " ") keys += 1;
      }}
    >
      <header>
        <h2 id="outer-heading">Outer section</h2>
        <p>Application description</p>
      </header>
      <p id="content">{caption}</p>
      <Card
        id="inner"
        class="nested"
        bind:ref={innerRef}
        aria-labelledby="inner-heading"
        style="--kit-card-radius:4px;--kit-color-surface-raised:rgb(230,240,250);--kit-color-border:rgb(80,90,100);--kit-shadow-sm:none;--kit-border-width:2px;--kit-color-text:rgb(20,30,40)"
      >
        <h3 id="inner-heading">Inner section</h3>
        <p>Nested application content</p>
        <button type="button" onclick={() => (actions += 1)}
          >Native child action</button
        >
      </Card>
      <form
        onsubmit={(event) => {
          event.preventDefault();
          submits += 1;
        }}
        onreset={() => (resets += 1)}
      >
        <input
          aria-label="Native editable field"
          name="answer"
          value="initial"
        />
        <button type="submit">Submit native form</button>
        <button type="reset">Reset native form</button>
      </form>
      <footer>Application footer</footer>
    </Card>
  {/if}
  <Card id="unnamed">Ordinary native section</Card>
</div>

<style>
  #theme.night {
    --kit-color-surface-raised: rgb(30, 40, 50);
    --kit-color-text: rgb(240, 245, 250);
    --kit-color-border: rgb(80, 90, 110);
    --kit-border-width: 3px;
    --kit-shadow-sm: 0 4px 8px rgb(10 20 30 / 20%);
  }
</style>
