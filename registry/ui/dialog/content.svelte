<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  import type { DialogContentProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: DialogContentProps = $props();

  // Pinned Dialog retains a description ID after an optional part unmounts.
  // Preserve native IDs, but expose only references to real document nodes.
  $effect(() => {
    const node = ref;
    if (!node) return;
    const document = node.ownerDocument;
    let expected = node.getAttribute("aria-describedby");
    let applied = expected;
    const synchronize = () => {
      if (!node.isConnected) return;
      const actual = node.getAttribute("aria-describedby");
      if (actual !== applied) expected = actual;
      const valid =
        expected
          ?.split(/\s+/)
          .filter((id) => document.getElementById(id))
          .join(" ") || null;
      applied = valid;
      if (actual === valid) return;
      if (valid) node.setAttribute("aria-describedby", valid);
      else node.removeAttribute("aria-describedby");
    };
    const observer = new MutationObserver(synchronize);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-describedby", "id"],
    });
    synchronize();
    return () => observer.disconnect();
  });
</script>

<BitsDialog.Content
  {...rest}
  bind:ref
  class={["kit-dialog-content", className]}
/>
