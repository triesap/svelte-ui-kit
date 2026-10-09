# Card native section and content contract

Current qualification status: original family gates, the selected native
baseline and local MVP are independently accepted through S203.
[Final qualification](../../implementation/evidence/RCLD-11_QUALIFICATION.md)
is anchored at `f756d227b6a1dce1396183dec4db138a256e16bf`. Checkpoint-era pending/gated statements below
retain historical provenance and do not reopen completed gates.
[Native/source boundaries](../../implementation/evidence/COMPATIBILITY.md#current-native-and-source-boundaries)
and documented platform limits remain explicit.

Original S161–S163, R03, R20, R22, R25, R26, R32, R33, R34.

Inspect actual immutable Card source, manifest and managed card CSS. The source
renders one section with `.kit-card`, optional caller class and required children.
It exports only Card; source accessibility notes call for a heading when the card
represents a distinct document section. There are no separate header/title/
description/content/footer/action parts, snippets, variants or business behavior.
Preserve native composition with application header/headings/paragraphs/footer,
controls and nested cards supplied through required children. Do not manufacture
extra parts from component names or a different kit's surface catalog.

Freeze flat Card/CardProps exports, `card.svelte`/`card.types.ts` targets, one
compatible `card` source/style cohort and tokens-only registry dependency with
no npm dependency. Intersect actual Svelte section attributes with compatible
required no-argument children Snippet and optional bindable HTMLElement|null ref.
The actual native section type uses HTMLElement; do not invent HTMLSectionElement
or a nominal ref restriction. Preserve native class/style, id/title, data/ARIA,
hidden/tabindex and events. Reject non-snippet content, non-HTML refs and unrelated
link/image/action/size/variant/replacement-child/named-part APIs.

Render one section and its children directly, without layout wrappers, auto
heading IDs, generated names, roles, state, event handlers, link/button behavior,
form bindings, live region, portal or runtime service. The application supplies
the document hierarchy and distinct labels/labelledby when it wants named region
semantics. An unnamed section remains native; do not impose an artificial landmark
or inaccessible heading structure. Caller native controls/events retain their
ordinary behavior, and nested surfaces inherit or override CSS normally without
shared component state or naming collisions. Caller refs bind to the actual
section and clear on teardown.

Preserve all seven source CSS declarations: border-box sizing, token-width solid
semantic border, card/surface/default/lg radius chain, 1rem padding, raised surface
background, text foreground and small shadow. Existing semantic foundation values
and card-radius metadata suffice; append no new hooks, styles, variants, motion or
metadata. Scoped native style/class customization remains application-owned.

S161 qualifies actual native types. S162 registers the complete item and tests
actual default/custom CLI installation, source/CSS ownership, compilation/build,
composed SSR and unchanged replay. S163 exercises nested/application content and
independent naming/styles, refs and caller attrs/events, native controls/forms,
source computed values and radius/theme changes, RTL/reduced motion and isolated
SSR/hydration in generated applications. Author verification remains a candidate;
mandatory separate S181 acceptance gates S182 and final platform/MVP acceptance
remains open.

S163's actual default/custom generated consumers verify one native section per
instance, direct application header/h2/content/inner-section/h3/form/footer,
two independently named native regions and an unnamed ordinary section without
automatic roles. Dynamic content preserves actual outer/inner nodes and native
input state. Caller focus, key events, native child activation, bubbling/default
cancellation and form submission/reset remain native; hiding/teardown clears both
section refs. Source seven declarations and all surface/default/lg/direct radius
paths are measured, with live parent theme and independently overridden nested
border/background/text/radius/shadow, RTL/reduced motion and concurrent isolated
SSR. No component/CSS/type/metadata changes were needed. These are author-verified
candidates; mandatory independent S181 and final platform/MVP acceptance remain.
