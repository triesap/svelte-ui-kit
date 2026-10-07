<script lang="ts">
  import { onMount } from "svelte";
  import "$lib/qualification/tokens/tokens.css";
  import customization from "$lib/qualification/tokens/component-customization-v1.json";

  let hydrated = $state(false);
  const radiusProperties = customization.properties.filter(
    (property) =>
      property.name.endsWith("-radius") ||
      property.name.startsWith("--kit-radius-"),
  );
  onMount(() => {
    hydrated = true;
  });
  const pairs = [
    ["text/canvas", "--kit-color-text", "--kit-color-canvas"],
    ["primary", "--kit-color-primary-foreground", "--kit-color-primary"],
    ["info", "--kit-color-info-foreground", "--kit-color-info"],
    ["success", "--kit-color-success-foreground", "--kit-color-success"],
    ["warning", "--kit-color-warning-foreground", "--kit-color-warning"],
    ["danger", "--kit-color-danger-foreground", "--kit-color-danger"],
  ];
</script>

<main data-hydrated={hydrated}>
  <h1>Token contract qualification</h1>
  <p>
    Computed contract probes; component behavior is qualified with each family.
  </p>
  {#each radiusProperties as property (property.name)}
    <div
      aria-hidden="true"
      class="radius-probe"
      data-property={property.name}
      style={`border-radius: var(${property.name}, ${property.fallback})`}
    ></div>
  {/each}
  {#each pairs as [name, foreground, background] (name)}
    <p
      data-contrast={name}
      style={`color:var(${foreground});background-color:var(${background})`}
    >
      Baseline color pair: {name}
    </p>
  {/each}
  <section class="theme-scope" id="custom-theme">
    <h2>Application theme scope</h2>
    <p class="color-probe" id="inherited-probe">Inherited theme color</p>
  </section>
  <p class="color-probe" id="document-probe">Document theme color</p>
</main>

<style>
  .radius-probe {
    inline-size: 40px;
    block-size: 40px;
    background: var(--kit-color-surface);
  }
  .color-probe {
    color: var(--kit-color-text);
  }
  @layer svelte-ui-kit.themes {
    .theme-scope {
      --kit-color-text: #ff0000;
    }
  }
</style>
