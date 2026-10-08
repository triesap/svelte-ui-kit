<script lang="ts">
  import { onMount } from "svelte";
  import { page as routePage } from "$app/state";
  import { RadioGroup as BitsRadioGroup } from "bits-ui";
  import RadioGroup from "$lib/candidate/radio/group.svelte";
  import RadioItem from "$lib/candidate/radio/item.svelte";
  import type {
    RadioGroupProps,
    RadioItemProps,
  } from "$lib/candidate/radio/types.js";
  let ready = $state(false);
  let value = $state(routePage.url.searchParams.get("value") ?? "a");
  let rawValue = $state("a");
  let callbacks = $state(0);
  let itemRef = $state<HTMLElement | null>(null);
  let groupRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  let disabled = $state(false);
  let cancel = $state(false);
  let clicks = $state(0);
  const options: Pick<RadioGroupProps, "name" | "required" | "orientation"> = {
    name: "candidate",
    required: true,
    orientation: "horizontal",
  };
  const itemOptions: Pick<RadioItemProps, "value"> = { value: "a" };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Radio candidate</h1>
<p data-ready={ready}>Ready</p>
<p id="value">{value}</p>
<p id="raw-value">{rawValue}</p>
<p id="callbacks">{callbacks}; clicks {clicks}</p>
<p id="refs">
  {groupRef?.tagName ?? "none"};{itemRef?.tagName ??
    "none"};{delegatedRef?.tagName ?? "none"}
</p>
<button
  onclick={() => {
    value = "b";
  }}>Set candidate value</button
>
<button
  onclick={() => {
    disabled = !disabled;
  }}>Toggle choice disabled</button
>
<button
  onclick={() => {
    cancel = !cancel;
  }}>Toggle cancellation</button
>
<form id="candidate-form">
  <RadioGroup
    id="group"
    bind:value
    bind:ref={groupRef}
    {...options}
    aria-label="Candidate choices"
    class="caller"
    data-caller="retained"
    onValueChange={() => {
      callbacks += 1;
    }}
  >
    <RadioItem
      id="choice-a"
      {...itemOptions}
      bind:ref={itemRef}
      aria-label="Candidate A"
      class="caller"
      onclick={(event) => {
        clicks += 1;
        if (cancel) event.preventDefault();
      }}
    >
      {#snippet children({ checked })}<span data-default-checked={checked}
          >A</span
        >{/snippet}
    </RadioItem>
    <RadioItem id="choice-b" value="b" {disabled} aria-label="Candidate B" />
  </RadioGroup>
  <button type="reset">Reset candidate</button>
</form>
<form id="raw-form">
  <BitsRadioGroup.Root
    bind:value={rawValue}
    name="raw"
    aria-label="Native choices"
  >
    <BitsRadioGroup.Item id="raw-a" value="a" aria-label="Native A" />
    <BitsRadioGroup.Item id="raw-b" value="b" aria-label="Native B" />
  </BitsRadioGroup.Root>
  <button type="reset">Reset raw native</button>
</form>
<RadioGroup
  value="b"
  id="delegated-group"
  aria-label="Delegated choices"
  bind:ref={delegatedRef}
>
  {#snippet child({ props })}
    <section {...props} data-delegated="group">
      <RadioItem value="a" aria-label="Delegated A" />
      <RadioItem value="b" aria-label="Delegated B" id="delegated-b">
        {#snippet child({ props, checked })}<button
            {...props}
            data-delegated="item"
            ><span data-delegated-checked={checked}>B</span></button
          >{/snippet}
      </RadioItem>
    </section>
  {/snippet}
</RadioGroup>
