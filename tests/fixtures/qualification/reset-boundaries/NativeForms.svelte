<script lang="ts">
  import { onMount } from "svelte";
  import type { TextInput, TextInputProps } from "__UI_MODULE__";

  let {
    Control,
    defaults,
  }: {
    Control: typeof TextInput;
    defaults: Pick<TextInputProps, "defaultValue">;
  } = $props();
  type Cohort = "plain" | "raw" | "generated";
  const cohorts: readonly Cohort[] = ["plain", "raw", "generated"];
  let forms = $state<Record<Cohort, HTMLFormElement | null>>({
    plain: null,
    raw: null,
    generated: null,
  });
  let inputs = $state<Record<Cohort, HTMLInputElement | null>>({
    plain: null,
    raw: null,
    generated: null,
  });
  let rawValue = $state("Initial");
  let generatedValue = $state("Initial");
  let canceled = $state(false);
  let counts = $state({ plain: 0, raw: 0, generated: 0 });
  let resets = $state<
    {
      cohort: Cohort;
      composed: boolean;
      prevented: boolean;
      trusted: boolean;
    }[]
  >([]);
  function record(cohort: Cohort, event: Event) {
    if (canceled) event.preventDefault();
    resets.push({
      cohort,
      composed: event.composed,
      prevented: event.defaultPrevented,
      trusted: event.isTrusted,
    });
  }
  onMount(() => {
    if (inputs.plain) inputs.plain.value = "Initial";
  });
  export function edit() {
    for (const cohort of cohorts) {
      const input = inputs[cohort];
      if (!input) throw new Error("Missing native input");
      input.value = "Edited";
      const realm = input.ownerDocument.defaultView;
      if (!realm) throw new Error("Missing input document");
      input.dispatchEvent(
        new realm.Event("input", { bubbles: true, composed: true }),
      );
    }
  }
  export function setCancellation(value: boolean) {
    canceled = value;
  }
  export function reset() {
    for (const cohort of cohorts) forms[cohort]?.reset();
  }
  export function snapshot() {
    return {
      counts: { ...counts },
      resets: [...resets],
      controls: cohorts.map((cohort) => {
        const form = forms[cohort],
          input = inputs[cohort];
        if (!form || !input) throw new Error("Missing native form");
        const realm = form.ownerDocument.defaultView;
        if (!realm) throw new Error("Missing form document");
        return {
          cohort,
          value: input.value,
          bound:
            cohort === "plain"
              ? input.value
              : cohort === "raw"
                ? rawValue
                : generatedValue,
          data: [...new realm.FormData(form)],
          connected: form.isConnected,
        };
      }),
    };
  }
</script>

<form bind:this={forms.plain} onreset={(event) => record("plain", event)}>
  <label for="plain-input">Plain DOM</label>
  <input
    id="plain-input"
    name="value"
    defaultValue="Default"
    bind:this={inputs.plain}
    oninput={() => counts.plain++}
  />
</form>
<form bind:this={forms.raw} onreset={(event) => record("raw", event)}>
  <label for="raw-input">Raw Svelte</label>
  <input
    id="raw-input"
    name="value"
    defaultValue="Default"
    bind:value={rawValue}
    bind:this={inputs.raw}
    oninput={() => counts.raw++}
  />
</form>
<form
  bind:this={forms.generated}
  onreset={(event) => record("generated", event)}
>
  <label for="generated-input">Generated Field</label>
  <Control
    id="generated-input"
    name="value"
    {...defaults}
    bind:value={generatedValue}
    bind:ref={inputs.generated}
    oninput={() => counts.generated++}
  />
</form>
