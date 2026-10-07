<script lang="ts">
  import { onMount } from "svelte";
  import { Spinner } from "__UI_MODULE__";
  import type { SpinnerProps } from "__UI_MODULE__";

  let ready = $state(false);
  let decorative = $state(false);
  let danger = $state(false);
  let label = $state("Working");
  let dynamic = $derived<SpinnerProps>(
    decorative ? { mode: "decorative" } : { mode: "status", label },
  );
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Spinner qualification</h1>
<p data-ready={ready}>Hydrated: {String(ready)}</p>
<button
  onclick={() => {
    label = "Complete";
  }}>Change label</button
>
<button
  onclick={() => {
    decorative = !decorative;
  }}>Toggle decoration</button
>
<button
  onclick={() => {
    danger = !danger;
  }}>Toggle theme</button
>
<section class:danger>
  <Spinner
    id="default"
    class={["caller", { retained: true }]}
    data-caller="preserved"
  />
  <Spinner id="named" label="Saving" />
  <Spinner id="decorative" mode="decorative" />
  <Spinner id="dynamic" {...dynamic} />
  <div class="override"><Spinner id="override" label="Overridden" /></div>
</section>

<style>
  section {
    font-size: 16px;
    color: var(--kit-color-accent);
    --kit-radius-default: 2px;
    --kit-radius-control: 2px;
    --kit-radius-surface: 2px;
  }
  section.danger {
    color: var(--kit-color-danger);
  }
  .override {
    --kit-spinner-inline-size: 32px;
    --kit-spinner-block-size: 24px;
    --kit-spinner-border-width: 3px;
    --kit-spinner-track-color: rgb(1 2 3);
    --kit-spinner-color: rgb(4 5 6);
    --kit-spinner-radius: 8px / 12px;
    --kit-spinner-animation-duration: 1500ms;
  }
</style>
