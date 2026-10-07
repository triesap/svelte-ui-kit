<script lang="ts">
  import { onMount } from "svelte";
  import {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "__UI_MODULE__";
  import type { DialogContentProps } from "__UI_MODULE__";
  let ready = $state(false);
  let nestedTheme = $state("one");
  const options: Pick<DialogContentProps, "preventScroll"> = {
    preventScroll: false,
  };
  function changeGlobal() {
    document.documentElement.dataset.dialogTheme =
      document.documentElement.dataset.dialogTheme === "one" ? "two" : "one";
  }
  onMount(() => {
    const previous = document.documentElement.dataset.dialogTheme;
    document.documentElement.dataset.dialogTheme = "one";
    ready = true;
    return () => {
      if (previous === undefined)
        delete document.documentElement.dataset.dialogTheme;
      else document.documentElement.dataset.dialogTheme = previous;
    };
  });
</script>

<main data-ready={ready}>
  <h1>Actual installed portal themes</h1>
  <div id="nested-scope" data-theme={nestedTheme}>
    <DialogRoot>
      <DialogTrigger id="body-trigger">Open body portal</DialogTrigger>
      <DialogPortal>
        <DialogOverlay id="body-overlay" />
        <DialogContent id="body-content" {...options}>
          <DialogTitle>Document theme dialog</DialogTitle>
          <button id="change-global" onclick={changeGlobal}
            >Change document theme while open</button
          >
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <DialogRoot>
      <DialogTrigger id="nested-trigger">Open nested portal</DialogTrigger>
      <DialogPortal to="#nested-host">
        <DialogOverlay id="nested-overlay" />
        <DialogContent id="nested-content" {...options}>
          <DialogTitle>Nested theme dialog</DialogTitle>
          <button
            id="change-nested"
            onclick={() => {
              nestedTheme = nestedTheme === "one" ? "two" : "one";
            }}>Change nested theme while open</button
          >
          <DialogClose>Close</DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
    <div id="nested-host"></div>
  </div>
  <DialogRoot>
    <DialogTrigger id="adverse-trigger"
      >Open deliberately unsuitable host</DialogTrigger
    >
    <DialogPortal to="#adverse-host">
      <DialogOverlay id="adverse-overlay" />
      <DialogContent id="adverse-content" {...options}>
        <DialogTitle>Clipped host example</DialogTitle>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <div id="adverse-host"></div>
</main>

<style>
  :global(html[data-dialog-theme="one"]) {
    --kit-dialog-background: rgb(31, 41, 51);
    --kit-dialog-color: rgb(241, 242, 243);
  }
  :global(html[data-dialog-theme="two"]) {
    --kit-dialog-background: rgb(61, 71, 81);
    --kit-dialog-color: rgb(211, 212, 213);
  }
  #nested-scope[data-theme="one"] {
    --kit-dialog-background: rgb(91, 101, 111);
    --kit-dialog-color: rgb(181, 182, 183);
  }
  #nested-scope[data-theme="two"] {
    --kit-dialog-background: rgb(121, 131, 141);
    --kit-dialog-color: rgb(151, 152, 153);
  }
  #adverse-host {
    transform: translateZ(0);
    overflow: hidden;
    position: relative;
    inline-size: 100px;
    block-size: 80px;
    isolation: isolate;
    z-index: 1;
  }
</style>
