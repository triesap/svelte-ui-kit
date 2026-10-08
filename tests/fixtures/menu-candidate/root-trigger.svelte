<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { DropdownMenu as RawMenu } from "bits-ui";
  import Root from "$lib/candidate/menu/root.svelte";
  import Trigger from "$lib/candidate/menu/trigger.svelte";
  const initial = page.url.searchParams.get("initial") === "open";
  let ready = $state(false);
  let open = $state(initial);
  let delegatedOpen = $state(false);
  let uncontrolled = $state("none");
  let cancel = $state(false);
  let disabled = $state(false);
  let changes = $state(0);
  let pointers = $state(0);
  let clicks = $state(0);
  let keys = $state(0);
  let triggerRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Incremental native Menu Root Trigger qualification</h1>
  <p>Content and Item below are explicitly raw pinned DropdownMenu parts.</p>
  <output id="state"
    >Open {open}; changes {changes}; pointers {pointers}; clicks {clicks}; keys {keys}</output
  >
  <output id="refs"
    >{triggerRef?.tagName ?? "none"}/{delegatedRef?.tagName ?? "none"}</output
  >
  <output id="uncontrolled-state">{uncontrolled}</output>
  <button
    id="parent-open"
    onclick={() => {
      open = true;
    }}>Parent open</button
  >
  <button
    id="parent-close"
    onclick={() => {
      open = false;
    }}>Parent close</button
  >
  <button
    id="cancel"
    onclick={() => {
      cancel = !cancel;
    }}>Toggle cancellation</button
  >
  <button
    id="disable"
    onclick={() => {
      disabled = !disabled;
    }}>Toggle disabled</button
  >
  <Root
    bind:open
    onOpenChange={() => {
      changes++;
    }}
  >
    <Trigger
      id="trigger"
      bind:ref={triggerRef}
      class={["caller", "retained"]}
      data-caller="preserved"
      title="Native menu trigger"
      {disabled}
      onpointerdown={(event) => {
        pointers++;
        if (cancel) event.preventDefault();
      }}
      onpointerup={(event) => {
        if (cancel) event.preventDefault();
      }}
      onclick={() => {
        clicks++;
      }}
      onkeydown={(event) => {
        keys++;
        if (cancel) event.preventDefault();
      }}>Open candidate</Trigger
    >
    <RawMenu.Content
      id="content"
      aria-label="Candidate menu"
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawMenu.Item id="item">Candidate selection</RawMenu.Item>
    </RawMenu.Content>
  </Root>
  <Root bind:open={delegatedOpen}>
    <Trigger id="delegated" bind:ref={delegatedRef} class="delegated-caller">
      {#snippet child({ props })}<button {...props} data-delegated="actual"
          >Delegated trigger</button
        >{/snippet}
    </Trigger>
    <RawMenu.Content
      id="delegated-content"
      aria-label="Delegated menu"
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawMenu.Item id="delegated-item">Delegated selection</RawMenu.Item>
    </RawMenu.Content>
  </Root>
  <Root
    onOpenChange={(value) => {
      uncontrolled = String(value);
    }}
  >
    <Trigger id="uncontrolled-trigger">Uncontrolled menu</Trigger>
    <RawMenu.Content
      id="uncontrolled-content"
      aria-label="Uncontrolled menu"
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawMenu.Item id="uncontrolled-item">Uncontrolled selection</RawMenu.Item>
    </RawMenu.Content>
  </Root>
  <RawMenu.Root open={initial}>
    <RawMenu.Trigger id="native-trigger">Native SSR control</RawMenu.Trigger>
    <RawMenu.Content
      id="native-content"
      aria-label="Native SSR menu"
      preventScroll={false}
    >
      <RawMenu.Item>Native selection</RawMenu.Item>
    </RawMenu.Content>
  </RawMenu.Root>
</main>
