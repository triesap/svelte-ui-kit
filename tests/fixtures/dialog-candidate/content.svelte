<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog as RawDialog } from "bits-ui";
  import DialogRoot from "$lib/candidate/dialog/root.svelte";
  import DialogPortal from "$lib/candidate/dialog/portal.svelte";
  import DialogContent from "$lib/candidate/dialog/content.svelte";
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

<main data-ready={ready}>
  <h1>Unregistered Dialog Content qualification</h1>
  <p>Title, Description and Close below remain raw Bits parts.</p>
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
    >{contentRef?.tagName ?? "none"}/{delegatedRef?.tagName ?? "none"}</output
  >
  <output id="events"
    >Escapes {escapes}; outside {outside}; clicks {clicks}; opened {opened};
    closed {closed}</output
  >
  <DialogRoot bind:open>
    <DialogPortal disabled>
      <DialogContent
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
        onInteractOutside={(event) => {
          outside++;
          event.preventDefault();
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
        <RawDialog.Title>Default content title</RawDialog.Title>
        <RawDialog.Description>Actual default children</RawDialog.Description>
        <RawDialog.Close type="button">Raw close</RawDialog.Close>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot bind:open={delegatedOpen}>
    <DialogPortal disabled>
      <DialogContent
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
            <RawDialog.Title>Delegated content title</RawDialog.Title>
            <RawDialog.Description
              >Actual delegated children</RawDialog.Description
            >
          </section>
        {/snippet}
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</main>
