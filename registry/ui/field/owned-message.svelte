<script lang="ts">
  import { onDestroy, untrack } from "svelte";
  import FieldMessage from "./message.svelte";
  import type { FieldRootProps } from "./types.js";
  type Message = NonNullable<FieldRootProps["messages"]>[number];
  let {
    message,
    id,
    attachRef,
  }: {
    message: Message;
    id: string;
    attachRef: (
      owner: Message,
      node: HTMLParagraphElement,
    ) => void | (() => void);
  } = $props();
  let paragraph = $state<HTMLParagraphElement | null>(null);
  let release: void | (() => void);
  const hasRef = $derived(Object.hasOwn(message, "ref"));
  const attributes = $derived.by(() => {
    const { key, ref, ...attributes } = message;
    void key;
    void ref;
    return attributes;
  });
  $effect(() => {
    const owner = message;
    const node = paragraph;
    const ownsRef = hasRef;
    // Native effect teardown reads the previous reactive values. Transfers
    // must compare against the caller's current slot, including deletion.
    untrack(() => {
      release?.();
      release = ownsRef && node ? attachRef(owner, node) : undefined;
    });
  });
  onDestroy(() => {
    const detach = release;
    release = undefined;
    // Leave native teardown's old-value view before the ownership check.
    if (detach) queueMicrotask(detach);
  });
</script>

<FieldMessage {...attributes} {id} bind:ref={paragraph} />
