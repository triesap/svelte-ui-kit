<script lang="ts">
  import { onMount, tick } from "svelte";
  import { page } from "$app/state";
  import { TextField, Checkbox } from "__UI_MODULE__";
  import type { TextInputProps } from "__UI_MODULE__";
  const witness: Pick<TextInputProps, "readonly" | "value"> = {
    readonly: true,
    value: "Opaque native binding values",
  };
  const scenarios = [
    "checkbox-empty",
    "checkbox-multiple",
    "checkbox-duplicates",
    "checkbox-object",
    "radio-empty",
    "radio-undefined",
    "radio-undefined-empty",
    "radio-null",
    "radio-null-empty",
  ] as const;
  const phases = ["none", "capture", "target", "bubble"] as const;
  type Phase = (typeof phases)[number];
  type Cohort = "plain" | "raw" | "kit";
  type Choice = { key: string };
  const scenario =
    scenarios.find(
      (value) => value === page.url.searchParams.get("scenario"),
    ) ?? "checkbox-empty";
  const isRadio = scenario.startsWith("radio-");
  const cohorts: readonly Cohort[] =
    scenario === "checkbox-duplicates"
      ? ["plain", "raw", "kit"]
      : ["plain", "raw"];
  const choices = $state<Choice[]>([{ key: "alpha" }, { key: "beta" }]);
  let strings = $state<string[]>([]);
  let objects = $state<Choice[]>([]);
  let radio = $state<string | null | undefined>("beta");
  let ready = $state(false);
  let kitChecked = $state([false, false, false]);
  let phase = $state<Phase>("none");
  let defaultFacts = $state<Record<string, unknown>>({});
  let ticks = $state<Record<string, unknown>>({});
  let counts = $state({
    plain: { input: 0, change: 0 },
    raw: { input: 0, change: 0 },
    kit: { input: 0, change: 0 },
  });
  let events = $state<
    { cohort: Cohort; phase: Phase; prevented: boolean; trusted: boolean }[]
  >([]);
  function bound() {
    if (isRadio)
      return radio === undefined
        ? { kind: "undefined" }
        : radio === null
          ? { kind: "null" }
          : { kind: "value", value: radio };
    if (scenario === "checkbox-object")
      return {
        values: objects.map((value) => value.key),
        identityValid: objects.every((value) => choices.includes(value)),
      };
    return strings;
  }
  function configureDefaults() {
    for (const cohort of cohorts) {
      const form = document.getElementById(`${cohort}-form`);
      if (!(form instanceof HTMLFormElement))
        throw new Error("Actual form required");
      for (const [index, input] of Array.from(
        form.querySelectorAll("input"),
      ).entries()) {
        // Native submission strings deliberately differ from opaque model
        // values. The framework must retain its own object/null/undefined.
        if (cohort !== "kit") input.value = input.dataset.key ?? "";
        input.defaultChecked = scenario.endsWith("empty")
          ? false
          : scenario === "checkbox-multiple"
            ? true
            : cohort === "kit"
              ? index === 0
              : input.dataset.key === "alpha" &&
                input.dataset.duplicate !== "true";
      }
      defaultFacts[cohort] = Array.from(
        form.querySelectorAll("input"),
        (input) => ({ value: input.value, checked: input.defaultChecked }),
      );
    }
  }
  function resetEvent(cohort: Cohort, at: Phase, event: Event) {
    if (phase === at) event.preventDefault();
    events.push({
      cohort,
      phase: at,
      prevented: event.defaultPrevented,
      trusted: event.isTrusted,
    });
  }
  async function reset(cohort: Cohort) {
    const form = document.getElementById(`${cohort}-form`);
    if (!(form instanceof HTMLFormElement))
      throw new Error("Actual form required");
    form.reset();
    await tick();
    ticks[cohort] = cohort === "raw" ? bound() : "native reset returned";
  }
  onMount(() => {
    ready = true;
  });
</script>

<h1>Native group value and default edges</h1>
<p data-ready={ready}>Hydrated</p>
<TextField label="Generated Field witness" name="witness" {...witness} />
<button onclick={configureDefaults}>Configure native defaults</button>
<output id="default-facts">{JSON.stringify(defaultFacts)}</output>
<output id="raw-bound">{JSON.stringify(bound())}</output>
<output id="counts">{JSON.stringify(counts)}</output>
<output id="events">{JSON.stringify(events)}</output>
<output id="ticks">{JSON.stringify(ticks)}</output>
<output id="kit-bound">{JSON.stringify(kitChecked)}</output>
<button
  onclick={() => {
    if (isRadio) radio = null;
    else strings = ["alpha"];
  }}>Project raw model</button
>
{#each phases as mode (mode)}<button
    onclick={() => {
      phase = mode;
    }}>Cancel {mode}</button
  >{/each}
<div onreset={(event) => resetEvent("plain", "bubble", event)}>
  <form
    id="plain-form"
    onresetcapture={(event) => resetEvent("plain", "capture", event)}
    onreset={(event) => resetEvent("plain", "target", event)}
  >
    {#each ["alpha", "beta"] as key (key)}
      <label
        >Plain {key}<input
          id={`plain-${key}`}
          data-key={key}
          name="value"
          type={isRadio ? "radio" : "checkbox"}
          value={key}
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        /></label
      >
    {/each}
    {#if scenario === "checkbox-duplicates"}<label
        >Plain duplicate Alpha<input
          id="plain-duplicate"
          data-key="alpha"
          data-duplicate="true"
          name="value"
          type="checkbox"
          value="alpha"
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        /></label
      >{/if}
    <button type="reset">Native reset plain</button><button
      type="button"
      onclick={() => reset("plain")}>Programmatic reset plain</button
    >
  </form>
</div>
<div onreset={(event) => resetEvent("raw", "bubble", event)}>
  <form
    id="raw-form"
    onresetcapture={(event) => resetEvent("raw", "capture", event)}
    onreset={(event) => resetEvent("raw", "target", event)}
  >
    {#if isRadio}
      <label
        >Raw alpha<input
          id="raw-alpha"
          data-key="alpha"
          name="value"
          type="radio"
          value={scenario.startsWith("radio-undefined")
            ? undefined
            : scenario.startsWith("radio-null")
              ? null
              : "alpha"}
          bind:group={radio}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
      <label
        >Raw beta<input
          id="raw-beta"
          data-key="beta"
          name="value"
          type="radio"
          value="beta"
          bind:group={radio}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if scenario === "checkbox-object"}
      {#each choices as choice (choice.key)}
        <label
          >Raw {choice.key}<input
            id={`raw-${choice.key}`}
            data-key={choice.key}
            name="value"
            type="checkbox"
            value={choice}
            bind:group={objects}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          /></label
        >
      {/each}
    {:else}
      {#each ["alpha", "beta"] as key (key)}
        <label
          >Raw {key}<input
            id={`raw-${key}`}
            data-key={key}
            name="value"
            type="checkbox"
            value={key}
            bind:group={strings}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          /></label
        >
      {/each}
      {#if scenario === "checkbox-duplicates"}<label
          >Raw duplicate Alpha<input
            id="raw-duplicate"
            data-key="alpha"
            data-duplicate="true"
            name="value"
            type="checkbox"
            value="alpha"
            bind:group={strings}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          /></label
        >{/if}
    {/if}
    <button type="reset">Native reset raw</button><button
      type="button"
      onclick={() => reset("raw")}>Programmatic reset raw</button
    >
  </form>
</div>
{#if scenario === "checkbox-duplicates"}
  <div onreset={(event) => resetEvent("kit", "bubble", event)}>
    <form
      id="kit-form"
      onresetcapture={(event) => resetEvent("kit", "capture", event)}
      onreset={(event) => resetEvent("kit", "target", event)}
    >
      <Checkbox
        aria-label="Kit alpha"
        name="value"
        value="alpha"
        bind:checked={kitChecked[0]}
        onCheckedChange={() => counts.kit.change++}
      />
      <Checkbox
        aria-label="Kit beta"
        name="value"
        value="beta"
        bind:checked={kitChecked[1]}
        onCheckedChange={() => counts.kit.change++}
      />
      <Checkbox
        aria-label="Kit duplicate alpha"
        name="value"
        value="alpha"
        bind:checked={kitChecked[2]}
        onCheckedChange={() => counts.kit.change++}
      />
      <button type="reset">Native reset kit</button><button
        type="button"
        onclick={() => reset("kit")}>Programmatic reset kit</button
      >
    </form>
  </div>
{/if}
