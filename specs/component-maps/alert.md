# Alert native message and accessible content contract

Original S164–S166, R03, R20, R22, R26, R32, R33, R34.

Inspect actual immutable Alert source, manifest and managed alert CSS. Source
renders one div with `.kit-alert`, fixed `role="alert"`, optional caller class
and required children. Its manifest requires alert live-region behavior and notes
Status for non-urgent dynamic messages. There are no severity/intent/size variants,
icon/title/action/dismiss parts, timers, announcement callbacks or notification
delivery state. Keep this presentational source role distinct from Alert Dialog;
no primitive, dialog dependency, modal/focus trap or application queue is needed.

Freeze flat Alert/AlertProps exports, `alert.svelte`/`alert.types.ts` targets, one
compatible `alert` source/style cohort, tokens-only registry dependency and no
npm dependency. Intersect actual native Svelte div attributes with compatible
required no-argument children Snippet, optional bindable HTMLDivElement ref and
optional role limited to the source literal alert. Omitted/explicit matching role
renders alert; contradictory role is rejected rather than accepted and dropped.
Native class/style/id/title, data/ARIA/hidden/tabindex and events remain native.
Reject replacement child/polymorphism, non-snippet content, foreign refs and
unsourced variants, delay, delivery/dismiss/named-part/action/link APIs.

Render required children directly; empty content can precede an application
message update in the retained live-region node. The source role implies native
assertive/atomic live-region defaults. Inherit actual native aria-live/aria-atomic/
aria-relevant values, not copied unions or invented recipe options. Explicit native
ARIA remains caller-owned and can change those defaults; document/qualify that
effect rather than silently dropping or rewriting it. Status is the source's
ordinary non-urgent message counterpart. The component does not choose urgency,
invent a message or announce through a second region.

Meaningful visible message content is application-owned. Preserve native explicit
label/labelledby and accessible child structure when supplied. Decorative duplicate
icons/text belong in aria-hidden child markup so they do not repeat accessible
content. No automatic focus, keyboard/action conversion, generated heading/ID,
live text clone, form binding, portal, timeout or dismiss behavior is introduced.
Keep message/node/ref identity on updates and clear the actual div ref on teardown.
SSR renders semantic content without delivery side effects or shared request state.

Preserve all six source CSS declarations: border-box sizing, token-width solid
semantic border, alert/surface/default/md radius chain, 0.75rem/1rem padding,
raised-surface background and text foreground. Existing semantic foundation
values and alert-radius metadata suffice; append no hooks, motion or variant
styles. Native application class/style and semantic theme values provide
customization, with actual foreground/background combinations qualified.

S164 qualifies actual native types and records supported/omitted hooks. S165
registers the complete item and verifies real default/custom install/check/build,
semantic SSR and unchanged replay. S166 tests actual role/live-region properties
and accessible tree/dynamic content, exclusion of decorative duplicates, native
caller attributes/ref/controls, source computed values/radii, theme contrast,
RTL/reduced motion and isolated SSR/hydration. Browser semantics/accessibility
tree evidence does not claim measured speech from every screen reader. Mandatory
separate S181 and final platform/MVP acceptance remain open; author checks are
candidates only.

S166 real default/custom generated production apps retain alert nodes/refs and
application focus across message updates, including initially empty content.
Chromium accessibility evidence exposes assertive/atomic defaults and excludes
aria-hidden decorative duplicates, matching a direct native role control.
Explicit off/false/removals attributes survive unchanged; Chromium omits the
live-region properties for the off case, just as for the direct native control.
Native until-found keeps an empty accessible alert node while concealing its
children. This is actual browser evidence, not measured screen-reader speech.
All six source declarations/radius fallbacks, native focus/events/form defaults,
hiding/ref teardown, RTL/reduced motion and eight distinct concurrent SSR
responses per layout are qualified. Three actual baseline/night/caller color
pairs meet 4.5:1 text contrast; arbitrary custom themes remain caller-owned.
