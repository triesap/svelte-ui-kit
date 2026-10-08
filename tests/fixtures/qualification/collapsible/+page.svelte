<script lang="ts">
  import { page } from "$app/state";
  import { Collapsible as BitsCollapsible } from "bits-ui";
  import { onMount } from "svelte";
  import {
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
  } from "__UI_MODULE__";
  import type { CollapsibleRootProps } from "__UI_MODULE__";
  let ready = $state(false);
  let customized = $state(false);
  let rtl = $state(false);
  let mounted = $state(true);
  let motion = $state(false);
  let completions = $state(0);
  let submits = $state(0);
  let independent = $state([false, true]);
  const options: Pick<CollapsibleRootProps, "aria-label"> = {
    "aria-label": "Installed disclosure",
  };
  let open = $state(page.url.searchParams.get("open") === "true");
  let disabled = $state(false);
  let forceMount = $state(false);
  let cancel = $state(false);
  let clicks = $state(0);
  let callbacks = $state(0);
  let completed = $state("none");
  let rootRef = $state<HTMLElement | null>(null);
  let triggerRef = $state<HTMLElement | null>(null);
  let contentRef = $state<HTMLElement | null>(null);
  let delegatedRef = $state<HTMLElement | null>(null);
  onMount(() => {
    ready = true;
  });
</script>

<main class:customized class:motion dir={rtl ? "rtl" : "ltr"}>
  <h1>Installed Collapsible qualification</h1>
  <button
    onclick={() => {
      customized = !customized;
    }}>Toggle collapsible theme</button
  >
  <button
    onclick={() => {
      rtl = !rtl;
    }}>Toggle collapsible direction</button
  >
  <p data-ready={ready}>Hydrated</p>
  <p id="state">{open}; callbacks {callbacks}; clicks {clicks}</p>
  <p id="completed">{completed}</p>
  <p id="completions">{completions}</p>
  <p id="submits">{submits}</p>
  <button
    onclick={() => {
      mounted = !mounted;
    }}>Toggle disclosure mount</button
  >
  <button
    onclick={() => {
      motion = !motion;
    }}>Toggle disclosure motion</button
  >
  <p id="refs">
    {rootRef?.tagName ?? "none"};{triggerRef?.tagName ??
      "none"};{contentRef?.tagName ?? "none"};{delegatedRef?.tagName ?? "none"}
  </p>
  <button
    onclick={() => {
      open = !open;
    }}>Set candidate open</button
  >
  <button
    onclick={() => {
      disabled = !disabled;
    }}>Toggle candidate disabled</button
  >
  <button
    onclick={() => {
      forceMount = !forceMount;
    }}>Toggle candidate force mount</button
  >
  <button
    onclick={() => {
      cancel = !cancel;
    }}>Toggle candidate cancellation</button
  >
  <button
    onclick={() => {
      triggerRef?.focus();
    }}>Focus candidate ref</button
  >
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits += 1;
    }}
  >
    {#if mounted}
      <CollapsibleRoot
        id="disclosure"
        {...options}
        bind:open
        bind:ref={rootRef}
        {disabled}
        class={["caller", { retained: true }]}
        data-caller="root"
        onOpenChange={() => {
          callbacks += 1;
        }}
        onOpenChangeComplete={(value) => {
          completed = String(value);
          completions += 1;
        }}
      >
        <CollapsibleTrigger
          id="disclosure-trigger"
          bind:ref={triggerRef}
          class="caller-trigger"
          data-caller="trigger"
          onclick={(event) => {
            clicks += 1;
            if (cancel) event.preventDefault();
          }}>Disclosure details</CollapsibleTrigger
        >
        <CollapsibleContent
          id="disclosure-content"
          bind:ref={contentRef}
          {forceMount}
          class="caller-content"
          data-caller="content"
          ><p>Details body</p>
          <input aria-label="Disclosure state" /></CollapsibleContent
        >
      </CollapsibleRoot>
    {/if}
  </form>
  <section aria-label="Independent disclosure recipe">
    {#each [0, 1] as index (index)}
      <CollapsibleRoot bind:open={independent[index]} data-auto-group={index}>
        <h2>
          <CollapsibleTrigger data-auto-trigger={index}
            >Recipe item {index + 1}</CollapsibleTrigger
          >
        </h2>
        <CollapsibleContent data-auto-content={index}>
          <p>Recipe body {index + 1}</p>
          <input aria-label={`Recipe input ${index + 1}`} />
        </CollapsibleContent>
      </CollapsibleRoot>
    {/each}
  </section>
  {#snippet delegatedBody()}
    <CollapsibleTrigger id="delegated-trigger">
      {#snippet child({ props })}<button {...props} data-delegated="trigger"
          >Delegated details</button
        >{/snippet}
    </CollapsibleTrigger>
    <CollapsibleContent id="delegated-content" bind:ref={delegatedRef}>
      {#snippet child({ props, open })}<section
          {...props}
          data-delegated="content"
          data-delegated-open={open}
        >
          Delegated body
        </section>{/snippet}
    </CollapsibleContent>
  {/snippet}
  <CollapsibleRoot id="delegated-root" open={true} children={delegatedBody}>
    {#snippet child({ props })}<section {...props} data-delegated="root">
        {@render delegatedBody()}
      </section>{/snippet}
  </CollapsibleRoot>
  <BitsCollapsible.Root open={page.url.searchParams.get("open") === "true"}>
    <BitsCollapsible.Trigger id="raw-trigger"
      >Raw details</BitsCollapsible.Trigger
    >
    <BitsCollapsible.Content id="raw-content"
      ><p>Raw body</p></BitsCollapsible.Content
    >
  </BitsCollapsible.Root>
</main>

<style>
  main {
    --kit-radius-default: 3px;
    --kit-radius-control: 6px;
  }
  main.customized {
    --kit-collapsible-gap: 20px;
    --kit-collapsible-trigger-radius: 8px / 5px;
    --kit-collapsible-trigger-background: rgb(4 5 6);
    --kit-collapsible-content-padding-block: 10px;
  }
  /* Application-owned animation exercises native presence, not kit defaults. */
  .motion :global(#disclosure-content[data-state="open"]) {
    overflow: hidden;
    animation: disclosure-open 160ms linear;
  }
  .motion :global(#disclosure-content[data-state="closed"]:not([hidden])) {
    overflow: hidden;
    animation: disclosure-close 500ms linear;
  }
  @keyframes disclosure-open {
    from {
      height: 0;
    }
    to {
      height: var(--bits-collapsible-content-height);
    }
  }
  @keyframes disclosure-close {
    from {
      height: var(--bits-collapsible-content-height);
    }
    to {
      height: 0;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .motion :global(#disclosure-content[data-state="open"]),
    .motion :global(#disclosure-content[data-state="closed"]:not([hidden])) {
      animation: none;
    }
  }
</style>
