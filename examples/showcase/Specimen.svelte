<script lang="ts">
  import type { Snippet } from "svelte";
  let {
    title,
    item,
    children,
  }: { title: string; item: string; children: Snippet } = $props();
</script>

<article class="showcase-specimen" data-kit-item={item}>
  <h3>{title}</h3>
  <div class="showcase-demo">{@render children()}</div>
</article>
