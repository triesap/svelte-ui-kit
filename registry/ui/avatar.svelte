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

<div
  class="kit-avatar-frame"
  data-state={loadingState}
  data-fallback-active={fallbackActive}
  role={fallbackActive && alt ? "img" : undefined}
  aria-label={fallbackActive && alt ? alt : undefined}
  aria-hidden={alt ? ariaHidden : true}
>
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
      aria-hidden={fallbackActive ? true : ariaHidden}
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
  {#if fallback}
    <span
      class="kit-avatar-fallback"
      aria-hidden="true"
      hidden={!fallbackActive}
    >
      {@render fallback()}
    </span>
  {/if}
</div>
