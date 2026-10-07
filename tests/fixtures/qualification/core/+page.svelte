<script lang="ts">
  import { onMount } from "svelte";
  import {
    Spinner,
    Button,
    Switch,
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
  let ready = $state(false),
    checked = $state(false),
    open = $state(false),
    loading = $state(false),
    actions = $state(0);
  const options: Pick<DialogContentProps, "restoreScrollDelay"> = {
    restoreScrollDelay: 0,
  };
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready} class="core-app">
  <h1>Actual installed complete core</h1>
  <Spinner mode="status" label="Core ready" />
  <Button
    id="action"
    {loading}
    loadingLabel="Saving core"
    onclick={() => {
      actions++;
    }}>Core action</Button
  >
  <button
    id="loading"
    onclick={() => {
      loading = !loading;
    }}>Toggle loading</button
  >
  <output id="actions">{actions}</output>
  <form id="core-form">
    <label for="core-switch">Enable core</label>
    <Switch id="core-switch" name="enabled" value="yes" bind:checked />
    <button type="reset" id="reset">Reset core</button>
  </form>
  <output id="checked">{String(checked)}</output>
  <DialogRoot bind:open>
    <DialogTrigger id="core-trigger">Open core dialog</DialogTrigger>
    <DialogPortal>
      <DialogOverlay id="core-overlay" />
      <DialogContent id="core-content" {...options}>
        <DialogTitle>Complete core dialog</DialogTitle>
        <DialogDescription
          >Installed source, tokens and primitives together</DialogDescription
        >
        <Button
          id="dialog-action"
          onclick={() => {
            actions++;
          }}>Nested native action</Button
        >
        <DialogClose id="core-close">Close core dialog</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</main>
