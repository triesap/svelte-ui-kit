<script lang="ts">
  import "./showcase.css";
  import "./recipes.css";
  import Specimen from "./Specimen.svelte";
  import { onMount } from "svelte";
  import {
    type TabsRootProps,
    Alert,
    Anchor,
    Avatar,
    Badge,
    Button,
    Card,
    Checkbox,
    CollapsibleRoot,
    CollapsibleTrigger,
    CollapsibleContent,
    DialogRoot,
    DialogTrigger,
    DialogPortal,
    DialogOverlay,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
    AlertDialogRoot,
    AlertDialogTrigger,
    AlertDialogPortal,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    MenuRoot,
    MenuTrigger,
    MenuPortal,
    MenuContent,
    MenuItem,
    MenuRadioGroup,
    MenuRadioItem,
    MenuItemIndicator,
    Progress,
    RadioGroup,
    RadioItem,
    RouterLink,
    Separator,
    Skeleton,
    Spinner,
    Status,
    Switch,
    TabsRoot,
    TabsList,
    TabsTrigger,
    TabsContent,
    FieldRoot,
    FieldSurface,
    FieldLabel,
    FieldRequired,
    TextInput,
    TextField,
    TextAreaField,
    SelectField,
  } from "__UI_MODULE__";

  let { label = "showcase" }: { label?: string } = $props();
  let invalid = $state(false);
  let submissions = $state(0);
  const instanceId = $props.id();
  let ready = $state(false);
  let count = $state(0);
  let checked = $state(false);
  let enabled = $state(false);
  let radio = $state("a");
  let text = $state("Ada");
  let area = $state("A thoughtful new idea.");
  let choice = $state("a");
  let selected = $state("a");
  let tab = $state("a");
  let manual = $state(false);
  let vertical = $state(false);
  let rtl = $state(false);
  let loop = $state(true);
  let dark = $state(false);
  let dialogOpen = $state(false);
  const activation: TabsRootProps["activationMode"] = $derived(
    manual ? "manual" : "automatic",
  );
  onMount(() => {
    ready = true;
  });
  $effect(() => {
    const root = document.documentElement;
    const previous = root.dataset.showcaseTheme;
    root.dataset.showcaseTheme = dark ? "dark" : "light";
    return () => {
      if (previous === undefined) delete root.dataset.showcaseTheme;
      else root.dataset.showcaseTheme = previous;
    };
  });
</script>

<main
  class="showcase"
  data-showcase={label}
  data-ready={ready}
  dir={rtl ? "rtl" : "ltr"}
>
  <header class="showcase-header">
    <div>
      <p class="showcase-eyebrow">Svelte UI kit · in-progress v1</p>
      <h1>Thoughtful components.<br />Ready to make your own.</h1>
      <p class="showcase-intro">
        Editable Svelte, TypeScript and plain CSS. A complete collection of
        accessible building blocks, with useful defaults and room for your own
        design.
      </p>
    </div>
    <nav aria-label="Showcase appearance" class="showcase-toolbar">
      <Button onclick={() => (dark = !dark)} aria-pressed={dark}
        >Dark theme</Button
      >
      <Button
        variant="secondary"
        onclick={() => (rtl = !rtl)}
        aria-pressed={rtl}>Right to left</Button
      >
    </nav>
  </header>
  <section class="showcase-category" aria-labelledby={`${label}-foundations`}>
    <header>
      <p class="showcase-eyebrow">01 · Foundations</p>
      <h2 id={`${label}-foundations`}>Color, shape and action</h2>
      <p>
        Neutral defaults, clear hierarchy, and deliberate interaction states.
      </p>
    </header>
    <div class="showcase-grid">
      <Specimen title="Semantic colors" item="tokens"
        ><div class="showcase-swatches">
          <span class="showcase-swatch primary">Primary</span><span
            class="showcase-swatch accent">Accent</span
          ><span class="showcase-swatch success">Success</span><span
            class="showcase-swatch warning">Warning</span
          ><span class="showcase-swatch danger">Danger</span>
        </div>
        <p class="showcase-note">
          White canvas. Semantic colors. Native focus and contrast.
        </p></Specimen
      >
      <Specimen title="Buttons" item="button"
        ><div class="showcase-row">
          <Button size="sm">Small</Button><Button>Default</Button><Button
            size="lg">Large</Button
          >
        </div>
        <div class="showcase-row">
          <Button variant="secondary">Secondary</Button><Button variant="ghost"
            >Ghost</Button
          ><Button class="showcase-button-accent">Accent</Button><Button
            class="showcase-button-danger">Danger</Button
          >
        </div>
        <div class="showcase-row">
          <Button disabled>Disabled</Button><Button
            loading
            loadingLabel="Saving">Save</Button
          ><Button onclick={() => (count += 1)}>Clicked {count}</Button>
        </div>
        <div class="showcase-radius-moderate showcase-row">
          <Button variant="secondary">Moderate radius recipe</Button>
        </div></Specimen
      >
      <Specimen title="Links" item="anchor"
        ><Anchor href={`#${label}-forms`}>Explore form controls</Anchor><Anchor
          href="https://example.com"
          target="_blank">External link</Anchor
        ></Specimen
      >
      <Specimen title="Application navigation" item="router-link"
        ><RouterLink href="/">Back to the showcase</RouterLink>
        <p class="showcase-note">
          Routing remains owned by the application.
        </p></Specimen
      >
    </div>
  </section>
  <section class="showcase-category" aria-labelledby={`${label}-content`}>
    <header>
      <p class="showcase-eyebrow">02 · Content and feedback</p>
      <h2 id={`${label}-content`}>Give information a clear place</h2>
      <p>Composed surfaces, recognizable status and useful loading states.</p>
    </header>
    <div class="showcase-grid">
      <Specimen title="Cards" item="card"
        ><Card class="showcase-card"
          ><Badge>New collection</Badge>
          <h4>A little structure goes a long way.</h4>
          <p>Group related information in an editable, semantic surface.</p>
          <Button variant="secondary">Explore collection</Button></Card
        ></Specimen
      >
      <Specimen title="Avatar" item="avatar"
        ><div class="showcase-row">
          <Avatar src="/showcase-avatar.svg" alt="Example profile" /><Avatar
            src=""
            alt="Profile without a photograph"
            >{#snippet fallback()}AB{/snippet}</Avatar
          >
        </div>
        <p class="showcase-note">
          A real image and a request-aware fallback.
        </p></Specimen
      >
      <Specimen title="Badges" item="badge"
        ><div class="showcase-row">
          <Badge>Available</Badge><Badge>In review</Badge><Badge>Archived</Badge
          >
        </div></Specimen
      >
      <Specimen title="Alerts" item="alert"
        ><Alert class="showcase-feedback-info"
          >A new update is ready to review.</Alert
        ><Alert>Application-owned content and announcement semantics.</Alert
        ></Specimen
      >
      <Specimen title="Status" item="status"
        ><Status class="showcase-feedback-success">Changes saved.</Status
        ><Status
          class="showcase-feedback-danger"
          role="alert"
          aria-live="assertive">An action needs your attention.</Status
        ></Specimen
      >
      <Specimen title="Progress" item="progress"
        ><label for={`${instanceId}-progress`} class="showcase-stack"
          ><span>Profile completeness · 68%</span><Progress
            id={`${instanceId}-progress`}
            value={68}
          /></label
        ><Progress aria-label="Preparing content" /></Specimen
      >
      <Specimen title="Separators" item="separator"
        ><p>Clear boundaries between related ideas.</p>
        <Separator />
        <p>Useful content continues here.</p></Specimen
      >
      <Specimen title="Skeletons" item="skeleton"
        ><div class="showcase-stack">
          <Skeleton class="showcase-skeleton-title" /><Skeleton
            class="showcase-skeleton-line"
          /><Skeleton class="showcase-skeleton-line" />
        </div></Specimen
      >
      <Specimen title="Spinners" item="spinner"
        ><div class="showcase-row">
          <Spinner label="Loading content" /><Spinner mode="decorative" /><span
            >Working in the background</span
          >
        </div></Specimen
      >
    </div>
  </section>
  <section class="showcase-category" aria-labelledby={`${label}-forms`}>
    <header>
      <p class="showcase-eyebrow">03 · Forms and selection</p>
      <h2 id={`${label}-forms`}>Details, without the friction</h2>
      <p>
        Native form behavior, stable relationships and explicit application
        state.
      </p>
    </header>
    <form
      class="showcase-grid"
      onsubmit={(event) => {
        event.preventDefault();
        submissions += 1;
      }}
      onreset={() => {
        invalid = false;
        submissions = 0;
      }}
    >
      <Specimen title="Fields" item="field"
        ><TextField
          label="Full name"
          name="name"
          defaultValue="Ada"
          bind:value={text}
          required
          {invalid}
          message={invalid
            ? "Please check this value."
            : "Your name as it should appear."}
        /><TextAreaField
          label="About your project"
          name="body"
          defaultValue="A thoughtful new idea."
          bind:value={area}
        /><SelectField
          label="Update schedule"
          name="choice"
          selectedLabel={choice === "a" ? "Weekly" : "Monthly"}
          bind:value={choice}
          ><option value="a">Weekly</option><option value="b">Monthly</option
          ></SelectField
        ><FieldRoot required
          >{#snippet children({ controlId })}<FieldSurface
              ><FieldLabel for={controlId}
                >Low-level composition <FieldRequired /></FieldLabel
              ><TextInput
                name="direct"
                placeholder="One label, one control"
              /></FieldSurface
            >{/snippet}</FieldRoot
        >
        <div class="showcase-row">
          <Button onclick={() => (invalid = !invalid)}>Toggle validation</Button
          ><Button type="submit">Submit example</Button>
          <Button type="reset" variant="secondary">Reset form</Button>
        </div>
        <output data-showcase-submissions aria-live="polite"
          >Submitted {submissions} times. Nothing leaves this page.</output
        ></Specimen
      >
      <Specimen title="Checkbox" item="checkbox"
        ><label for={`${instanceId}-checked`} class="showcase-choice"
          ><Checkbox
            id={`${instanceId}-checked`}
            name="checked"
            bind:checked
          /><span>Send me useful updates</span></label
        ><label for={`${instanceId}-disabled`} class="showcase-choice"
          ><Checkbox id={`${instanceId}-disabled`} disabled checked /><span
            >Disabled selection</span
          ></label
        ></Specimen
      >
      <Specimen title="Radio group" item="radio"
        ><RadioGroup aria-label="Project type" name="radio" bind:value={radio}
          ><label for={`${instanceId}-radio-a`} class="showcase-choice"
            ><RadioItem id={`${instanceId}-radio-a`} value="a" /><span
              >Personal project</span
            ></label
          ><label for={`${instanceId}-radio-b`} class="showcase-choice"
            ><RadioItem id={`${instanceId}-radio-b`} value="b" /><span
              >Team project</span
            ></label
          ></RadioGroup
        ></Specimen
      >
      <Specimen title="Switch" item="switch"
        ><label for={`${instanceId}-enabled`} class="showcase-choice"
          ><Switch
            id={`${instanceId}-enabled`}
            name="enabled"
            bind:checked={enabled}
          /><span>Enable notifications</span></label
        >
        <p class="showcase-note">
          {enabled ? "Notifications enabled" : "Notifications paused"}
        </p></Specimen
      >
    </form>
  </section>
  <section class="showcase-category" aria-labelledby={`${label}-interactions`}>
    <header>
      <p class="showcase-eyebrow">04 · Disclosure and overlays</p>
      <h2 id={`${label}-interactions`}>The right detail, at the right time</h2>
      <p>
        Primitive-backed interactions with keyboard, focus and state ownership.
      </p>
    </header>
    <div class="showcase-grid">
      <Specimen title="Disclosure" item="collapsible"
        ><CollapsibleRoot
          ><CollapsibleTrigger>What makes this source-first?</CollapsibleTrigger
          ><CollapsibleContent
            ><p>
              You own the generated component source, styles and composition.
              Customize them using ordinary Svelte and CSS.
            </p></CollapsibleContent
          ></CollapsibleRoot
        ></Specimen
      >
      <Specimen title="Tabs" item="tabs"
        ><div class="showcase-row">
          <Button variant="ghost" onclick={() => (manual = !manual)}
            >Manual activation: {manual ? "on" : "off"}</Button
          ><Button variant="ghost" onclick={() => (vertical = !vertical)}
            >Vertical: {vertical ? "on" : "off"}</Button
          >
        </div>
        <TabsRoot
          bind:value={tab}
          activationMode={activation}
          orientation={vertical ? "vertical" : "horizontal"}
          dir={rtl ? "rtl" : "ltr"}
          {loop}
          ><TabsList aria-label="Project details"
            ><TabsTrigger value="a">Overview</TabsTrigger><TabsTrigger value="b"
              >Activity</TabsTrigger
            ><TabsTrigger value="c" disabled>Archived</TabsTrigger></TabsList
          ><TabsContent value="a"
            >A useful overview of your project.</TabsContent
          ><TabsContent value="b"
            >Your recent activity appears here.</TabsContent
          ></TabsRoot
        ></Specimen
      >
      <Specimen title="Menus" item="menu"
        ><MenuRoot dir={rtl ? "rtl" : "ltr"}
          ><MenuTrigger>Choose display density</MenuTrigger><MenuPortal
            ><MenuContent
              side="bottom"
              align="start"
              aria-label="Display density"
              ><MenuItem onSelect={() => (count += 1)}>Use recommended</MenuItem
              ><MenuRadioGroup bind:value={selected}
                ><MenuRadioItem value="a" closeOnSelect={false}
                  >{#snippet children({ checked: active })}<span
                      >Comfortable</span
                    ><MenuItemIndicator checked={active}>✓</MenuItemIndicator
                    >{/snippet}</MenuRadioItem
                ><MenuRadioItem value="b" closeOnSelect={false}
                  >{#snippet children({ checked: active })}<span>Compact</span
                    ><MenuItemIndicator checked={active}>✓</MenuItemIndicator
                    >{/snippet}</MenuRadioItem
                ></MenuRadioGroup
              ></MenuContent
            ></MenuPortal
          ></MenuRoot
        ></Specimen
      >
      <Specimen title="Dialog" item="dialog"
        ><DialogRoot bind:open={dialogOpen}
          ><DialogTrigger>Open project details</DialogTrigger><DialogPortal
            ><DialogOverlay /><DialogContent
              ><DialogTitle>Project details</DialogTitle><DialogDescription
                >Review information in a focused space. Escape closes this
                dialog and returns focus.</DialogDescription
              ><DialogClose>Close details</DialogClose></DialogContent
            ></DialogPortal
          ></DialogRoot
        ></Specimen
      >
      <Specimen title="Alert dialog" item="alert-dialog"
        ><AlertDialogRoot
          ><AlertDialogTrigger>Review a decision</AlertDialogTrigger
          ><AlertDialogPortal
            ><AlertDialogOverlay /><AlertDialogContent
              ><AlertDialogTitle>Archive this example?</AlertDialogTitle
              ><AlertDialogDescription
                >This demonstrates a distinct confirmation interaction. No
                external action is performed.</AlertDialogDescription
              >
              <div class="showcase-row">
                <AlertDialogCancel>Keep example</AlertDialogCancel
                ><AlertDialogAction>Confirm example</AlertDialogAction>
              </div></AlertDialogContent
            ></AlertDialogPortal
          ></AlertDialogRoot
        ></Specimen
      >
    </div>
  </section>
  <footer class="showcase-footer">
    <p>Built from editable components. Styled with plain CSS.</p>
    <p>
      Complete installed catalog · native identity · no hidden theme runtime
    </p>
  </footer>
</main>
