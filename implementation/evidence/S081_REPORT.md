# S081 step report — Init through guarded apply

Author: Codex. Implemented and locally verified; independent RCLD-05 acceptance
remains pending under original S081 criteria and contracts.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S081","kind":"report","commit":null,"disposition":"candidate"}
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
