<script lang="ts">
  import { onMount } from "svelte";
  import { RadioGroup, RadioItem } from "__UI_MODULE__";
  import type { RadioGroupProps, RadioItemProps } from "__UI_MODULE__";
  let ready = $state(false);
  let value = $state("a");
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
<form id="radio-form" class:customized dir={rtl ? "rtl" : "ltr"}>
  <RadioGroup
    id="radio-group"
    bind:value
    bind:ref
    {...options}
    aria-label="Choice set"
    class={["caller", { retained: true }]}
    onValueChange={() => {
      callbacks += 1;
    }}
  >
    <label for="radio-a">Choice A</label>
    <RadioItem id="radio-a" {...item} bind:ref={itemRef} />
    <label for="radio-b">Choice B</label>
    <RadioItem id="radio-b" value="b" />
    <label for="radio-disabled">Unavailable</label>
    <RadioItem id="radio-disabled" value="disabled" disabled />
  </RadioGroup>
  <button type="reset">Reset radio</button>
</form>

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
