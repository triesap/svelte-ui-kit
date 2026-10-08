<script lang="ts">
  import { page } from "$app/state";
  import { Tabs as BitsTabs } from "bits-ui";
  import { onMount } from "svelte";
  import { TabsRoot, TabsList, TabsTrigger, TabsContent } from "__UI_MODULE__";
  import type { TabsRootProps } from "__UI_MODULE__";
  let value = $state(page.url.searchParams.get("value") ?? "a");
  let ready = $state(false);
  let customized = $state(false);
  let rtl = $state(false);
  let callbacks = $state(0);
  let rootRef = $state<HTMLElement | null>(null);
  let listRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let triggerRef = $state<HTMLElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let delegatedTriggerRef = $state<HTMLElement | null>(null);
  let delegatedContentRef = $state<HTMLElement | null>(null);
  let cancel = $state(false);
  let clicks = $state(0);
  let manual = $state(false);
  let vertical = $state(false);
  let disabled = $state(false);
  const options: Pick<TabsRootProps, "loop"> = {
    loop: false,
  };
  onMount(() => {
    ready = true;
  });
</script>

<main class:customized dir={rtl ? "rtl" : "ltr"}>
  <h1>Installed Tabs qualification</h1>
  <button
    onclick={() => {
      customized = !customized;
    }}>Toggle tabs theme</button
  >
  <button
    onclick={() => {
      rtl = !rtl;
    }}>Toggle tabs direction</button
  >
  <p data-ready={ready}>Hydrated</p>
  <p id="value">{value}; callbacks {callbacks}</p>
  <p id="part-refs">
    {triggerRef?.tagName ?? "none"};{contentRef?.tagName ??
      "none"};{delegatedTriggerRef?.tagName ??
      "none"};{delegatedContentRef?.tagName ?? "none"}
  </p>
  <p id="clicks">{clicks}</p>
  <button
    onclick={() => {
      cancel = !cancel;
    }}>Toggle tab cancellation</button
  >
  <p id="refs">
    {rootRef?.tagName ?? "none"};{listRef?.tagName ??
      "none"};{delegatedRef?.tagName ?? "none"}
  </p>
  <button
    onclick={() => {
      value = "b";
    }}>Set candidate tab B</button
  >
  <button
    onclick={() => {
      manual = !manual;
    }}>Toggle candidate manual</button
  >
  <button
    onclick={() => {
      vertical = !vertical;
    }}>Toggle candidate vertical</button
  >
  <button
    onclick={() => {
      disabled = !disabled;
    }}>Toggle candidate disabled</button
  >
  <TabsRoot
    id="tabs-root"
    {...options}
    bind:value
    bind:ref={rootRef}
    activationMode={manual ? "manual" : "automatic"}
    orientation={vertical ? "vertical" : "horizontal"}
    {disabled}
    class={["caller", { retained: true }]}
    data-caller="root"
    onValueChange={() => {
      callbacks += 1;
    }}
  >
    <TabsList
      id="tabs-list"
      bind:ref={listRef}
      aria-label="Candidate settings"
      class="caller-list"
      data-caller="list"
    >
      <TabsTrigger
        id="tab-a"
        value="a"
        bind:ref={triggerRef}
        class={["caller-trigger", { retained: true }]}
        data-caller="trigger"
        onclick={(event) => {
          clicks += 1;
          if (cancel) event.preventDefault();
        }}>Tab A</TabsTrigger
      >
      <TabsTrigger id="tab-b" value="b">Tab B</TabsTrigger>
      <TabsTrigger id="tab-disabled" value="disabled" disabled
        >Unavailable tab</TabsTrigger
      >
    </TabsList>
    <TabsContent
      id="panel-a"
      value="a"
      bind:ref={contentRef}
      class="caller-panel"
      data-caller="content"
      ><p>Panel A</p>
      <input aria-label="Panel A state" /></TabsContent
    >
    <TabsContent id="panel-b" value="b"><p>Panel B</p></TabsContent>
  </TabsRoot>

  {#snippet delegatedTabs()}
    <TabsList id="delegated-list" aria-label="Delegated settings">
      {#snippet child({ props })}
        <nav {...props} data-delegated="list">
          <TabsTrigger
            id="delegated-tab-a"
            value="a"
            bind:ref={delegatedTriggerRef}
          >
            {#snippet child({ props })}<button
                {...props}
                data-delegated="trigger">Delegated A</button
              >{/snippet}
          </TabsTrigger>
          <TabsTrigger id="delegated-tab-b" value="b">Delegated B</TabsTrigger>
        </nav>
      {/snippet}
    </TabsList>
    <TabsContent
      id="delegated-panel-a"
      value="a"
      bind:ref={delegatedContentRef}
    >
      {#snippet child({ props })}<section {...props} data-delegated="content">
          Delegated panel A
        </section>{/snippet}
    </TabsContent>
    <TabsContent id="delegated-panel-b" value="b">Delegated panel B</TabsContent
    >
  {/snippet}
  <TabsRoot
    value="b"
    id="delegated-root"
    bind:ref={delegatedRef}
    class="delegated-caller"
    children={delegatedTabs}
  >
    {#snippet child({ props })}<section {...props} data-delegated="root">
        {@render delegatedTabs()}
      </section>{/snippet}
  </TabsRoot>

  <BitsTabs.Root value="a"
    ><BitsTabs.List aria-label="Raw settings"
      ><BitsTabs.Trigger id="raw-tab-a" value="a">Raw A</BitsTabs.Trigger
      ><BitsTabs.Trigger id="raw-tab-b" value="b">Raw B</BitsTabs.Trigger
      ></BitsTabs.List
    ><BitsTabs.Content id="raw-panel-a" value="a">Raw panel A</BitsTabs.Content
    ><BitsTabs.Content id="raw-panel-b" value="b">Raw panel B</BitsTabs.Content
    ></BitsTabs.Root
  >
</main>

<style>
  main {
    --kit-radius-default: 3px;
    --kit-radius-control: 6px;
  }
  main.customized {
    --kit-tabs-gap: 20px;
    --kit-tabs-trigger-radius: 8px / 5px;
    --kit-tabs-trigger-background-active: rgb(4 5 6);
    --kit-tabs-panel-padding-block: 10px;
  }
</style>
