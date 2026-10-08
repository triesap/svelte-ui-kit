<script lang="ts">
  import { onMount } from "svelte";
  import * as UI from "__UI_MODULE__";
  import type { ButtonProps } from "__UI_MODULE__";
  let {
    seed,
    on,
    portal,
    openKind,
  }: {
    seed: string;
    on: boolean;
    portal: "inline" | "body" | "custom";
    openKind: "" | "dialog" | "alert" | "menu";
  } = $props();
  let ready = $state(false);
  const variants: ButtonProps["variant"][] = ["primary", "secondary", "ghost"];
  const sizes: ButtonProps["size"][] = ["sm", "md", "lg"];
  onMount(() => {
    ready = true;
  });
</script>

<section data-instance={seed} data-ready={ready}>
  <h2>Catalog request {seed}</h2>
  <UI.Anchor href="#target">Anchor</UI.Anchor>
  <UI.RouterLink href="#target">Router link</UI.RouterLink>
  <UI.Alert>Alert</UI.Alert><UI.Status>Status</UI.Status><UI.Card>Card</UI.Card>
  <UI.Badge>Badge</UI.Badge><UI.Badge hidden>Hidden badge</UI.Badge>
  <UI.Progress value={on ? 25 : null} aria-label="Progress" /><UI.Progress
    hidden
    aria-label="Hidden progress"
  />
  <UI.Skeleton /><UI.Skeleton hidden />
  <UI.Spinner />
  <UI.Avatar
    src="data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%271%27 height=%271%27/%3E"
    alt="Loaded">{#snippet fallback()}Loaded fallback{/snippet}</UI.Avatar
  >
  <UI.Avatar src="" alt="Absent"
    >{#snippet fallback()}Absent fallback{/snippet}</UI.Avatar
  >
  <UI.Avatar src="" hidden alt="Hidden" />
  <UI.Separator /><UI.Separator orientation="vertical" />
  {#each variants as variant (variant)}{#each sizes as size (size)}
      <UI.Button {variant} {size}>Button</UI.Button>
    {/each}{/each}
  <UI.Button disabled>Disabled</UI.Button><UI.Button loading>Loading</UI.Button>
  <UI.Switch aria-label="Unchecked switch" /><UI.Checkbox
    aria-label="Unchecked checkbox"
  />
  <UI.TextField
    name="valid-text"
    value={seed}
    label="Valid text"
    message="Valid hint"
  />
  <UI.TextAreaField
    name="valid-area"
    value={seed + " area"}
    label="Valid area"
  />
  <UI.SelectField name="valid-select" label="Valid select" selectedLabel="A"
    ><option>A</option></UI.SelectField
  >
  {#each [false, true] as disabled (disabled)}
    <UI.Switch
      {disabled}
      name={disabled ? "disabled-switch" : "switch"}
      checked={on}
      aria-label="Switch"
    />
    <UI.Checkbox
      {disabled}
      checked={on}
      name={disabled ? "disabled-check" : "check"}
      aria-label="Checked"
    />
    <UI.Checkbox {disabled} indeterminate={on} aria-label="Indeterminate" />
    <UI.RadioGroup
      value={on ? "b" : "a"}
      name={disabled ? "disabled-radio" : "radio"}
      aria-label="Radio"
    >
      <UI.RadioItem value="a" {disabled} aria-label="Radio A" /><UI.RadioItem
        value="b"
        {disabled}
        aria-label="Radio B"
      />
    </UI.RadioGroup>
    <UI.TextField
      name="text"
      label="Text"
      required
      {disabled}
      invalid
      message="Invalid text"
    />
    <UI.TextAreaField
      name="area"
      label="Area"
      {disabled}
      invalid
      message="Invalid area"
    />
    <UI.SelectField
      name="select"
      label="Select"
      selectedLabel="A"
      {disabled}
      invalid
      message="Invalid select"
    >
      {#snippet icon()}Select icon{/snippet}<option value="a">A</option>
    </UI.SelectField>
    <UI.CollapsibleRoot open={on}
      ><UI.CollapsibleTrigger {disabled}>Collapse</UI.CollapsibleTrigger
      ><UI.CollapsibleContent>Content</UI.CollapsibleContent
      ></UI.CollapsibleRoot
    >
    <UI.DialogRoot open={!disabled && openKind === "dialog"}
      ><UI.DialogTrigger {disabled}>Dialog</UI.DialogTrigger><UI.DialogPortal
        disabled={portal === "inline"}
        to={portal === "custom" ? "#catalog-host" : undefined}
      >
        <UI.DialogOverlay /><UI.DialogContent restoreScrollDelay={0}>
          <UI.DialogTitle>Dialog title</UI.DialogTitle><UI.DialogDescription
            >Dialog description</UI.DialogDescription
          ><UI.DialogClose {disabled}>Close</UI.DialogClose>
        </UI.DialogContent>
      </UI.DialogPortal></UI.DialogRoot
    >
    <UI.AlertDialogRoot open={!disabled && openKind === "alert"}
      ><UI.AlertDialogTrigger {disabled}>Alert dialog</UI.AlertDialogTrigger
      ><UI.AlertDialogPortal
        disabled={portal === "inline"}
        to={portal === "custom" ? "#catalog-host" : undefined}
      >
        <UI.AlertDialogOverlay /><UI.AlertDialogContent restoreScrollDelay={0}>
          <UI.AlertDialogTitle>Alert title</UI.AlertDialogTitle
          ><UI.AlertDialogDescription
            >Alert description</UI.AlertDialogDescription
          ><UI.AlertDialogAction {disabled}>Action</UI.AlertDialogAction
          ><UI.AlertDialogCancel {disabled}>Cancel</UI.AlertDialogCancel>
        </UI.AlertDialogContent>
      </UI.AlertDialogPortal></UI.AlertDialogRoot
    >
  {/each}
  {#each ["horizontal", "vertical"] as orientation (orientation)}
    <UI.TabsRoot
      value={on ? "b" : "a"}
      orientation={orientation === "vertical" ? "vertical" : "horizontal"}
    >
      <UI.TabsList aria-label="Tabs"
        ><UI.TabsTrigger value="a">A</UI.TabsTrigger><UI.TabsTrigger value="b"
          >B</UI.TabsTrigger
        ><UI.TabsTrigger value="c" disabled>C</UI.TabsTrigger></UI.TabsList
      >
      <UI.TabsContent value="a">Panel A</UI.TabsContent><UI.TabsContent
        value="b">Panel B</UI.TabsContent
      >
    </UI.TabsRoot>
  {/each}
  {#each ["bottom", "top", "left", "right"] as side (side)}
    <UI.MenuRoot open={openKind === "menu" && side === "bottom"}
      ><UI.MenuTrigger>Menu</UI.MenuTrigger><UI.MenuPortal
        disabled={portal === "inline"}
        to={portal === "custom" ? "#catalog-host" : undefined}
      >
        <UI.MenuContent
          side={side === "top"
            ? "top"
            : side === "left"
              ? "left"
              : side === "right"
                ? "right"
                : "bottom"}
          avoidCollisions={false}
          preventScroll={false}
          aria-label="Menu"
        >
          <UI.MenuItem>Choice</UI.MenuItem><UI.MenuItem disabled
            >Disabled choice</UI.MenuItem
          >
          <UI.MenuRadioGroup value={on ? "b" : "a"}
            ><UI.MenuRadioItem value="a"
              >{#snippet children({ checked })}<UI.MenuItemIndicator {checked}
                  >Indicator</UI.MenuItemIndicator
                ><span class="kit-menu-radio-item-label">A</span
                >{/snippet}</UI.MenuRadioItem
            ><UI.MenuRadioItem value="b"
              >{#snippet children({ checked })}<UI.MenuItemIndicator {checked}
                  >Indicator</UI.MenuItemIndicator
                >B{/snippet}</UI.MenuRadioItem
            ></UI.MenuRadioGroup
          >
        </UI.MenuContent>
      </UI.MenuPortal></UI.MenuRoot
    >
  {/each}
  <UI.MenuRoot
    ><UI.MenuTrigger disabled>Disabled menu</UI.MenuTrigger></UI.MenuRoot
  >
</section>
