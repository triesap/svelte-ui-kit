<script lang="ts">
  import { onMount } from "svelte";
  import {
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogCancel,
  } from "__UI_MODULE__";
  import type { AlertDialogContentProps } from "__UI_MODULE__";
  let ready = $state(false);
  let nestedTheme = $state("one");
  const options: Pick<AlertDialogContentProps, "preventScroll"> = {
    preventScroll: false,
  };
  function changeGlobal() {
    document.documentElement.dataset.alertDialogTheme =
      document.documentElement.dataset.alertDialogTheme === "one"
        ? "two"
        : "one";
  }
  onMount(() => {
    const previous = document.documentElement.dataset.alertDialogTheme;
    document.documentElement.dataset.alertDialogTheme = "one";
    ready = true;
    return () => {
      if (previous === undefined)
        delete document.documentElement.dataset.alertDialogTheme;
      else document.documentElement.dataset.alertDialogTheme = previous;
    };
  });
</script>

<main data-ready={ready}>
  <h1>Actual installed portal themes</h1>
  <div id="nested-scope" data-theme={nestedTheme}>
    <AlertDialogRoot>
      <AlertDialogTrigger id="body-trigger">Open body portal</AlertDialogTrigger
      >
      <AlertDialogPortal>
        <AlertDialogOverlay id="body-overlay" />
        <AlertDialogContent id="body-content" {...options}>
          <AlertDialogTitle>Document theme dialog</AlertDialogTitle>
          <button id="change-global" onclick={changeGlobal}
            >Change document theme while open</button
          >
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
    <AlertDialogRoot>
      <AlertDialogTrigger id="nested-trigger"
        >Open nested portal</AlertDialogTrigger
      >
      <AlertDialogPortal to="#nested-host">
        <AlertDialogOverlay id="nested-overlay" />
        <AlertDialogContent id="nested-content" {...options}>
          <AlertDialogTitle>Nested theme dialog</AlertDialogTitle>
          <button
            id="change-nested"
            onclick={() => {
              nestedTheme = nestedTheme === "one" ? "two" : "one";
            }}>Change nested theme while open</button
          >
          <AlertDialogCancel>Close</AlertDialogCancel>
        </AlertDialogContent>
      </AlertDialogPortal>
    </AlertDialogRoot>
    <div id="nested-host"></div>
  </div>
  <AlertDialogRoot>
    <AlertDialogTrigger id="adverse-trigger"
      >Open deliberately unsuitable host</AlertDialogTrigger
    >
    <AlertDialogPortal to="#adverse-host">
      <AlertDialogOverlay id="adverse-overlay" />
      <AlertDialogContent id="adverse-content" {...options}>
        <AlertDialogTitle>Clipped host example</AlertDialogTitle>
        <AlertDialogCancel>Close</AlertDialogCancel>
      </AlertDialogContent>
    </AlertDialogPortal>
  </AlertDialogRoot>
  <div id="adverse-host"></div>
</main>

<style>
  :global(html[data-alert-dialog-theme="one"]) {
    --kit-alert-dialog-background: rgb(31, 41, 51);
    --kit-alert-dialog-color: rgb(241, 242, 243);
  }
  :global(html[data-alert-dialog-theme="two"]) {
    --kit-alert-dialog-background: rgb(61, 71, 81);
    --kit-alert-dialog-color: rgb(211, 212, 213);
  }
  #nested-scope[data-theme="one"] {
    --kit-alert-dialog-background: rgb(91, 101, 111);
    --kit-alert-dialog-color: rgb(181, 182, 183);
  }
  #nested-scope[data-theme="two"] {
    --kit-alert-dialog-background: rgb(121, 131, 141);
    --kit-alert-dialog-color: rgb(151, 152, 153);
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
