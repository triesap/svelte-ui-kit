# S122 step report — Menu source parity and floating contracts

Author: Codex. Independently accepted on code `21c72d21fd78a34f12099b94b0d4fddff779d911` at evidence `f9dc56f1921024c426b8df59c0c08abb28e2af7c`.
Original implementation commit: `a01d348cb323880423f97f6d9dfed4259c5e4c4d`. The candidate narrative below
is retained as historical implementation and verification provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S122","kind":"report","commit":"f9dc56f1921024c426b8df59c0c08abb28e2af7c","disposition":"implemented"}
-->

The worksheet maps the immutable six-part reference Menu surface and its required
ordinary/radio controlled selection to actual pinned DropdownMenu contracts.
Exactly eight target parts are frozen: Root, Trigger, Portal, Content, Item,
RadioGroup, RadioItem and a stateless native-span ItemIndicator. Portal and
RadioGroup are required native composition/context adaptations, not adoption of
optional submenus, checkbox/group-heading/arrow or static-content catalog scope.

Seven public prop types alias exact native public types. Indicator requires a
boolean checked supplied by actual native RadioItem snippets, preserves native
span attrs/ref/children and excludes hidden override/unsupported child rather
than accepting and dropping hooks. No index/keyboard/selection engine or fake
upstream Indicator type is introduced. Source checked index maps to stable
application string group values; source radio kind maps to actual RadioItem.

Floating delegated Content explicitly retains wrapperProps, inner props and
open. Native side/align/strategy/collision/selection unions remain intact. Source
bottom/start/spacing4/viewport8 maps to the actual native placement options;
actual Dropdown Content loop=true runtime is recorded rather than its shared
false-default declaration comment. Source root DOM/classes and index/callback
aliases are not accepted and dropped by virtual native Root. Label/indicator
styling remains explicit nested composition with actual checked state.

Strict native type checks pass26/26: positive all-eight/native-snippet cases,
23 causal invalid prop/ref/selection/callback/floating/indicator/optional-export
controls, exact equality of seven primitive types, and actual production view
refusal of the still-unadvertised incomplete candidate. Every error is attributed
to the owned fixture; no skipLibCheck or any weakening is introduced.

Typecheck, lint, formatting, maintained fixture check zero errors/warnings,
governing projection/contracts and diff checks pass. Raw evidence:
`implementation/evidence/logs/codex-r10/s122-types.log` and
`s122-static.log`. Conditional Cargo provenance remains unchanged and no reference
source changes occurred. All203 original definitions remain intact.

This is implemented/locally verified API/source-parity progress, not independent
acceptance. S123–S125 author these parts, S126 advertises the complete cohort,
S127 proves installed selection/keyboard/nesting and S128 proves actual floating
placement/themes/CSP and supplies the mandatory independent sequence gate.
Source strict-CSP claims are not silently inherited or waived: the measured
native limits still require S128 evidence. AC20/later delivery remain open.
