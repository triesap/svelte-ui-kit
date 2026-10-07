<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog as RawDialog } from "bits-ui";
  import DialogRoot from "$lib/candidate/dialog/root.svelte";
  import DialogTrigger from "$lib/candidate/dialog/trigger.svelte";

  let ready = $state(false);
  let open = $state(false);
  let delegatedOpen = $state(false);
  let triggerRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let changes = $state(0);
  let clicks = $state(0);
  let keys = $state(0);
  let cancel = $state(false);
  let disabled = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Unregistered Dialog Root and Trigger qualification</h1>
  <p>Content, Title, Description and Close below are raw Bits parts.</p>
  <output id="state"
    >Open {String(open)}; changes {changes}; clicks {clicks}; keys {keys}</output
  >
  <output id="refs"
    >{triggerRef?.tagName ?? "none"}/{delegatedRef?.tagName ?? "none"}</output
  >
  <button
    id="parent-open"
    onclick={() => {
      open = true;
    }}>Parent open</button
  >
  <button
    id="disable"
    onclick={() => {
      disabled = !disabled;
    }}>Toggle disabled</button
  >
  <button
    id="cancel"
    onclick={() => {
      cancel = !cancel;
    }}>Toggle cancellation</button
  >
  <DialogRoot
    bind:open
    onOpenChange={() => {
      changes++;
    }}
  >
    <DialogTrigger
      id="trigger"
      bind:ref={triggerRef}
      class={["caller", "retained"]}
      data-caller="preserved"
      title="Native trigger"
      {disabled}
      onclick={(event) => {
        clicks++;
        if (cancel) event.preventDefault();
      }}
      onkeydown={(event) => {
        keys++;
        if (cancel) event.preventDefault();
      }}>Open candidate</DialogTrigger
    >
    <RawDialog.Content
      id="content"
      trapFocus={false}
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawDialog.Title>Candidate title</RawDialog.Title>
      <RawDialog.Description
        >Raw primitive content composition</RawDialog.Description
      >
      <RawDialog.Close id="close" type="button">Close candidate</RawDialog.Close
      >
      <button
        id="parent-close"
        onclick={() => {
          open = false;
        }}>Parent close</button
      >
    </RawDialog.Content>
  </DialogRoot>
  <DialogRoot bind:open={delegatedOpen}>
    <DialogTrigger
      id="delegated"
      bind:ref={delegatedRef}
      class="delegated-caller"
    >
      {#snippet child({ props })}
        <button {...props} data-delegated="actual">Delegated trigger</button>
      {/snippet}
    </DialogTrigger>
    <RawDialog.Content
      id="delegated-content"
      trapFocus={false}
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawDialog.Title>Delegated title</RawDialog.Title>
      <RawDialog.Description>Delegated content</RawDialog.Description>
      <RawDialog.Close id="delegated-close" type="button"
        >Close delegated</RawDialog.Close
      >
    </RawDialog.Content>
  </DialogRoot>
</main>
