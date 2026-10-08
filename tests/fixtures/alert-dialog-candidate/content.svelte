<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { AlertDialog as RawAlertDialog } from "bits-ui";
  import AlertDialogRoot from "$lib/candidate/alert-dialog/root.svelte";
  import AlertDialogPortal from "$lib/candidate/alert-dialog/portal.svelte";
  import AlertDialogContent from "$lib/candidate/alert-dialog/content.svelte";
  import AlertDialogOverlay from "$lib/candidate/alert-dialog/overlay.svelte";
  const mode = page.url.searchParams.get("portal") ?? "inline";
  const outsidePolicy =
    page.url.searchParams.get("policy") === "close" ? "close" : "ignore";
  const cancelOutside = page.url.searchParams.get("allow") !== "1";
  let host = $state<HTMLElement | null>(null);
  let overlayRef = $state<HTMLElement | null>(null);
  let ready = $state(false);
  let open = $state(true);
  let delegatedOpen = $state(false);
  let contentRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let escapes = $state(0);
  let outside = $state(0);
  let clicks = $state(0);
  let opened = $state(0);
  let closed = $state(0);
  onMount(() => {
    ready = true;
  });
</script>

<div id="portal-host" bind:this={host}></div>
<main data-ready={ready}>
  <h1>Unregistered Alert Dialog Content qualification</h1>
  <p>Title, Description and Cancel below remain raw Bits parts.</p>
  <button
    id="toggle-content"
    onclick={() => {
      open = !open;
    }}>Toggle content</button
  >
  <button
    id="toggle-delegated"
    onclick={() => {
      delegatedOpen = !delegatedOpen;
    }}>Toggle delegated content</button
  >
  <output id="refs"
    >{contentRef?.tagName ?? "none"}/{delegatedRef?.tagName ??
      "none"}/{overlayRef?.tagName ?? "none"}</output
  >
  <output id="events"
    >Escapes {escapes}; outside {outside}; clicks {clicks}; opened {opened};
    closed {closed}</output
  >
  <AlertDialogRoot bind:open>
    <AlertDialogPortal
      disabled={mode === "inline"}
      to={mode === "selector"
        ? "#portal-host"
        : mode === "element"
          ? (host ?? undefined)
          : undefined}
    >
      <AlertDialogOverlay
        id="default-overlay"
        bind:ref={overlayRef}
        class={["overlay-caller", "retained"]}
        data-caller="overlay-preserved"
      />
      <AlertDialogContent
        id="default-content"
        bind:ref={contentRef}
        class={["caller", "retained"]}
        data-caller="preserved"
        trapFocus={false}
        preventScroll={false}
        restoreScrollDelay={0}
        preventOverflowTextSelection={false}
        onclick={() => {
          clicks++;
        }}
        onEscapeKeydown={(event) => {
          escapes++;
          event.preventDefault();
        }}
        interactOutsideBehavior={outsidePolicy}
        onInteractOutside={(event) => {
          outside++;
          if (cancelOutside) event.preventDefault();
        }}
        onOpenAutoFocus={(event) => {
          opened++;
          event.preventDefault();
        }}
        onCloseAutoFocus={(event) => {
          closed++;
          event.preventDefault();
        }}
      >
        <RawAlertDialog.Title>Default content title</RawAlertDialog.Title>
        <RawAlertDialog.Description
          >Actual default children</RawAlertDialog.Description
        >
        <RawAlertDialog.Cancel type="button">Raw close</RawAlertDialog.Cancel>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
  <AlertDialogRoot bind:open={delegatedOpen}>
    <AlertDialogPortal disabled>
      <AlertDialogContent
        id="delegated-content"
        bind:ref={delegatedRef}
        class="delegated-caller"
        forceMount
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {#snippet child({ props, open })}
          <section {...props} hidden={!open} data-child-open={open}>
            <RawAlertDialog.Title>Delegated content title</RawAlertDialog.Title>
            <RawAlertDialog.Description
              >Actual delegated children</RawAlertDialog.Description
            >
          </section>
        {/snippet}
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</main>
