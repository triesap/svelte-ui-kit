# S107 step report — Explicit native Portal and Overlay

Author: Codex. Independently accepted on repaired code `5c235eed860667d030c4f36e805d04f0acd2e91d` at evidence `6e087c10b441712d82c70230c3db7f8490ea787f`.
Original implementation commit: `dcb754aa0e9302e08587dd3d88acae17c5c644c0`. Earlier candidate
reporting below is retained as historical implementation provenance.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S107","kind":"report","commit":"6e087c10b441712d82c70230c3db7f8490ea787f","disposition":"implemented"}
-->

Portal forwards the exact pinned to/disabled/children API without aliases,
browser globals or computed-theme copying. Overlay explicitly binds the native
ref, combines design/caller classes and forwards forceMount, attributes, events
and exact default/delegated snippets. Presence/state remain upstream.

Actual owned candidate applications compile/build and import/render the actual
production handler without browser globals. SSR renders disabled inline content
and Overlay while body/selector/Element portal content is absent according to
the native SSR contract. Browser hydration places the actual parts under body,
a selected host, a bound Element and the original inline host; default/delegated
Overlay snippets expose true open state and bound DIV/SECTION refs. Owning
component/SSR checks pass3/3 with retained Root/Trigger controls, and the coupled
Chromium lane passes6/6 with strict lifecycle issue capture.

The helper now retains actual check/build transcripts and hashes every built
production file alongside authored types, parts and route. Per-case attachments
identify the exact candidate stage, authored/raw parts and artifact inventory.
This strengthens evidence; it does not turn an unregistered candidate into an
installed family or qualify later focus/theme/presence requirements.

Maintained fixture check/build, typecheck, lint, formatting and governing
contracts/projection accompany final staged self-review. Conditional Cargo is
N/A. All original checkpoint definitions and criteria remain unchanged; S111 is
the registration boundary. Next original checkpoint is S108 Content forwarding.

Raw evidence: `implementation/evidence/logs/codex-r10/s107-*`, actual candidate
transcripts under `implementation/evidence/logs/dialog-candidate/`, and browser
candidate-artifact attachments in the ignored output directory.
