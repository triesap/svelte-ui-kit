<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog as RawDialog } from "bits-ui";
  import DialogRoot from "$lib/candidate/dialog/root.svelte";
  import DialogPortal from "$lib/candidate/dialog/portal.svelte";
  import DialogOverlay from "$lib/candidate/dialog/overlay.svelte";
  let ready = $state(false);
  let target = $state<HTMLElement | null>(null);
  let inlineRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Unregistered Dialog Portal and Overlay qualification</h1>
  <p>Content, Title, Description and Close are raw Bits parts.</p>
  <section id="selector-target" aria-label="Selector portal target"></section>
  <section
    id="element-target"
    bind:this={target}
    aria-label="Element portal target"
  ></section>
  <output id="refs"
    >{inlineRef?.tagName ?? "none"}/{delegatedRef?.tagName ?? "none"}</output
  >
  <DialogRoot open>
    <DialogPortal>
      <DialogOverlay id="body-overlay" class="caller">
        {#snippet children({ open })}<span id="body-state">{String(open)}</span
          >{/snippet}
      </DialogOverlay>
      <RawDialog.Content
        id="body-content"
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <RawDialog.Title>Body candidate</RawDialog.Title>
        <RawDialog.Description>Default body portal</RawDialog.Description>
      </RawDialog.Content>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot open>
    <DialogPortal to="#selector-target">
      <DialogOverlay
        id="selector-overlay"
        bind:ref={delegatedRef}
        class="delegated"
      >
        {#snippet child({ props, open })}<section {...props} data-open={open}>
            Delegated Overlay
          </section>{/snippet}
      </DialogOverlay>
      <RawDialog.Content
        id="selector-content"
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <RawDialog.Title>Selector candidate</RawDialog.Title
        ><RawDialog.Description>Custom selector target</RawDialog.Description>
      </RawDialog.Content>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot open>
    <DialogPortal to={target ?? undefined}>
      <DialogOverlay id="element-overlay" />
      <RawDialog.Content
        id="element-content"
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <RawDialog.Title>Element candidate</RawDialog.Title
        ><RawDialog.Description>Custom Element target</RawDialog.Description>
      </RawDialog.Content>
    </DialogPortal>
  </DialogRoot>
  <section id="inline-host" aria-label="Inline portal composition">
    <DialogRoot open>
      <DialogPortal disabled>
        <DialogOverlay
          id="inline-overlay"
          bind:ref={inlineRef}
          class="inline-caller"
          data-caller="preserved"
        />
        <RawDialog.Content
          id="inline-content"
          trapFocus={false}
          preventScroll={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <RawDialog.Title>Inline candidate</RawDialog.Title
          ><RawDialog.Description
            >Disabled portal inline SSR</RawDialog.Description
          >
        </RawDialog.Content>
      </DialogPortal>
    </DialogRoot>
  </section>
</main>
