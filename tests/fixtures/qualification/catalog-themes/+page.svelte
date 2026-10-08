<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import * as UI from "__UI_MODULE__";
  import type { MenuContentProps } from "__UI_MODULE__";
  import Catalog from "./Catalog.svelte";
  let ready = $state(false);
  let nested = $state("one");
  const kind = page.url.searchParams.get("kind") ?? "dialog";
  const customHost = page.url.searchParams.get("host") === "nested";
  const menu: Pick<MenuContentProps, "preventScroll"> = {
    preventScroll: false,
  };
  function changeGlobal() {
    const root = document.documentElement;
    root.dataset.catalogTheme =
      root.dataset.catalogTheme === "one" ? "two" : "one";
    localStorage.setItem("catalog-theme", root.dataset.catalogTheme);
  }
  onMount(() => {
    const previous = document.documentElement.dataset.catalogTheme;
    document.documentElement.dataset.catalogTheme =
      localStorage.getItem("catalog-theme") === "two" ? "two" : "one";
    ready = true;
    return () => {
      if (previous === undefined)
        delete document.documentElement.dataset.catalogTheme;
      else document.documentElement.dataset.catalogTheme = previous;
    };
  });
</script>

<main id="theme-qualification" data-ready={ready}>
  <h1 class="catalog-owned">Full installed catalog themes</h1>
  <button id="change-global" onclick={changeGlobal}
    >Change document theme</button
  >
  <div id="global-catalog"><Catalog /></div>
  <section id="nested-scope" data-nested-theme={nested}>
    <button
      id="change-nested"
      onclick={() => {
        nested = nested === "one" ? "two" : "one";
      }}>Change nested theme</button
    >
    <div id="nested-catalog"><Catalog /></div>
    {#if kind === "dialog"}
      <UI.DialogRoot
        ><UI.DialogTrigger id="theme-trigger"
          >Open themed Dialog</UI.DialogTrigger
        ><UI.DialogPortal to={customHost ? "#nested-host" : undefined}>
          <UI.DialogOverlay id="theme-overlay" /><UI.DialogContent
            id="theme-content"
            preventScroll={false}
            restoreScrollDelay={0}
          >
            <UI.DialogTitle>Themed Dialog</UI.DialogTitle><UI.DialogDescription
              >Actual theme inheritance</UI.DialogDescription
            >
            <button id="open-change-global" onclick={changeGlobal}
              >Change document theme</button
            >
            <button
              id="open-change-nested"
              onclick={() => {
                nested = nested === "one" ? "two" : "one";
              }}>Change nested theme</button
            >
            <UI.DialogClose>Close themed Dialog</UI.DialogClose>
          </UI.DialogContent>
        </UI.DialogPortal></UI.DialogRoot
      >
    {:else if kind === "alert"}
      <UI.AlertDialogRoot
        ><UI.AlertDialogTrigger id="theme-trigger"
          >Open themed Alert</UI.AlertDialogTrigger
        ><UI.AlertDialogPortal to={customHost ? "#nested-host" : undefined}>
          <UI.AlertDialogOverlay id="theme-overlay" /><UI.AlertDialogContent
            id="theme-content"
            preventScroll={false}
            restoreScrollDelay={0}
          >
            <UI.AlertDialogTitle>Themed Alert</UI.AlertDialogTitle
            ><UI.AlertDialogDescription
              >Actual theme inheritance</UI.AlertDialogDescription
            >
            <button id="open-change-global" onclick={changeGlobal}
              >Change document theme</button
            >
            <button
              id="open-change-nested"
              onclick={() => {
                nested = nested === "one" ? "two" : "one";
              }}>Change nested theme</button
            >
            <UI.AlertDialogCancel>Close themed Alert</UI.AlertDialogCancel>
          </UI.AlertDialogContent>
        </UI.AlertDialogPortal></UI.AlertDialogRoot
      >
    {:else}
      <UI.MenuRoot
        ><UI.MenuTrigger id="theme-trigger">Open themed Menu</UI.MenuTrigger
        ><UI.MenuPortal to={customHost ? "#nested-host" : undefined}>
          <UI.MenuContent id="theme-content" aria-label="Themed Menu" {...menu}>
            <UI.MenuItem
              closeOnSelect={false}
              id="open-change-global"
              onSelect={changeGlobal}>Change document theme</UI.MenuItem
            >
            <UI.MenuItem
              closeOnSelect={false}
              id="open-change-nested"
              onSelect={() => {
                nested = nested === "one" ? "two" : "one";
              }}>Change nested theme</UI.MenuItem
            >
          </UI.MenuContent>
        </UI.MenuPortal></UI.MenuRoot
      >
    {/if}
    <div id="nested-host"></div>
  </section>
</main>
