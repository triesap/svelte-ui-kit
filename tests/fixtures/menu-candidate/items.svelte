<script lang="ts">
  import { onMount } from "svelte";
  import Root from "$lib/candidate/menu/root.svelte";
  import Trigger from "$lib/candidate/menu/trigger.svelte";
  import Content from "$lib/candidate/menu/content.svelte";
  import Item from "$lib/candidate/menu/item.svelte";
  import RadioGroup from "$lib/candidate/menu/radio-group.svelte";
  import RadioItem from "$lib/candidate/menu/radio-item.svelte";
  import Indicator from "$lib/candidate/menu/item-indicator.svelte";
  let ready = $state(false);
  let open = $state(true);
  let value = $state("alpha");
  let cancel = $state(false);
  let selected = $state(0);
  let changed = $state(0);
  let itemRef = $state<HTMLElement | null>(null);
  let groupRef = $state<HTMLElement | null>(null);
  let radioRef = $state<HTMLElement | null>(null);
  let indicatorRef = $state<HTMLSpanElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let delegatedGroupRef = $state<HTMLElement | null>(null);
  let delegatedRadioRef = $state<HTMLElement | null>(null);
  onMount(() => {
    ready = true;
  });
  function select(event: Event) {
    selected++;
    if (cancel) event.preventDefault();
  }
</script>

<main data-ready={ready}>
  <h1>Native Menu item composition</h1>
  <output id="state"
    >Open {open}; value {value}; selected {selected}; changed {changed}</output
  >
  <output id="refs"
    >{itemRef?.tagName ?? "none"}/{groupRef?.tagName ??
      "none"}/{radioRef?.tagName ?? "none"}/{indicatorRef?.tagName ??
      "none"}/{delegatedRef?.tagName ?? "none"}/{delegatedGroupRef?.tagName ??
      "none"}/{delegatedRadioRef?.tagName ?? "none"}</output
  >
  <button id="cancel" onclick={() => (cancel = !cancel)}
    >Cancel selection</button
  >
  <button id="parent-value" onclick={() => (value = "beta")}>Parent beta</button
  >
  <Root bind:open>
    <Trigger id="trigger">Open items</Trigger>
    <Content
      id="content"
      aria-label="Item menu"
      preventScroll={false}
      onOpenAutoFocus={(event) => event.preventDefault()}
      onInteractOutside={(event) => event.preventDefault()}
    >
      <Item
        id="ordinary"
        bind:ref={itemRef}
        class="caller-item"
        data-caller="ordinary"
        onSelect={select}
        closeOnSelect={false}>Ordinary choice</Item
      >
      <Item id="disabled" disabled onSelect={select}>Disabled choice</Item>
      <Item id="closing" onSelect={select}>Closing choice</Item>
      <Item
        id="delegated"
        bind:ref={delegatedRef}
        class="delegated-item"
        closeOnSelect={false}
        onSelect={select}
      >
        {#snippet child({ props })}<section {...props} data-delegated="item">
            Delegated choice
          </section>{/snippet}
      </Item>
      <RadioGroup
        id="group"
        bind:value
        bind:ref={groupRef}
        class="caller-group"
        onValueChange={() => changed++}
      >
        <RadioItem
          id="alpha"
          value="alpha"
          bind:ref={radioRef}
          class="caller-radio"
          closeOnSelect={false}
          onSelect={select}
        >
          {#snippet children({ checked })}<span
              class="kit-menu-radio-item-label">Alpha</span
            ><Indicator
              id="alpha-indicator"
              {checked}
              bind:ref={indicatorRef}
              class="caller-indicator"
              aria-hidden="true">✓</Indicator
            >{/snippet}
        </RadioItem>
        <RadioItem
          id="beta"
          value="beta"
          closeOnSelect={false}
          onSelect={select}
        >
          {#snippet child({ props, checked })}<section
              {...props}
              data-delegated="radio"
            >
              <span>Beta</span><Indicator
                id="beta-indicator"
                {checked}
                aria-hidden="true">✓</Indicator
              >
            </section>{/snippet}
        </RadioItem>
        <RadioItem
          id="disabled-radio"
          value="disabled"
          disabled
          onSelect={select}>Disabled radio</RadioItem
        >
      </RadioGroup>
      <RadioGroup
        id="delegated-group"
        bind:ref={delegatedGroupRef}
        class="delegated-group"
      >
        {#snippet child({ props })}<section {...props} data-delegated="group">
            <RadioItem
              id="delegated-radio"
              value="first"
              bind:ref={delegatedRadioRef}
              closeOnSelect={false}
            >
              {#snippet children({ checked })}Uncontrolled first<Indicator
                  id="uncontrolled-indicator"
                  {checked}>✓</Indicator
                >{/snippet}
            </RadioItem>
          </section>{/snippet}
      </RadioGroup>
    </Content>
  </Root>
</main>
