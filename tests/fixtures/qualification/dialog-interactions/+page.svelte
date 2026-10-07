<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Dialog as BitsDialog } from "bits-ui";
  import {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } from "__UI_MODULE__";
  import type { DialogContentProps } from "__UI_MODULE__";
  let ready = $state(false);
  let open = $state(false);
  let nestedOpen = $state(false);
  let triggerRef = $state<HTMLElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let cancelEscape = $state(false);
  let cancelOutside = $state(false);
  let cancelAutoFocus = $state(false);
  let changes = $state(0);
  let escapes = $state(0);
  let outside = $state(0);
  let completes = $state("");
  let uncontrolled = $state("none");
  let nativeCompletes = $state("");
  const options: Pick<DialogContentProps, "restoreScrollDelay"> = {
    restoreScrollDelay: 0,
  };
  const nameless = $derived(page.url.searchParams.get("nameless") === "1");
  onMount(() => {
    ready = true;
  });
  function burst() {
    open = false;
    requestAnimationFrame(() => {
      open = true;
    });
  }
</script>

<main data-ready={ready}>
  <h1>Actual installed Dialog interaction qualification</h1>
  <button id="outside-button">Outside action</button>
  <button
    id="parent-open"
    onclick={() => {
      open = true;
    }}>Parent open</button
  >
  <button
    id="cancel-autofocus"
    onclick={() => {
      cancelAutoFocus = !cancelAutoFocus;
    }}>Toggle autofocus cancellation</button
  >
  <output id="state"
    >Open {String(open)}; changes {changes}; escapes {escapes}; outside {outside};
    complete {completes}</output
  >
  <output id="refs"
    >{triggerRef?.tagName ?? "none"}/{contentRef?.tagName ?? "none"}</output
  >
  <output id="uncontrolled-state">{uncontrolled}</output>
  <output id="native-completes">{nativeCompletes}</output>
  <BitsDialog.Root
    onOpenChangeComplete={(value) => {
      nativeCompletes += `${value},`;
    }}
  >
    <BitsDialog.Trigger id="native-trigger"
      >Open native control</BitsDialog.Trigger
    >
    <BitsDialog.Portal>
      <BitsDialog.Content id="native-content">
        <BitsDialog.Title>Native callback control</BitsDialog.Title>
        <BitsDialog.Close id="native-close"
          >Close native control</BitsDialog.Close
        >
      </BitsDialog.Content>
    </BitsDialog.Portal>
  </BitsDialog.Root>
  <DialogRoot
    bind:open
    onOpenChange={() => {
      changes++;
    }}
    onOpenChangeComplete={(value) => {
      completes += `${value},`;
    }}
  >
    <DialogTrigger id="trigger" bind:ref={triggerRef} class="caller-trigger"
      >Open main dialog</DialogTrigger
    >
    <DialogPortal>
      <DialogOverlay id="overlay" />
      <DialogContent
        id="content"
        bind:ref={contentRef}
        class="caller-content"
        {...options}
        onEscapeKeydown={(event) => {
          escapes++;
          if (cancelEscape) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          outside++;
          if (cancelOutside) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          if (cancelAutoFocus) event.preventDefault();
        }}
      >
        {#if !nameless}<DialogTitle id="title"
            >Main accessible dialog</DialogTitle
          >{/if}
        <DialogDescription id="description"
          >Actual installed modal content</DialogDescription
        >
        <label for="draft">Draft</label><input id="draft" value="initial" />
        <button
          id="cancel-escape"
          onclick={() => {
            cancelEscape = !cancelEscape;
          }}>Toggle Escape cancellation</button
        >
        <button
          id="cancel-outside"
          onclick={() => {
            cancelOutside = !cancelOutside;
          }}>Toggle outside cancellation</button
        >
        <button
          id="parent-close"
          onclick={() => {
            open = false;
          }}>Parent close</button
        >
        <button id="burst" onclick={burst}>Interrupt close and reopen</button>
        <DialogRoot bind:open={nestedOpen}>
          <DialogTrigger id="nested-trigger">Open nested dialog</DialogTrigger>
          <DialogPortal>
            <DialogOverlay id="nested-overlay" />
            <DialogContent id="nested-content">
              <DialogTitle id="nested-title"
                >Nested accessible dialog</DialogTitle
              >
              <DialogDescription>Nested native layer</DialogDescription>
              <label for="nested-input">Nested draft</label><input
                id="nested-input"
              />
              <DialogClose id="nested-close">Close nested dialog</DialogClose>
            </DialogContent>
          </DialogPortal>
        </DialogRoot>
        <DialogClose id="close">Close main dialog</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot
    onOpenChange={(value) => {
      uncontrolled = String(value);
    }}
  >
    <DialogTrigger id="uncontrolled-trigger"
      >Open uncontrolled dialog</DialogTrigger
    >
    <DialogPortal>
      <DialogOverlay id="uncontrolled-overlay" />
      <DialogContent id="uncontrolled-content">
        <DialogTitle>Uncontrolled accessible dialog</DialogTitle>
        <DialogDescription>Native per-instance default state</DialogDescription>
        <DialogClose id="uncontrolled-close"
          >Close uncontrolled dialog</DialogClose
        >
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</main>
