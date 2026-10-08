<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import {
    Checkbox,
    Switch,
    RadioGroup,
    RadioItem,
    FieldRoot,
    FieldSurface,
    FieldLabel,
    FieldMessage,
    FieldRequired,
    TextInput,
    TextArea,
    NativeSelect,
    SelectIcon,
    TextField,
    TextAreaField,
    SelectField,
  } from "__UI_MODULE__";
  import type { FieldRootProps, FieldSlot, TextInputType } from "__UI_MODULE__";
  let ready = $state(false);
  let customized = $state(false);
  let rtl = $state(false);
  let invalid = $state(page.url.searchParams.get("invalid") === "true");
  let disabled = $state(false);
  let required = $state(true);
  let showHelper = $state(page.url.searchParams.get("helper") !== "false");
  let mounted = $state(true);
  let cancelReset = $state(false);
  let movedOwner = $state(false);
  let submitted = $state("none");
  let resetEvents = $state(0);
  let submits = $state(0);
  let checked = $state(true);
  let switched = $state(true);
  let radio = $state("a");
  let checkboxRef = $state<HTMLElement | null>(null);
  let switchRef = $state<HTMLElement | null>(null);
  let radioRef = $state<HTMLElement | null>(null);
  let formRef = $state<HTMLFormElement | null>(null);
  let rawText = $state(
    page.url.searchParams.get("value") ?? "initial@example.test",
  );
  let rawArea = $state("Initial body");
  let rawChoice = $state("a");
  let overrideId = $state("actual-override");
  let text = $state(
    page.url.searchParams.get("value") ?? "initial@example.test",
  );
  let area = $state("Initial body");
  let choice = $state("a");
  let inputEvents = $state(0);
  let changeEvents = $state(0);
  let rootRef = $state<HTMLDivElement | null>(null);
  let surfaceRef = $state<HTMLDivElement | null>(null);
  let labelRef = $state<HTMLLabelElement | null>(null);
  let inputRef = $state<HTMLInputElement | null>(null);
  let areaRef = $state<HTMLTextAreaElement | null>(null);
  let selectRef = $state<HTMLSelectElement | null>(null);
  let markerRef = $state<HTMLSpanElement | null>(null);
  let iconRef = $state<HTMLSpanElement | null>(null);
  let messageRef = $state<HTMLParagraphElement | null>(null);
  let convenienceInput = $state<HTMLInputElement | null>(null);
  let convenienceArea = $state<HTMLTextAreaElement | null>(null);
  let convenienceSelect = $state<HTMLSelectElement | null>(null);
  const inputType: TextInputType = "email";
  const labelAction: FieldSlot = action;
  const helpMessage = $state<NonNullable<FieldRootProps["messages"]>[number]>({
    key: "help",
    children: helper,
    ref: null,
  });
  const messages = $derived<NonNullable<FieldRootProps["messages"]>>([
    ...(showHelper ? [helpMessage] : []),
    ...(invalid ? [{ key: "error", children: error, role: "alert" }] : []),
  ]);
  onMount(() => {
    ready = true;
  });
</script>

{#snippet helper()}Shared helper{/snippet}
{#snippet error()}Current error{/snippet}
{#snippet action()}<button type="button">Label action</button>{/snippet}
{#snippet icon()}⌄{/snippet}
<main class:customized dir={rtl ? "rtl" : "ltr"}>
  <h1>Installed Field forms qualification</h1>
  <p data-ready={ready}>Hydrated</p>
  <button
    onclick={() => {
      required = !required;
    }}>Toggle field required</button
  >
  <button
    onclick={() => {
      showHelper = !showHelper;
    }}>Toggle field helper</button
  >
  <button
    onclick={() => {
      mounted = !mounted;
    }}>Toggle form field mount</button
  >
  <button
    onclick={() => {
      cancelReset = !cancelReset;
    }}>Toggle reset cancellation</button
  >
  <button
    onclick={() => {
      movedOwner = !movedOwner;
    }}>Toggle native form owner</button
  >
  <button onclick={() => formRef?.requestSubmit()}>Submit field form</button>
  <button onclick={() => formRef?.reset()}>Reset field form</button>
  <button
    onclick={() => {
      radio = "";
    }}>Clear field radio</button
  >
  <p id="form-submits">{submits}</p>
  <p id="form-resets">{resetEvents}</p>
  <p id="submitted">{submitted}</p>
  <p id="kit-values">{checked};{switched};{radio}</p>
  <p id="kit-refs">
    {checkboxRef?.tagName ?? "none"};{switchRef?.tagName ??
      "none"};{radioRef?.tagName ?? "none"}
  </p>
  <p id="raw-values">{rawText};{rawArea};{rawChoice}</p>
  <button
    onclick={() => {
      customized = !customized;
    }}>Toggle field theme</button
  >
  <button
    onclick={() => {
      rtl = !rtl;
    }}>Toggle field direction</button
  >
  <button
    onclick={() => {
      invalid = !invalid;
    }}>Toggle field invalid</button
  >
  <button
    onclick={() => {
      disabled = !disabled;
    }}>Toggle field disabled</button
  >
  <button onclick={() => inputRef?.focus()}>Focus input ref</button>
  <button
    onclick={() => {
      overrideId = "changed-override";
    }}>Change overridden control ID</button
  >
  <p id="refs">
    {rootRef?.tagName ?? "none"};{surfaceRef?.tagName ??
      "none"};{labelRef?.tagName ?? "none"};{inputRef?.tagName ??
      "none"};{areaRef?.tagName ?? "none"};{selectRef?.tagName ??
      "none"};{markerRef?.tagName ?? "none"};{iconRef?.tagName ??
      "none"};{messageRef?.tagName ?? "none"}
  </p>
  <p id="convenience-refs">
    {convenienceInput?.tagName ?? "none"};{convenienceArea?.tagName ??
      "none"};{convenienceSelect?.tagName ?? "none"}
  </p>
  <p id="owned-message-ref">{helpMessage.ref?.tagName ?? "none"}</p>
  <p id="values">
    {text};{area};{choice}; input {inputEvents}; change {changeEvents}
  </p>
  <form
    id="candidate-form"
    bind:this={formRef}
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
      submitted = JSON.stringify([
        ...new FormData(event.currentTarget).entries(),
      ]);
    }}
    onreset={(event) => {
      resetEvents += 1;
      if (cancelReset) event.preventDefault();
    }}
  >
    {#if mounted}
      <FieldRoot
        id="address"
        {invalid}
        {disabled}
        {required}
        {messages}
        bind:ref={rootRef}
        class="caller-root"
        data-caller="root"
      >
        <FieldSurface bind:ref={surfaceRef} class="caller-surface">
          <FieldLabel bind:ref={labelRef}
            >Address<FieldRequired bind:ref={markerRef} /></FieldLabel
          >
          <TextInput
            type={inputType}
            defaultValue="reset@example.test"
            form={movedOwner ? "secondary-form" : undefined}
            name="address"
            autocomplete="email"
            bind:value={text}
            bind:ref={inputRef}
            oninput={() => {
              inputEvents += 1;
            }}
            data-caller="input"
          />
        </FieldSurface>
      </FieldRoot>
      <FieldRoot id="body" messages={[{ key: "help", children: helper }]}>
        <FieldLabel>Body</FieldLabel><TextArea
          name="body"
          defaultValue="Reset body"
          bind:value={area}
          bind:ref={areaRef}
        />
      </FieldRoot>
      <FieldRoot id="choice" messages={[{ key: "help", children: helper }]}>
        <FieldLabel>Choice</FieldLabel><NativeSelect
          name="choice"
          bind:value={choice}
          bind:ref={selectRef}
          onchange={() => {
            changeEvents += 1;
          }}
          ><option value="a">Alpha</option><option value="b">Beta</option
          ></NativeSelect
        >
        <SelectIcon bind:ref={iconRef}>⌄</SelectIcon>
      </FieldRoot>
      <FieldRoot
        id="override"
        required
        invalid
        disabled
        messages={[{ key: "help", children: helper }]}
        controlId={overrideId}
      >
        <FieldLabel>Explicit override</FieldLabel><TextInput
          id={overrideId}
          required={false}
          disabled={false}
          invalid={false}
          aria-describedby="manual-message"
        />
      </FieldRoot>
      <FieldMessage id="manual-message" bind:ref={messageRef}
        >Manual helper</FieldMessage
      >
      <TextField
        id="text-convenience"
        label="Convenience text"
        name="convenience-text"
        defaultValue="Text initial"
        required
        message="Text helper"
        {labelAction}
        bind:ref={convenienceInput}
        value="Text initial"
      />
      <TextAreaField
        id="area-convenience"
        label="Convenience body"
        name="convenience-area"
        defaultValue="Body initial"
        message="Body helper"
        rows={7}
        bind:ref={convenienceArea}
        value="Body initial"
      />
      <SelectField
        id="select-convenience"
        label="Convenience choice"
        name="convenience-choice"
        selectedLabel="Alpha"
        {icon}
        value="a"
        message="Choice helper"
        bind:ref={convenienceSelect}
        ><option value="a">Alpha</option><option value="b">Beta</option
        ></SelectField
      >
      <FieldRoot
        id="field-checkbox"
        {disabled}
        required
        messages={[{ key: "help", children: helper }]}
      >
        {#snippet children(field)}
          <FieldLabel>Agree to terms<FieldRequired /></FieldLabel>
          <Checkbox
            id={field.controlId}
            aria-describedby={field.describedBy}
            disabled={field.disabled}
            required={field.required}
            name="agree"
            form={movedOwner ? "secondary-form" : undefined}
            bind:checked
            bind:ref={checkboxRef}
          />
        {/snippet}
      </FieldRoot>
      <FieldRoot
        id="field-switch"
        {disabled}
        messages={[{ key: "help", children: helper }]}
      >
        {#snippet children(field)}
          <FieldLabel>Email preference</FieldLabel>
          <Switch
            id={field.controlId}
            aria-describedby={field.describedBy}
            disabled={field.disabled}
            name="preference"
            form={movedOwner ? "secondary-form" : undefined}
            bind:checked={switched}
            bind:ref={switchRef}
          />
        {/snippet}
      </FieldRoot>
      <FieldRoot
        id="field-radio"
        {disabled}
        required
        messages={[{ key: "help", children: helper }]}
      >
        {#snippet children(field)}
          <FieldLabel id="plan-label">Plan<FieldRequired /></FieldLabel>
          <RadioGroup
            id="plan-group"
            aria-labelledby="plan-label"
            aria-describedby={field.describedBy}
            disabled={field.disabled}
            required={field.required}
            name="plan"
            bind:value={radio}
            bind:ref={radioRef}
          >
            <RadioItem id={field.controlId} value="a">Alpha plan</RadioItem
            ><RadioItem value="b">Beta plan</RadioItem>
          </RadioGroup>
        {/snippet}
      </FieldRoot>
    {/if}
    <input
      aria-label="Raw native text"
      type="email"
      defaultValue="reset@example.test"
      bind:value={rawText}
    />
    <textarea
      aria-label="Raw native body"
      defaultValue="Reset body"
      bind:value={rawArea}></textarea>
    <select aria-label="Raw native choice" bind:value={rawChoice}
      ><option value="a">Alpha</option><option value="b">Beta</option></select
    >
  </form>
  <form id="secondary-form">
    <button type="reset">Reset secondary form</button>
  </form>
  {#each [0, 1] as index (index)}
    <FieldRoot
      data-auto-field={index}
      messages={[{ key: "help", children: helper }]}
    >
      <FieldLabel>Repeated field {index + 1}</FieldLabel><TextInput
        name={`repeated-${index}`}
      />
    </FieldRoot>
  {/each}
</main>

<style>
  main {
    --kit-radius-default: 3px;
    --kit-radius-control: 6px;
    --kit-radius-surface: 7px;
  }
  main.customized {
    --kit-input-radius: 8px / 5px;
    --kit-field-surface-radius: 11px / 9px;
    --kit-field-gap: 12px;
    --kit-field-control-background: rgb(4 5 6);
    --kit-field-control-padding-block: 12px;
    --kit-field-message-invalid-color: rgb(180 0 0);
  }
</style>
