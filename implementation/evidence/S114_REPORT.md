# S114 step report — Actual Dialog SSR, hydration and lifecycle

Author: Codex. Candidate; independent S115 acceptance remains pending.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S114","kind":"report","commit":null,"disposition":"candidate"}
-->

Actual CLI-installed default/custom production applications render supported
initial open/closed state with body, disabled-inline and custom-host portals.
Concurrent mixed requests and a subsequent repeated sequence share the same
owned production worker; request-local state and generated IDs remain isolated.
Server body/custom portals omit browser-only content; open inline renders actual
Content, Title and Description with unique native IDs. A direct raw Bits server
control proves Content relationship attributes follow the pinned rendering-order
boundary and are completed during hydration. The initial server expectation of
already-registered child relationships failed in both layouts; no product SSR
disable or invented shared ID context conceals it. This native boundary is
explicit in README and the governing record for independent review.

Actual Chromium checks require hydrated names/descriptions and distinct IDs
across two simultaneous instances for all portal/initial-state combinations,
then close both cleanly. Optional Description removal/restoration, replacement
of the actual keyed Content node, root destruction and three remount cycles
release every lifecycle-local description observer. Instrumentation delegates
to native MutationObserver and identifies only the owned document relation
observer. Removing only its cleanup in an owned installed artifact causes the
same teardown assertion to fail; that artifact's evidence records the mutation
and all production identities. No authored product source is mutated by the
control. Strict browser issue capture remains enabled through page close.

Final owning Chromium passes15/15; same-worker SSR passes2/2, twenty concurrent/
repeated actual responses per layout including the native control. Maintained
fixture check zero errors/warnings and build, typecheck and lint pass. Formatting/
contracts and staged self-review accompany the checkpoint. Conditional Cargo
is N/A; original203 definitions and acceptance criteria remain unchanged. Next
is S115 actual integrated installed/synthetic-upgrade/packed core qualification
and mandatory separate acceptance before S116. Full MVP acceptance is open.

Raw evidence: `implementation/evidence/logs/codex-r10/s114-*`, same-worker full
responses and production hashes in `implementation/evidence/logs/dialog-ssr/`,
actual check/build logs in `implementation/evidence/logs/generated-consumer/`
and browser generated/negative artifact JSON with complete hashes.
