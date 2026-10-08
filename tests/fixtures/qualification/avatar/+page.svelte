<script lang="ts">
  import { onMount } from "svelte";
  import { asset } from "$app/paths";
  import { page } from "$app/state";
  import { Avatar } from "__UI_MODULE__";
  import type { AvatarProps } from "__UI_MODULE__";

  let ready = $state(false);
  let mounted = $state(true);
  let ref = $state<HTMLImageElement | null>(null);
  let src = $state(
    asset(
      page.url.searchParams.has("cached")
        ? "/avatar/success.svg"
        : "/avatar/slow.svg",
    ),
  );
  let responsive = $state(false);
  let customized = $state(false);
  let resized = $state(false);
  let rtl = $state(false);
  let loads = $state(0);
  let errors = $state(0);
  let events = $state<string[]>([]);
  const hints: Pick<
    AvatarProps,
    "loading" | "decoding" | "crossorigin" | "referrerpolicy"
  > = {
    loading: "lazy",
    decoding: "async",
    crossorigin: "anonymous",
    referrerpolicy: "no-referrer",
  };
  onMount(() => {
    ready = true;
  });
</script>

<h1>Generated Avatar qualification</h1>
<p data-ready={ready}>Hydrated {String(ready)}</p>
<p id="ref-proof">{ref?.tagName ?? "none"}</p>
<p id="counts">Loads {loads}; errors {errors}</p>
<p id="events">{events.join(",")}</p>
<button onclick={() => (src = asset("/avatar/success.svg"))}
  >Successful source</button
>
<button onclick={() => (src = asset("/avatar/slow.svg"))}>Slow source</button>
<button onclick={() => (src = `${asset("/avatar/slow.svg")}?revision=2`)}
  >Fresh slow source</button
>
<button onclick={() => (src = asset("/avatar/failure.svg"))}
  >Failed source</button
>
<button onclick={() => (src = "")}>Empty source</button>
<button onclick={() => (responsive = !responsive)}
  >Toggle responsive source</button
>
<button onclick={() => (mounted = !mounted)}>Toggle avatar</button>
<button onclick={() => (customized = !customized)}>Toggle customization</button>
<button onclick={() => (resized = !resized)}>Toggle dimensions</button>
<button onclick={() => (rtl = !rtl)}>Toggle direction</button>

<div id="theme" class:customized dir={rtl ? "rtl" : "ltr"}>
  {#snippet fallback()}<span id="main-fallback">AD</span>{/snippet}
  {#if mounted}
    <Avatar
      id="main"
      {src}
      alt="Ada portrait"
      {fallback}
      bind:ref
      class={["caller", { retained: true }]}
      data-caller="preserved"
      data-state="caller-owned"
      title="Native image title"
      {...hints}
      srcset={responsive ? `${asset("/avatar/responsive.svg")} 1x` : undefined}
      sizes={responsive ? "64px" : undefined}
      style={resized ? "width:64px;height:48px" : undefined}
      onloadcapture={() => {
        events.push("capture-load");
      }}
      onerrorcapture={() => {
        events.push("capture-error");
      }}
      onload={(event) => {
        event.preventDefault();
        loads += 1;
        events.push("load");
      }}
      onerror={(event) => {
        event.preventDefault();
        errors += 1;
        events.push("error");
      }}
    />
  {/if}
  {#snippet otherFallback()}<span>BC</span>{/snippet}
  <Avatar
    id="independent"
    src={asset("/avatar/other.svg")}
    alt="Bea portrait"
    fallback={otherFallback}
  />
  <Avatar
    id="decorative"
    src={asset("/avatar/failure.svg")}
    alt=""
    fallback={otherFallback}
  />
  <Avatar
    id="native"
    src={asset("/avatar/failure.svg")}
    alt="Native failure alternate text"
  />
  <Avatar
    id="hidden"
    src={asset("/avatar/success.svg")}
    alt="Hidden portrait"
    hidden
  />
  <Avatar
    id="aria-hidden"
    src={asset("/avatar/success.svg")}
    alt="Ignored portrait"
    aria-hidden="true"
  />
  <Avatar
    id="until-found"
    src={asset("/avatar/success.svg")}
    alt="Until found portrait"
    hidden="until-found"
  />
</div>

<style>
  #theme {
    --kit-color-surface-hover: rgb(220, 225, 230);
    --kit-color-text-muted: rgb(60, 70, 80);
  }
  #theme.customized {
    --kit-avatar-radius: 8px;
    --kit-avatar-fallback-background: rgb(180, 200, 220);
    --kit-avatar-fallback-color: rgb(30, 60, 90);
  }
</style>
