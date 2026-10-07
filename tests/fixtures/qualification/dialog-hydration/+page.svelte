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
  const initialOpen = page.url.searchParams.get("initial") === "open";
  const nativeControl = page.url.searchParams.get("native") === "1";
  const inline = page.url.searchParams.get("portal") === "inline";
  const customHost = page.url.searchParams.get("portal") === "custom";
  let firstOpen = $state(initialOpen);
  let secondOpen = $state(false);
  let mounted = $state(true);
  let contentKey = $state(0);
  let description = $state(true);
  let ready = $state(false);
  const options: Pick<DialogContentProps, "restoreScrollDelay"> = {
    restoreScrollDelay: 0,
  };
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready} data-initial={initialOpen ? "open" : "closed"}>
  <h1>Actual installed Dialog SSR and hydration</h1>
  {#if nativeControl}
    <BitsDialog.Root open={initialOpen}>
      <BitsDialog.Trigger>Native control</BitsDialog.Trigger>
      <BitsDialog.Portal disabled={inline}>
        <BitsDialog.Content>
          <BitsDialog.Title>Native request-local dialog</BitsDialog.Title>
          <BitsDialog.Description
            >Native request-local description</BitsDialog.Description
          >
          <BitsDialog.Close>Close native</BitsDialog.Close>
        </BitsDialog.Content>
      </BitsDialog.Portal>
    </BitsDialog.Root>
  {:else}
    <button
      id="mount-first"
      onclick={() => {
        firstOpen = false;
        mounted = true;
      }}>Mount first root</button
    >
    {#if mounted}
      <DialogRoot bind:open={firstOpen}>
        <DialogTrigger data-instance="first">Open first</DialogTrigger>
        <DialogPortal
          disabled={inline}
          to={customHost ? "#hydration-host" : undefined}
        >
          <DialogOverlay data-instance="first" />
          {#key contentKey}
            <DialogContent data-instance="first" {...options}>
              <DialogTitle>First request-local dialog</DialogTitle>
              {#if description}<DialogDescription
                  >First request-local description</DialogDescription
                >{/if}
              <label for="first-input">First draft</label><input
                id="first-input"
              />
              <button
                id="toggle-description"
                onclick={() => {
                  description = !description;
                }}>Toggle description</button
              >
              <button
                id="replace-content"
                onclick={() => {
                  contentKey++;
                }}>Replace actual content node</button
              >
              <button
                id="open-second"
                onclick={() => {
                  secondOpen = true;
                }}>Open second instance</button
              >
              <button
                id="destroy-first"
                onclick={() => {
                  mounted = false;
                }}>Destroy first root</button
              >
              <DialogClose data-instance="first">Close first</DialogClose>
            </DialogContent>
          {/key}
        </DialogPortal>
      </DialogRoot>
    {/if}
    <DialogRoot bind:open={secondOpen}>
      <DialogTrigger data-instance="second">Open second</DialogTrigger>
      <DialogPortal
        disabled={inline}
        to={customHost ? "#hydration-host" : undefined}
      >
        <DialogOverlay data-instance="second" />
        <DialogContent data-instance="second" {...options}>
          <DialogTitle>Second request-local dialog</DialogTitle>
          <DialogDescription>Second request-local description</DialogDescription
          >
          <DialogClose data-instance="second">Close second</DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <div id="hydration-host"></div>
  {/if}
</main>
