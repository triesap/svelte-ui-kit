<script lang="ts">
  import { mount, onMount, tick, unmount } from "svelte";
  import { page } from "$app/state";
  import { TextInput } from "__UI_MODULE__";
  import type { TextInputProps } from "__UI_MODULE__";
  import NativeForms from "./NativeForms.svelte";
  const defaults: Pick<TextInputProps, "defaultValue"> = {
    defaultValue: "Default",
  };
  const scopes = [
    "connected",
    "detached",
    "shadow",
    "foreign-document",
  ] as const;
  const scope =
    scopes.find((value) => value === page.url.searchParams.get("scope")) ??
    "connected";
  const cancellationMode =
    page.url.searchParams.get("cancel") === "before-await"
      ? "before-await"
      : page.url.searchParams.get("cancel") === "after-await"
        ? "after-await"
        : "sync";
  let host = $state<HTMLDivElement | null>(null);
  let frame = $state<HTMLIFrameElement | null>(null);
  let ready = $state(false);
  let observation = $state("");
  function create(target: Element | Document | ShadowRoot) {
    return mount(NativeForms, {
      target,
      props: { Control: TextInput, defaults, cancellationMode },
    });
  }
  let instance: ReturnType<typeof create> | undefined;
  async function publish() {
    await tick();
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    if (instance) observation = JSON.stringify(instance.snapshot());
  }
  onMount(() => {
    if (!host) throw new Error("Missing native root host");
    let live = true;
    let target: Element | Document | ShadowRoot = host;
    if (scope === "detached") target = document.createElement("div");
    if (scope === "shadow") target = host.attachShadow({ mode: "open" });
    if (scope === "foreign-document") {
      const doc = frame?.contentDocument;
      if (!doc?.body) throw new Error("Missing same-origin frame document");
      target = doc.body;
    }
    const mounted = create(target);
    instance = mounted;
    void publish().then(() => {
      if (live) ready = true;
    });
    return () => {
      live = false;
      instance = undefined;
      void unmount(mounted);
    };
  });
</script>

<h1>Native form root boundaries</h1>
<p data-ready={ready}>Native root {scope}</p>
<button
  type="button"
  onclick={async () => {
    instance?.edit();
    await publish();
  }}>Edit controls</button
>
<button
  type="button"
  onclick={async () => {
    instance?.setCancellation(true);
    await publish();
  }}>Cancel reset</button
>
<button
  type="button"
  onclick={async () => {
    instance?.reset();
    await publish();
  }}>Reset controls</button
>
<pre id="observation">{observation}</pre>
<button type="button" onclick={publish}>Read native state</button>
<div bind:this={host}></div>
{#if scope === "foreign-document"}
  <iframe bind:this={frame} title="Native form document"></iframe>
{/if}
