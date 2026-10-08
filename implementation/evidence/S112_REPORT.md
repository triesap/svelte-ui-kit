# S112 step report — Installed Dialog interactions

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `c7fb18429f09d2c5bf5210962e366db51a78a0a5`. Earlier candidate
reporting below is retained as historical implementation provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S112","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Actual built CLI default/custom applications exercise the installed eight-part
Dialog family through keyboard activation, native accessible relationships,
forwarded refs, modal Tab/Shift-Tab trapping, return focus, cancellable Escape
and outside interaction, controlled and uncontrolled state, nested modal layers,
interrupted close/reopen, removed Content/Overlay and autofocus cancellation.
A genuinely title-free input is caught by the same accessible-name assertion;
the browser issue collector remains strict through page teardown.

The initial interaction lane passed12/12. Strengthening it with an assumed
first-opening completion callback failed in both layouts. Inspection identifies
the pinned Bits animation tracker reading a missing initial Content ref. A
direct raw Bits control now proves the same native callback sequence alongside
the installed wrappers; completed closing emits false in both. The wrapper
continues to forward onOpenChangeComplete unchanged, with no duplicated presence
engine or invented callback timing. This upstream limitation is explicit for
independent review and is not represented as a repaired upstream feature.

The generated consumer helper retains raw actual checker/build logs and hashes
every regular production artifact in addition to actual installed source,
route, barrel, lock and CSS. Per-case artifacts identify the tested configuration
and application. It also retains this evidence for the existing core builders.

Final owning Chromium passes14/14, strict Dialog component contracts14/14,
maintained fixture check zero errors/warnings and production build. Typecheck,
lint, formatting, governing contracts/projection and staged diff are checked
before commit; actual logs retain each result.
Conditional Cargo is N/A. All original203 definitions and acceptance criteria
remain unchanged. Next checkpoint is original S113 portal theme qualification;
S114 SSR/hydration/lifecycle and S115 integrated/packed workflow with separate
acceptance are still required.

Raw evidence: `implementation/evidence/logs/codex-r10/s112-*`; causal failed
browser artifacts in `implementation/evidence/logs/codex-r10/s112-callback-before/`;
actual generated-app check/build logs in
`implementation/evidence/logs/generated-consumer/` and browser artifact JSON.
