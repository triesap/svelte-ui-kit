<script lang="ts">
  import { page } from "$app/state";
  import { Tabs as BitsTabs } from "bits-ui";
  import { onMount } from "svelte";
  import TabsRoot from "$lib/candidate/tabs/root.svelte";
  import TabsList from "$lib/candidate/tabs/list.svelte";
  import type { TabsRootProps } from "$lib/candidate/tabs/types.js";
  let value = $state(page.url.searchParams.get("value") ?? "a");
  let ready = $state(false);
  let callbacks = $state(0);
  let rootRef = $state<HTMLElement | null>(null);
  let listRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let manual = $state(false);
  let vertical = $state(false);
  let disabled = $state(false);
  const options: Pick<TabsRootProps, "loop" | "dir"> = {
    loop: false,
    dir: "rtl",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Candidate Tabs Root and List</h1>
<p data-ready={ready}>Hydrated</p>
<p id="value">{value}; callbacks {callbacks}</p>
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
    <BitsTabs.Trigger id="tab-a" value="a">Tab A</BitsTabs.Trigger>
    <BitsTabs.Trigger id="tab-b" value="b">Tab B</BitsTabs.Trigger>
    <BitsTabs.Trigger id="tab-disabled" value="disabled" disabled
      >Unavailable tab</BitsTabs.Trigger
    >
  </TabsList>
  <BitsTabs.Content id="panel-a" value="a"
    ><p>Panel A</p>
    <input aria-label="Panel A state" /></BitsTabs.Content
  >
  <BitsTabs.Content id="panel-b" value="b"><p>Panel B</p></BitsTabs.Content>
</TabsRoot>

{#snippet delegatedTabs()}
  <TabsList id="delegated-list" aria-label="Delegated settings">
    {#snippet child({ props })}
      <nav {...props} data-delegated="list">
        <BitsTabs.Trigger id="delegated-tab-a" value="a"
          >Delegated A</BitsTabs.Trigger
        >
        <BitsTabs.Trigger id="delegated-tab-b" value="b"
          >Delegated B</BitsTabs.Trigger
        >
      </nav>
    {/snippet}
  </TabsList>
  <BitsTabs.Content id="delegated-panel-a" value="a"
    >Delegated panel A</BitsTabs.Content
  >
  <BitsTabs.Content id="delegated-panel-b" value="b"
    >Delegated panel B</BitsTabs.Content
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
