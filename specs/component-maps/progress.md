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
suffices; no hooks or copied browser-specific pseudo-element skins. Qualify actual
native determinate/indeterminate visual state and geometry, theme colors and
contrast, caller style/radius, RTL/reduced motion without invented animation.
Native hidden must work even when explicit block display needs a scoped rule;
retain until-found browser semantics. Types are S170, complete actual CLI install/
check/build/SSR/replay S171, browser/value/name/ref/style/state qualification S172.
Mandatory separate S181 and later platform/MVP acceptance remain open.
