# S078 step report — Render human and JSON command outcomes

Author: Codex. Disposition: implemented and locally verified; separate RCLD-05
acceptance remains pending. Original S078 criteria and R09/R15/R30/R32/R33/R34
apply without modification.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S078","kind":"report","commit":"eb210b0de991c8a36b53dd444930622cb5c4960f","disposition":"candidate"}
-->

`src/cli/output.ts` provides one pure JSON/human channel renderer and adapters
for typed model/application outcomes. JSON is exactly one canonical envelope;
human failures use stderr with empty stdout and the frozen exit map. Planned
and committed changes carry truthful applied flags. Cleanup warnings preserve
committed writes and actionable guidance. Raw transaction IDs are omitted from
command data and normalized in recovery messages; unsafe physical locators and
unexpected raw internal exceptions do not leak through issue adapters.

Existing bootstrap usage/metadata JSON failures now call this renderer.
Original S078 JSON-help coverage is implemented using existing help and JSON
flags together, with either flag order. Bare help/version remain stable;
version grammar and extra/duplicate/command-argument refusals are preserved.
No product command, automatic installation or overwrite/recovery flag is added.

Checks through the configured router, Node24.21.0/pnpm11.22.0:

- Build and typecheck/lint pass.
- `node tools/run-unit-tests.mjs --suite integration tests/integration/output.test.ts`:
  13/13, including the actual built executable JSON help/usage cases, all status
  envelopes, human errors/exit classes, truthful writes and transaction controls.
- `node tools/run-unit-tests.mjs tests/unit/protocol.test.ts tests/unit/args.test.ts`:
  20/20; existing protocol and standalone grammar controls retained.
- CLI bootstrap 52/52; format and contract projection/validation pass.
- Full strict-authority contract regressions after the RCLD-05 tuple:139/139.

Raw outputs remain ignored at `implementation/evidence/logs/codex-r10/`.
Direct source comparison checks adapters and actual bootstrap callsites;
this is not evidence for unimplemented info/view/write/doctor handlers.
Human/JSON full product command matrix remains S086, and independent sequence
acceptance remains S091. No additional platform/reference rerun is attributed
to this TypeScript-only output checkpoint; unchanged RCLD-04 reference identity
and its freshly qualified guard are retained. No push or publication.

Next: S079 after this green implementation commit is recorded within the
existing exact RCLD-05 authorization. Completion of the MVP is not claimed.
