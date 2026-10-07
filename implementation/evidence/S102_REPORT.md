# S102 step report — Exact pinned Switch composition contract

Author: Codex. Candidate; independent S115 acceptance remains pending.
Original criteria and accepted S001–S091 remain unchanged.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S102","kind":"report","commit":"bf6813c1d38924300cd2a5732fcac7d70cc9c748","disposition":"candidate"}
-->

SwitchProps derives directly from public Bits Switch.RootProps, omitting only
child/children because the single internal Thumb is owned. The source mapping
records exact pinned Root/Thumb types, public exports, checked/ref binding,
boolean onCheckedChange, native form/required/disabled/value attributes, caller
classes/styles/events and upstream ordering/cancellation. No replacement
primitive interface, new any, generic dictionary or invented state machine is
introduced. Upstream HTMLElement/null ref typing is preserved. Actual HiddenInput
form/reset behavior is explicitly a S104 obligation, not inferred from role
markup. Full source selectors, seven inherited track/Thumb hooks, exact circular
Thumb radius, RTL and reduced-motion obligations are documented before wrapper
implementation. S103 supplies actual bindings/runtime and initial SSR.

Eight real strict TypeScript fixtures pass. Positive checked/ref/form/style,
native events/classes/aria and boolean callback contracts compile. Child and
children, nonboolean checked, wrong callback, foreign SVG ref, link attributes
and foreign event targets fail causally in the consuming fixture. The first
probe omitted real Svelte checker ambient shims and Node types, producing
missing Expand/NodeJS context errors. Final probes include the installed pinned
svelte-check Svelte5 shim and Node types, with skipLibCheck:false unchanged;
there is no authored declaration shim or diagnostic suppression. All positive
diagnostics are empty and all negative diagnostics belong to the real fixture.
This does not discharge the separate two upstream Svelte-check TS2590 exceptions.

Typecheck, lint, maintained fixture check zero errors/warnings, formatting and
governing contracts/projection pass. Raw evidence:
`implementation/evidence/logs/codex-r10/s102-*`, including initial context
failures. Conditional Cargo is N/A. AC20, S103/S104 and later catalog/platform/
package requirements and independent RCLD-06 acceptance remain open. No whole
Switch/MVP acceptance is claimed. Next original checkpoint is S103 generation.
