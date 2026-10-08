<script lang="ts">
  import {
    DialogRoot,
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
  } from "__UI_MODULE__";
  import type { DialogRootProps, AlertDialogRootProps } from "__UI_MODULE__";
  let open = $state(false);
  const initial: AlertDialogRootProps = { open: false };
  void initial;
  const dialogInitial: DialogRootProps = { open: false };
  void dialogInitial;
</script>

<main>
  <h1>Generated native Alert Dialog</h1>
  <DialogRoot><p>Separate generic Dialog context</p></DialogRoot>
  <AlertDialogRoot bind:open>
    <AlertDialogTrigger id="generated-trigger">Open decision</AlertDialogTrigger
    >
    <AlertDialogPortal>
      <AlertDialogOverlay id="generated-overlay" />
      <AlertDialogContent id="generated-content">
        <AlertDialogTitle>Generated decision title</AlertDialogTitle>
        <AlertDialogDescription
          >Generated decision description</AlertDialogDescription
        >
        <AlertDialogAction
          id="generated-action"
          onclick={() => {
            open = false;
          }}>Application confirmation</AlertDialogAction
        >
        <AlertDialogCancel id="generated-cancel">Cancel</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
</main>
