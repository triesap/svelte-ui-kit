<script lang="ts">
  import { page as routePage } from "$app/state";
  import { RadioGroup as BitsRadioGroup } from "bits-ui";
  import { onMount } from "svelte";
  import { RadioGroup, RadioItem } from "__UI_MODULE__";
  import type { RadioGroupProps, RadioItemProps } from "__UI_MODULE__";
  let ready = $state(false);
  let value = $state(routePage.url.searchParams.get("value") ?? "a");
  let readonly = $state(false);
  let disabled = $state(false);
  let orientation = $state<RadioGroupProps["orientation"]>("vertical");
  let loop = $state(true);
  let showC = $state(true);
  let cancel = $state(false);
  let clicks = $state(0);
  let cancelReset = $state(false);
  let submitted = $state("not submitted");
  let submits = $state(0);
  let mounted = $state(true);
  let lifeValue = $state("a");
  let rawEmptyValue = $state("");
  let callbacks = $state(0);
  let ref = $state<HTMLElement | null>(null);
  let itemRef = $state<HTMLElement | null>(null);
  let customized = $state(false);
  let rtl = $state(false);
  const options: Pick<RadioGroupProps, "name" | "required"> = {
    name: "choice",
    required: true,
  };
  const item: Pick<RadioItemProps, "value"> = { value: "a" };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Installed Radio qualification</h1>
<p data-ready={ready}>Hydrated</p>
<p id="value">{value}; callbacks {callbacks}</p>
<p id="clicks">{clicks}</p>
<p id="submitted">{submitted}</p>
<p id="submits">{submits}</p>
<button
  onclick={() => {
    value = "";
  }}>Clear radio value</button
>
<button
  onclick={() => {
    value = "b";
  }}>Set radio B</button
>
<button
  onclick={() => {
    readonly = !readonly;
  }}>Toggle radio readonly</button
>
<button
  onclick={() => {
    disabled = !disabled;
  }}>Toggle radio group disabled</button
>
<button
  onclick={() => {
    orientation = orientation === "vertical" ? "horizontal" : "vertical";
  }}>Toggle radio orientation</button
>
<button
  onclick={() => {
    loop = !loop;
  }}>Toggle radio loop</button
>
<button
  onclick={() => {
    showC = !showC;
  }}>Toggle radio C</button
>
<button
  onclick={() => {
    cancel = !cancel;
  }}>Toggle radio cancellation</button
>
<button
  onclick={() => {
    cancelReset = !cancelReset;
  }}>Toggle radio reset cancellation</button
>
<button
  onclick={() => {
    itemRef?.focus();
  }}>Focus radio ref</button
>
<p id="refs">{ref?.tagName ?? "none"};{itemRef?.tagName ?? "none"}</p>
<button
  onclick={() => {
    customized = !customized;
  }}>Toggle radio theme</button
>
<button
  onclick={() => {
    rtl = !rtl;
  }}>Toggle radio direction</button
>
<form
  id="radio-form"
  class:customized
  dir={rtl ? "rtl" : "ltr"}
  onreset={(event) => {
    if (cancelReset) event.preventDefault();
  }}
  onsubmit={(event) => {
    event.preventDefault();
    submits += 1;
    submitted = new URLSearchParams(
      [...new FormData(event.currentTarget)].map(([key, value]) => [
        key,
        typeof value === "string" ? value : value.name,
      ]),
    ).toString();
  }}
>
  <fieldset>
    <legend id="radio-legend">Choice set</legend>
    <RadioGroup
      id="radio-group"
      bind:value
      bind:ref
      {...options}
      aria-labelledby="radio-legend"
      {readonly}
      {disabled}
      {orientation}
      {loop}
      class={["caller", { retained: true }]}
      onValueChange={() => {
        callbacks += 1;
      }}
    >
      <label for="radio-a">Choice A</label>
      <RadioItem
        id="radio-a"
        {...item}
        bind:ref={itemRef}
        onclick={(event) => {
          clicks += 1;
          if (cancel) event.preventDefault();
        }}
      />
      <label for="radio-b">Choice B</label>
      <RadioItem id="radio-b" value="b" />
      <label for="radio-disabled">Unavailable</label>
      <RadioItem id="radio-disabled" value="disabled" disabled />
      {#if showC}<label for="radio-c">Choice C</label><RadioItem
          id="radio-c"
          value="c"
        />{/if}
    </RadioGroup>
  </fieldset>
  <button type="submit">Submit radio</button>
  <button type="reset">Reset radio</button>
</form>

<RadioGroup id="unnamed-group" value="a" aria-label="Unnamed choices"
  ><RadioItem value="a" aria-label="Unnamed A" /></RadioGroup
>
<BitsRadioGroup.Root
  bind:value={rawEmptyValue}
  aria-label="Native empty choices"
  ><BitsRadioGroup.Item
    id="native-empty-a"
    value="a"
    aria-label="Native empty A"
  /><BitsRadioGroup.Item
    id="native-empty-b"
    value="b"
    aria-label="Native empty B"
  /></BitsRadioGroup.Root
>
<p id="native-empty-value">{rawEmptyValue}</p>
<button
  onclick={() => {
    mounted = true;
  }}>Remount radio</button
>
<p id="life-value">{lifeValue}</p>
<section
  onreset={() => {
    mounted = false;
  }}
>
  <form id="life-form">
    {#if mounted}<RadioGroup
        id="life-group"
        bind:value={lifeValue}
        name="life"
        aria-label="Lifecycle choices"
        ><RadioItem id="life-a" value="a" aria-label="Life A" /><RadioItem
          id="life-b"
          value="b"
          aria-label="Life B"
        /></RadioGroup
      >{/if}
    <button type="reset">Reset and remove radio</button>
  </form>
</section>

<style>
  form {
    --kit-radius-default: 3px;
    --kit-radius-control: 4px;
  }
  form.customized {
    --kit-radio-radius: 8px / 5px;
    --kit-color-primary: rgb(4 5 6);
    --kit-color-selection-indicator: rgb(7 8 9);
  }
</style>
