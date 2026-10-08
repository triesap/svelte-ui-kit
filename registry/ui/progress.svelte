<script lang="ts">
  import type { ProgressProps } from "./progress.types.js";
  let {
    value,
    max = 100,
    ref = $bindable(null),
    class: className,
    ...rest
  }: ProgressProps = $props();
  // The pinned generic value removal path also writes through the IDL setter.
  // Restore true attribute absence after that update; the browser owns the state.
  // Initial absence uses undefined: explicit null takes an input-only default
  // setter path before effects and throws on the native progress element.
  $effect(() => {
    if (ref && value == null) ref.removeAttribute("value");
  });
</script>

<!-- HTML attribute names are case-insensitive. Keep VALUE on the native attribute
     path: the pinned special lowercase value setter turns omission into zero. -->
<progress
  {...rest}
  bind:this={ref}
  class={["kit-progress", className]}
  VALUE={value == null ? undefined : String(value)}
  max={max == null ? max : String(max)}
  >{value == null ? "" : `${value} / ${max ?? 1}`}</progress
>
