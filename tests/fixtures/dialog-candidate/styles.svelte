<script lang="ts">
  import { onMount } from "svelte";
  import DialogRoot from "$lib/candidate/dialog/root.svelte";
  import DialogTrigger from "$lib/candidate/dialog/trigger.svelte";
  import DialogPortal from "$lib/candidate/dialog/portal.svelte";
  import DialogOverlay from "$lib/candidate/dialog/overlay.svelte";
  import DialogContent from "$lib/candidate/dialog/content.svelte";
  import DialogTitle from "$lib/candidate/dialog/title.svelte";
  import DialogDescription from "$lib/candidate/dialog/description.svelte";
  import DialogClose from "$lib/candidate/dialog/close.svelte";
  import "$lib/candidate/styles/tokens.css";
  import "$lib/candidate/styles/dialog.css";
  let ready = $state(false);
  let open = $state(false);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Unregistered styled Dialog candidate</h1>
  <DialogRoot bind:open>
    <DialogTrigger id="style-trigger">Open styled candidate</DialogTrigger>
    <DialogPortal>
      <DialogOverlay id="style-overlay" />
      <DialogContent id="style-content">
        <DialogTitle id="style-title">Styled candidate title</DialogTitle>
        <DialogDescription id="style-description"
          >Source design defaults on actual native parts.</DialogDescription
        >
        <DialogClose id="disabled-close" disabled>Disabled close</DialogClose>
        <DialogClose id="style-close">Close styled candidate</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <DialogRoot
    ><DialogTrigger id="disabled-trigger" disabled
      >Disabled trigger</DialogTrigger
    ></DialogRoot
  >
</main>
