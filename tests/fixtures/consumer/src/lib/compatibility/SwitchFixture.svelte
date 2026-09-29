<script lang="ts">
  import { Switch } from "bits-ui";

  interface Props {
    label?: string;
    name?: string;
  }

  let { label = "Enable notifications", name = "notifications" }: Props =
    $props();

  // Real bindable state and a real element ref, both flowing through the
  // pinned upstream primitive.
  let checked = $state(false);
  let switchRef = $state<HTMLElement | null>(null);

  function focusSwitch(): void {
    switchRef?.focus();
  }
</script>

<section data-testid="compatibility">
  <Switch.Root bind:checked bind:ref={switchRef} {name} value="on">
    {#snippet child({ props, checked: childChecked })}
      <button {...props} data-testid="switch" aria-label={label}>
        <span data-testid="switch-thumb" data-checked={childChecked}></span>
      </button>
    {/snippet}
  </Switch.Root>

  <p data-testid="switch-state">{checked ? "on" : "off"}</p>

  <button
    type="button"
    data-testid="toggle"
    onclick={() => {
      checked = !checked;
    }}
  >
    Toggle programmatically
  </button>
  <button type="button" data-testid="focus" onclick={focusSwitch}>
    Focus switch
  </button>
</section>
