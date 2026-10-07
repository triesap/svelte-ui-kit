<script lang="ts">
  import { onMount } from "svelte";
  import { SvelteURLSearchParams } from "svelte/reactivity";
  import { Button } from "__UI_MODULE__";
  import type { ButtonVariant, ButtonSize } from "__UI_MODULE__";

  let ready = $state(false);
  let clicks = $state(0);
  let submits = $state(0);
  let resets = $state(0);
  let submitted = $state("");
  let loading = $state(false);
  let disabled = $state(false);
  let loadingLabel = $state("Loading");
  let ref = $state<HTMLButtonElement | null>(null);
  let variant = $state<ButtonVariant>("primary");
  let size = $state<ButtonSize>("md");
  let customized = $state(false);
  const click = () => {
    clicks += 1;
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Button qualification</h1>
<p data-ready={ready}>Hydrated: {String(ready)}</p>
<p id="counts">Clicks {clicks}; submits {submits}; resets {resets}</p>
<p id="submitted">{submitted}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<button
  onclick={() => {
    loading = !loading;
  }}>Toggle loading</button
>
<button
  onclick={() => {
    disabled = !disabled;
  }}>Toggle disabled</button
>
<button
  onclick={() => {
    loadingLabel = "Saving changes";
  }}>Change loading label</button
>
<button
  onclick={() => {
    ref?.focus();
  }}>Focus bound button</button
>
<button
  onclick={() => {
    variant =
      variant === "primary"
        ? "secondary"
        : variant === "secondary"
          ? "ghost"
          : "primary";
  }}>Cycle variant</button
>
<button
  onclick={() => {
    size = size === "md" ? "sm" : size === "sm" ? "lg" : "md";
  }}>Cycle size</button
>
<button
  onclick={() => {
    customized = !customized;
  }}>Toggle customization</button
>
<form
  class:customized
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
  onreset={() => {
    resets += 1;
  }}
>
  <label>Draft <input name="draft" value="initial" /></label>
  <Button
    id="action"
    bind:ref
    {variant}
    {size}
    {loading}
    {disabled}
    {loadingLabel}
    class={["caller", { retained: true }]}
    data-caller="preserved"
    title="Native title"
    onclick={click}>Save draft</Button
  >
  <Button id="submit" type="submit" name="intent" value="save"
    >Submit draft</Button
  >
  <Button id="reset" type="reset">Reset draft</Button>
  <Button id="busy-default" loading>Hidden original</Button>
</form>

<style>
  form {
    font-size: 16px;
    --kit-radius-control: 9px;
  }
  form.customized {
    --kit-button-radius: 12px / 6px;
    --kit-button-spinner-size: 25px;
    --kit-color-primary: rgb(1 2 3);
    --kit-color-primary-hover: rgb(1 2 3);
    --kit-color-primary-foreground: rgb(250 251 252);
    --kit-button-focus-outline-width: 4px;
    --kit-button-focus-outline-offset: 5px;
  }
</style>
