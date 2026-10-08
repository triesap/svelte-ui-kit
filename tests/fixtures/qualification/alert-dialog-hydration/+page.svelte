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
    AlertDialogCancel,
  } from "__UI_MODULE__";
  import type { AlertDialogContentProps } from "__UI_MODULE__";
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
  const options: Pick<AlertDialogContentProps, "restoreScrollDelay"> = {
    restoreScrollDelay: 0,
  };
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready} data-initial={initialOpen ? "open" : "closed"}>
  <h1>Actual installed AlertDialog SSR and hydration</h1>
  {#if nativeControl}
    <BitsAlertDialog.Root open={initialOpen}>
      <BitsAlertDialog.Trigger>Native control</BitsAlertDialog.Trigger>
      <BitsAlertDialog.Portal disabled={inline}>
        <BitsAlertDialog.Content>
          <BitsAlertDialog.Title
            >Native request-local dialog</BitsAlertDialog.Title
          >
          <BitsAlertDialog.Description
            >Native request-local description</BitsAlertDialog.Description
          >
          <BitsAlertDialog.Cancel>Close native</BitsAlertDialog.Cancel>
        </BitsAlertDialog.Content>
      </BitsAlertDialog.Portal>
    </BitsAlertDialog.Root>
  {:else}
    <button
      id="mount-first"
      onclick={() => {
        firstOpen = false;
        mounted = true;
      }}>Mount first root</button
    >
    {#if mounted}
      <AlertDialogRoot bind:open={firstOpen}>
        <AlertDialogTrigger data-instance="first">Open first</AlertDialogTrigger
        >
        <AlertDialogPortal
          disabled={inline}
          to={customHost ? "#hydration-host" : undefined}
        >
          <AlertDialogOverlay data-instance="first" />
          {#key contentKey}
            <AlertDialogContent data-instance="first" {...options}>
              <AlertDialogTitle>First request-local dialog</AlertDialogTitle>
              {#if description}<AlertDialogDescription
                  >First request-local description</AlertDialogDescription
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
              <AlertDialogCancel data-instance="first"
                >Close first</AlertDialogCancel
              >
            </AlertDialogContent>
          {/key}
        </AlertDialogPortal>
      </AlertDialogRoot>
    {/if}
    <AlertDialogRoot bind:open={secondOpen}>
      <AlertDialogTrigger data-instance="second">Open second</AlertDialogTrigger
      >
      <AlertDialogPortal
        disabled={inline}
        to={customHost ? "#hydration-host" : undefined}
      >
        <AlertDialogOverlay data-instance="second" />
        <AlertDialogContent data-instance="second" {...options}>
          <AlertDialogTitle>Second request-local dialog</AlertDialogTitle>
          <AlertDialogDescription
            >Second request-local description</AlertDialogDescription
          >
          <AlertDialogCancel data-instance="second"
            >Close second</AlertDialogCancel
          >
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
    <div id="hydration-host"></div>
  {/if}
</main>
