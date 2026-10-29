<script lang="ts">
  import { flushSync, onMount, tick } from "svelte";
  import { page } from "$app/state";
  import { TextInput, TextArea, NativeSelect } from "__UI_MODULE__";
  import type { TextInputProps } from "__UI_MODULE__";
  const defaults: Pick<TextInputProps, "defaultValue"> = {
    defaultValue: "Default",
  };

  type Cohort = "plain" | "raw" | "generated";
  type Phase = "none" | "capture" | "target" | "bubble";
  const phases: readonly Phase[] = ["none", "capture", "target", "bubble"];
  const cohorts: readonly Cohort[] = ["plain", "raw", "generated"];
  const inputTypes = [
    "text",
    "email",
    "password",
    "search",
    "tel",
    "url",
  ] as const;
  const requestedKind = page.url.searchParams.get("kind");
  const inputType = inputTypes.find((type) => type === requestedKind) ?? "text";
  const kind =
    requestedKind === "textarea" || requestedKind === "select"
      ? requestedKind
      : inputType;
  const scenario = page.url.searchParams.get("scenario");
  let ready = $state(false);
  let phase = $state<Phase>("none");
  let rawValue = $state("Initial");
  let generatedValue = $state("Initial");
  let forms = $state<Record<Cohort, HTMLFormElement | null>>({
    plain: null,
    raw: null,
    generated: null,
  });
  let plainInput = $state<
    HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
  >(null);
  let keys = $state({ plain: 0, raw: 0, generated: 0 });
  let mounted = $state({ plain: true, raw: true, generated: true });
  let counts = $state({
    plain: { input: 0, change: 0 },
    raw: { input: 0, change: 0 },
    generated: { input: 0, change: 0 },
  });
  let events = $state<
    {
      cohort: Cohort;
      phase: Phase;
      trusted: boolean;
      prevented: boolean;
      eventPhase: number;
    }[]
  >([]);
  let afterTick = $state<Partial<Record<Cohort, string>>>({});
  function resetEvent(cohort: Cohort, at: Phase, event: Event) {
    if (phase === at) event.preventDefault();
    if (at === "target") {
      if (scenario === "replace") flushSync(() => keys[cohort]++);
      if (scenario === "unmount") flushSync(() => (mounted[cohort] = false));
      if (scenario === "detach") forms[cohort]?.remove();
      if (scenario === "move-before")
        document
          .getElementById(`${cohort}-input`)
          ?.setAttribute("form", "alternate");
    }
    events.push({
      cohort,
      phase: at,
      trusted: event.isTrusted,
      prevented: event.defaultPrevented,
      eventPhase: event.eventPhase,
    });
  }
  function beforeNativeReset(cohort: Cohort) {
    if (
      scenario === "late-edit" ||
      scenario === "later-mount" ||
      scenario === "move-after"
    ) {
      setTimeout(() => {
        if (scenario === "later-mount") {
          flushSync(() => {
            if (cohort === "raw") rawValue = "Initial";
            if (cohort === "generated") generatedValue = "Initial";
            keys[cohort]++;
          });
          if (cohort === "plain" && plainInput) plainInput.value = "Initial";
        } else if (scenario === "late-edit") {
          const input = document.getElementById(`${cohort}-input`);
          if (
            input instanceof HTMLInputElement ||
            input instanceof HTMLTextAreaElement ||
            input instanceof HTMLSelectElement
          )
            input.value = "Initial";
        } else
          document
            .getElementById(`${cohort}-input`)
            ?.setAttribute("form", "alternate");
      }, 0);
    }
  }
  async function programmatic(cohort: Cohort) {
    forms[cohort]?.reset();
    await tick();
    afterTick[cohort] =
      cohort === "plain"
        ? (plainInput?.value ?? "missing")
        : cohort === "raw"
          ? rawValue
          : generatedValue;
  }
  onMount(() => {
    if (plainInput) plainInput.value = "Initial";
    ready = true;
  });
</script>

<h1>Native reset semantics</h1>
<p data-ready={ready}>Hydrated</p>
{#each phases as mode (mode)}
  <button type="button" onclick={() => (phase = mode)}>Cancel {mode}</button>
{/each}
<button type="button" id="blur">Commit input edits</button>
<output id="raw-bound">{rawValue}</output>
<output id="generated-bound">{generatedValue}</output>
<pre id="counts">{JSON.stringify(counts)}</pre>
<pre id="events">{JSON.stringify(events)}</pre>
<pre id="after-tick">{JSON.stringify(afterTick)}</pre>
<form id="alternate"></form>

<div onreset={(event) => resetEvent("plain", "bubble", event)}>
  <form
    id="plain-form"
    bind:this={forms.plain}
    onresetcapture={(event) => resetEvent("plain", "capture", event)}
    onreset={(event) => resetEvent("plain", "target", event)}
  >
    <label for="plain-input">Plain DOM</label>
    {#if mounted.plain}{#key keys.plain}
        {#if kind === "textarea"}
          <textarea
            id="plain-input"
            name="value"
            bind:this={plainInput}
            oninput={() => counts.plain.input++}
            onchange={() => counts.plain.change++}>Default</textarea
          >
        {:else if kind === "select"}
          <select
            id="plain-input"
            name="value"
            bind:this={plainInput}
            oninput={() => counts.plain.input++}
            onchange={() => counts.plain.change++}
          >
            {#each ["Default", "Initial", "Edited"] as option (option)}<option
                value={option}
                selected={option === "Default"}>{option}</option
              >{/each}
          </select>
        {:else}<input
            id="plain-input"
            type={inputType}
            name="value"
            value="Default"
            bind:this={plainInput}
            oninput={() => (counts.plain.input += 1)}
            onchange={() => (counts.plain.change += 1)}
          />{/if}
      {/key}{/if}
    <button type="reset" onclickcapture={() => beforeNativeReset("plain")}
      >Native reset plain</button
    >
  </form>
</div>
<div onreset={(event) => resetEvent("raw", "bubble", event)}>
  <form
    id="raw-form"
    bind:this={forms.raw}
    onresetcapture={(event) => resetEvent("raw", "capture", event)}
    onreset={(event) => resetEvent("raw", "target", event)}
  >
    <label for="raw-input">Raw Svelte</label>
    {#if mounted.raw}{#key keys.raw}
        {#if kind === "textarea"}
          <textarea
            id="raw-input"
            name="value"
            defaultValue="Default"
            bind:value={rawValue}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}></textarea>
        {:else if kind === "select"}
          <select
            id="raw-input"
            name="value"
            bind:value={rawValue}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          >
            {#each ["Default", "Initial", "Edited"] as option (option)}<option
                value={option}
                selected={option === "Default"}>{option}</option
              >{/each}
          </select>
        {:else}<input
            id="raw-input"
            type={inputType}
            name="value"
            defaultValue="Default"
            bind:value={rawValue}
            oninput={() => (counts.raw.input += 1)}
            onchange={() => (counts.raw.change += 1)}
          />{/if}
      {/key}{/if}
    <button type="reset" onclickcapture={() => beforeNativeReset("raw")}
      >Native reset raw</button
    >
  </form>
</div>
<div onreset={(event) => resetEvent("generated", "bubble", event)}>
  <form
    id="generated-form"
    bind:this={forms.generated}
    onresetcapture={(event) => resetEvent("generated", "capture", event)}
    onreset={(event) => resetEvent("generated", "target", event)}
  >
    <label for="generated-input">Generated Field</label>
    {#if mounted.generated}{#key keys.generated}
        {#if kind === "textarea"}
          <TextArea
            id="generated-input"
            name="value"
            defaultValue="Default"
            bind:value={generatedValue}
            oninput={() => counts.generated.input++}
            onchange={() => counts.generated.change++}
          />
        {:else if kind === "select"}
          <NativeSelect
            id="generated-input"
            name="value"
            bind:value={generatedValue}
            oninput={() => counts.generated.input++}
            onchange={() => counts.generated.change++}
          >
            {#each ["Default", "Initial", "Edited"] as option (option)}<option
                value={option}
                selected={option === "Default"}>{option}</option
              >{/each}
          </NativeSelect>
        {:else}<TextInput
            id="generated-input"
            type={inputType}
            name="value"
            {...defaults}
            bind:value={generatedValue}
            oninput={() => (counts.generated.input += 1)}
            onchange={() => (counts.generated.change += 1)}
          />{/if}
      {/key}{/if}
    <button type="reset" onclickcapture={() => beforeNativeReset("generated")}
      >Native reset generated</button
    >
  </form>
</div>
{#each cohorts as cohort (cohort)}
  <button type="button" onclick={() => programmatic(cohort)}
    >Programmatic reset {cohort}</button
  >
{/each}
