<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import * as UI from "__UI_MODULE__";
  import type { RadioGroupProps } from "__UI_MODULE__";
  const direction: RadioGroupProps["dir"] =
    page.url.searchParams.get("dir") === "rtl" ? "rtl" : "ltr";
  let ready = $state(false);
  let checked = $state(false);
  let agreed = $state(false);
  let radio = $state("a");
  let tab = $state("a");
  let collapsed = $state(false);
  onMount(() => {
    const previous = document.documentElement.dir;
    document.documentElement.dir = direction ?? "ltr";
    ready = true;
    return () => {
      document.documentElement.dir = previous;
    };
  });
</script>

<main data-ready={ready} dir={direction}>
  <h1>Installed accessible state qualification</h1>
  <UI.Anchor href="#target">Reference link</UI.Anchor><UI.RouterLink
    href="#target">Application link</UI.RouterLink
  >
  <UI.Card
    ><h2>Native catalog</h2>
    <UI.Badge>Ready</UI.Badge><UI.Alert>Information</UI.Alert><UI.Status
      role="status">Saved</UI.Status
    ></UI.Card
  >
  <UI.Avatar
    src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%271%27 height=%271%27/%3E"
    alt="Profile">{#snippet fallback()}P{/snippet}</UI.Avatar
  >
  <UI.Button id="primary">Save</UI.Button><UI.Button
    variant="secondary"
    id="secondary">Cancel</UI.Button
  ><UI.Button variant="ghost" id="ghost">More</UI.Button>
  <UI.Button disabled>Disabled save</UI.Button><UI.Button loading
    >Pending save</UI.Button
  >
  <UI.Spinner label="Loading content" /><UI.Spinner mode="decorative" />
  <UI.Progress value={25} max={100} aria-label="Upload" />
  <UI.Separator /><UI.Skeleton aria-hidden="true" />
  <UI.TextField name="name" label="Name" required message="Enter a name" />
  <UI.TextAreaField name="description" label="Description" message="Details" />
  <UI.SelectField name="choice" label="Choice" selectedLabel="First"
    ><option value="a">First</option><option value="b">Second</option
    ></UI.SelectField
  >
  <UI.TextField
    name="invalid"
    label="Invalid name"
    invalid
    message="Correct this name"
  />
  <UI.Checkbox
    id="agree"
    name="agree"
    bind:checked={agreed}
    aria-label="Agree"
  />
  <UI.Switch
    id="notifications"
    name="notifications"
    bind:checked
    aria-label="Notifications"
  />
  <UI.RadioGroup
    aria-label="Color"
    orientation="horizontal"
    dir={direction}
    bind:value={radio}
  >
    <UI.RadioItem id="radio-a" value="a" aria-label="Red" /><UI.RadioItem
      value="disabled"
      disabled
      aria-label="Unavailable color"
    /><UI.RadioItem id="radio-b" value="b" aria-label="Blue" />
  </UI.RadioGroup>
  <UI.TabsRoot dir={direction} bind:value={tab}>
    <UI.TabsList aria-label="Views"
      ><UI.TabsTrigger id="tab-a" value="a">Overview</UI.TabsTrigger
      ><UI.TabsTrigger value="disabled" disabled
        >Unavailable view</UI.TabsTrigger
      ><UI.TabsTrigger id="tab-b" value="b">Details</UI.TabsTrigger
      ></UI.TabsList
    >
    <UI.TabsContent value="a">Overview panel</UI.TabsContent><UI.TabsContent
      value="b">Details panel</UI.TabsContent
    >
  </UI.TabsRoot>
  <UI.CollapsibleRoot bind:open={collapsed}
    ><UI.CollapsibleTrigger id="collapse">Extra details</UI.CollapsibleTrigger
    ><UI.CollapsibleContent>Expanded information</UI.CollapsibleContent
    ></UI.CollapsibleRoot
  >
  <UI.DialogRoot
    ><UI.DialogTrigger id="dialog-trigger">Edit profile</UI.DialogTrigger
    ><UI.DialogPortal>
      <UI.DialogOverlay /><UI.DialogContent
        id="dialog-content"
        restoreScrollDelay={0}
        ><UI.DialogTitle>Edit profile dialog</UI.DialogTitle
        ><UI.DialogDescription>Update your name</UI.DialogDescription
        ><UI.TextField name="dialog-name" label="Dialog name" /><UI.DialogClose
          >Close profile</UI.DialogClose
        ></UI.DialogContent
      >
    </UI.DialogPortal></UI.DialogRoot
  >
  <UI.AlertDialogRoot
    ><UI.AlertDialogTrigger id="alert-trigger"
      >Delete profile</UI.AlertDialogTrigger
    ><UI.AlertDialogPortal>
      <UI.AlertDialogOverlay /><UI.AlertDialogContent
        id="alert-content"
        restoreScrollDelay={0}
        ><UI.AlertDialogTitle>Confirm deletion</UI.AlertDialogTitle
        ><UI.AlertDialogDescription
          >This action is permanent</UI.AlertDialogDescription
        ><UI.AlertDialogAction>Delete now</UI.AlertDialogAction
        ><UI.AlertDialogCancel>Keep profile</UI.AlertDialogCancel
        ></UI.AlertDialogContent
      >
    </UI.AlertDialogPortal></UI.AlertDialogRoot
  >
  <UI.MenuRoot dir={direction}
    ><UI.MenuTrigger id="menu-trigger">Profile actions</UI.MenuTrigger
    ><UI.MenuPortal>
      <UI.MenuContent id="menu-content" aria-label="Profile actions menu"
        ><UI.MenuItem id="menu-first">Account</UI.MenuItem><UI.MenuItem disabled
          >Unavailable action</UI.MenuItem
        ><UI.MenuItem id="menu-last">Settings</UI.MenuItem><UI.MenuRadioGroup
          value="a"
          ><UI.MenuRadioItem value="a"
            >{#snippet children({ checked })}<UI.MenuItemIndicator {checked}
                >✓</UI.MenuItemIndicator
              >Choice A{/snippet}</UI.MenuRadioItem
          ></UI.MenuRadioGroup
        ></UI.MenuContent
      >
    </UI.MenuPortal></UI.MenuRoot
  >
  <div id="target">Link destination</div>
</main>

<style>
  :global(body) {
    background: var(--kit-color-canvas);
    color: var(--kit-color-text);
  }
</style>
