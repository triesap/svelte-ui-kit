<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Skeleton } from "__UI_MODULE__";
  import type { SkeletonProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLSpanElement | null>(null);
  let loading = $state(true);
  let mounted = $state(true);
  let hidden = $state(false);
  let night = $state(false);
  let rtl = $state(false);
  let radius = $state(0);
  let clicks = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  const caption = page.url.searchParams.get("label") ?? "Profile";
  const radii = [
    "",
    "--kit-radius-surface:8px",
    "--kit-radius-default:6px",
    "--kit-radius-sm:12px",
    "--kit-skeleton-radius:3px",
    "--kit-skeleton-radius:50% / 25%",
  ];
  const attrs: Pick<SkeletonProps, "title" | "data-caller"> = {
    title: "Decorative placeholder",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Skeleton qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">Clicks {clicks}; submits {submits}; resets {resets}</p>
<button onclick={() => (loading = !loading)}>Toggle loading</button>
<button onclick={() => (mounted = !mounted)}>Toggle skeleton</button>
<button onclick={() => (hidden = !hidden)}>Toggle hiding</button>
<button onclick={() => ref?.focus()}>Attempt native focus</button>
<button onclick={() => (night = !night)}>Toggle theme</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>
<button onclick={() => (radius = (radius + 1) % radii.length)}
  >Next radius</button
>
<p id="loading-status" role="status">
  {loading ? "Loading profile" : "Profile ready"}
</p>
<div id="theme" class:night dir={rtl ? "rtl" : "ltr"} style={radii[radius]}>
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
    }}
    onreset={() => (resets += 1)}
  >
    <input type="hidden" name="native-field" value="preserved" />
    <section id="region" aria-label={caption} aria-busy={loading}>
      {#if loading}
        {#if mounted}<Skeleton
            id="main"
            bind:ref
            {...attrs}
            class={["caller", { retained: true }]}
            {hidden}
            aria-label="Loading profile"
            data-state="caller-owned"
            onclick={(event) => {
              event.preventDefault();
              clicks += 1;
            }}
          />{/if}
      {:else}
        <p id="content">Loaded profile content</p>
      {/if}
    </section>
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <Skeleton
    id="styled"
    aria-label="Concealed duplicate"
    style="width:80px;height:24px;border-radius:50%;background:rgb(140,150,170)"
  />
  <Skeleton id="small" style="height:8px" />
  <Skeleton id="until-found" hidden="until-found" />
  <span
    id="native-control"
    aria-hidden="true"
    aria-label="Concealed native duplicate"
  ></span>
</div>

<style>
  #theme {
    width: 320px;
    background: white;
  }
  #theme.night {
    background: rgb(25, 30, 40);
    --kit-color-surface-hover: rgb(50, 60, 75);
  }
</style>
