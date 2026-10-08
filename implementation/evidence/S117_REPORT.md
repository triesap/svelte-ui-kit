# S117 step report — Native Alert Dialog state and activation

Author: Codex. Candidate; separate S128/RCLD-07 acceptance remains pending.
Original S001–S115 acceptance and all203 definitions remain preserved.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S117","kind":"report","commit":null,"disposition":"candidate"}
-->

Root uses the actual distinct AlertDialog primitive with explicit bindable open
and forwarded children/change/completion callbacks. It introduces no DOM, role
switch, IDs, confirmation state or focus machinery. Trigger forwards native
ref, attributes, event handlers and child/children rendering, combining caller
classes with kit-alert-dialog-trigger and defaulting type to button with native
explicit overrides. Event ordering and cancellation remain upstream.

Owned incremental consumers copy exactly these authored parts and types while
declaring Content, Title, Description and Cancel as raw native AlertDialog parts.
This is explicitly candidate-copy qualification; no partial registry installation
is claimed. Check/build and actual closed/initially-open production SSR pass,
including native alertdialog role, source class/delegation and actual handler
hash. Full responses, source/config/package and every production file identity
are retained. The actual distinct context is verified in rendered DOM, not
inferred from structurally shared upstream prop types.

Four production Chromium cases prove open state flows both ways through native
and parent changes, exactly counted callbacks/handlers, keyboard activation,
actual BUTTON refs, native cancellation and disabled refusal, and delegated
merged props/ref. The coupled component lane passes20/20 (native SSR plus19
strict API/registry controls), with a final owning SSR1/1 rerun retaining complete
response evidence. No browser errors, hydration warning suppression, retries,
disabled tests or SSR switch is introduced.

Typecheck, lint, formatting, maintained fixture check zero errors/warnings and
production build, contract/projection validation and diff checks pass. The
registry is unchanged and the family remains unregistered until S120. Conditional
Cargo scope and unchanged reference evidence remain; no reference source edits.
AC20 and all later catalog/platform/package/release obligations remain open.

Raw evidence: `implementation/evidence/logs/codex-r10/s117-*`,
`implementation/evidence/logs/alert-dialog-candidate/` and browser
`candidate-artifact.json` containing actual source and production hashes. This
is implemented/locally verified progress, not independent acceptance. Continue
original S118 Portal/Overlay/Content under the existing batch and retain the
separate S128 gate before S129.
