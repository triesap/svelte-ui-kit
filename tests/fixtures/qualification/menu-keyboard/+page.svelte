<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { DropdownMenu as NativeMenu } from "bits-ui";
  import {
    MenuRoot,
    MenuTrigger,
    MenuPortal,
    MenuContent,
    MenuItem,
    MenuRadioGroup,
    MenuRadioItem,
    MenuItemIndicator,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogClose,
  } from "__UI_MODULE__";
  import type { MenuRootProps } from "__UI_MODULE__";
  const direction: MenuRootProps["dir"] = page.url.searchParams.has("rtl")
    ? "rtl"
    : "ltr";
  let ready = $state(false);
  let open = $state(false);
  let value = $state("small");
  let cancelSelection = $state(false);
  let cancelDismiss = $state(false);
  let selections = $state(0);
  let changes = $state(0);
  let escapes = $state(0);
  let outside = $state(0);
  let dialogOpen = $state(false);
  let nestedOpen = $state(false);
  onMount(() => {
    ready = true;
  });
  function select(event: Event) {
    selections++;
    if (cancelSelection) event.preventDefault();
  }
</script>

<main data-ready={ready} dir={direction}>
  <h1>Installed Menu keyboard qualification</h1>
  <output id="state"
    >Open {open}; value {value}; selections {selections}; changes {changes};
    escapes {escapes}; outside {outside}</output
  >
  <label
    ><input
      id="cancel-selection"
      type="checkbox"
      bind:checked={cancelSelection}
    />Cancel selection</label
  >
  <label
    ><input
      id="cancel-dismiss"
      type="checkbox"
      bind:checked={cancelDismiss}
    />Cancel dismissal</label
  >
  <MenuRoot bind:open dir={direction}>
    <MenuTrigger id="trigger">Open choices</MenuTrigger>
    <MenuPortal>
      <MenuContent
        id="content"
        aria-label="Actions"
        dir={direction}
        preventScroll={false}
        onEscapeKeydown={(event) => {
          escapes++;
          if (cancelDismiss) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          outside++;
          if (cancelDismiss) event.preventDefault();
        }}
      >
        <MenuItem id="apple" onSelect={select}>Apple</MenuItem>
        <MenuItem id="disabled" disabled onSelect={select}>Blocked</MenuItem>
        <MenuItem
          id="banana"
          textValue="Banana"
          closeOnSelect={false}
          onSelect={select}>Banana fruit choice</MenuItem
        >
        <MenuItem id="cherry" onSelect={select}>Cherry</MenuItem>
        <MenuRadioGroup id="sizes" bind:value onValueChange={() => changes++}>
          <MenuRadioItem
            id="small"
            value="small"
            closeOnSelect={false}
            onSelect={select}
          >
            {#snippet children({ checked })}<span
                class="kit-menu-radio-item-label">Small</span
              ><MenuItemIndicator
                {checked}
                id="small-indicator"
                aria-hidden="true">✓</MenuItemIndicator
              >{/snippet}
          </MenuRadioItem>
          <MenuRadioItem
            id="large"
            value="large"
            closeOnSelect={false}
            onSelect={select}
          >
            {#snippet children({ checked })}<span
                class="kit-menu-radio-item-label">Large</span
              ><MenuItemIndicator
                {checked}
                id="large-indicator"
                aria-hidden="true">✓</MenuItemIndicator
              >{/snippet}
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
  <DialogRoot bind:open={dialogOpen}>
    <DialogTrigger id="dialog-trigger">Open dialog</DialogTrigger>
    <DialogPortal>
      <DialogOverlay id="dialog-overlay" />
      <DialogContent id="dialog-content" aria-describedby={undefined}>
        <DialogTitle>Nested choice dialog</DialogTitle>
        <MenuRoot bind:open={nestedOpen}>
          <MenuTrigger id="nested-trigger">Nested choices</MenuTrigger>
          <MenuPortal>
            <MenuContent
              id="nested-content"
              aria-label="Nested actions"
              preventScroll={false}
            >
              <MenuItem id="nested-first">First nested choice</MenuItem>
              <MenuItem id="nested-second">Second nested choice</MenuItem>
            </MenuContent>
          </MenuPortal>
        </MenuRoot>
        <DialogClose id="dialog-close">Close dialog</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
  <MenuRoot>
    <MenuTrigger id="alias-trigger">Candidate textValue boundary</MenuTrigger>
    <MenuPortal
      ><MenuContent
        id="alias-content"
        aria-label="Candidate alias control"
        preventScroll={false}
      >
        <MenuItem id="alias-first">First</MenuItem>
        <MenuItem id="alias-item" textValue="Alias">Zebra</MenuItem>
      </MenuContent></MenuPortal
    >
  </MenuRoot>
  <NativeMenu.Root>
    <NativeMenu.Trigger id="native-alias-trigger"
      >Native textValue control</NativeMenu.Trigger
    >
    <NativeMenu.Portal
      ><NativeMenu.Content
        id="native-alias-content"
        aria-label="Native alias control"
        preventScroll={false}
      >
        <NativeMenu.Item id="native-alias-first">First</NativeMenu.Item>
        <NativeMenu.Item id="native-alias-item" textValue="Alias"
          >Zebra</NativeMenu.Item
        >
      </NativeMenu.Content></NativeMenu.Portal
    >
  </NativeMenu.Root>
</main>
