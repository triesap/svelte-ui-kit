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
  } from "__UI_MODULE__";
  import type { MenuRootProps } from "__UI_MODULE__";
  const initial = page.url.searchParams.get("initial") === "open";
  const mode = page.url.searchParams.get("portal") ?? "body";
  const native = page.url.searchParams.has("native");
  const direction: MenuRootProps["dir"] = page.url.searchParams.has("rtl")
    ? "rtl"
    : "ltr";
  let ready = $state(false);
  let open = $state(initial);
  let second = $state(false);
  let mounted = $state(true);
  let key = $state(0);
  let dynamic = $state(true);
  let corner = $state(page.url.searchParams.has("corner"));
  let theme = $state("one");
  let host = $state<HTMLDivElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let selections = $state(0);
  const globalTheme = () => {
    document.documentElement.dataset.menuTheme =
      document.documentElement.dataset.menuTheme === "one" ? "two" : "one";
  };
  onMount(() => {
    const previous = document.documentElement.dataset.menuTheme;
    document.documentElement.dataset.menuTheme = "one";
    ready = true;
    return () => {
      if (previous === undefined)
        delete document.documentElement.dataset.menuTheme;
      else document.documentElement.dataset.menuTheme = previous;
    };
  });
</script>

<main
  data-ready={ready}
  data-initial={initial ? "open" : "closed"}
  dir={direction}
>
  <h1>Installed Menu floating qualification</h1>
  <output id="ref-state"
    >{contentRef?.tagName ?? "none"}; selected {selections}</output
  >
  <button id="global-theme" onclick={globalTheme}>Global theme</button>
  <button
    id="nested-theme"
    onclick={() => (theme = theme === "one" ? "two" : "one")}
    >Nested theme</button
  >
  <button id="corner" onclick={() => (corner = !corner)}
    >Corner placement</button
  >
  <button id="replace" onclick={() => key++}>Replace Content</button>
  <button id="dynamic" onclick={() => (dynamic = !dynamic)}
    >Toggle dynamic item</button
  >
  <button id="destroy" onclick={() => (mounted = !mounted)}>Toggle Root</button>
  <section
    id="scope"
    data-nested-menu-theme={theme}
    class:adverse={mode === "adverse"}
  >
    <div id="portal-host" bind:this={host}></div>
    <div id="scroll-host">
      <div class="scroll-spacer"></div>
      <div class:corner>
        {#if native}
          <NativeMenu.Root open={initial}>
            <NativeMenu.Trigger data-instance="native"
              >Native SSR control</NativeMenu.Trigger
            >
            <NativeMenu.Portal disabled={mode === "inline"}
              ><NativeMenu.Content aria-label="Native control"
                ><NativeMenu.Item>Native choice</NativeMenu.Item
                ></NativeMenu.Content
              ></NativeMenu.Portal
            >
          </NativeMenu.Root>
        {:else if mounted}
          <MenuRoot bind:open dir={direction}>
            <MenuTrigger id="placement-trigger" data-instance="first"
              >Floating choices</MenuTrigger
            >
            <MenuPortal
              disabled={mode === "inline"}
              to={mode === "custom" || mode === "adverse" ? host : undefined}
            >
              {#key key}
                <MenuContent
                  id="placement-content"
                  data-instance="first"
                  aria-label="Floating choices"
                  bind:ref={contentRef}
                  dir={direction}
                  preventScroll={false}
                  onInteractOutside={(event) => event.preventDefault()}
                  onOpenAutoFocus={(event) => event.preventDefault()}
                >
                  <MenuItem id="first-item" closeOnSelect={false}
                    >First choice</MenuItem
                  >
                  {#if dynamic}<MenuItem
                      id="dynamic-item"
                      closeOnSelect={false}
                      onSelect={() => selections++}>Dynamic choice</MenuItem
                    >{/if}
                  <MenuItem id="last-item" closeOnSelect={false}
                    >Last choice</MenuItem
                  >
                </MenuContent>
              {/key}
            </MenuPortal>
          </MenuRoot>
        {/if}
      </div>
      <div class="scroll-tail"></div>
    </div>
    <MenuRoot bind:open={second}>
      <MenuTrigger id="second-trigger" data-instance="second"
        >Second instance</MenuTrigger
      >
      <MenuPortal
        ><MenuContent
          id="second-content"
          data-instance="second"
          aria-label="Second choices"
          preventScroll={false}><MenuItem>Second choice</MenuItem></MenuContent
        ></MenuPortal
      >
    </MenuRoot>
  </section>
</main>

<style>
  :global(:root[data-menu-theme="one"]) {
    --kit-menu-content-background: rgb(21, 34, 55);
    --kit-menu-content-color: rgb(240, 241, 242);
  }
  :global(:root[data-menu-theme="two"]) {
    --kit-menu-content-background: rgb(55, 34, 21);
    --kit-menu-content-color: rgb(220, 221, 222);
  }
  #scope[data-nested-menu-theme="one"] {
    --kit-menu-content-background: rgb(10, 50, 90);
    --kit-menu-content-color: rgb(230, 231, 232);
  }
  #scope[data-nested-menu-theme="two"] {
    --kit-menu-content-background: rgb(90, 50, 10);
    --kit-menu-content-color: rgb(210, 211, 212);
  }
  #scroll-host {
    height: 240px;
    width: 500px;
    max-width: 90vw;
    overflow: auto;
    border: 1px solid black;
  }
  .scroll-tail {
    height: 500px;
  }
  .scroll-spacer {
    height: 60px;
  }
  .corner {
    position: fixed;
    right: 2px;
    bottom: 2px;
  }
  .adverse {
    transform: translateZ(0);
    height: 150px;
    width: 220px;
    overflow: hidden;
  }
</style>
