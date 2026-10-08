<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { Dialog, AlertDialog } from "bits-ui";
  import * as UI from "__UI_MODULE__";
  import type { DialogContentProps } from "__UI_MODULE__";
  const native = page.url.searchParams.get("native") === "1";
  const alert = page.url.searchParams.get("kind") === "alert";
  const delegated = page.url.searchParams.get("policy") === "delegated";
  const options: Pick<
    DialogContentProps,
    "forceMount" | "preventScroll" | "restoreScrollDelay"
  > = {
    forceMount: true,
    ...(page.url.searchParams.get("policy") === "scroll-off"
      ? { preventScroll: false }
      : {}),
    restoreScrollDelay: 0,
  };
  const Root = native
    ? alert
      ? AlertDialog.Root
      : Dialog.Root
    : alert
      ? UI.AlertDialogRoot
      : UI.DialogRoot;
  const Content = native
    ? alert
      ? AlertDialog.Content
      : Dialog.Content
    : alert
      ? UI.AlertDialogContent
      : UI.DialogContent;
  const Title = native
    ? alert
      ? AlertDialog.Title
      : Dialog.Title
    : alert
      ? UI.AlertDialogTitle
      : UI.DialogTitle;
  const Description = native
    ? alert
      ? AlertDialog.Description
      : Dialog.Description
    : alert
      ? UI.AlertDialogDescription
      : UI.DialogDescription;
  let mounted = $state(true);
  let ready = $state(false);
  let activated = $state(0);
  onMount(() => {
    ready = true;
  });
</script>

<svelte:window
  onkeydown={(event) => {
    if (event.key === "F8") mounted = false;
  }}
/>
{#snippet delegatedChild({ props }: { props: Record<string, unknown> })}
  <div {...props}>
    <Title>Closed title</Title><Description>Closed description</Description>
  </div>
{/snippet}
<main data-ready={ready} data-mounted={mounted}>
  <h1>Closed force-mounted native modal comparison</h1>
  <button
    id="outside"
    onclick={() => {
      activated++;
    }}>Ordinary outside action</button
  >
  <output id="activated">{activated}</output>
  {#if mounted}
    <Root open={false}>
      <Content
        {...options}
        data-probe-part
        child={delegated ? delegatedChild : undefined}
      >
        <Title>Closed title</Title><Description>Closed description</Description>
      </Content>
    </Root>
  {/if}
</main>

<style>
  /* Application hides its retained closed content to isolate body locking. */
  :global([data-probe-part]) {
    visibility: hidden;
  }
</style>
