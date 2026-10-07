<script lang="ts">
  import { onMount } from "svelte";
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
  const contentOptions: Pick<
    DialogContentProps,
    "trapFocus" | "preventScroll"
  > = { trapFocus: true, preventScroll: true };
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Generated Dialog qualification</h1>
  <DialogRoot bind:open>
    <DialogTrigger id="generated-trigger">Open generated Dialog</DialogTrigger>
    <DialogPortal>
      <DialogOverlay id="generated-overlay" />
      <DialogContent id="generated-content" {...contentOptions}>
        <DialogTitle id="generated-title">Generated Dialog title</DialogTitle>
        <DialogDescription id="generated-description"
          >Actual installed compound source and CSS.</DialogDescription
        >
        <DialogClose id="generated-close">Close generated Dialog</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</main>
