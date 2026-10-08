<script lang="ts">
  import { RadioGroup as BitsRadioGroup } from "bits-ui";
  import { untrack } from "svelte";
  import type { RadioGroupProps } from "./types.js";
  let {
    value = $bindable(""),
    ref = $bindable(null),
    name,
    required = false,
    disabled = false,
    class: className,
    ...rest
  }: RadioGroupProps = $props();
  const initialValue = untrack(() => value);
  let inputRef = $state<HTMLInputElement | null>(null);
  $effect(() => {
    const input = inputRef;
    if (!input) return;
    const tree = input.getRootNode();
    const pending: number[] = [];
    const reset = (event: Event) => {
      if (event.target !== input.form) return;
      const timer = window.setTimeout(() => {
        pending.splice(pending.indexOf(timer), 1);
        if (!event.defaultPrevented) value = initialValue;
      }, 0);
      pending.push(timer);
    };
    tree.addEventListener("reset", reset, true);
    return () => {
      tree.removeEventListener("reset", reset, true);
      for (const timer of pending) window.clearTimeout(timer);
    };
  });
</script>

<BitsRadioGroup.Root
  {...rest}
  {required}
  {disabled}
  bind:value
  bind:ref
  class={["kit-radio-group", className]}
/>
{#if name !== undefined}
  <input
    class="kit-radio-input"
    type="text"
    {name}
    {required}
    {disabled}
    defaultValue={initialValue}
    {value}
    bind:this={inputRef}
    oninput={(event) => {
      value = event.currentTarget.value;
    }}
    onfocus={() => {
      ref
        ?.querySelector<HTMLElement>(
          '[data-radio-group-item][tabindex="0"]:not([disabled])',
        )
        ?.focus();
    }}
    aria-hidden="true"
    tabindex="-1"
  />
{/if}
