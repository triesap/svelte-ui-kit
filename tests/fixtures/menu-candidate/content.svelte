<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { DropdownMenu as RawMenu } from "bits-ui";
  import Root from "$lib/candidate/menu/root.svelte";
  import Trigger from "$lib/candidate/menu/trigger.svelte";
  import Portal from "$lib/candidate/menu/portal.svelte";
  import Content from "$lib/candidate/menu/content.svelte";

  const mode = page.url.searchParams.get("portal") ?? "inline";
  const custom = page.url.searchParams.has("placement");
  let ready = $state(false);
  let host = $state<HTMLDivElement | null>(null);
  let open = $state(true);
  let delegatedOpen = $state(false);
  let contentRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let escapes = $state(0);
  let outside = $state(0);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Incremental floating Menu Content</h1>
  <output id="refs"
    >{contentRef?.tagName ?? "none"}/{delegatedRef?.tagName ?? "none"}</output
  >
  <output id="events">Escapes {escapes}; outside {outside}</output>
  <div id="portal-host" bind:this={host}></div>
  <button id="toggle-delegated" onclick={() => (delegatedOpen = !delegatedOpen)}
    >Toggle delegated</button
  >
  <Root bind:open>
    <Trigger id="content-trigger">Content trigger</Trigger>
    <Portal
      disabled={mode === "inline"}
      to={mode === "selector"
        ? "#portal-host"
        : mode === "element"
          ? host
          : undefined}
    >
      <Content
        id="default-content"
        aria-label="Default floating menu"
        bind:ref={contentRef}
        class={["caller", "retained"]}
        data-caller="preserved"
        preventScroll={false}
        onOpenAutoFocus={(event) => event.preventDefault()}
        {...custom
          ? {
              side: "top",
              align: "end",
              sideOffset: 12,
              collisionPadding: 16,
              strategy: "fixed",
              avoidCollisions: false,
            }
          : {}}
        onEscapeKeydown={(event) => {
          escapes++;
          event.preventDefault();
        }}
        onInteractOutside={(event) => {
          outside++;
          event.preventDefault();
        }}
      >
        <RawMenu.Item id="default-item">Default choice</RawMenu.Item>
      </Content>
    </Portal>
  </Root>
  <Root bind:open={delegatedOpen} dir="rtl">
    <Trigger id="delegated-trigger">Delegated trigger</Trigger>
    <Content
      id="delegated-content"
      aria-label="Delegated floating menu"
      bind:ref={delegatedRef}
      class="delegated-caller"
      dir="rtl"
      forceMount
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
    >
      {#snippet child({ props, wrapperProps, open })}
        <article {...wrapperProps} data-outer="actual" hidden={!open}>
          <section {...props} data-child-open={open}>
            <RawMenu.Item id="delegated-content-item"
              >Delegated choice</RawMenu.Item
            >
          </section>
        </article>
      {/snippet}
    </Content>
  </Root>
</main>
