# S104 step report — Actual Switch state, native forms and direction

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `03526028df9e30f93f9b13fe315ccfa90e7e82d5`. Earlier candidate
reporting below is retained as historical implementation provenance.

Independent return review reproduced same-ID external form replacement leaving
state stale. The repair and subsequent18/18 owning browser evidence are recorded
in [RCLD06_R1_REPAIR.md](RCLD06_R1_REPAIR.md). The earlier listener description
below records the original candidate; event-time native ownership replaces it.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S104","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Real default/custom installed consumers expose checked/ref bindings, pointer,
Space/Enter and programmatic state updates, exact caller handler/callback counts,
cancellation, attributes/classes and actual button refs. Named controls produce
one real checkbox; unnamed controls produce none. Browser form checks prove
actual checked value, required refusal, disabled exclusion, initially false/true
reset seeds, canceled reset and external native form association. All original
hooks, default strong track/checked primary/Thumb surface colors, shape-critical
Thumb dimensions/radius, exact elliptical track/Thumb overrides, theme changes,
RTL physical travel and reduced motion pass on the production artifact.

Initial tests reproduced incoherent reset and wrong RTL travel in both layouts
(six pass/four fail). An actual built-app probe proves Root computes/matches rtl
but the production CSS compiler lowers :dir(rtl) to language selectors. The
target now uses logical margin travel with the same14px distance and transition
hooks. Physical relative geometry proves both directions rather than freezing
a computed transform matrix; the original travel criterion is unchanged.

Pinned Root HiddenInput has no reset binding. The first native framework-binding
repair fixed reset but reproduced canceled-state corruption (whole browser59/61,
two focused causal failures with event.defaultPrevented=true). Final Root/Thumb
behavior remains upstream, with only name/value withheld to avoid duplicate
input. One named native checkbox shares checked/onchange/defaultChecked and form
attributes. A lifecycle-local actual associated-form reset listener settles
after the event task, respects cancellation, restores only per-instance seed and
cleans listeners/pending timers. This is a narrow native form bridge, not a
primitive state/keyboard clone, global identity/state or new public API. The
exact public RootProps omission remains unchanged. SSR retains initial native
input semantics; browser-only work stays inside a lifecycle effect.

Sixteen owning Chromium cases pass, including teardown/remount after reset.
The teardown fixture removes the field from an ancestor reset handler, after
the field's own listener has run, so pending cleanup matters. Whole browser63/63
passes on the final product code; after strengthening that fixture the final
owning16/16 rerun passes.
An isolated generated-app negative control removes only pending timer cleanup;
it reproduces stale parent state after removal/remount. The control retains
original/mutated source hashes and every production artifact hash; it never
changes authored product source. Thus the teardown case detects the actual
cleanup failure rather than merely mirroring implementation text.
Actual source/type/barrel/route/lock/CSS/handler hashes are retained per case. Owning install/SSR/metadata/style-guard18/18, strict native
compiler8/8, registry45/45, packed inventory1/1, typecheck, lint, maintained
fixture check zero errors/warnings and build, formatting and governing
contracts/projection pass. The initial mutable timer Set lint failure was repaired
using an event-local array; no rule was disabled. Conditional Cargo is N/A.

Raw logs/probes: `implementation/evidence/logs/codex-r10/s104-*`; cancellation
traces/screenshots and artifact identities are retained in s104-cancel-before
and s104-cancel-causal-artifacts under that ignored directory. No fresh whole
integration claim replaces S100714/714 provenance. AC20 and later requirements
remain open; no independent sequence or whole MVP acceptance is claimed. Next
original checkpoint is S105 Dialog family contract.
