# Progress native bounds and indeterminate contract

Original S170–S172, R03, R20, R22, R25, R26, R32, R33, R34.

Immutable source renders one native progress element with `.kit-progress`, caller
class, numeric value and optional numeric max default100. It renders numeric
fallback text and asks applications for an associated label when context does
not name the task. The approved catalog additionally requires indeterminate
progress: make value optional/null so the browser owns omission semantics. Keep
native progress, not a div-based ARIA clone, timer, task engine or primitive.

Freeze Progress/ProgressProps, two flat source files, one compatible source/style
cohort, tokens-only registry dependency and empty npm list. Intersect actual
Svelte progress attributes with source numeric value/max (optional/null), optional
matching progressbar role, no caller children and bindable HTMLProgressElement
ref. Deliberately exclude native string/array numeric attribute inputs: source
f64 intent requires numbers. Do not invent min, indeterminate flag, percentage
store, controlled duration, variant/size, callback/delivery or named parts.
Actual class/style/id/title/data/ARIA/hidden/tabindex/events remain native.

Omitted max uses source100; explicit null omits max and uses browser native1.
Omitted/null value is native indeterminate (position -1, no value attribute);
numeric0 is determinate. Browser native properties own normalization: invalid/
nonpositive max uses1, negative value clamps0, above-max value clamps to max.
Pass raw numeric attributes without a second normalization or synthetic ARIA
value store; native semantics and rendered state remain synchronized. Float,
nonfinite and dynamic boundary controls are qualified against a direct native
progress, rather than promising TypeScript can constrain finite numeric ranges.
Numeric fallback text follows source values/default max for determinate cases;
indeterminate fallback is empty instead of fabricated percentage/message. It is
not an accessible name: preserve actual label-for, aria-label or labelledby,
and caller-owned aria-valuetext when supplied. Do not synthesize a role/name or
announce through a second region. Explicit native ARIA stays caller-owned;
applications should use native value/max to represent bounds rather than add
contradictory redundant ARIA values.

Native progress is read-only presentation, not a form input; no name/min/required/
disabled semantics or submission entry, custom keyboard activation or automatic
focus. Caller tabindex/events/ref remain native. Changes retain element/ref,
conditional teardown clears ref, and SSR state/bounds/naming are request-local.
No mount-only state, shared counter or hydration suppression.

Preserve all eight CSS declarations: block display, inline-size100%, block-size
0.5rem, border0, progress/indicator/default/full radius, overflow hidden,
surface-hover background and primary accent. Existing radius/semantic metadata
suffices; no new hooks or copied skins. Map native paint through narrowly scoped
browser progress pseudo-elements when needed to retain the existing semantic
colors and inherited radius/background. Qualify actual
native determinate/indeterminate visual state and geometry, theme colors and
contrast, caller style/radius, RTL/reduced motion without invented animation.
Native hidden must work even when explicit block display needs a scoped rule;
retain until-found browser semantics. Types are S170, complete actual CLI install/
check/build/SSR/replay S171, browser/value/name/ref/style/state qualification S172.
Mandatory separate S181 and later platform/MVP acceptance remain open.

S172 real installed production apps expose a pinned-framework attribute boundary:
numeric IDL max setters ignore nonpositive values, nonfinite value setters throw,
and Svelte's lowercase value update/removal path writes zero when the prop is
removed. Serialize numeric HTML attribute values without custom normalization,
using case-insensitive VALUE through the spread attribute path, and restore true
value absence in a reactive effect after native ref/update completion. This
keeps source-compatible raw attribute parsing and native indeterminate state on
the retained element; there is no owned percentage/ARIA/timer state. Version0.1.1
and registry identity record the repair; separate S181 must assess it.

Twelve live states in each layout match direct native attribute controls for
exact attributes, value/max/position, indeterminate selector, accessible bounds
and retained node/name. Causal DOM controls separately qualify setter-versus-
attribute behavior. Chromium ignores aria-valuetext on the actual native progress
in this lane, matching the independent native control; preserve the caller attr
without claiming measured spoken value text. Native names, label association,
read-only focus/events/form behavior, ref teardown, hidden/until-found, all eight
CSS declarations/radius paths, caller geometry/themes/RTL and isolated SSR are
qualified. Visual inspection exposed Chromium native green/gray paint despite
computed theme values; scoped native bar/value pseudo-elements now apply the
existing primary token and inherited background/radius. Default/night/caller
pixel samples match exact semantic colors and each pair exceeds3:1. Keep actual
screenshots and painted/computed JSON, not CSSOM alone. Only pinned Chromium
paint is measured; the Mozilla mapping is declaration-qualified until applicable
platform checks. Internal native indeterminate animation remains user-agent
behavior: no kit CSS animation/transition does not certify every browser's
internal animation or an arbitrary theme's contrast. Initial negative/nonfinite
SSR-to-hydration cases also match independent native attributes with no errors.
