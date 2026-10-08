# S180 step report — Qualify request-local component identity

Author: Codex. Independently accepted on code `a79db79f78818797e2b3d541731797b5b19b60ce` at evidence `871c1945daf660d9f0f724fb949057b4fa3a1da6`.
Original implementation commit: `8f40545f5035839133829d30b496213ca63de6e4`. The candidate narrative below
is historical implementation and verification provenance.
Implementation commit: `8f40545f5035839133829d30b496213ca63de6e4`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S180","kind":"report","commit":"871c1945daf660d9f0f724fb949057b4fa3a1da6","disposition":"implemented"}
-->

Original R21, R22, R28, R29, R32, R33, R34.
Starting `928500c8a59e11040b29cb4788c4a8d6461c324f` on `master`.

Real CLI-installed default/custom production consumers coinstall Field, Switch,
Checkbox, Radio, Tabs, Collapsible, Dialog, Alert Dialog and Menu. Record all
installed component source/lock metadata hashes and application/barrel/CSS/
production hashes plus actual consumer check/build logs. Identity is only the
qualification route name, never an install request or generated registry alias.

Two integration tests each drive twelve concurrent and twelve repeated requests
through one owned production worker: distinct request text, optional fields and
initially open inline dialogs. Every actual document has unique IDs, exact
caller overrides and field label/control/URI-encoded message relationships.
Equivalent render trees retain identical IDs across repeated/different request
data, proving allocator reset rather than a process-shared increasing counter.
Initially open Dialog markup and caller names exist in SSR; previously measured
native title/description registration boundary remains explicit.

Ten browser tests (five per layout) preserve strict lifecycle error collectors.
Server identities survive actual hydration unchanged, initial conditional/open
SSR trees retain identities, and all live Dialog/Alert Dialog title/description
references resolve inside their intended content. Trigger/content references,
caller overrides and native close/focus return work for both instances and Menu.
Tab/panel and Collapsible relationships target the intended own parts; Field
labels actually focus the intended control. Three post-hydration conditional
mount/remove cycles allocate unique fresh IDs while retained associations stay
stable. Standalone native input/textarea/select identities remain distinct.

Initial author harness mistakes were caught before qualification: generated
metadata was incorrectly read as component source; a nonexistent Dialog modal
prop failed actual consumer typechecking; each needed an explicit key for lint.
Correct source inventory checks retain all metadata hashes without treating it
as UI source, and use the actual pinned Dialog contract/keyed tree. Initial SSR
text matcher missed native snippet comments; strip only HTML comments for that
text assertion. Preserve raw IDs/markup evidence. Product source is unchanged.

Verification through the configured build router:

- Actual production SSR integration2/2,48 responses total; exit0, no skips.
- Exact browser10/10 in both layouts, no skips; exit0.
- Maintained fixture check/build, typecheck, lint, format and governing contracts:
  exit0; installed consumers check with zero errors/warnings.
- Source/staged diff and whitespace review pass. Cargo N/A; no Rust affected.

Changed owning consumer helper/page, SSR/browser tests, actual predecessor
bookkeeping and report. Native identity disposition is now behavior-qualified;
independent acceptance remains S181. No new helper/styles/registry/metadata or
boundary relaxation. Continue original S181; separate acceptance gates S182.
Unrelated work remains intact. No push/publication/deployment. No blocker.
