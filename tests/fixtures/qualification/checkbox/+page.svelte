<script lang="ts">
  import { page as routePage } from "$app/state";
  import { Checkbox as BitsCheckbox } from "bits-ui";
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { Checkbox } from "__UI_MODULE__";
  import type { CheckboxProps } from "__UI_MODULE__";

  let ready = $state(false);
  let checked = $state(routePage.url.searchParams.get("checked") === "true");
  let indeterminate = $state(
    routePage.url.searchParams.get("mixed") === "true",
  );
  let nativeReadonlyClicks = $state(0);
  let externalForm = $state("external-form");
  let mixedCallbacks = $state(0);
  let readonly = $state(false);
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
  const options: Pick<CheckboxProps, "name" | "value"> = {
    name: "enabled",
    value: "yes",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Checkbox qualification</h1>
<p data-ready={ready}>Hydrated: {String(ready)}</p>
<p id="state">{String(checked)}</p>
<p id="mixed-state">{String(indeterminate)}; callbacks {mixedCallbacks}</p>
<button
  onclick={() => {
    indeterminate = !indeterminate;
  }}>Toggle mixed</button
>
<button
  onclick={() => {
    readonly = !readonly;
  }}>Toggle readonly</button
>
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
  }}>Focus bound checkbox</button
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
  <Checkbox
    id="control"
    bind:checked
    bind:indeterminate
    bind:ref
    {readonly}
    onIndeterminateChange={() => {
      mixedCallbacks += 1;
    }}
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
  <Checkbox id="initial" checked aria-label="Initially enabled" />
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
  <Checkbox
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
<Checkbox
  id="external"
  form={externalForm}
  name="outside"
  value="yes"
  checked
  aria-label="External option"
/>
<form id="alternate-form"></form>
<button
  onclick={() => {
    externalForm = "alternate-form";
  }}>Reassociate external owner</button
>
<BitsCheckbox.Root
  id="native-readonly"
  form={externalForm}
  readonly
  checked
  aria-label="Native readonly"
  onclick={() => {
    nativeReadonlyClicks += 1;
  }}
/>
<p id="native-readonly-events">{nativeReadonlyClicks}</p>
<p id="external-submitted">{externalSubmitted}</p>

<button
  onclick={() => {
    mounted = true;
  }}>Remount checkbox</button
>
<p id="lifecycle-state">{String(lifecycleChecked)}</p>
<section
  onreset={() => {
    mounted = false;
  }}
>
  <form id="lifecycle-form">
    {#if mounted}
      <Checkbox
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
    --kit-radius-control: 4px;
  }
  form.customized {
    --kit-checkbox-radius: 8px / 5px;
    --kit-color-primary: rgb(4 5 6);
    --kit-color-selection-indicator: rgb(7 8 9);
  }
</style>
