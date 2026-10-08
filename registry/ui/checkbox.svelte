<script lang="ts">
  import { Checkbox as BitsCheckbox } from "bits-ui";
  import { untrack } from "svelte";
  import type { CheckboxProps } from "./checkbox.types.js";

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    ref = $bindable(null),
    name,
    value = "on",
    disabled = false,
    required = false,
    readonly,
    form,
    class: className,
    ...rest
  }: CheckboxProps = $props();
  const initialChecked = untrack(() => checked);
  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    if (inputRef) inputRef.indeterminate = indeterminate;
  });
  $effect(() => {
    const input = inputRef;
    if (!input) return;
    const tree = input.getRootNode();
    const pending: number[] = [];
    const reset = (event: Event) => {
      if (event.target !== input.form) return;
      const timer = window.setTimeout(() => {
        pending.splice(pending.indexOf(timer), 1);
        // Native reset restores checked and preserves current indeterminate.
        if (!event.defaultPrevented) checked = initialChecked;
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

<span class="kit-checkbox-root">
  <BitsCheckbox.Root
    {...rest}
    {disabled}
    {required}
    {readonly}
    {form}
    bind:checked
    bind:indeterminate
    bind:ref
    class={["kit-checkbox", className]}
  />
  <svg
    class="kit-checkbox-indicator"
    viewBox="0 0 16 16"
    aria-hidden="true"
    focusable="false"
  >
    {#if indeterminate}
      <path d="M3.25 8 12.75 8" />
    {:else}
      <path d="M3.25 8.25 6.5 11.5 12.75 4.75" />
    {/if}
  </svg>
</span>

{#if name !== undefined}
  <input
    class="kit-checkbox-input"
    type="checkbox"
    {name}
    {value}
    {disabled}
    {required}
    {readonly}
    {form}
    defaultChecked={initialChecked}
    {checked}
    onchange={(event) => {
      checked = event.currentTarget.checked;
      indeterminate = event.currentTarget.indeterminate;
    }}
    onfocus={() => ref?.focus()}
    bind:this={inputRef}
    aria-hidden="true"
    tabindex="-1"
  />
{/if}
