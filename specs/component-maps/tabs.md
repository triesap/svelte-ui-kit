# Tabs source and pinned activation contract

Source: [family](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs/mod.rs),
[Root](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs/root.rs),
[List](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs/list.rs),
[Trigger](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs/trigger.rs),
[Panel](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs/panel.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/tabs.json)
and [CSS](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/tabs.css).
Preserve MIT attribution. Source Root/List/Trigger/Panel map to actual pinned
Bits Tabs2.19.3 Root/List/Trigger/Content; public TabsContent keeps source
kit-tabs-panel styling. No extra TabsPanel alias or compatibility enums are added.

## Exact native API and inventory

Four public value/type pairs: TabsRoot/TabsRootProps, TabsList/TabsListProps,
TabsTrigger/TabsTriggerProps and TabsContent/TabsContentProps. Props alias exact
pinned public types; no index model, Rust activation/direction/loop ABI, numeric
value or wrapper keyboard context. Root binds string value (native empty default)
and HTMLElement/null ref; List/Trigger/Content bind their actual HTMLElement/null
refs (normally div/button/div). Trigger and Content require matching string
values. Root forwards native disabled, orientation horizontal/vertical,
activationMode automatic/manual, loop and DOM dir. The installed implementation
defaults automatic/horizontal/loop=true, matching source wrap semantics; its
type comment says loop=false, so implementation observation governs the actual
default rather than repeating that inconsistent comment.

All parts preserve native children (no-argument Snippet) and child (Snippet with
actual props); a child renderer must spread those props onto its actual element
to preserve relationships, refs, classes and handlers. Forward IDs, labels,
aria/data, native attributes, class arrays/style objects and caller handlers
without replacing primitive ordering/cancellation. A Trigger is a native button
type=button by default and supports native button attributes; no href polymorphism.
Native DOM dir supports inherited RTL. Source direction is expressed by dir,
source activation by activationMode and source Wrap/Clamp by loop true/false.

Root kit-tabs, List kit-tabs-list, Trigger kit-tabs-trigger, Content kit-tabs-panel
are merged with caller classes. Six sources (root.svelte, list.svelte,
trigger.svelte, content.svelte, types.ts, index.ts) and one styles/tabs.css asset
form one complete cohort. Exactly eight flat exports; only tokens as registry
dependency and pinned Bits2.19.3 as runtime dependency. Native Svelte/Bits identity
replaces source registry identity context; no generated identity dependency or
global ID counter is justified. Candidate parts remain unadvertised through
S138; original S139 registers the complete family.

## Selection, panels and lifecycle

Automatic mode selects on eligible native focus; manual mode moves focus until
Space/Enter/click activates. Disabled triggers are skipped/refuse activation;
native orientation/direction/loop own arrows/Home/End and current tabstops.
Root value is authoritative, with onValueChange for native selection rather than
a second engine. Source numeric index is adapted to stable caller string values.
Unmatched/empty values may hide every panel; callers choose explicit initial
selection. Do not invent a default-first selection or normalize dynamic values.

Pinned Content always renders its children and actual DOM, hides inactive panels
with native hidden and retains tabindex=0 by default. It has no forceMount,
open, transition, presence callback or unmount-on-hide option. Both its default
and delegated child paths preserve that hidden policy. Inactive panel descendants
remain mounted; S140 must qualify state retention and visibility in an actual
installed browser rather than inferring presence from type tests.

Native registration owns value → trigger/content IDs, tab/tabpanel roles,
aria-selected, aria-controls and aria-labelledby, with cleanup when parts/values
change. Render-time SSR relationships and post-hydration linkage must be measured
independently: do not manufacture identifiers or promise attrs before native
registration runs. Stable request-local IDs, dynamic cleanup, controlled values,
refs/snippets and concurrent SSR/hydration are required S137/S138/S140 evidence.
Styles preserve source active/inactive, orientation, focus/disabled and panel
design; exact source hooks/radius and reduced-motion/RTL qualify in S139/S140.
The separate original S148 acceptance gates S149; this S136 freeze grants no
independent acceptance of future implementations.

S137 actual Root/List candidate with raw native Trigger/Content checks/builds
without warnings. A/B/empty SSR preserves selected/hidden panels, mounted child
content and delegated Root/List markup. Native server output omits trigger
aria-controls and panel aria-labelledby before registration effects; actual
hydrated DOM has both exact relationships. Retained SSR artifacts show the
boundary explicitly. Do not certify server linkage from browser-only effects or
introduce a parallel ID registry. Original S138/S140 must preserve and measure
complete candidate/installed identities, relationships and hydration separately.

S138 completes thin Trigger/Content candidates. Actual compiled default and
delegated button/section paths retain native props and refs; all three hydrated
groups (candidate default, delegated and raw Bits) have exact reciprocal links.
Hidden panels preserve the same input DOM/state while selection changes.
Manual click cancellation precedes native selection; Enter and disabled refusal
retain native behavior. Full candidate and direct raw Bits SSR both omit the
pre-registration links, demonstrating the pinned boundary independently of the
wrappers. The complete unadvertised candidate remains pending S139 installation,
S140 browser/hydration and separate S148 acceptance.

## Source customization hooks

All original customization records remain unchanged. The complete Tabs stylesheet
adds observed source hooks to the independent customization metadata; the existing
radius record retains its exact control/default/md fallback. Tokens0.1.7 records
that metadata addition without changing semantic token defaults.

| Property                                | Grammar                                                                                                             | Source fallback                                                              |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-tabs-trigger-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-tabs-gap                          | `<length-percentage>`                                                                                               | `1rem`                                                                       |
| --kit-tabs-list-gap                     | `<length-percentage>`                                                                                               | `0.25rem`                                                                    |
| --kit-tabs-trigger-border-color         | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-tabs-trigger-min-height           | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-tabs-trigger-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-tabs-trigger-padding-inline       | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-tabs-trigger-background           | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-tabs-trigger-color-inactive       | `<color>`                                                                                                           | `var(--kit-color-text-secondary)`                                            |
| --kit-tabs-trigger-font-weight          | `<number>`                                                                                                          | `600`                                                                        |
| --kit-tabs-trigger-background-active    | `<color>`                                                                                                           | `var(--kit-color-surface)`                                                   |
| --kit-tabs-trigger-color                | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-tabs-trigger-background-hover     | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-tabs-trigger-focus-outline-width  | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-trigger-focus-ring           | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-tabs-trigger-focus-outline-offset | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-trigger-disabled-opacity     | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-tabs-panel-padding-block          | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-tabs-panel-padding-inline         | `<length-percentage>`                                                                                               | `0`                                                                          |
| --kit-tabs-panel-background             | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-tabs-panel-color                  | `<color>`                                                                                                           | `inherit`                                                                    |
| --kit-tabs-panel-focus-outline-width    | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-tabs-panel-focus-ring             | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-tabs-panel-focus-outline-offset   | `<length-percentage>`                                                                                               | `2px`                                                                        |
