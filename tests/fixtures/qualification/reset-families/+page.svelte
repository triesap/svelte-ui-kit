<script lang="ts">
  import { onMount, tick } from "svelte";
  import { page } from "$app/state";
  import { TextField } from "__UI_MODULE__";
  import type { TextInputProps } from "__UI_MODULE__";

  const witness: Pick<TextInputProps, "readonly" | "value"> = {
    readonly: true,
    value: "Native runtime qualification",
  };
  const kinds = [
    "number",
    "range",
    "checked",
    "multiple",
    "files",
    "checkbox-group",
    "radio-group",
    "chained",
    "chained-reverse",
  ] as const;
  type Kind = (typeof kinds)[number];
  type Cohort = "plain" | "raw";
  type Phase = "none" | "capture" | "target" | "bubble";
  const phases = ["none", "capture", "target", "bubble"] as const;
  const requested = page.url.searchParams.get("kind");
  const kind: Kind = kinds.find((value) => value === requested) ?? "number";
  let ready = $state(false);
  let defaultFacts = $state<Record<string, unknown>>({});
  let phase = $state<Phase>("none");
  let numeric = $state<number | undefined>(20);
  let checked = $state(false);
  let selected = $state(["beta"]);
  let files = $state<FileList>();
  let checkboxGroup = $state<string[]>([]);
  let radioGroup = $state<string | null>("beta");
  let chainedGroup = $state<string[]>([]);
  let chainedChecked = $state(false);
  let tickFacts = $state<Record<string, unknown>>({});
  let bindingProbe = $state("");
  let counts = $state({
    plain: { input: 0, change: 0 },
    raw: { input: 0, change: 0 },
  });
  let events = $state<
    { cohort: Cohort; phase: Phase; prevented: boolean; trusted: boolean }[]
  >([]);
  function bound() {
    switch (kind) {
      case "number":
      case "range":
        return numeric ?? null;
      case "checked":
        return checked;
      case "multiple":
        return selected;
      case "files":
        return Array.from(files ?? [], (file) => ({
          name: file.name,
          size: file.size,
          type: file.type,
        }));
      case "checkbox-group":
        return checkboxGroup;
      case "radio-group":
        return radioGroup;
      case "chained":
      case "chained-reverse":
        return { group: chainedGroup, checked: chainedChecked };
    }
  }
  function probeBindings() {
    const input = document.getElementById("raw-input");
    bindingProbe = JSON.stringify({
      value: bound(),
      sameFileList:
        kind === "files" && input instanceof HTMLInputElement
          ? files === input.files
          : null,
    });
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
    tickFacts[cohort] = cohort === "raw" ? bound() : "native reset returned";
  }
  function configureDefaults() {
    for (const cohort of ["plain", "raw"]) {
      const form = document.getElementById(`${cohort}-form`);
      if (!(form instanceof HTMLFormElement))
        throw new Error("Actual form required");
      for (const input of form.querySelectorAll("input")) {
        if (input.type === "number" || input.type === "range")
          input.defaultValue = "10";
        if (input.type === "checkbox" || input.type === "radio")
          input.defaultChecked = input.value === "alpha";
      }
      for (const option of form.querySelectorAll("option"))
        option.defaultSelected = option.value !== "beta";
      defaultFacts[cohort] = Array.from(
        form.querySelectorAll("input,select"),
        (node) => {
          if (node instanceof HTMLInputElement)
            return {
              type: node.type,
              value: node.defaultValue,
              checked: node.defaultChecked,
            };
          if (node instanceof HTMLSelectElement)
            return {
              type: node.type,
              selected: Array.from(node.options)
                .filter((option) => option.defaultSelected)
                .map((option) => option.value),
            };
          throw new Error("Actual default-bearing control required");
        },
      );
    }
  }
  onMount(() => {
    ready = true;
  });
</script>

<h1>Additional native reset families</h1>
<p data-ready={ready}>Hydrated</p>
<button id="commit-native-edits">Commit native edits</button>
<button onclick={probeBindings}>Read current native bindings</button>
<output id="binding-probe">{bindingProbe}</output>
<button onclick={configureDefaults}>Configure native defaults</button>
<output id="default-facts">{JSON.stringify(defaultFacts)}</output>
<TextField label="Generated Field witness" name="witness" {...witness} />
<output id="raw-bound">{JSON.stringify(bound())}</output>
<output id="counts">{JSON.stringify(counts)}</output>
<output id="events">{JSON.stringify(events)}</output>
<output id="tick-facts">{JSON.stringify(tickFacts)}</output>
{#each phases as mode (mode)}
  <button
    onclick={() => {
      phase = mode;
    }}>Cancel {mode}</button
  >
{/each}

<div onreset={(event) => resetEvent("plain", "bubble", event)}>
  <form
    id="plain-form"
    onresetcapture={(event) => resetEvent("plain", "capture", event)}
    onreset={(event) => resetEvent("plain", "target", event)}
  >
    {#if kind === "number" || kind === "range"}
      <label
        >Plain numeric<input
          id="plain-input"
          name="value"
          type={kind}
          value="10"
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        /></label
      >
    {:else if kind === "multiple"}
      <label
        >Plain selection<select
          id="plain-input"
          name="value"
          multiple
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        >
          <option value="alpha" selected>Alpha</option><option value="beta"
            >Beta</option
          ><option value="gamma" selected>Gamma</option>
        </select></label
      >
    {:else if kind === "files"}
      <label
        >Plain files<input
          id="plain-input"
          name="value"
          type="file"
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        /></label
      >
    {:else if kind === "checked" || kind === "chained" || kind === "chained-reverse"}
      <label
        >Plain checked<input
          id="plain-input"
          name="value"
          value="alpha"
          type="checkbox"
          checked
          oninput={() => counts.plain.input++}
          onchange={() => counts.plain.change++}
        /></label
      >
    {:else}
      {#each ["alpha", "beta"] as value (value)}
        <label
          >Plain {value}<input
            id={`plain-${value}`}
            name="value"
            type={kind === "radio-group" ? "radio" : "checkbox"}
            {value}
            checked={value === "alpha"}
            oninput={() => counts.plain.input++}
            onchange={() => counts.plain.change++}
          /></label
        >
      {/each}
    {/if}
    <button type="reset">Native reset plain</button>
    <button type="button" onclick={() => reset("plain")}
      >Programmatic reset plain</button
    >
  </form>
</div>
<div onreset={(event) => resetEvent("raw", "bubble", event)}>
  <form
    id="raw-form"
    onresetcapture={(event) => resetEvent("raw", "capture", event)}
    onreset={(event) => resetEvent("raw", "target", event)}
  >
    {#if kind === "number" || kind === "range"}
      <label
        >Raw numeric<input
          id="raw-input"
          name="value"
          type={kind}
          defaultValue="10"
          bind:value={numeric}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if kind === "multiple"}
      <label
        >Raw selection<select
          id="raw-input"
          name="value"
          multiple
          bind:value={selected}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        >
          <option value="alpha" selected>Alpha</option><option value="beta"
            >Beta</option
          ><option value="gamma" selected>Gamma</option>
        </select></label
      >
    {:else if kind === "files"}
      <label
        >Raw files<input
          id="raw-input"
          name="value"
          type="file"
          bind:files
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if kind === "checked"}
      <label
        >Raw checked<input
          id="raw-input"
          name="value"
          value="alpha"
          type="checkbox"
          defaultChecked
          bind:checked
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if kind === "chained"}
      <label
        >Raw checked<input
          id="raw-input"
          name="value"
          value="alpha"
          type="checkbox"
          defaultChecked
          bind:group={chainedGroup}
          bind:checked={chainedChecked}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if kind === "chained-reverse"}
      <label
        >Raw checked<input
          id="raw-input"
          name="value"
          value="alpha"
          type="checkbox"
          defaultChecked
          bind:checked={chainedChecked}
          bind:group={chainedGroup}
          oninput={() => counts.raw.input++}
          onchange={() => counts.raw.change++}
        /></label
      >
    {:else if kind === "checkbox-group"}
      {#each ["alpha", "beta"] as value (value)}
        <label
          >Raw {value}<input
            id={`raw-${value}`}
            name="value"
            type="checkbox"
            {value}
            defaultChecked={value === "alpha"}
            bind:group={checkboxGroup}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          /></label
        >
      {/each}
    {:else}
      {#each ["alpha", "beta"] as value (value)}
        <label
          >Raw {value}<input
            id={`raw-${value}`}
            name="value"
            type="radio"
            {value}
            defaultChecked={value === "alpha"}
            bind:group={radioGroup}
            oninput={() => counts.raw.input++}
            onchange={() => counts.raw.change++}
          /></label
        >
      {/each}
    {/if}
    <button type="reset">Native reset raw</button>
    <button type="button" onclick={() => reset("raw")}
      >Programmatic reset raw</button
    >
  </form>
</div>
