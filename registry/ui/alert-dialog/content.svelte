<script lang="ts">
  import { AlertDialog as BitsAlertDialog } from "bits-ui";
  import type { AlertDialogContentProps } from "./types.js";

  let {
    ref = $bindable(null),
    class: className,
    ...rest
  }: AlertDialogContentProps = $props();

  // Pinned Alert Dialog retains a description ID after an optional part unmounts.
  // Preserve native IDs, but expose only references to nodes in its actual tree.
  $effect(() => {
    const node = ref;
    if (!node) return;
    const tree = node.getRootNode();
    if (!(tree instanceof Document || tree instanceof ShadowRoot)) return;
    let expected = node.getAttribute("aria-describedby");
    let applied = expected;
    const synchronize = () => {
      if (!node.isConnected) return;
      const actual = node.getAttribute("aria-describedby");
      if (actual !== applied) expected = actual;
      const valid =
        expected
          ?.split(/\s+/)
          .filter((id) => tree.getElementById(id))
          .join(" ") || null;
      applied = valid;
      if (actual === valid) return;
      if (valid) node.setAttribute("aria-describedby", valid);
      else node.removeAttribute("aria-describedby");
    };
    const observer = new MutationObserver(synchronize);
    observer.observe(tree instanceof Document ? tree.documentElement : tree, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["aria-describedby", "id"],
    });
    synchronize();
    return () => observer.disconnect();
  });
</script>

<BitsAlertDialog.Content
  {...rest}
  bind:ref
  class={["kit-alert-dialog-content", className]}
/>
