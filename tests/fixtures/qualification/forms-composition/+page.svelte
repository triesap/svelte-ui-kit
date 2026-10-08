<script lang="ts">
  import { onMount } from "svelte";
  import {
    Button,
    TextField,
    Checkbox,
    RadioGroup,
    RadioItem,
    Switch,
  } from "__UI_MODULE__";
  import type { TextFieldProps } from "__UI_MODULE__";
  let ready = $state(false);
  let title = $state<TextFieldProps["value"]>("initial");
  let nativeTitle = $state("initial");
  let resetEvent = $state({ cancelable: false, prevented: false });
  let formRef = $state<HTMLFormElement | null>(null);
  let nativeFormRef = $state<HTMLFormElement | null>(null);
  let accepted = $state(true);
  let indeterminate = $state(false);
  let mode = $state("a");
  let enabled = $state(true);
  let outside = $state(true);
  let disabled = $state(false);
  let required = $state(false);
  let loading = $state(false);
  let buttonDisabled = $state(false);
  let cancelReset = $state(false);
  let submits = $state(0);
  let resets = $state(0);
  let clicks = $state(0);
  let submitted = $state<[string, string | File][]>([]);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Combined native form qualification</h1>
  <button id="programmatic-reset" onclick={() => formRef?.reset()}
    >Reset through native form API</button
  >
  <button id="native-programmatic-reset" onclick={() => nativeFormRef?.reset()}
    >Reset native control through form API</button
  >
  <button
    id="toggle-disabled"
    onclick={() => {
      disabled = !disabled;
    }}>Toggle disabled controls</button
  >
  <button
    id="toggle-required"
    onclick={() => {
      required = !required;
    }}>Toggle required controls</button
  >
  <button
    id="toggle-loading"
    onclick={() => {
      loading = !loading;
    }}>Toggle loading</button
  >
  <button
    id="toggle-button-disabled"
    onclick={() => {
      buttonDisabled = !buttonDisabled;
    }}>Toggle disabled button</button
  >
  <button
    id="toggle-cancel-reset"
    onclick={() => {
      cancelReset = !cancelReset;
    }}>Toggle reset cancellation</button
  >
  <button
    id="toggle-indeterminate"
    onclick={() => {
      indeterminate = !indeterminate;
    }}>Toggle indeterminate</button
  >
  <button
    id="clear-mode"
    onclick={() => {
      mode = "";
    }}>Clear radio</button
  >
  <output id="state"
    >{JSON.stringify({
      title,
      accepted,
      indeterminate,
      mode,
      enabled,
      outside,
      disabled,
      required,
      loading,
      buttonDisabled,
      cancelReset,
      submits,
      resets,
      clicks,
    })}</output
  >
  <output id="submitted">{JSON.stringify(submitted)}</output>
  <form
    id="combined-form"
    bind:this={formRef}
    onsubmit={(event) => {
      event.preventDefault();
      submits++;
      submitted = Array.from(
        new FormData(event.currentTarget, event.submitter),
      );
    }}
    onreset={(event) => {
      resets++;
      if (cancelReset) event.preventDefault();
      resetEvent = {
        cancelable: event.cancelable,
        prevented: event.defaultPrevented,
      };
    }}
  >
    <TextField
      id="title-field"
      label="Title"
      name="title"
      message="Title hint"
      defaultValue="initial"
      {required}
      {disabled}
      bind:value={title}
    />
    <label for="accepted">Accept terms</label><Checkbox
      id="accepted"
      name="accepted"
      value="yes"
      {required}
      {disabled}
      bind:checked={accepted}
      bind:indeterminate
    />
    <RadioGroup
      name="mode"
      aria-label="Mode"
      {required}
      {disabled}
      bind:value={mode}
    >
      <RadioItem value="a" aria-label="Mode A" /><RadioItem
        value="b"
        aria-label="Mode B"
      />
    </RadioGroup>
    <label for="enabled">Enable notifications</label><Switch
      id="enabled"
      name="enabled"
      value="on"
      {required}
      {disabled}
      bind:checked={enabled}
    />
    <Button
      id="save"
      type="submit"
      name="action"
      value="save"
      {loading}
      disabled={buttonDisabled}
      loadingLabel="Saving combined">Save combined</Button
    >
    <Button id="reset-combined" type="reset">Reset combined</Button>
    <Button
      id="plain"
      onclick={() => {
        clicks++;
      }}>Plain action</Button
    >
  </form>
  <label for="outside">External consent</label><Checkbox
    id="outside"
    name="outside"
    value="yes"
    form="combined-form"
    {disabled}
    bind:checked={outside}
  />
  <output id="reset-event">{JSON.stringify(resetEvent)}</output>
  <form
    id="native-form"
    bind:this={nativeFormRef}
    onreset={(event) => {
      if (cancelReset) event.preventDefault();
    }}
  >
    <input
      aria-label="Raw native title"
      defaultValue="initial"
      bind:value={nativeTitle}
    />
    <button type="reset" id="native-reset">Reset raw native</button>
  </form>
</main>
