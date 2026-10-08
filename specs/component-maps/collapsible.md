# Collapsible source, composition and native presence contract

Source: [family](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/collapsible/mod.rs),
[Root](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/collapsible/root.rs),
[Trigger](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/collapsible/trigger.rs),
[Content](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/collapsible/content.rs),
[manifest](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/ui/collapsible.json)
and [CSS](https://github.com/triesap/leptos_ui_kit/blob/a10fbf06334f4648f5755e05a7147414e4e5fc98/crates/leptos_ui_kit_registry/registry/styles/collapsible.css).
Preserve MIT attribution. Source Root/Trigger/Content map to actual pinned
Bits Collapsible2.19.3 with native disclosure context and stable identity.

Exactly CollapsibleRoot/CollapsibleRootProps, CollapsibleTrigger/
CollapsibleTriggerProps and CollapsibleContent/CollapsibleContentProps are the
six flat exports. Five sibling sources (root.svelte, trigger.svelte,
content.svelte, types.ts, index.ts) plus one styles/collapsible.css asset form one
complete cohort. Tokens is the only registry dependency; Bits2.19.3 is the runtime
dependency. Native identity replaces source identity dependency without a global
counter, source ABI, alternate context or generalized accordion state engine.

## Frozen state, refs and rendering

Root aliases exact native RootProps and binds boolean open, false by default,
and actual HTMLElement/null ref. Source default_open becomes native initial
open; bind:open supplies controlled caller state. Native onOpenChange and
onOpenChangeComplete preserve state/transition callback ordering. Forward native
Root disabled, DOM ID/dir/attrs/events/classes/style and both snippet forms.
Trigger aliases exact TriggerProps, binds actual HTMLElement/null ref and uses
the native type=button, expanded/controls/state, click/Space/Enter behavior and
Root/Trigger disabled refusal. It requires a meaningful visible/accessible label.
Its native button attrs, caller events and cancellation remain intact.

Content uses exact native ContentProps with hiddenUntilFound excluded: the source
has no browser-find expansion contract. A causal type fixture rejects that
additional search behavior. The implementation default is hiddenUntilFound=false;
the pinned type comment saying true does not change the supported source policy.
forceMount is supported native presence control for caller-composed motion.
Content binds actual HTMLElement/null ref, forwards DOM attrs/classes/style and
native children/child. All parts' children are no-argument snippets. Root/Trigger
child receives props; Content child receives props and actual boolean open.
Callers spread supplied native props onto their delegated DOM element. Numeric
state, source content_id/default_open aliases, custom keyboard/presence callbacks
and an open argument on children are not public APIs.

Merge kit-collapsible, kit-collapsible-trigger and kit-collapsible-content with
caller classes on the actual native elements. No extra label, indicator, Portal,
Accordion, variant, transition or state-management export is introduced.

## Presence, motion and composition

Pinned Content always renders its DOM/children, including while closed. Default
forceMount=false uses native presence/hidden after supported exit motion, rather
than unmounting the child snippet. forceMount=true leaves closed DOM visible so
callers can own its visual hiding/motion from data-state. Root's presence manager
owns transition status and completion; preserve native state/transition attrs
and callbacks. No source-framework presence ABI or separate transition engine.

Actual native measurement provides --bits-collapsible-content-height/width and
temporary inline animation/transition styles. Plain managed CSS does not promise
zero runtime inline styles. Source CSS itself has no mandatory keyframes; caller
motion may use native dimensions/state and must honor reduced motion. Original
S142/S144 must measure closed/open/mounted state, snippets, callbacks, cleanup,
actual initial SSR/hydration, styles/directions and any strict-CSP boundary.

Source content_id maps to actual Content id. Native controls relationship uses
the same current native Content registration; render-order SSR and hydration
must be observed separately with raw Bits controls. No sibling ID registry is
added to pretend browser-effect linkage already exists on the server.

Accordion-like recipes compose multiple independent labeled disclosures using
caller state and ordinary Svelte markup. A recipe may choose coordinated open
values in application code; the kit adds no new keyboard or collection engine.
Original S144 qualifies multiple independent instances and composed behavior.
Candidates stay unadvertised until the complete original S143 registration;
separate original S148 acceptance gates S149. This freeze supplies exact types
and policy, without granting independent acceptance of future implementations.

S142 actual candidate check/build and open/closed SSR preserve expanded/hidden
state, mounted children, source/caller classes and delegated open snippet props.
Both candidate and raw Bits SSR omit trigger controls before the later Content
registration; hydrated triggers link to their own actual Content IDs. Real
candidate Chromium measures refs, pointer/Space/Enter binding and state/completion
callbacks, caller cancellation, disabled refusal and independent delegated/raw
groups. Closed content retains the same input node/state, and forceMount exposes
closed content with expanded=false as its native caller-owned visual policy.
Complete candidate parts remain unadvertised until S143. S144 installed
qualification measures both initial states, 12 concurrent requests per layout,
stable generated IDs in two independent recipe items, retained input DOM,
native callbacks/cancellation/disabled/refs and source form button behavior.
Caller-owned measured-height animations use native presence; a paused actual
exit remains visible until completion, rapid toggles settle to the latest state,
reduced motion disables both animations, and destruction during exit clears refs
and cancels pending completion before remount. Separate S148 acceptance remains
required.

Actual CSP responses use nonce-bearing scripts and external source CSS. Allowing
style attributes produces no diagnostics. Denying style attributes blocks native
SSR measurement declarations and emits only attributed style-src-attr violations
(six server / seven hydrated diagnostics in the measured route). Chromium's
hydrated CSSOM property updates still provide measured dimensions under that
policy; source padding, visibility and keyboard toggling remain functional.
This qualifies those observed paths, not arbitrary caller height animations or
an absence of runtime inline styles. All exceptions and warnings fail the CSP
lane; expected violations are retained individually with policy and artifacts.

## Complete source customization hooks

All prior customization records remain unchanged. Tokens0.1.8 records the
observed source hooks without changing semantic defaults or token CSS. The
existing exact trigger radius keeps its source control/default/md chain.

| Property                                       | Grammar                                                                                                             | Source fallback                                                              |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| --kit-collapsible-trigger-radius               | `<length-percentage>{1,4} [ / <length-percentage>{1,4} ]? \| inherit \| initial \| unset \| revert \| revert-layer` | `var(--kit-radius-control, var(--kit-radius-default, var(--kit-radius-md)))` |
| --kit-collapsible-gap                          | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-trigger-border-color         | `<color>`                                                                                                           | `var(--kit-color-border)`                                                    |
| --kit-collapsible-trigger-min-height           | `<length-percentage>`                                                                                               | `2.5rem`                                                                     |
| --kit-collapsible-trigger-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-trigger-padding-inline       | `<length-percentage>`                                                                                               | `0.75rem`                                                                    |
| --kit-collapsible-trigger-background           | `<color>`                                                                                                           | `transparent`                                                                |
| --kit-collapsible-trigger-color                | `<color>`                                                                                                           | `var(--kit-color-text)`                                                      |
| --kit-collapsible-trigger-font-weight          | `<number>`                                                                                                          | `600`                                                                        |
| --kit-collapsible-trigger-background-hover     | `<color>`                                                                                                           | `var(--kit-color-surface-hover)`                                             |
| --kit-collapsible-trigger-focus-outline-width  | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-collapsible-trigger-focus-ring           | `<color>`                                                                                                           | `var(--kit-focus-ring)`                                                      |
| --kit-collapsible-trigger-focus-outline-offset | `<length-percentage>`                                                                                               | `2px`                                                                        |
| --kit-collapsible-trigger-disabled-opacity     | `<number>`                                                                                                          | `var(--kit-disabled-opacity)`                                                |
| --kit-collapsible-content-padding-block        | `<length-percentage>`                                                                                               | `0.5rem`                                                                     |
| --kit-collapsible-content-padding-inline       | `<length-percentage>`                                                                                               | `0`                                                                          |
