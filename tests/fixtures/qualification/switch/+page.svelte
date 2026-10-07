<script lang="ts">
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { Switch } from "__UI_MODULE__";
  import type { SwitchProps } from "__UI_MODULE__";

  let ready = $state(false);
  let checked = $state(false);
  let ref = $state<HTMLElement | null>(null);
  let disabled = $state(false);
  let required = $state(false);
  let callbacks = $state(0);
  let clicks = $state(0);
  let lastCallback = $state(false);
  let cancel = $state(false);
  let rtl = $state(false);
  let customized = $state(false);
  let submitted = $state("not submitted");
  let submits = $state(0);
  let seedChecked = $state(true);
  let cancelReset = $state(false);
  let resetPrevented = $state(false);
  let externalSubmitted = $state("not submitted");
  let mounted = $state(true);
  let lifecycleChecked = $state(false);
  const options: Pick<SwitchProps, "name" | "value"> = {
    name: "enabled",
    value: "yes",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Switch qualification</h1>
<p data-ready={ready}>Hydrated: {String(ready)}</p>
<p id="state">{String(checked)}</p>
<p id="events">
  Callbacks {callbacks}; clicks {clicks}; last {String(lastCallback)}
</p>
<p id="ref">{ref?.tagName ?? "none"}</p>
<p id="submits">{submits}</p>
<p id="submitted">{submitted}</p>
<button
  onclick={() => {
    checked = !checked;
  }}>Set state</button
>
<button
  onclick={() => {
    disabled = !disabled;
  }}>Toggle disabled</button
>
<button
  onclick={() => {
    required = !required;
  }}>Toggle required</button
>
<button
  onclick={() => {
    cancel = !cancel;
  }}>Toggle cancellation</button
>
<button
  onclick={() => {
    ref?.focus();
  }}>Focus bound switch</button
>
<button
  onclick={() => {
    rtl = !rtl;
  }}>Toggle direction</button
>
<button
  onclick={() => {
    customized = !customized;
  }}>Toggle theme</button
>
<form
  id="main-form"
  class:customized
  dir={rtl ? "rtl" : "ltr"}
  onsubmit={(event) => {
    event.preventDefault();
    submits += 1;
    const values = new SvelteURLSearchParams();
    for (const [name, value] of new FormData(
      event.currentTarget,
      event.submitter,
    ))
      values.append(name, typeof value === "string" ? value : value.name);
    submitted = values.toString();
  }}
>
  <label for="control">Enable feature</label>
  <Switch
    id="control"
    bind:checked
    bind:ref
    {disabled}
    {required}
    {...options}
    class={["caller", { retained: true }]}
    data-caller="preserved"
    onclick={(event) => {
      clicks += 1;
      if (cancel) event.preventDefault();
    }}
    onCheckedChange={(value) => {
      callbacks += 1;
      lastCallback = value;
    }}
  />
  <Switch id="initial" checked aria-label="Initially enabled" />
  <button type="submit">Submit state</button>
  <button type="reset">Reset state</button>
</form>

<button
  onclick={() => {
    cancelReset = !cancelReset;
  }}>Toggle reset cancellation</button
>
<form
  id="seed-form"
  onreset={(event) => {
    if (cancelReset) event.preventDefault();
    resetPrevented = event.defaultPrevented;
  }}
>
  <Switch
    id="seed"
    bind:checked={seedChecked}
    name="seed"
    aria-label="Reset seed"
  />
  <p id="seed-state">{String(seedChecked)}</p>
  <p id="cancel-state">{String(cancelReset)}</p>
  <p id="reset-prevented">{String(resetPrevented)}</p>
  <button type="reset">Restore seed</button>
</form>
<form
  id="external-form"
  onsubmit={(event) => {
    event.preventDefault();
    const values = new SvelteURLSearchParams();
    for (const [name, value] of new FormData(event.currentTarget))
      values.append(name, typeof value === "string" ? value : value.name);
    externalSubmitted = values.toString();
  }}
>
  <button type="submit">Submit external</button>
</form>
<Switch
  id="external"
  form="external-form"
  name="outside"
  value="yes"
  checked
  aria-label="External option"
/>
<p id="external-submitted">{externalSubmitted}</p>

<button
  onclick={() => {
    mounted = true;
  }}>Remount switch</button
>
<p id="lifecycle-state">{String(lifecycleChecked)}</p>
<section
  onreset={() => {
    mounted = false;
  }}
>
  <form id="lifecycle-form">
    {#if mounted}
      <Switch
        id="lifecycle"
        bind:checked={lifecycleChecked}
        name="lifecycle"
        aria-label="Lifecycle control"
      />
    {/if}
    <button type="reset">Reset and remove</button>
  </form>
</section>

<style>
  form {
    --kit-radius-default: 3px;
    --kit-radius-indicator: 4px;
  }
  form.customized {
    --kit-switch-radius: 8px / 5px;
    --kit-switch-thumb-radius: 2px;
    --kit-switch-track-background-unchecked: rgb(1 2 3);
    --kit-switch-track-background-checked: rgb(4 5 6);
    --kit-switch-thumb-background: rgb(7 8 9);
    --kit-switch-transition-duration: 300ms;
    --kit-switch-transition-timing: linear;
  }
</style>
