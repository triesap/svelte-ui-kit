# S200 implementation report — current guidance and evidence traceability

Author: Codex. Candidate; separate final S203 acceptance remains required.
Implementation commit: `c1a2b3321c64b8e39006e00e0abcc307222fcbf8`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S200","kind":"report","commit":"c1a2b3321c64b8e39006e00e0abcc307222fcbf8","disposition":"candidate"}
-->

AGENTS now reflects actual CLI/project/registry/codegen responsibilities,
accepted versus candidate progress, supported source/platform boundaries,
owned-server and serialized writer verification, operational recovery limits
and the open raw strict blocker. Resolved historical RCLD-04 findings remain
provenance rather than instructions to redo accepted work. README distinguishes
Svelte request-local identity from the pinned floating primitive's process
counter without claiming counter values reset per request.

The command map names actual current scripts, all six root TypeScript configs,
registry/full-package/full-browser lanes and valid focused runner selectors.
It distinguishes configured CI selectors from full local suites and remote
execution, and records that its 30-minute job limit has not qualified cumulative
runtime. Cargo guards remain N/A for this TypeScript-only repository.

TRACEABILITY maps all 34 stable requirements and 22 acceptance criteria to
actual maintained implementation/tests or recorded evidence with explicit
status and bounds. Final AC20 is BLOCKED by the two raw native TS2590 errors;
AC21's final independent acceptance and AC22's scheduled extension reconciliation
remain open. Historical native/reset/ID/force-mount/CSP/contrast/clipping and
platform limits are preserved. No deviation or original criterion was silently
closed, and no new dependency/API, suppression or SSR workaround was introduced.

Three focused registry tests verify complete/unique original IDs, actual local
file evidence, visible strict debt and authenticated registry/source-map assets.
Causal controls reject missing evidence, duplicate/missing IDs and an attempted
AC20 acceptance claim while the library-check exception remains configured.
The first contract check rejected seven directory links: its contract requires
file targets. Those links now point to actual maintained files, and the owning
test also requires regular files rather than merely existing paths. The failed
log remains retained.

Focused registry verification passes 3/3 with no skips, failures or TODOs.
Root typecheck, lint, full formatting and contract validation all exit 0.

```sh
node tools/run-unit-tests.mjs --suite registry tests/registry/contract-links.test.ts
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

Logs under `implementation/evidence/logs` are `s200-contract-links.log`,
`s200-contract-links-final.log`, `s200-contracts-initial.log` (broken directory
links), `s200-contracts-qualified.log`, and `s200-{typecheck,lint,format,contracts}.log`.
All 203 original definition slices remain byte-identical to the recorded
original boundary. All 95 immutable reference source hashes match, and the
reference remains clean at its frozen revision. S201 cumulative qualification
follows the verified candidate;
its strict prerequisite cannot be waived or bypassed to unlock S202/S203.
