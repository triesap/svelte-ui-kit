<script lang="ts">
  import { onMount } from "svelte";
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
  } from "__UI_MODULE__";
  import type {
    MenuRootProps,
    MenuContentProps,
    MenuRadioItemProps,
    MenuItemIndicatorProps,
  } from "__UI_MODULE__";
  let ready = $state(false);
  let open = $state(false);
  let value = $state("a");
  const rootOptions: MenuRootProps = {};
  const contentOptions: MenuContentProps = { preventScroll: false };
  const radioOptions: MenuRadioItemProps = { value: "a", closeOnSelect: false };
  const indicatorOptions: MenuItemIndicatorProps = {
    checked: true,
    "aria-hidden": true,
  };
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Generated native Menu</h1>
  <DialogRoot><p>Separate generic Dialog context</p></DialogRoot>
  <MenuRoot {...rootOptions} bind:open>
    <MenuTrigger id="generated-trigger">Open installed Menu</MenuTrigger>
    <MenuPortal>
      <MenuContent
        {...contentOptions}
        id="generated-content"
        aria-label="Installed choices"
      >
        <MenuItem id="generated-item">Ordinary choice</MenuItem>
        <MenuRadioGroup bind:value>
          <MenuRadioItem {...radioOptions} id="generated-radio">
            {#snippet children({ checked })}<span
                class="kit-menu-radio-item-label">Radio choice</span
              ><MenuItemIndicator
                {...indicatorOptions}
                {checked}
                id="generated-indicator">✓</MenuItemIndicator
              >{/snippet}
          </MenuRadioItem>
        </MenuRadioGroup>
      </MenuContent>
    </MenuPortal>
  </MenuRoot>
</main>
