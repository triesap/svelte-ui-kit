<script lang="ts">
  import { Switch as BitsSwitch } from "bits-ui";
  import { untrack } from "svelte";
  import type { SwitchProps } from "./switch.types.js";

  let {
    checked = $bindable(false),
    ref = $bindable(null),
    name,
    value = "on",
    disabled = false,
    required = false,
    form,
    class: className,
    ...rest
  }: SwitchProps = $props();
  const initialChecked = untrack(() => checked);
  let inputRef = $state<HTMLInputElement | null>(null);

  $effect(() => {
    // Track native form reassociation as well as insertion/removal of the field.
    void form;
    const owner = inputRef?.form;
    if (!owner) return;
    const pending: number[] = [];
    const reset = (event: Event) => {
      const timer = window.setTimeout(() => {
        pending.splice(pending.indexOf(timer), 1);
        if (!event.defaultPrevented) checked = initialChecked;
      }, 0);
      pending.push(timer);
    };
    owner.addEventListener("reset", reset);
    return () => {
      owner.removeEventListener("reset", reset);
      for (const timer of pending) window.clearTimeout(timer);
    };
  });
</script>

<BitsSwitch.Root
  {...rest}
  {disabled}
  {required}
  {form}
  bind:checked
  bind:ref
  class={["kit-switch", className]}
>
  <BitsSwitch.Thumb class="kit-switch-thumb" aria-hidden="true" />
</BitsSwitch.Root>

{#if name !== undefined}
  <input
    class="kit-switch-input"
    type="checkbox"
    {name}
    {value}
    {disabled}
    {required}
    {form}
    defaultChecked={initialChecked}
    {checked}
    onchange={(event) => {
      checked = event.currentTarget.checked;
    }}
    bind:this={inputRef}
    aria-hidden="true"
    tabindex="-1"
  />
{/if}
