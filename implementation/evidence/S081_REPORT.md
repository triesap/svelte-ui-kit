# S081 step report — Init through guarded apply

Current disposition: independently accepted on corrected combined candidate
`dbd54903a5954d1139cda63413a041498379edc8`, with separate review evidence at
`c6aaf147dbf6316a96420fd5136a717f3665f711`. See the matching review and
[RCLD-05 qualification](RCLD-05_QUALIFICATION.md). Original implementation
provenance and author observations below remain historical evidence; earlier
pending-acceptance wording is superseded by this disposition.

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending under original S081 criteria and contracts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S081","kind":"report","commit":"c6aaf147dbf6316a96420fd5136a717f3665f711","disposition":"implemented"}
-->

The executable's init handler resolves the selected project, locates prospective
mapping targets, captures one immutable planning snapshot, and uses that
snapshot's effective mapping and environment for semantic decisions. Mapping
drift refuses rather than recapturing missing target authority. `planInit`,
`composeApplyPlan`, `validateApplyPlan` and `applyPlan` provide the accepted core;
no alternate write path is introduced. Dry-run validates without coordination,
staging or any hidden write. Satisfied init returns no_change without a writer.
Dependency-manager/manual and mapped integration guidance are included; no
package install occurs. Logical changes distinguish planned versus applied.

Router verification: build/typecheck/lint/format/projection/contracts pass;
29/29 CLI integration (four init plus info/view/output), bootstrap49/49.
Init cases cover default and independent custom paths, exact planned/applied
file sets, hidden/visible complete-tree dry-run purity, retained user layout,
stylesheet and ignore content, exact-tree replay, and symlink-ancestor refusal
(exit11, zero changes). A real CLI-initialized consumer copy passes svelte-check
(0 errors/0 warnings) and production Vite/Node-adapter build. Maintained fixture
check and build also pass. Resulting-consumer raw logs and command outputs are
retained under ignored `implementation/evidence/logs/codex-r10/s081-*`.

Earlier test compilation typo was corrected before final verification; no
failed check is represented as passed. No browser/reference rerun is attributed
to this command adapter. Unchanged reference identity and AC20/platform debt
remain explicit. No parent/remote/publication/reference-source action. Next:S082.

## Independent S091 boundary correction

Earlier candidate checks did not cover late guarded apply refusal in init.
Separate built-process review reproduced AUTHORITY_ANCESTOR_UNSAFE with exit1
while add used unsafe11. S091 retains a four-case default/custom process
regression and corrects init's refused-outcome failure classification under the
original frozen exit contract. No guard, mutation boundary or acceptance criterion
changed; the initial green subset alone did not establish this boundary. See
[S091 evidence](S091_REPORT.md) and the mandatory independent sequence review.
