<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import {
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "__UI_MODULE__";
  import type { AlertDialogContentProps } from "__UI_MODULE__";
  const outsidePolicy =
    page.url.searchParams.get("policy") === "close" ? "close" : "ignore";
  let actions = $state(0);
  let applicationClose = $state(false);
  let disabledAction = $state(false);
  let actionRef = $state<HTMLElement | null>(null);
  let cancelRef = $state<HTMLElement | null>(null);
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
  const options: Pick<AlertDialogContentProps, "restoreScrollDelay"> = {
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
  <h1>Actual installed AlertDialog interaction qualification</h1>
  <DialogRoot>
    <DialogTrigger id="generic-trigger"
      >Open generic Dialog control</DialogTrigger
    >
    <DialogPortal
      ><DialogOverlay id="generic-overlay" /><DialogContent id="generic-content"
        ><DialogTitle>Generic Dialog control</DialogTitle><DialogClose
          id="generic-close">Close</DialogClose
        ></DialogContent
      ></DialogPortal
    >
  </DialogRoot>
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
    complete {completes}; actions {actions}</output
  >
  <output id="refs"
    >{triggerRef?.tagName ?? "none"}/{contentRef?.tagName ?? "none"}</output
  >
  <output id="uncontrolled-state">{uncontrolled}</output>
  <output id="native-completes">{nativeCompletes}</output>
  <BitsAlertDialog.Root
    onOpenChangeComplete={(value) => {
      nativeCompletes += `${value},`;
    }}
  >
    <BitsAlertDialog.Trigger id="native-trigger"
      >Open native control</BitsAlertDialog.Trigger
    >
    <BitsAlertDialog.Portal>
      <BitsAlertDialog.Content id="native-content">
        <BitsAlertDialog.Title>Native callback control</BitsAlertDialog.Title>
        <BitsAlertDialog.Cancel id="native-close"
          >Close native control</BitsAlertDialog.Cancel
        >
      </BitsAlertDialog.Content>
    </BitsAlertDialog.Portal>
  </BitsAlertDialog.Root>
  <AlertDialogRoot
    bind:open
    onOpenChange={() => {
      changes++;
    }}
    onOpenChangeComplete={(value) => {
      completes += `${value},`;
    }}
  >
    <AlertDialogTrigger
      id="trigger"
      bind:ref={triggerRef}
      class="caller-trigger">Open main dialog</AlertDialogTrigger
    >
    <AlertDialogPortal>
      <AlertDialogOverlay id="overlay" />
      <AlertDialogContent
        interactOutsideBehavior={outsidePolicy}
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
        {#if !nameless}<AlertDialogTitle id="title"
            >Main accessible dialog</AlertDialogTitle
          >{/if}
        <AlertDialogDescription id="description"
          >Actual installed modal content</AlertDialogDescription
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
        <AlertDialogRoot bind:open={nestedOpen}>
          <AlertDialogTrigger id="nested-trigger"
            >Open nested dialog</AlertDialogTrigger
          >
          <AlertDialogPortal>
            <AlertDialogOverlay id="nested-overlay" />
            <AlertDialogContent id="nested-content">
              <AlertDialogTitle id="nested-title"
                >Nested accessible dialog</AlertDialogTitle
              >
              <AlertDialogDescription
                >Nested native layer</AlertDialogDescription
              >
              <label for="nested-input">Nested draft</label><input
                id="nested-input"
              />
              <AlertDialogCancel id="nested-close"
                >Close nested dialog</AlertDialogCancel
              >
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialogRoot>
        <label
          ><input
            id="application-close"
            type="checkbox"
            bind:checked={applicationClose}
          />Application closes</label
        >
        <label
          ><input
            id="disable-action"
            type="checkbox"
            bind:checked={disabledAction}
          />Disable action</label
        >
        <AlertDialogAction
          id="action"
          bind:ref={actionRef}
          disabled={disabledAction}
          onclick={() => {
            actions++;
            if (applicationClose) open = false;
          }}>Confirm</AlertDialogAction
        >
        <output id="decision-refs"
          >{actionRef?.tagName ?? "none"}/{cancelRef?.tagName ?? "none"}</output
        >
        <AlertDialogCancel bind:ref={cancelRef} id="close"
          >Close main dialog</AlertDialogCancel
        >
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
  <AlertDialogRoot
    onOpenChange={(value) => {
      uncontrolled = String(value);
    }}
  >
    <AlertDialogTrigger id="uncontrolled-trigger"
      >Open uncontrolled dialog</AlertDialogTrigger
    >
    <AlertDialogPortal>
      <AlertDialogOverlay id="uncontrolled-overlay" />
      <AlertDialogContent id="uncontrolled-content">
        <AlertDialogTitle>Uncontrolled accessible dialog</AlertDialogTitle>
        <AlertDialogDescription
          >Native per-instance default state</AlertDialogDescription
        >
        <AlertDialogCancel id="uncontrolled-close"
          >Close uncontrolled dialog</AlertDialogCancel
        >
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</main>
