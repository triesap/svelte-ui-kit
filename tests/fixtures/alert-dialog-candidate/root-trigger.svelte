<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { AlertDialog as RawAlertDialog } from "bits-ui";
  import AlertDialogRoot from "$lib/candidate/alert-dialog/root.svelte";
  import AlertDialogTrigger from "$lib/candidate/alert-dialog/trigger.svelte";

  let ready = $state(false);
  let open = $state(page.url.searchParams.get("initial") === "open");
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
  <h1>Unregistered Alert Dialog Root and Trigger qualification</h1>
  <p>Content, Title, Description and Cancel below are raw Bits parts.</p>
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
  <AlertDialogRoot
    bind:open
    onOpenChange={() => {
      changes++;
    }}
  >
    <AlertDialogTrigger
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
      }}>Open candidate</AlertDialogTrigger
    >
    <RawAlertDialog.Content
      id="content"
      trapFocus={false}
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawAlertDialog.Title>Candidate title</RawAlertDialog.Title>
      <RawAlertDialog.Description
        >Raw primitive content composition</RawAlertDialog.Description
      >
      <RawAlertDialog.Cancel id="close" type="button"
        >Close candidate</RawAlertDialog.Cancel
      >
      <button
        id="parent-close"
        onclick={() => {
          open = false;
        }}>Parent close</button
      >
    </RawAlertDialog.Content>
  </AlertDialogRoot>
  <AlertDialogRoot bind:open={delegatedOpen}>
    <AlertDialogTrigger
      id="delegated"
      bind:ref={delegatedRef}
      class="delegated-caller"
    >
      {#snippet child({ props })}
        <button {...props} data-delegated="actual">Delegated trigger</button>
      {/snippet}
    </AlertDialogTrigger>
    <RawAlertDialog.Content
      id="delegated-content"
      trapFocus={false}
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      <RawAlertDialog.Title>Delegated title</RawAlertDialog.Title>
      <RawAlertDialog.Description>Delegated content</RawAlertDialog.Description>
      <RawAlertDialog.Cancel id="delegated-close" type="button"
        >Close delegated</RawAlertDialog.Cancel
      >
    </RawAlertDialog.Content>
  </AlertDialogRoot>
</main>
