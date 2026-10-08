# S106 step report — Actual candidate Root and Trigger

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `45eeeed775d5397329e5a5aff743c4d7b61e9173`. Earlier candidate
reporting below is retained as historical implementation provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S106","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Actual candidate wrappers import pinned public Bits Dialog parts and exact Props.
Root explicitly binds open and forwards its callbacks/children. Trigger explicitly
binds the upstream HTMLElement ref, combines design/caller classes and preserves
all native attributes, events and both default/delegated snippets. Type defaults
to button, preserving the immutable source while allowing a native override.
No activation/state/focus machinery or compound namespace alias was added.

An owned application composes these two wrappers with explicitly raw Content,
Title, Description and Close. Real checker/build and production-handler SSR pass
the two owning component cases. Four actual Chromium cases pass: pointer and
parent updates in both directions, exact keyboard/callback counts, caller
cancellation, native disabled refusal, merged attributes/classes, actual bound
button refs and delegated child props/activation. The issue collector covers
page errors, console errors and hydration warnings through page teardown.
Per-case authored type/source/route and actual production-handler hashes are
retained in browser attachments. These are candidate compositions, not CLI
installation or full-family/focus/theme qualification.

Maintained fixture check/build, typecheck, lint, registry health, formatting,
governing contracts/projection and staged self-review accompany the checkpoint.
Conditional Cargo is N/A. Original criteria and all203 checkpoint definitions
remain unchanged. The live catalog remains unadvertised for Dialog; S111 retains
the registration boundary. Next original checkpoint is S107 Portal/Overlay.

Raw evidence: `implementation/evidence/logs/codex-r10/s106-*` and per-case
candidate-artifact attachments in the ignored browser output directory.
