<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import * as UI from "__UI_MODULE__";
  import type { DialogContentProps } from "__UI_MODULE__";
  const kind = page.url.searchParams.get("kind") ?? "dialog";
  let ready = $state(false);
  let mounted = $state(true);
  let outerOpen = $state(false);
  let alertOpen = $state(false);
  let menuOpen = $state(false);
  let actions = $state(0);
  let outerRef = $state<HTMLElement | null>(null);
  let alertRef = $state<HTMLElement | null>(null);
  let menuRef = $state<HTMLElement | null>(null);
  const options: Pick<DialogContentProps, "restoreScrollDelay"> = {
    restoreScrollDelay: 0,
  };
  onMount(() => {
    ready = true;
  });
  function resetOwnedState() {
    menuOpen = false;
    alertOpen = false;
    outerOpen = false;
  }
  function burst() {
    resetOwnedState();
    requestAnimationFrame(() => {
      outerOpen = true;
    });
  }
</script>

{#snippet menu()}
  <UI.MenuRoot bind:open={menuOpen}
    ><UI.MenuTrigger id="nested-menu-trigger">Nested choices</UI.MenuTrigger
    ><UI.MenuPortal
      ><UI.MenuContent
        aria-label="Nested choices"
        id="nested-menu"
        bind:ref={menuRef}
        ><UI.MenuItem id="nested-menu-item" closeOnSelect={false}
          >Nested action</UI.MenuItem
        ></UI.MenuContent
      ></UI.MenuPortal
    ></UI.MenuRoot
  >
{/snippet}
{#snippet alertBody()}
  <UI.AlertDialogOverlay data-overlay="alert" />
  <UI.AlertDialogContent id="alert-content" bind:ref={alertRef} {...options}>
    <UI.AlertDialogTitle>Nested confirmation</UI.AlertDialogTitle
    ><UI.AlertDialogDescription>Alert body</UI.AlertDialogDescription>
    {@render menu()}<button id="alert-other">Other alert action</button>
    <UI.AlertDialogAction
      id="alert-action"
      onclick={() => {
        actions++;
      }}>Native confirmation action</UI.AlertDialogAction
    >
    <UI.AlertDialogCancel id="alert-cancel"
      >Cancel confirmation</UI.AlertDialogCancel
    >
  </UI.AlertDialogContent>
{/snippet}
<main data-ready={ready} data-kind={kind}>
  <h1>Native cross-family overlay composition</h1>
  <button id="outside">Outside action</button>
  <button id="burst" onclick={burst}>Interrupt parent presence</button>
  <button
    id="toggle-mounted"
    onclick={() => {
      resetOwnedState();
      mounted = !mounted;
    }}>Toggle mounted overlay roots</button
  >
  <output id="state"
    >{JSON.stringify({
      outerOpen,
      alertOpen,
      menuOpen,
      actions,
      mounted,
      outerRef: outerRef?.tagName ?? null,
      alertRef: alertRef?.tagName ?? null,
      menuRef: menuRef?.tagName ?? null,
    })}</output
  >
  {#if mounted}
    {#if kind === "alert"}
      <UI.AlertDialogRoot bind:open={outerOpen}
        ><UI.AlertDialogTrigger id="outer-trigger"
          >Open parent</UI.AlertDialogTrigger
        ><UI.AlertDialogPortal>{@render alertBody()}</UI.AlertDialogPortal
        ></UI.AlertDialogRoot
      >
    {:else}
      <UI.DialogRoot bind:open={outerOpen}
        ><UI.DialogTrigger id="outer-trigger">Open parent</UI.DialogTrigger
        ><UI.DialogPortal
          ><UI.DialogOverlay data-overlay="dialog" /><UI.DialogContent
            id="outer-content"
            bind:ref={outerRef}
            {...options}
            ><UI.DialogTitle>Outer dialog</UI.DialogTitle><UI.DialogDescription
              >Dialog body</UI.DialogDescription
            >
            {#if kind === "nested"}
              <UI.AlertDialogRoot bind:open={alertOpen}
                ><UI.AlertDialogTrigger id="nested-alert-trigger"
                  >Open nested confirmation</UI.AlertDialogTrigger
                ><UI.AlertDialogPortal
                  >{@render alertBody()}</UI.AlertDialogPortal
                ></UI.AlertDialogRoot
              >
            {:else}{@render menu()}{/if}
            <button id="dialog-other">Other dialog action</button
            ><UI.DialogClose id="outer-close">Close parent</UI.DialogClose>
          </UI.DialogContent></UI.DialogPortal
        ></UI.DialogRoot
      >
    {/if}
  {/if}
</main>
