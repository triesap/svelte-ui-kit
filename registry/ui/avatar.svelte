<script lang="ts">
  import type { AvatarProps } from "./avatar.types.js";

  let {
    src,
    alt,
    srcset,
    sizes,
    crossorigin,
    referrerpolicy,
    fallback,
    ref = $bindable(null),
    class: className,
    "aria-hidden": ariaHidden,
    onload,
    onerror,
    ...rest
  }: AvatarProps = $props();

  let result = $state<{
    image: HTMLImageElement;
    request: string;
    state: "loaded" | "error";
  } | null>(null);
  const request = $derived(
    JSON.stringify([src, srcset, sizes, crossorigin, referrerpolicy]),
  );
  const loadingState = $derived(
    result?.image === ref && result?.request === request
      ? result.state
      : "loading",
  );
  const fallbackActive = $derived(!!fallback && loadingState !== "loaded");
  function settle(
    image: HTMLImageElement,
    source: string,
    next: "loaded" | "error",
  ) {
    if (image === ref && source === request)
      result = { image, request: source, state: next };
  }

  $effect(() => {
    const image = ref;
    const source = request;
    if (image && ((!src && !srcset) || image.complete))
      settle(image, source, image.naturalWidth > 0 ? "loaded" : "error");
  });
</script>

{#snippet image()}
  {#key request}
    {@const source = request}
    <img
      {...rest}
      {src}
      {alt}
      {srcset}
      {sizes}
      {crossorigin}
      {referrerpolicy}
      class={["kit-avatar", className]}
      bind:this={ref}
      aria-hidden={ariaHidden}
      onload={(event) => {
        const image = event.currentTarget;
        if (
          !(image instanceof HTMLImageElement) ||
          image !== ref ||
          source !== request
        )
          return;
        settle(image, source, "loaded");
        onload?.(event);
      }}
      onerror={(event) => {
        const image = event.currentTarget;
        if (
          !(image instanceof HTMLImageElement) ||
          image !== ref ||
          source !== request
        )
          return;
        settle(image, source, "error");
        onerror?.(event);
      }}
    />
  {/key}
{/snippet}

{#if fallback}
  <span
    class="kit-avatar-frame"
    hidden={rest.hidden}
    data-state={loadingState}
    data-fallback-active={fallbackActive}
  >
    {@render image()}
    <span
      class="kit-avatar-fallback"
      aria-hidden="true"
      hidden={!fallbackActive}
    >
      {@render fallback()}
    </span>
  </span>
{:else}
  {@render image()}
{/if}
