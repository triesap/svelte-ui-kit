<script lang="ts">
  import { onMount } from "svelte";
  import DialogRoot from "$lib/candidate/dialog/root.svelte";
  import DialogPortal from "$lib/candidate/dialog/portal.svelte";
  import DialogContent from "$lib/candidate/dialog/content.svelte";
  import DialogTitle from "$lib/candidate/dialog/title.svelte";
  import DialogDescription from "$lib/candidate/dialog/description.svelte";
  import DialogClose from "$lib/candidate/dialog/close.svelte";
  let ready = $state(false);
  let open = $state(true);
  let delegatedOpen = $state(false);
  let description = $state(true);
  let descriptionId = $state("candidate-description");
  let cancel = $state(false);
  let closeClicks = $state(0);
  let titleRef = $state<HTMLElement | null>(null);
  let descriptionRef = $state<HTMLElement | null>(null);
  let closeRef = $state<HTMLElement | null>(null);
  let delegatedTitleRef = $state<HTMLElement | null>(null);
  let delegatedDescriptionRef = $state<HTMLElement | null>(null);
  let delegatedCloseRef = $state<HTMLElement | null>(null);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Unregistered complete Dialog parts qualification</h1>
  <p>
    All required parts are candidate wrappers; registration and CSS remain
    later.
  </p>
  <output id="refs"
    >{titleRef?.tagName ?? "none"}/{descriptionRef?.tagName ??
      "none"}/{closeRef?.tagName ?? "none"}/{delegatedTitleRef?.tagName ??
      "none"}/{delegatedDescriptionRef?.tagName ??
      "none"}/{delegatedCloseRef?.tagName ?? "none"}</output
  >
  <output id="close-count">Clicks {closeClicks}; open {String(open)}</output>
  <button
    id="open-delegated"
    onclick={() => {
      delegatedOpen = true;
    }}>Open delegated</button
  >
  <DialogRoot bind:open>
    <DialogPortal disabled>
      <DialogContent
        id="default-content"
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogTitle
          id="candidate-title"
          bind:ref={titleRef}
          class="caller-title">Candidate accessible title</DialogTitle
        >
        {#if description}<DialogDescription
            id={descriptionId}
            bind:ref={descriptionRef}
            class="caller-description"
            >Candidate description text</DialogDescription
          >{/if}
        <button
          id="toggle-description"
          onclick={() => {
            description = !description;
          }}>Toggle description</button
        >
        <button
          id="rename-description"
          onclick={() => {
            descriptionId = "renamed-description";
          }}>Rename description</button
        >
        <button
          id="cancel-close"
          onclick={() => {
            cancel = !cancel;
          }}>Toggle close cancellation</button
        >
        <DialogClose
          id="candidate-close"
          bind:ref={closeRef}
          class="caller-close"
          data-caller="preserved"
          onclick={(event) => {
            closeClicks++;
            if (cancel) event.preventDefault();
          }}>Close candidate</DialogClose
        >
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot open>
    <DialogPortal disabled>
      <DialogContent
        id="optional-content"
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogTitle id="optional-title">Title without description</DialogTitle>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot bind:open={delegatedOpen}>
    <DialogPortal disabled>
      <DialogContent
        id="delegated-content"
        forceMount
        trapFocus={false}
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        {#snippet child({ props, open })}
          <section {...props} hidden={!open}>
            <DialogTitle
              id="delegated-title"
              bind:ref={delegatedTitleRef}
              level={3}
              class="delegated-title"
            >
              {#snippet child({ props })}<h3 {...props}>
                  Delegated accessible title
                </h3>{/snippet}
            </DialogTitle>
            <DialogDescription
              id="delegated-description"
              bind:ref={delegatedDescriptionRef}
              class="delegated-description"
            >
              {#snippet child({ props })}<p {...props}>
                  Delegated description text
                </p>{/snippet}
            </DialogDescription>
            <DialogClose
              id="delegated-close"
              bind:ref={delegatedCloseRef}
              class="delegated-close"
            >
              {#snippet child({ props })}<button {...props}
                  >Delegated close</button
                >{/snippet}
            </DialogClose>
          </section>
        {/snippet}
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</main>
