<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Progress } from "__UI_MODULE__";
  import type { ProgressProps } from "__UI_MODULE__";
  let ready = $state(false);
  let ref = $state<HTMLProgressElement | null>(null);
  let mounted = $state(page.url.searchParams.get("mounted") !== "0");
  let hidden = $state(false);
  let night = $state(false);
  let rtl = $state(false);
  let index = $state(0);
  let radius = $state(0);
  let clicks = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  const queryValue = page.url.searchParams.get("value");
  const queryMax = page.url.searchParams.get("max");
  const states: Pick<ProgressProps, "value" | "max">[] = [
    {
      value:
        queryValue === "null"
          ? null
          : queryValue === "undefined"
            ? undefined
            : Number(queryValue ?? 25),
      max: page.url.searchParams.has("max")
        ? queryMax === "null"
          ? null
          : Number(queryMax)
        : undefined,
    },
    { value: 0 },
    { value: 75, max: 80 },
    { value: -10 },
    { value: 200 },
    { value: 25, max: 0 },
    { value: 25, max: -1 },
    { value: 2, max: 0.5 },
    {},
    { value: null, max: null },
    { value: NaN },
    { value: Infinity },
  ];
  const current = $derived(states[index]!);
  const caption = page.url.searchParams.get("label") ?? "Upload";
  const radii = [
    "",
    "--kit-radius-indicator:10px",
    "--kit-radius-default:6px",
    "--kit-radius-full:18px",
    "--kit-progress-radius:3px",
  ];
  const attrs: Pick<ProgressProps, "title" | "data-caller"> = {
    title: "Transfer progress",
    "data-caller": "preserved",
  };
  onMount(() => {
    ready = true;
  });
  function nativeControl(
    node: HTMLProgressElement,
    attrs: Pick<ProgressProps, "value" | "max">,
  ) {
    const update = (attrs: Pick<ProgressProps, "value" | "max">) => {
      if (attrs.value == null) node.removeAttribute("value");
      else node.setAttribute("value", String(attrs.value));
      if (attrs.max === null) node.removeAttribute("max");
      else node.setAttribute("max", String(attrs.max ?? 100));
    };
    update(attrs);
    return { update };
  }
</script>

<h1>Generated Progress qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">
  Clicks {clicks}; keys {keys}; submits {submits}; resets {resets}
</p>
<button onclick={() => (index = (index + 1) % states.length)}
  >Next bounds</button
>
<button onclick={() => ref?.focus()}>Focus progress</button>
<button onclick={() => (mounted = !mounted)}>Toggle progress</button>
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
    onreset={() => (resets += 1)}
  >
    <label for="main" id="task-label">{caption}</label>
    <input type="hidden" name="native-field" value="preserved" />
    {#if mounted}
      <Progress
        id="main"
        bind:ref
        class={["caller", { retained: true }]}
        {...attrs}
        value={current.value}
        max={current.max}
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
      />
    {/if}
    <button type="submit">Submit native form</button>
    <button type="reset">Reset native form</button>
  </form>
  <progress
    id="native-control"
    aria-label="Native control"
    use:nativeControl={current}
  ></progress>
  <progress
    id="native-value-text"
    value="25"
    max="100"
    aria-label="Native value text"
    aria-valuetext="One quarter copied"
  ></progress>
  <span id="styled-label">Download</span>
  <Progress
    id="styled"
    aria-labelledby="styled-label"
    aria-valuetext="One quarter copied"
    value={25}
    style="inline-size:160px;block-size:12px;border-radius:2px;--kit-color-primary:rgb(120,20,40);accent-color:rgb(120,20,40);background:rgb(250,240,230)"
  />
  <Progress id="aria-named" aria-label="Preparation" />
  <Progress
    id="until-found"
    hidden="until-found"
    aria-label="Searchable progress"
  />
</div>

<style>
  #theme {
    width: 320px;
  }
  #theme.night {
    --kit-color-surface-hover: rgb(35, 40, 50);
    --kit-color-primary: rgb(240, 245, 250);
  }
</style>
