# Clean retirement warning repair qualification

Author: Codex. Candidate repair requested by the separate RCLD-10 reviewer.
No original checkpoint or sequence acceptance is granted by this report.

The reviewer independently reproduced clean-only Dialog retirement on frozen
candidate `de45c55a45634ddf0878552d7f245b11ebb6dde0` in default/custom layouts.
Actual sync deleted its source barrel and preserved application import bytes,
but returned success without manual import-review guidance. Existing S191
customized Badge/Card warnings masked the clean-only gap. The frozen
SYNCHRONIZATION.md requirement already requires warning about leftover imports;
no policy or original checkpoint definition is changed to accommodate the gap.

`src/cli/commands/sync.ts` now emits one stable
`RETIRED_IMPORTS_REVIEW_REQUIRED` warning when source retirement detaches
ownership, using an actual safe retired logical path and actionable manual
review guidance. Existing customization warnings remain. Dry runs still report
planned actions; successful retirement reports warning with exit zero, and
stable replay has no new retirement warning. The message describes a possible
leftover import without claiming imports were scanned or rewritten.

`tests/integration/clean-retirement-warning.test.ts` runs the real CLI against
actual Field/Dialog installs in both layouts. It proves a clean-only case has
no customization diagnostic yet has exactly one import-review warning; actual
source deletion and truthful item/file/CSS ownership loss; exact remaining
file records/bytes and application import preservation; complete dry-run and
replay tree purity. Two owned compiled-CLI omission controls disable only the
new returned warning and reproduce the original silent-success behavior while
performing the same real retirement. No authoring package or shared dependency
is modified by the controls. Actual transcripts/locks are retained in
`logs/clean-retirement-warning/`, relative to this evidence directory.

The interrupted independent full integration run on the earlier head had no
final summary and remains unverified. Its other completed checks are historical
results, not claims of a fresh repaired-head run. The mandatory separate review
must reverify this repair and finish the cumulative integration/browser/fixture
gate before S194 proceeds. Pinned declaration exceptions, platform limits and
final AC20 remain explicit. Cargo checks N/A: no Rust changes.

## Author verification

After green extbuild doctor/current guard, build and the seven-file retirement
lane passed 35/35 tests with zero skips: clean-retirement-warning (4), catalog-
retirement (2), CSS retirement (3), plan retirement (6), source retirement (4),
sync (14), and workflow purity (2). Typecheck, lint, full formatting and contract
validation passed; contracts reported zero errors/warnings. Raw logs use the
`logs/r10-retirement-warning-*` prefix. Final diff/staged review and original
203-definition preservation are checked before committing this candidate.

Only the CLI warning and its owning tests change executable behavior. The
previously authenticated S193 platform snapshot records the pre-warning source
head; its transaction/path/recovery sources remain unchanged. It is not relabeled
as a fresh run on the repair. Reference source and repository boundaries remain
preserved. No push, publication or deployment is performed.
