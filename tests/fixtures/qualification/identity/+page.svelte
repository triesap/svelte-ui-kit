<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    FieldRoot,
    FieldLabel,
    TextInput,
    TextArea,
    NativeSelect,
    Switch,
    Checkbox,
    RadioGroup,
    RadioItem,
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogCancel,
    MenuRoot,
    MenuTrigger,
    MenuPortal,
    MenuContent,
    MenuItem,
  } from "__UI_MODULE__";
  import type { FieldRootProps } from "__UI_MODULE__";
  const request = page.url.searchParams.get("request") ?? "default";
  const initialExtra = page.url.searchParams.get("extra") === "1";
  const initialOpen = page.url.searchParams.get("open") === "1";
  let extra = $state(initialExtra);
  let ready = $state(false);
  const instances = ["automatic", "explicit"] as const;
  const messages: NonNullable<FieldRootProps["messages"]> = [
    { key: "hint / unique", children: hint },
  ];
  onMount(() => {
    ready = true;
  });
</script>

{#snippet hint()}Request {request} hint{/snippet}
{#snippet field(key: string)}
  <FieldRoot
    data-field={key}
    id={key === "explicit" ? "caller-field" : undefined}
    controlId={key === "explicit" ? "caller-control" : undefined}
    {messages}
  >
    <FieldLabel>Field {key} {request}</FieldLabel><TextInput
      data-control={key}
    />
  </FieldRoot>
{/snippet}
<main data-ready={ready} data-request={request} data-extra={extra}>
  <h1>Request local native identity</h1>
  <button
    id="toggle-extra"
    onclick={() => {
      extra = !extra;
    }}>Toggle extra instance</button
  >
  {@render field("automatic")}{@render field("explicit")}
  {#if extra}<section data-extra-instance>
      {@render field("conditional")}<TextInput data-standalone="conditional" />
    </section>{/if}
  <TextInput data-standalone="input" aria-label="Standalone input" /><TextArea
    data-standalone="area"
    aria-label="Standalone area"
  /><NativeSelect data-standalone="select" aria-label="Standalone select"
    ><option value="a">A</option></NativeSelect
  >
  {#each instances as key (key)}
    <section data-instance={key}>
      <Switch
        aria-label={`Switch ${key}`}
        id={key === "explicit" ? "caller-switch" : undefined}
      />
      <Checkbox
        aria-label={`Checkbox ${key}`}
        id={key === "explicit" ? "caller-checkbox" : undefined}
      />
      <RadioGroup aria-label={`Radio ${key}`} value="a"
        ><RadioItem
          value="a"
          aria-label={`Radio A ${key}`}
          id={key === "explicit" ? "caller-radio" : undefined}
        /><RadioItem value="b" aria-label={`Radio B ${key}`} /></RadioGroup
      >
      <TabsRoot value="a"
        ><TabsList aria-label={`Tabs ${key}`}
          ><TabsTrigger
            value="a"
            id={key === "explicit" ? "caller-tab" : undefined}
            >Tab A {key}</TabsTrigger
          ><TabsTrigger value="b">Tab B {key}</TabsTrigger></TabsList
        ><TabsContent
          value="a"
          id={key === "explicit" ? "caller-panel" : undefined}
          >Panel A {key}</TabsContent
        ><TabsContent value="b">Panel B {key}</TabsContent></TabsRoot
      >
      <CollapsibleRoot open
        ><CollapsibleTrigger
          id={key === "explicit" ? "caller-collapse-trigger" : undefined}
          >Collapse {key}</CollapsibleTrigger
        ><CollapsibleContent
          id={key === "explicit" ? "caller-collapse-content" : undefined}
          >Collapsed content {key}</CollapsibleContent
        ></CollapsibleRoot
      >
      <DialogRoot open={initialOpen}
        ><DialogTrigger
          id={key === "explicit" ? "caller-dialog-trigger" : undefined}
          >Dialog {key}</DialogTrigger
        ><DialogPortal disabled
          ><DialogContent
            data-overlay={`dialog-${key}`}
            id={key === "explicit" ? "caller-dialog-content" : undefined}
            aria-label={`Dialog ${key}`}
            restoreScrollDelay={0}
            ><DialogTitle
              id={key === "explicit" ? "caller-dialog-title" : undefined}
              >Title dialog {key} {request}</DialogTitle
            ><DialogDescription
              id={key === "explicit" ? "caller-dialog-description" : undefined}
              >Description dialog {key} {request}</DialogDescription
            ><DialogClose>Close dialog {key}</DialogClose></DialogContent
          ></DialogPortal
        ></DialogRoot
      >
      <AlertDialogRoot
        ><AlertDialogTrigger
          id={key === "explicit" ? "caller-alert-trigger" : undefined}
          >Alert {key}</AlertDialogTrigger
        ><AlertDialogPortal disabled
          ><AlertDialogContent
            data-overlay={`alert-${key}`}
            id={key === "explicit" ? "caller-alert-content" : undefined}
            aria-label={`Alert ${key}`}
            restoreScrollDelay={0}
            ><AlertDialogTitle
              id={key === "explicit" ? "caller-alert-title" : undefined}
              >Title alert {key} {request}</AlertDialogTitle
            ><AlertDialogDescription
              id={key === "explicit" ? "caller-alert-description" : undefined}
              >Description alert {key} {request}</AlertDialogDescription
            ><AlertDialogCancel>Cancel alert {key}</AlertDialogCancel
            ></AlertDialogContent
          ></AlertDialogPortal
        ></AlertDialogRoot
      >
      <MenuRoot
        ><MenuTrigger
          id={key === "explicit" ? "caller-menu-trigger" : undefined}
          >Menu {key}</MenuTrigger
        ><MenuPortal disabled
          ><MenuContent
            data-overlay={`menu-${key}`}
            id={key === "explicit" ? "caller-menu-content" : undefined}
            aria-label={`Menu ${key}`}
            ><MenuItem>Action {key}</MenuItem></MenuContent
          ></MenuPortal
        ></MenuRoot
      >
    </section>
  {/each}
</main>
