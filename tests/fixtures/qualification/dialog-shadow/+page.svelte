<script lang="ts">
  import { onMount } from "svelte";
  import { Dialog as BitsDialog } from "bits-ui";
  import {
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } from "__UI_MODULE__";
  import type { DialogContentProps } from "__UI_MODULE__";
  const options: Pick<DialogContentProps, "trapFocus" | "preventScroll"> = {
    trapFocus: false,
    preventScroll: false,
  };
  let wrapperTarget = $state<HTMLElement | null>(null);
  let nativeTarget = $state<HTMLElement | null>(null);
  onMount(() => {
    for (const id of ["wrapper-host", "native-host"]) {
      const shadow = document
        .getElementById(id)!
        .attachShadow({ mode: "open" });
      const target = document.createElement("div");
      shadow.appendChild(target);
      if (id === "wrapper-host") wrapperTarget = target;
      else nativeTarget = target;
    }
  });
</script>

<div id="wrapper-host"></div>
<div id="native-host"></div>
<main data-ready={Boolean(wrapperTarget && nativeTarget)}>
  {#if wrapperTarget}
    <DialogRoot>
      <DialogTrigger id="wrapper-trigger">Open wrapper</DialogTrigger>
      <DialogPortal to={wrapperTarget}>
        <DialogContent {...options}>
          <DialogTitle>Wrapper title</DialogTitle>
          <DialogDescription>Wrapper real description</DialogDescription>
          <DialogClose>Close wrapper</DialogClose>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  {/if}
  {#if nativeTarget}
    <BitsDialog.Root>
      <BitsDialog.Trigger id="native-trigger">Open native</BitsDialog.Trigger>
      <BitsDialog.Portal to={nativeTarget}>
        <BitsDialog.Content trapFocus={false} preventScroll={false}>
          <BitsDialog.Title>Native title</BitsDialog.Title>
          <BitsDialog.Description
            >Native real description</BitsDialog.Description
          >
          <BitsDialog.Close>Close native</BitsDialog.Close>
        </BitsDialog.Content>
      </BitsDialog.Portal>
    </BitsDialog.Root>
  {/if}
</main>
