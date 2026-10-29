<script lang="ts">
  import { page } from "$app/state";
  import { onMount, tick } from "svelte";
  import {
    FieldRoot,
    FieldLabel,
    FieldMessage,
    TextInput,
    TextField,
    TextAreaField,
    SelectField,
  } from "__UI_MODULE__";
  import type { FieldRootProps, FieldSlot } from "__UI_MODULE__";
  type Message = NonNullable<FieldRootProps["messages"]>[number];
  const first = $state<Message>({
    key: "helper / café",
    children: firstText,
    ref: null,
  });
  const replacement = $state<Message>({
    key: first.key,
    children: replacementText,
    ref: null,
  });
  const withoutRef = $state<Message>({ key: first.key, children: firstText });
  const other = $state<Message>({
    key: "other%key",
    children: otherText,
    ref: null,
  });
  let ready = $state(false);
  let selection = $state(0);
  let reverse = $state(false);
  let empty = $state(false);
  let duplicate = $state(page.url.searchParams.has("duplicate"));
  let shown = $state(true);
  let generation = $state(0);
  if (page.url.searchParams.has("unexpected"))
    throw new Error("Unexpected Field ownership qualification failure.");
  let recipeId = $state("recipe");
  let slotMode = $state(0);
  let parking = $state<HTMLParagraphElement | null>(null);
  let refProbe = $state("");
  function observeRef() {
    return { ownsRef: Object.hasOwn(first, "ref"), ref: first.ref?.id ?? null };
  }
  const selected = $derived(
    selection === 0 ? first : selection === 1 ? replacement : withoutRef,
  );
  const messages = $derived(
    empty
      ? []
      : duplicate
        ? [selected, selected]
        : reverse
          ? [other, selected]
          : [selected, other],
  );
  const action: FieldSlot | undefined = $derived(
    slotMode === 0
      ? firstAction
      : slotMode === 1
        ? secondAction
        : slotMode === 3
          ? emptyIcon
          : undefined,
  );
  const icon: FieldSlot | undefined = $derived(
    slotMode === 0 || slotMode === 3
      ? undefined
      : slotMode === 1
        ? emptyIcon
        : visibleIcon,
  );
  onMount(() => {
    ready = true;
  });
</script>

{#snippet firstText()}First helper{/snippet}
{#snippet replacementText()}Replacement helper{/snippet}
{#snippet otherText()}Other helper{/snippet}
{#snippet firstAction()}<button type="button">First action</button>{/snippet}
{#snippet secondAction()}<button type="button">Second action</button>{/snippet}
{#snippet emptyIcon()}{/snippet}
{#snippet visibleIcon()}<span>Visible icon</span>{/snippet}
<main>
  <h1>Generated Field ownership</h1>
  <p data-ready={ready}>Hydrated</p>
  <p id="parking" bind:this={parking}>Caller-owned parking ref</p>
  <output id="refs"
    >{JSON.stringify({
      first: first.ref?.id ?? null,
      replacement: replacement.ref?.id ?? null,
      other: other.ref?.id ?? null,
    })}</output
  >
  <output id="first-ref-presence" data-has-ref={Object.hasOwn(first, "ref")}
    >Current first descriptor</output
  >
  <output id="ref-probe">{refProbe}</output>
  <button
    onclick={async () => {
      delete first.ref;
      const immediate = observeRef();
      await tick();
      refProbe = JSON.stringify({ immediate, settled: observeRef() });
    }}>Delete first ref property</button
  >
  <button
    onclick={() => {
      first.ref = null;
    }}>Add first ref property</button
  >
  <output id="optional-ref" data-has-ref={Object.hasOwn(withoutRef, "ref")}
    >Optional descriptor</output
  >
  <button
    onclick={() => {
      selection = 1;
    }}>Replace descriptor</button
  >
  <button
    onclick={() => {
      selection = 2;
    }}>Remove ref property</button
  >
  <button
    onclick={() => {
      reverse = !reverse;
    }}>Reorder messages</button
  >
  <button
    onclick={() => {
      empty = true;
    }}>Clear messages</button
  >
  <button
    onclick={() => {
      duplicate = true;
    }}>Duplicate keys</button
  >
  <button
    onclick={() => {
      first.ref = parking;
    }}>Reassign first ref</button
  >
  <button
    onclick={() => {
      first.ref = parking;
      shown = false;
    }}>Reassign and unmount together</button
  >
  <button
    onclick={() => {
      first.ref = parking;
      selection = 1;
    }}>Reassign and replace together</button
  >
  <button
    onclick={() => {
      replacement.ref = parking;
    }}>Reassign replacement ref</button
  >
  <button
    onclick={() => {
      shown = !shown;
    }}>Toggle root</button
  >
  <button
    onclick={() => {
      generation += 1;
    }}>Replace root instance</button
  >
  <button
    onclick={() => {
      recipeId = "changed-recipe";
      slotMode = (slotMode + 1) % 4;
    }}>Change recipe slots</button
  >
  <svelte:boundary
    onerror={(error) => {
      if (
        !duplicate ||
        !(error instanceof Error) ||
        error.message !== "FieldRoot message keys must be unique."
      )
        throw error;
    }}
  >
    {#if shown}
      {#key generation}
        <FieldRoot id="owned" {messages}>
          <FieldLabel>Owned messages</FieldLabel><TextInput name="owned" />
        </FieldRoot>
      {/key}
    {/if}
    {#snippet failed(error)}<p id="refusal">
        {error instanceof Error ? error.message : "Unexpected non-error"}
      </p>{/snippet}
  </svelte:boundary>
  <TextField
    id={recipeId}
    label="Recipe text"
    name="recipe"
    labelAction={action}
    message={slotMode === 0 || slotMode === 3
      ? null
      : slotMode === 1
        ? ""
        : "Present message"}
  />
  <TextAreaField
    id={`${recipeId}-area`}
    label="Recipe body"
    name="body"
    labelAction={action}
    message={slotMode === 0 || slotMode === 3
      ? undefined
      : slotMode === 1
        ? ""
        : "Present message"}
  />
  <SelectField
    id="select-recipe"
    label="Recipe choice"
    name="choice"
    selectedLabel="Alpha"
    {icon}
  >
    <option value="a">Alpha</option>
  </SelectField>
  <FieldRoot id="manual">
    <FieldLabel>Manual relationship</FieldLabel><TextInput
      aria-describedby="manual-description"
    />
    <FieldMessage id="manual-description"
      >Caller owns this association</FieldMessage
    >
  </FieldRoot>
  {#each [0, 1] as index (index)}
    <FieldRoot
      data-auto={index}
      messages={[{ key: "help", children: firstText }]}
    >
      <FieldLabel>Automatic {index}</FieldLabel><TextInput />
    </FieldRoot>
  {/each}
</main>
