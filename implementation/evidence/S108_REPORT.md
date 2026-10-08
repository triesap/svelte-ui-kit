# S108 step report — Native Content forwarding

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `182fddf63e6b5d40abfd7315bb0b8bdeb34e8d14`. Earlier candidate
reporting below is retained as historical implementation provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S108","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Content forwards the exact public pinned Props to the actual Bits part, explicitly
binds its native ref and combines design/caller classes. The wrapper introduces
no handlers, focus/layer/state machinery, identity shim or Alert Dialog emulation.
Default children and delegated child({props,open}) retain native semantics and
focus/dismissal/presence/scroll controls.

An actual owned compiled application composes five authored parts with remaining
raw Title/Description/Close. Production SSR passes1/1 for default DIV and forced
closed delegated SECTION, original children, classes, dialog role and live state.
The initial SSR assertion assumed attribute order; the corrected check identifies
each actual element and checks attributes without weakening semantics. Product
code was unchanged by that test repair; the failing transcript is retained.

Coupled actual Chromium passes8/8, including two new Content cases: bound refs,
classes/native caller events, canceled Escape, controlled removal and native
close-autofocus callback, plus forced delegated closed/open state and props.
Strict issue collection includes teardown. These checks isolate forwarding with
trapFocus/preventScroll disabled; modal focus, default scrolling, nested dialogs,
interrupted presence, themes and installed-family qualification remain at their
original subsequent checkpoints. Actual checker/build transcripts and complete
production artifact/type/source/route hashes identify every candidate app.

Maintained fixture check/build, typecheck and lint pass. Formatting, governing
contracts/projection and final staged self-review accompany this checkpoint.
Conditional Cargo is N/A. All original criteria/203 definitions are preserved.
Dialog remains unregistered through S111. Next is S109 labeling/close parts.

Raw evidence: `implementation/evidence/logs/codex-r10/s108-*`, candidate check/
build transcripts under `implementation/evidence/logs/dialog-candidate/` and
per-case candidate-artifact browser attachments in the ignored output tree.
