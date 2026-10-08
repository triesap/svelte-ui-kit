<script lang="ts">
  import { onMount } from "svelte";
  import * as UI from "__UI_MODULE__";
  import type { StatusProps } from "__UI_MODULE__";

  const questions = [
    {
      id: "ownership",
      question: "Who owns the source?",
      answer: "The application owns generated source.",
    },
    {
      id: "behavior",
      question: "Who owns interaction?",
      answer: "Native elements and Bits UI own interaction.",
    },
  ] as const;
  let expanded = $state({ ownership: false, behavior: false });
  let ready = $state(false);
  let consent = $state(false);
  let error = $state("");
  let message = $state("No submission yet.");
  let night = $state(false);
  const feedback: Pick<StatusProps, "politeness" | "atomic"> = {
    politeness: "polite",
    atomic: true,
  };
  onMount(() => {
    ready = true;
  });
  function submit(
    event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement },
  ) {
    event.preventDefault();
    if (!consent) {
      error = "Accept the source ownership agreement.";
      return;
    }
    error = "";
    const submitted = new FormData(event.currentTarget);
    message = `Saved ${String(submitted.get("title"))}; consent ${String(submitted.get("consent"))}.`;
  }
</script>

<main data-ready={ready}>
  <h1>App-owned composition examples</h1>
  <nav aria-label="Example sections">
    <UI.Anchor href="#examples-details">Read ownership details</UI.Anchor>
    <UI.RouterLink href="#examples-form"
      >Go to the application form</UI.RouterLink
    >
  </nav>
  <section aria-labelledby="examples-details">
    <h2 id="examples-details">Independent disclosures</h2>
    {#each questions as question (question.id)}
      <UI.CollapsibleRoot bind:open={expanded[question.id]}>
        <UI.CollapsibleTrigger>{question.question}</UI.CollapsibleTrigger>
        <UI.CollapsibleContent><p>{question.answer}</p></UI.CollapsibleContent>
      </UI.CollapsibleRoot>
    {/each}
  </section>
  <section aria-labelledby="examples-form">
    <h2 id="examples-form">Application form and feedback</h2>
    <form onsubmit={submit}>
      <UI.TextField name="title" label="Project title" required />
      <UI.Checkbox
        name="consent"
        value="yes"
        bind:checked={consent}
        aria-label="Accept source ownership"
      />
      <UI.Button type="submit">Save application settings</UI.Button>
    </form>
    {#if error}<UI.Alert>{error}</UI.Alert>{/if}
    <UI.Status {...feedback}>{message}</UI.Status>
  </section>
  <section
    class="examples-theme"
    data-theme={night ? "night" : "day"}
    aria-label="Application dialog theme"
  >
    <UI.DialogRoot>
      <UI.DialogTrigger>Review source ownership</UI.DialogTrigger>
      <UI.DialogPortal to="#examples-portal">
        <UI.DialogOverlay />
        <UI.DialogContent restoreScrollDelay={0}>
          <UI.DialogTitle>Application review</UI.DialogTitle>
          <UI.DialogDescription
            >The application chooses the portal host and theme.</UI.DialogDescription
          >
          <UI.Button
            onclick={() => {
              night = !night;
            }}>Switch dialog theme</UI.Button
          >
          <UI.DialogClose>Finish review</UI.DialogClose>
        </UI.DialogContent>
      </UI.DialogPortal>
    </UI.DialogRoot>
    <div id="examples-portal"></div>
  </section>
</main>

<style>
  .examples-theme {
    --kit-color-surface-raised: rgb(240, 245, 250);
    --kit-color-primary: rgb(12, 34, 56);
  }
  .examples-theme[data-theme="night"] {
    --kit-color-surface-raised: rgb(20, 30, 40);
    --kit-color-primary: rgb(80, 100, 120);
  }
</style>
