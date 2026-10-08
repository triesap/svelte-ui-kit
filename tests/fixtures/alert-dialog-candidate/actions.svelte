<script lang="ts">
  import { onMount } from "svelte";
  import Root from "$lib/candidate/alert-dialog/root.svelte";
  import Portal from "$lib/candidate/alert-dialog/portal.svelte";
  import Content from "$lib/candidate/alert-dialog/content.svelte";
  import Title from "$lib/candidate/alert-dialog/title.svelte";
  import Description from "$lib/candidate/alert-dialog/description.svelte";
  import Action from "$lib/candidate/alert-dialog/action.svelte";
  import Cancel from "$lib/candidate/alert-dialog/cancel.svelte";
  let ready = $state(false);
  let open = $state(true);
  let delegatedOpen = $state(true);
  let cancelEvents = $state(false);
  let disabled = $state(false);
  let actionCloses = $state(false);
  let titleRef = $state<HTMLElement | null>(null);
  let descriptionRef = $state<HTMLElement | null>(null);
  let actionRef = $state<HTMLElement | null>(null);
  let cancelRef = $state<HTMLElement | null>(null);
  let delegatedTitleRef = $state<HTMLElement | null>(null);
  let delegatedDescriptionRef = $state<HTMLElement | null>(null);
  let delegatedActionRef = $state<HTMLElement | null>(null);
  let delegatedCancelRef = $state<HTMLElement | null>(null);
  let actions = $state(0);
  let cancels = $state(0);
  let keys = $state(0);
  let submits = $state(0);
  let changes = $state(0);
  onMount(() => {
    ready = true;
  });
</script>

<main data-ready={ready}>
  <h1>Candidate native Alert Dialog decision controls</h1>
  <label
    ><input
      id="cancel-events"
      type="checkbox"
      bind:checked={cancelEvents}
    />Cancel events</label
  >
  <label
    ><input
      id="disabled"
      type="checkbox"
      bind:checked={disabled}
    />Disabled</label
  >
  <label
    ><input
      id="action-closes"
      type="checkbox"
      bind:checked={actionCloses}
    />Application closes after action</label
  >
  <button
    id="reopen"
    onclick={() => {
      open = true;
      delegatedOpen = true;
    }}>Reopen</button
  >
  <output id="state"
    >Open {open}; delegated {delegatedOpen}; actions {actions}; cancels {cancels};
    keys {keys}; submits {submits}; changes {changes}</output
  >
  <output id="refs"
    >{[
      titleRef,
      descriptionRef,
      actionRef,
      cancelRef,
      delegatedTitleRef,
      delegatedDescriptionRef,
      delegatedActionRef,
      delegatedCancelRef,
    ]
      .map((node) => node?.tagName ?? "none")
      .join("/")}</output
  >
  <form
    onsubmit={(event) => {
      event.preventDefault();
      submits++;
    }}
  >
    <Root
      bind:open
      onOpenChange={() => {
        changes++;
      }}
    >
      <Portal disabled>
        <Content
          id="content"
          trapFocus={false}
          preventScroll={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Title
            id="candidate-title"
            bind:ref={titleRef}
            class={["caller-title", "retained"]}>Decision title</Title
          >
          <Description
            id="candidate-description"
            bind:ref={descriptionRef}
            class="caller-description">Decision description</Description
          >
          <Action
            id="candidate-action"
            bind:ref={actionRef}
            class="caller-action"
            data-caller="action"
            {disabled}
            onclick={() => {
              actions++;
              if (actionCloses) open = false;
            }}>Confirm</Action
          >
          <Cancel
            id="candidate-cancel"
            bind:ref={cancelRef}
            class="caller-cancel"
            data-caller="cancel"
            {disabled}
            onclick={(event) => {
              cancels++;
              if (cancelEvents) event.preventDefault();
            }}
            onkeydown={(event) => {
              keys++;
              if (cancelEvents) event.preventDefault();
            }}>Cancel</Cancel
          >
          <Action id="submit-action" type="submit">Explicit submit</Action>
          <Action id="reset-action" type="reset">Explicit reset</Action>
        </Content>
      </Portal>
    </Root>
    <Root bind:open={delegatedOpen}>
      <Portal disabled>
        <Content
          id="delegated-content"
          trapFocus={false}
          preventScroll={false}
          onOpenAutoFocus={(event) => event.preventDefault()}
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <Title
            id="delegated-title"
            bind:ref={delegatedTitleRef}
            level={3}
            class="delegated-title"
          >
            {#snippet child({ props })}<h3 {...props}>
                Delegated decision title
              </h3>{/snippet}
          </Title>
          <Description
            id="delegated-description"
            bind:ref={delegatedDescriptionRef}
            class="delegated-description"
          >
            {#snippet child({ props })}<p {...props}>
                Delegated decision description
              </p>{/snippet}
          </Description>
          <Action
            id="delegated-action"
            bind:ref={delegatedActionRef}
            class="delegated-action"
            onclick={() => {
              actions++;
            }}
          >
            {#snippet child({ props })}<button
                {...props}
                data-delegated="actual">Delegated confirm</button
              >{/snippet}
          </Action>
          <Cancel
            id="delegated-cancel"
            bind:ref={delegatedCancelRef}
            class="delegated-cancel"
          >
            {#snippet child({ props })}<button
                {...props}
                data-delegated="actual">Delegated cancel</button
              >{/snippet}
          </Cancel>
        </Content>
      </Portal>
    </Root>
  </form>
</main>
