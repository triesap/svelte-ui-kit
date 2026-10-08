# Separator native orientation and decorative contract

Original S173–S175, R03, R20, R22, R26, R32, R33, R34.

Immutable source renders one empty div with `.kit-separator`, caller class,
separator role and matching aria-orientation/data-orientation. Source orientation
supports horizontal/vertical, default horizontal. Native semantic div is justified
for both orientations; no Bits primitive or copied behavioral service is needed.
Preserve Separator/SeparatorProps/SeparatorOrientation, two flat source files,
one compatible source/style cohort, tokens-only dependency and no npm dependency.

The approved catalog also requires decorative versus meaningful cases. Add one
boolean decorative option default false. Meaningful uses separator and matching
ARIA orientation; decorative uses role none and aria-hidden true, omits ARIA
orientation and retains data orientation for the same visual geometry. There is
no separator message, duplicate announcement or extra accessible node. Do not
invent focus/action/window-splitter behavior, keyboard resizing/value state,
polymorphism, children/parts, variant/size or custom dimensions API.

Intersect actual Svelte div attributes with source orientation union, no children
and bindable HTMLDivElement ref. A discriminated decorative case allows only
matching role/aria-hidden choices instead of accepting and silently dropping
contradictory values. Meaningful role is optional matching separator; native
aria-hidden remains caller-owned for meaningful cases. ARIA/data orientation are
owned by orientation and cannot be separately supplied to diverge styling and
semantics. Native attrs/names/class/style/hidden/tabindex/events otherwise remain
native, without Omit widening known data attributes. Reject foreign refs,
unsupported orientations, role collisions and unrelated control/part options.

Caller labels/names can identify meaningful sections; empty source children do
not fabricate readable text. Native div is not a focusable/resizable widget;
caller tabindex/events/ref are ordinary native behavior without synthetic Enter/
Space activation or automatic focus. Dynamic orientation/decorative changes keep
the same node/ref and synchronize role/ARIA/data/CSS. Conditional teardown clears
ref, native hidden remains native, and SSR options/relationships are request-local.
No generated IDs/counters, mount-only values or hydration suppression.

Preserve six source CSS declarations: flex none, semantic border background,
horizontal border-width block size and inline-size100%, vertical block-size100%
and border-width inline size. Vertical percentages need an application ancestor
with definite height; no invented min-size/layout wrapper. Native class/style
and existing border token provide customization. No new hook/radius/motion or
metadata change. Actual CLI registration/install/compile/build/SSR/replay is S174;
native accessible orientation/decorative/ref/attrs, live geometry/theme/contrast,
RTL/reduced motion and SSR/hydration are S175. Mandatory separate S181 and later
platform/MVP acceptance remain open.
