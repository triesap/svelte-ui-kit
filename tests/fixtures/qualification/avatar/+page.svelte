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
  let hiddenFallback = $state(true);
  let hiddenSrc = $state(asset("/avatar/failure.svg"));
  let namingSrc = $state(asset("/avatar/failure.svg"));
  let matches = $state<string[]>([]);
  let imageTarget = $state("");
  let focusRef = $state<HTMLImageElement | null>(null);
  let imageRole = $state<"img" | "presentation" | "none" | undefined>();
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
<p id="matches">{matches.join(",")}</p>
<button onclick={() => (hiddenFallback = !hiddenFallback)}
  >Toggle hidden fallback</button
>
<button onclick={() => (hiddenSrc = `${asset("/avatar/slow.svg")}?hidden=1`)}
  >Load hidden fallback</button
>
<button onclick={() => (namingSrc = `${asset("/avatar/slow.svg")}?naming=1`)}
  >Load named portraits</button
>
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
  <div id="flow-kit">
    Before<Avatar
      id="flow-image"
      src={asset("/avatar/success.svg")}
      alt="Flow portrait"
    />After
  </div>
  <div id="flow-native">
    Before<img
      class="kit-avatar"
      src={asset("/avatar/success.svg")}
      alt="Native flow portrait"
    />After
  </div>
  <p id="image-target">{imageTarget}</p>
  <button onclick={() => (imageRole = "presentation")}
    >Presentational images</button
  >
  <button onclick={() => (imageRole = "none")}>No-role images</button>
  <button onclick={() => (imageRole = undefined)}>Named images</button>
  <button id="focus-start" onclick={() => focusRef?.focus()}
    >Start image focus</button
  >
  <Avatar
    id="focus-fallback"
    src={namingSrc}
    alt="Focus portrait"
    role={imageRole}
    aria-describedby="portrait-description"
    tabindex={-1}
    bind:ref={focusRef}
    style="--kit-avatar-radius:0;outline:3px solid rgb(0,0,0);outline-offset:2px"
    fallback={otherFallback}
    onclick={(event) => {
      event.preventDefault();
      imageTarget = event.currentTarget.tagName;
    }}
  />
  <img
    id="native-focus"
    class="kit-avatar"
    src={namingSrc}
    alt="Native focus portrait"
    role={imageRole}
    aria-describedby="portrait-description"
    tabindex="-1"
    style="--kit-avatar-radius:0;outline:3px solid rgb(0,0,0);outline-offset:2px"
  />
  <p id="portrait-description">Caller image description</p>
  {#if page.url.searchParams.has("phrasing")}
    <p id="phrasing">
      Before <Avatar
        id="phrasing-image"
        src={asset("/avatar/success.svg")}
        alt="Inline portrait"
        fallback={otherFallback}
      /> after
    </p>
  {/if}
  <Avatar
    id="hidden-fallback"
    src={hiddenSrc}
    alt="Hidden fallback portrait"
    hidden={hiddenFallback}
    fallback={otherFallback}
  />
  <p id="avatar-caption">Caller caption</p>
  <Avatar
    id="labelled"
    src={namingSrc}
    alt="Base portrait name"
    aria-label="Caller portrait name"
    fallback={otherFallback}
  />
  <Avatar
    id="referenced"
    src={namingSrc}
    alt="Base referenced name"
    aria-label="Lower priority name"
    aria-labelledby="avatar-caption"
    fallback={otherFallback}
  />
  <Avatar
    id="empty-alt-named"
    src={namingSrc}
    alt=""
    aria-label="Explicit empty-alt name"
    fallback={otherFallback}
  />
  {#snippet findFallback()}<span id="avatar-find-fallback"
      >Findable fallback text</span
    >{/snippet}
  <Avatar
    id="until-found-fallback"
    src={asset("/avatar/failure.svg")}
    alt="Findable fallback portrait"
    hidden="until-found"
    fallback={findFallback}
  />
  <a href="#avatar-find-fallback">Reveal fallback text</a>
  <a href="#until-found">Reveal findable image</a>
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
    fallback={otherFallback}
    onbeforematch={(event) =>
      matches.push(`${event.currentTarget.tagName}:${String(event.isTrusted)}`)}
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
