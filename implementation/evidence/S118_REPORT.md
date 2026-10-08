# S118 step report — Native Alert Dialog portal and content

Author: Codex. Candidate; separate S128/RCLD-07 acceptance remains pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S118","kind":"report","commit":null,"disposition":"candidate"}
-->

Portal forwards the pinned distinct AlertDialog primitive's native target and
inline configuration. Overlay and Content bind actual refs, merge caller
classes and forward the exact native props, policies and rendering hooks. No
role-only emulation, target inference, custom focus engine or SSR switch is
introduced. Content retains native description identities while resolving and
observing physical relationships in its actual Document or ShadowRoot, with
observer teardown on ref replacement or unmount.

The owned incremental consumer explicitly copies the authored candidate parts;
Title, Description and Cancel remain raw native parts. No registry installation
is claimed before S120. Production Chromium passes ten cases, including the
four retained Root/Trigger cases and six new content cases: inline, body,
selector and Element targets, native role/name/description, actual DIV/SECTION
refs, merged classes/attributes, canceled Escape, default outside-ignore,
explicit outside policy/cancellation and delegated forceMount state.

The coupled component lane passes21/21. The final owning compiled SSR test
passes1/1 over four separately captured responses. Native enabled portals omit
the portaled default Content on the server; the separately inline delegated
Content remains present in every mode. The initial expanded test incorrectly
asserted absence of every alertdialog, including that independent inline
control; this test assertion was corrected to address the actual portaled
Content. Product behavior was unchanged. Full response and source/config/package
and production file hashes are retained, including the executed handler hash.

Typecheck, lint, format, maintained fixture check zero errors/warnings and
production build, governing projection/contracts and diff checks pass. Raw
checks and responses are under `implementation/evidence/logs/codex-r10/s118-*`
and `implementation/evidence/logs/alert-dialog-candidate/`; browser artifacts
retain the exact candidate source/production identities. The complete registry
family and installed-consumer qualification remain S120/S121 obligations.

Conditional Rust scope is unchanged; no reference-source changes. AC20 and later
platform/package/delivery obligations remain open. This is implemented and
locally verified progress, not independent acceptance. Continue original S119
labeling and decision controls, retaining the separate S128 gate before S129.
