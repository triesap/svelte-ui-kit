# Badge native presentation contract

Original S158–S160, R03, R20, R22, R25, R26, R32, R33, R34.

Inspect the immutable source Badge component, manifest and managed badge CSS.
The source renders one native span with `.kit-badge`, optional caller class and
required children. It has no variant, size, status/intent enum, action, disabled
state, icon slot or compound part. Preserve that bounded native presentation;
do not derive new variants from the styled kit's broader token catalog.

Freeze exact flat Badge/BadgeProps exports, `badge.svelte`/`badge.types.ts`
targets and one `badge` source/style compatibility cohort. Depend only on tokens,
with no npm or primitive dependency. Intersect actual Svelte native span attributes
with required no-argument children Snippet and optional bindable HTMLSpanElement
ref. Preserve caller class/style, id/title, data/ARIA attributes and native events.
Native DOM types are structural: HTMLSpanElement does not nominally reject every
other HTML element; do not invent a nominal binding type. Actual rendered/ref
identity is the span and is qualified in installed browser consumers. Reject
foreign non-HTML refs, non-snippet children and unsourced props such as href,
variant, size, disabled, loading and replacement child/polymorphic hooks.

Render children directly inside the span; add no wrapper, state, event handler,
ID generator, link/button behavior, live region or form action. Meaningful badge
text belongs to the application; do not convey status by color alone. Native
caller ARIA and tabindex remain native, without automatically converting the span
to an interactive/status role. Keyboard/focus/form behavior follows native span
semantics rather than a kit action contract.

Preserve all ten source declarations: inline-flex display, centered alignment,
indicator/default/full radius chain through `--kit-badge-radius`, 0.125rem/0.5rem
padding, surface-hover background, text foreground, inherited font, 0.75rem size,
600 weight and unit line height. Radius customization already exists in the
foundation metadata. No additional hooks or metadata changes are needed; native
class/style and existing semantic theme values provide application customization.
No state selector, motion or source variant is invented.

S158 freezes actual native types with positive/causal negative fixtures. S159
registers the complete item and verifies actual default/custom CLI installation,
compilation/build/SSR and unchanged replay. S160 verifies meaningful dynamic
children, native attrs/classes/ref, foreground/background and radius combinations,
theme, native focus/event/form behavior, RTL/reduced motion and SSR/hydration in
installed applications. Separate S181 acceptance remains mandatory; this type
freeze does not claim runtime or independent acceptance.
