# Filesystem safety, concurrency, and recovery

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

#### Threat model and limits

Proposed initial scope: a trusted local developer checkout that may contain accidental unsafe paths, symlinks, stale metadata, concurrent cooperative writers, interrupted processes, and user edits. This is not a hostile multi-user filesystem guarantee. Record actual OS/filesystem support and the accepted race limits before exposing mutating commands.

Do not claim Node `path.resolve` plus rename equals Leptos's capability-relative handle operations. A hostile attacker able to replace directories between checks needs a stronger design; changing this threat model is an explicit architecture decision, not a hidden portability fix.

#### Path and ownership validation

Validate lexical paths before joining: reject absolute paths where relative is required, parent traversal, invalid/reserved segments, unexpected drive/UNC forms, overlap between reserved state and generated targets, duplicate/case-colliding targets, and inappropriate file kinds. Use actual filesystem observations to reject unsupported symlinks and nonregular targets. Containment must use segment-aware checks, not naive string-prefix tests.

Treat symlinked parents, broken links, existing directories at file targets, and project-root aliases deliberately. Do not follow a link outside the authorized root. Recheck safe target ancestry/preimages before writes. Public diagnostics should use safe logical paths rather than leaking unsanitized path input.

#### Plan/apply protocol

The planner is read-only, including dry-run and doctor; it must not leave temporary directories, journals, lockfiles, package-manager state, or formatting changes. A write invocation obtains exclusive coordination before committing a staged plan, revalidates observed inputs, and refuses stale or unsafe plans. The particular acquisition timing may allow a read-only speculative plan first, but the mutation phase must always revalidate under coordination.

Stage new bytes on an appropriate same-filesystem location for replacement. Journal expected old/new states and target sequence. Preserve modes where appropriate, use atomic per-file replacement when supported, and publish canonical `kit.lock.json` last as the successful state marker. Explicitly test durability/order assumptions; no claim of native multi-file atomicity.

The transaction must include config, source, CSS, export/layout integration, and lock metadata as one planned batch. Package dependency installation is outside the transaction because it is not performed by the CLI.

#### Recovery

Inject failures before/after staging, before/after individual replacement, before lock publication, during publication, and during cleanup. After restart, either recover safely to a documented consistent state or fail closed with actionable guidance. Do not silently delete a stale journal based solely on age or a recycled process ID.

A recovery operation must not overwrite user changes made after the interrupted operation. Validate the expected preimage or exact staged image before restore/roll-forward. Corrupted journals, mismatched transaction identity, missing backups, and ambiguous lock-last states are explicit errors. Lock publication with unchanged bytes still needs distinguishable transaction bookkeeping; byte equality alone is not a unique commit event.

Transient coordination and recovery files are not app-owned components and should not be committed. Safe ignore-file changes, when needed, must themselves be planned and preserve existing ignore rules. Do not add an undocumented recovery command/force flag; fit safe recovery and actionable manual instructions into the approved command surface.

#### Approved no-change inspection boundary — 2026-10-08

An unchanged write-command plan is not proof that retained writer/transaction
state is clean. Before unchanged init/add/sync success, including unchanged
dry-run paths, inspect the independently resolved mapping's state without
creating, modifying or removing files. Safe physical containment/non-following
observations precede coordination and journal checks. Journal contents cannot
authorize their own mapping. A symlink/nonregular/unreadable state must not be
followed or misclassified as absent.

Absent coordination and transactions permit the existing clean `no_change`.
Present/ambiguous coordination or retained/corrupt/foreign/ambiguous recovery
evidence require truthful safe refusal under
[the public protocol](API_CONTRACTS.md). Preserve exact application bytes,
modes, links, owner records and transaction evidence. Age, PID death or matching
bytes never authorize takeover. A read-only observation makes no stronger
hostile-race/linearizability promise than the frozen trusted-local threat model.

The approved repair is fail-closed inspection, not automatic no-change cleanup.
Genuine writes retain full coordinated recovery and live revalidation. No
recover/force command, fake metadata write, component request invented to trigger
cleanup, or stale-lock reclamation is added. If later evidence requires a
different cleanup boundary, amend its contract before implementing coordinated
recovery and fresh planning. Qualify all commands/mappings with real process
interruption, post-crash edits, committed cleanup, malformed evidence and exact
tree-preservation controls. Reverting the inspection in an owned copy must
reproduce the original silent-success defect. Existing whole-journal safety and
publication tests remain required.

#### Resource and error handling

Bound parsing and diagnostics sensibly to the packaged local asset model; validate before allocating or writing large user-controlled structures. Prefer a single serialized writer rather than unnecessary parallel mutation. Propagate filesystem and parser errors with context, close handles, clean only owned temporary files, and retain recovery evidence when cleanup cannot safely finish.

Cancellation and process termination cannot always run cleanup; durable recovery must not depend solely on a finally block. A dry run is safe precisely because it does not start a transaction. Prove these properties with fault-injection tests and platform lanes, not prose assertions.

#### Frozen transaction model (S064)

The trusted-local threat model above is frozen: a cooperative developer
checkout, not a hostile multi-user filesystem. The implementation uses only the
pinned Node 24/TypeScript baseline and built-in filesystem facilities; no new
dependency, CLI flag or semantic schema mode is introduced. Node cannot rename
across filesystems, so staging is required to live on the same filesystem as
the targets, and atomic per-file replacement is used where the platform
supports it. No native multi-file atomicity or hostile-filesystem safety is
claimed.

Phases are ordered `planned -> prepared -> applied -> published -> cleaned`;
`prepared`/`applied` may additionally `rolled_back` by recovery, and `published`
may only be cleaned. `planned` has written no live bytes. `published` is the
semantic commit point and is reached only after the canonical lock is replaced.
Failure dispositions are `no_change`, `applied`, `committed_needs_cleanup` and
`refused`; the last is a fail-closed logical diagnostic with manual guidance.

Transient coordination and recovery files live under the reserved state
directory at `<uiDir>/_kit/.svelte-ui-kit/`: a cooperative `writer.lock`
directory and per-attempt `transactions/<transactionId>/` directories holding
`journal.json`, `staged/`, `backups/` and `progress/`. Owned transient
directories use mode `0700` and the journal/staged files use `0600`. The
namespace is ignored via a single managed entry `<_kit>/.svelte-ui-kit/` that
preserves existing ignore rules. A unique transaction id proves ownership and
publication; byte-equal lock bytes, wall-clock age, PID reuse and process
`finally` blocks are not sufficient proof of ownership, takeover or successful
publication.
