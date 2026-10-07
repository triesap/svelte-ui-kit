# S096 step report — Native Spinner API contract

Author: Codex. Candidate; separate S115 acceptance remains pending.
Previously accepted S001–S091 and original checkpoint criteria are preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S096","kind":"report","commit":null,"disposition":"candidate"}
-->

The immutable source component/CSS mapping freezes public Spinner,
SpinnerMode and SpinnerProps. Status/decorative are a string union; native
attributes come from pinned SvelteHTMLElements["span"], not a generic dictionary
or primitive placeholder. Default status/Loading owns a single hidden label and
status role. Decorative excludes label and owns no announcement. Internal
children and controlled role/aria-hidden/aria-label/aria-live are omitted;
other native attributes/events/classes remain supported. There is no internal
event handler to merge, bindable ref, polymorphism or delegated child hook.

The source accepted but ignored decorative labels. The adopted owned-markup
rule justifies the target discriminated type refusing this combination rather
than silently dropping it. A standalone type-only sibling template is justified
for public exports and causal compiler fixtures before the actual S097 wrapper.
No dummy runtime behavior is introduced. The source's circular radius,
dimensions, ring colors, thickness/duration and selectors are explicitly mapped;
target reduced motion remains the required S097/S098 implementation/proof.

Actual TypeScript6.0.3 compiles the real template in owned isolated consumers
with strict checking and skipLibCheck=false. Eleven owning checks pass: both
modes/native attributes/events/class values; nine causal refusals for unknown
mode, decorative label, children, controlled ARIA/role, ref and wrong event
target; and explicit source/CSS/omitted-hook mapping. Errors must arise in the
intended consumer fixture; unrelated import/library failures do not count.

Routed pinned owning types11/11, maintained fixture check, build/typecheck,
lint, format and governing contracts/projection pass. One formatting-only
failure was corrected without weakening rules; its red log is retained.
Raw logs: `implementation/evidence/logs/codex-r10/s096-*`.
Runtime, installation, accessible render and motion are not accepted through
types alone; original S097/S098 remain next. Conditional Cargo is N/A in this
TypeScript scope; retained reference evidence and AC20 debt remain unchanged.
