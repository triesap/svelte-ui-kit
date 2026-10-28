<script lang="ts">
  import { onMount } from "svelte";
  import {
    Button,
    TextField,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
  } from "../generated/ui/index.js";

  let { label }: { label: string } = $props();
  let hydrated = $state(false);
  let count = $state(0);
  let value = $state<string | undefined>("");
  let dialogMounted = $state(true);
  onMount(() => {
    hydrated = true;
  });
</script>

<section data-island={label} data-hydrated={hydrated}>
  <h2>{label} independent island</h2>
  <TextField name={label.toLowerCase()} label={`${label} name`} bind:value />
  <p data-testid={`${label}-value`}>{value}</p>
  <Button onclick={() => (count += 1)}>{label} increment</Button>
  <p data-testid={`${label}-count`}>{count}</p>
  {#if dialogMounted}
    <DialogRoot>
      <DialogTrigger>{label} dialog</DialogTrigger>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent>
          <DialogTitle>{label} details</DialogTitle>
          <DialogDescription>{label} application description</DialogDescription>
          <DialogClose>Close {label}</DialogClose>
          <Button onclick={() => (dialogMounted = false)}>
            Unmount {label} dialog
          </Button>
        </DialogContent>
      </DialogPortal>
    </DialogRoot>
  {:else}
    <Button onclick={() => (dialogMounted = true)}>Mount {label} dialog</Button>
  {/if}
</section>
