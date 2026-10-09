Coordinator acceptance record: the separate final decision is anchored at
`f756d227b6a1dce1396183dec4db138a256e16bf` in [RCLD-11 qualification](RCLD-11_QUALIFICATION.md).
The original implementation/review narrative retains its pre-transition states;
current qualification supersedes historical strict debt and pending-review notes.
This bookkeeping records the separate decision, not implementation self-acceptance.

# S198 implementation report — safe recovery procedures

Author: Codex. Implemented and independently accepted. The narrative below
preserves original candidate-stage provenance and failed attempts.
Implementation commit: `918b503d3c18ecac64fc1943b2d632bf865aaa75`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S198","kind":"report","commit":"f756d227b6a1dce1396183dec4db138a256e16bf","disposition":"implemented"}
-->

The runbook and README now require a verified external application backup,
including hidden evidence and modes, before manual action. A recorded dead
writer's coordination directory may be moved to a fresh external quarantine
only after independently proving the owner's exit and stopping all writers.
Owner evidence is retained; transaction state is never blindly deleted. This
is a bounded operator procedure, not automatic PID/age takeover or a new API.

Eight real SIGKILL fixtures cover default/custom mappings and interrupted
preparation, post-crash edits, committed cleanup and a corrupt journal. They
execute the two documented diagnosis commands, compare complete trees, verify
external backup bytes/modes/symlinks, bind the owner PID to the actual exited
owned child, quarantine exactly that coordination directory, and preserve every
transaction entry before retrying. Corrupt/ambiguous evidence and partial
integration without canonical ownership stop safely with retained evidence.

An actual `init` no-change replay does not enter recovery. The documentation
explicitly requires inspection of strict doctor afterward and forbids treating
exit 0 as cleanup evidence or inventing a request to force recovery. In the
committed fixture a separate intentional button request enters guarded recovery,
cleans the committed journal, installs its planned component/style blocks and
preserves both existing unmanaged CSS regions, including the subsequent edit.
The corrupt equivalent refuses with a byte/mode-identical application tree.
Separate published-recovery cases verify whole-file postcommit edit preservation
without the subsequent component write. Live-writer contention and actual
uncommitted rollback remain qualified by the owning subprocess suite.

The first run exposed that Node recursive copying changes directory modes;
the test now restores every recorded regular-file/directory mode and verifies
the entire backup before proceeding. Subsequent failed authored expectations
incorrectly assumed replay always entered recovery and that a new intentional
button request left managed token blocks unchanged. Actual outcomes are now
documented and asserted explicitly; no production code, safety checks or
original acceptance criteria changed. Failed logs remain retained.

Owning verification passes 22/22 across the four selected integration files,
with zero skips, TODOs or failures. Root typecheck, lint, full formatting and
contract validation all exit 0. Final diff health is clean.

```sh
node tools/run-unit-tests.mjs --suite integration tests/integration/docs-recovery.test.ts tests/integration/recovery-invalid.test.ts tests/integration/transaction-processes.test.ts tests/integration/recovery-published.test.ts
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

Logs are retained under `implementation/evidence/logs` as
`s198-recovery{,-modes,-outcomes,-qualified,-final}.log` and
`s198-{typecheck,lint,format,contracts}.log`. Cargo guards are N/A.
The raw strict-declaration blocker remains open and unaccepted. S199 follows
the verified green candidate commit; no final release acceptance is claimed.
