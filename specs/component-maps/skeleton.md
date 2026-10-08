# Skeleton empty decorative placeholder contract

Original S176–S178, R03, R20, R22, R25, R26, R32, R33, R34.

Immutable source renders one empty span with `.kit-skeleton`, caller class and
fixed aria-hidden true. Manifest calls it decorative and asks the owning region
to expose loading state. Source has no dimensions/shape enums, shimmer/pulse,
loading flag, children/readable message, role/live region or behavior. Preserve
native decorative span, Skeleton/SkeletonProps, two flat source files, one
compatible source/style cohort, tokens-only dependency and no npm dependency.

Intersect actual native Svelte span attributes with no children, optional actual
HTMLSpanElement ref and only matching aria-hidden true choices. Contradictory
false/null values cannot be accepted and silently discarded. Exclude role,
aria-live and tabindex: a concealed decorative placeholder must not become an
announcing or focusable control. Native caller class/style/id/title/data, other
ARIA/hidden/direction and events otherwise remain native, without Omit widening
known attributes. Reject foreign refs, input name/value/disabled/form state,
variants/size/shape/dimensions recipes, timer/animation/loading/busy/callback and
child/polymorphism/part APIs. Native ARIA labels may be preserved on the hidden
DOM node but must not create accessible readable content or a second region.

Loading/busy/message meaning belongs to the application region/status, with
meaningful content when available. The skeleton remains empty/concealed and
does not fabricate readable fallback, heading/name/ID or redundant announcements.
No automatic focus, keyboard/action/form behavior, polling/presence timer,
shared identity/state or hydration suppression. Actual ref stays on the span
and clears on conditional teardown. SSR native empty hidden markup is stable
and request-local, while the owning application's loading state remains its own.

Preserve all four source CSS declarations: block display, min-block-size1rem,
skeleton/surface/default/sm radius chain and surface-hover background. Default
span fills its application's block width and has at least the source minimum
height; caller native class/style owns width/height/min-height/radius overrides.
Use ordinary CSS radius grammar, not a shape enum or copied circle rules. Existing
semantic/radius metadata suffices, no new hook/palette/motion. Source is static:
reduced motion does not need invented pulse/shimmer/transition. Native hidden
needs a scoped display exception because explicit block display overrides UA
hidden; preserve until-found browser behavior.

Actual types are S176, complete registry/CLI install/check/build/SSR/replay S177,
empty/concealed accessible tree and owning-region state, actual refs/native attrs,
dimensions/radius/theme surfaces/contrast/RTL/reduced motion and SSR/hydration S178.
Document source baseline contrast concerns under AC18 rather than automatically
certify a decorative surface. Mandatory separate S181 and later platform/MVP
acceptance remain open.
