# S109 step report — Native labeling, optional description and Close

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `11705ea18063e6b5b6208697af6c1df06109a2c1`. Earlier candidate
reporting below is retained as historical implementation provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S109","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Title, Description and Close bind exact pinned refs and preserve classes, native
attributes/events and default/delegated snippets. Title preserves source heading
level2 through the actual native role/aria-level contract; delegated H3/P markup
receives real primitive props. Close preserves source type=button by default
with native override, cancellation and upstream keyboard dismissal. All eight
parts are authored, but the single family remains unregistered until S111.

Actual production SSR/check/build passes for default/delegated markup and native
types. Final coupled component/SSR checks pass5/5 across all four candidate
stages; coupled Chromium passes13/13 with strict error/hydration capture and
actual source/type/route/full-production artifact identities. Five new browser
cases prove accessible title/description relations, actual refs, optional absence/
removal/return, native ID changes, Close attributes/cancellation and delegated
labeling/dismissal.

The initial owning browser run passes3/fails1: pinned Bits retains aria-describedby
after the actual optional description disappears. Preserve the original criterion
with a lifecycle-local Content guard that uses only primitive-supplied IDs and
the owning document. Remove dangling references, remember native intent while
absent and restore only real nodes; actual native ID changes remain authoritative.
The guard disconnects on ref change/teardown, creates no identity/context/layer/
focus/state shim and accesses browser facilities only inside the lifecycle effect.
Focused repair4/4 and final coupled13/13 pass, including renamed-ID removal and
restoration and unaffected independent description-free instances. Initial
failing trace, screenshot and exact source/artifact identity are retained before
the rerun. Further installed modal/presence/SSR/lifecycle qualification remains
at its original S112–S115 checkpoints; this is not independent acceptance.

Maintained fixture check/build pass; final typecheck and lint pass. Formatting,
governing contracts/projection and staged self-review accompany the checkpoint.
Conditional Cargo is N/A. All203 original definitions and criteria are unchanged.
Next original checkpoint is S110 managed CSS/actual compound DOM adaptation.

Raw evidence: `implementation/evidence/logs/codex-r10/s109-*`, retained initial
description failure artifacts under s109-description-before in that ignored
directory, candidate check/build transcripts under
`implementation/evidence/logs/dialog-candidate/` and per-case browser attachments.
