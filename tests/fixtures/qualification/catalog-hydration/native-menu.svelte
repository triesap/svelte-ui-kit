<script lang="ts">
  import { DropdownMenu as Native } from "bits-ui";
</script>

<Native.Root open>
  <Native.Trigger>Native trigger</Native.Trigger>
  <Native.Portal disabled>
    <Native.Content preventScroll={false}>
      <Native.Item>Native item</Native.Item>
    </Native.Content>
  </Native.Portal>
</Native.Root>
