<script lang="ts">
  import { flushSync, onMount } from "svelte";
  import { page } from "$app/state";
  import {
    Checkbox,
    Switch,
    RadioGroup,
    RadioItem,
    TextInput,
  } from "__UI_MODULE__";
  import type {
    CheckboxProps,
    SwitchProps,
    RadioGroupProps,
  } from "__UI_MODULE__";

  const checkboxProps: Pick<CheckboxProps, "id" | "name" | "aria-label"> = {
    id: "kit-checkbox",
    name: "kit-checkbox",
    "aria-label": "Kit checkbox",
  };
  const switchProps: Pick<SwitchProps, "id" | "name" | "aria-label"> = {
    id: "kit-switch",
    name: "kit-switch",
    "aria-label": "Kit switch",
  };
  const radioProps: Pick<RadioGroupProps, "id" | "name" | "aria-label"> = {
    id: "kit-radio",
    name: "kit-radio",
    "aria-label": "Kit radio",
  };
  const scenario = page.url.searchParams.get("scenario");
  const cancellation = page.url.searchParams.get("cancel");
  let ready = $state(false);
  let show = $state(true);
  let checked = $state(false);
  let switched = $state(false);
  let value = $state("alpha");
  let callbacks = $state({ checkbox: 0, switch: 0, radio: 0 });
  let owner = $state<HTMLFormElement | null>(null);
  const input = (selector: string) => {
    const field = document.querySelector(selector);
    if (!(field instanceof HTMLInputElement))
      throw new Error(`missing native field ${selector}`);
    return field;
  };
  function editedDom() {
    for (const selector of [
      "#plain-checkbox",
      "#plain-switch",
      ".kit-checkbox-input",
      ".kit-switch-input",
    ])
      input(selector).checked = true;
    input("#plain-alpha").checked = false;
    input("#plain-beta").checked = true;
    input(".kit-radio-input").value = "beta";
  }
  function beforeReset() {
    // Queued before the reset event's deferred callbacks, after native default.
    if (scenario === "late-edit") setTimeout(editedDom, 0);
    if (scenario === "late-destroy")
      setTimeout(() => flushSync(() => (show = false)), 0);
  }
  function reset(event: Event) {
    if (cancellation === "target") event.preventDefault();
    if (scenario === "reassociate" || scenario === "incoming") {
      for (const field of owner?.querySelectorAll("input") ?? [])
        field.setAttribute(
          "form",
          scenario === "incoming" ? "original" : "alternate",
        );
    } else if (scenario === "replace-owner") {
      const original = owner;
      if (!original) throw new Error("missing original form");
      original.id = "previous";
      const replacement = document.createElement("form");
      replacement.id = "original";
      original.after(replacement);
    } else if (scenario === "destroy") flushSync(() => (show = false));
  }
  function changeDefaults() {
    for (const selector of [
      "#plain-checkbox",
      "#plain-switch",
      ".kit-checkbox-input",
      ".kit-switch-input",
    ])
      input(selector).defaultChecked = true;
    input("#plain-alpha").defaultChecked = false;
    input("#plain-beta").defaultChecked = true;
    input(".kit-radio-input").defaultValue = "beta";
  }
  function resetTwice() {
    if (!owner) throw new Error("missing form");
    owner.reset();
    editedDom();
    owner.addEventListener("reset", (event) => event.preventDefault(), {
      once: true,
    });
    owner.reset();
  }
  onMount(() => {
    // RadioGroup intentionally exposes no invented form prop. Exercise the
    // actual field's standard DOM association alongside every native field.
    for (const field of owner?.querySelectorAll("input") ?? [])
      field.setAttribute(
        "form",
        scenario === "incoming" ? "alternate" : "original",
      );
    ready = true;
  });
</script>

<h1>Current native reset truth</h1>
<p data-ready={ready}>Hydrated</p>
<label for="note">Run note</label><TextInput
  id="note"
  value="Reset qualification"
  readonly
/>
<output id="kit-state"
  >{JSON.stringify({
    checkbox: checked,
    switch: switched,
    radio: value,
  })}</output
>
<output id="callbacks">{JSON.stringify(callbacks)}</output>
<button type="button" onclick={changeDefaults}>Change native defaults</button>
<button type="button" onclick={resetTwice}
  >Reset twice with a canceled second event</button
>
<button type="button" onclick={() => (show = true)}>Remount controls</button>
<form id="alternate"></form>
<div
  onreset={(event) => {
    if (cancellation === "bubble") event.preventDefault();
  }}
>
  <form
    id="original"
    bind:this={owner}
    onresetcapture={(event) => {
      if (cancellation === "capture") event.preventDefault();
    }}
    onreset={reset}
  >
    {#if show}
      <label
        ><input
          id="plain-checkbox"
          type="checkbox"
          name="plain-checkbox"
          value="yes"
        />Plain checkbox</label
      >
      <Checkbox
        {...checkboxProps}
        value="yes"
        bind:checked
        onCheckedChange={() => callbacks.checkbox++}
      />
      <label
        ><input
          id="plain-switch"
          type="checkbox"
          name="plain-switch"
          value="yes"
        />Plain switch checkbox</label
      >
      <Switch
        {...switchProps}
        value="yes"
        bind:checked={switched}
        onCheckedChange={() => callbacks.switch++}
      />
      <fieldset>
        <legend>Plain radio</legend>
        <label
          ><input
            id="plain-alpha"
            type="radio"
            name="plain-radio"
            value="alpha"
            checked
          />Plain Alpha</label
        >
        <label
          ><input
            id="plain-beta"
            type="radio"
            name="plain-radio"
            value="beta"
          />Plain Beta</label
        >
      </fieldset>
      <RadioGroup
        {...radioProps}
        bind:value
        onValueChange={() => callbacks.radio++}
      >
        <RadioItem value="alpha" aria-label="Kit Alpha" />
        <RadioItem value="beta" aria-label="Kit Beta" />
      </RadioGroup>
    {/if}
    <button type="reset" onclickcapture={beforeReset}>Native reset</button>
  </form>
</div>
