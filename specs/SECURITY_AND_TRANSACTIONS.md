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

#### Resource and error handling

Bound parsing and diagnostics sensibly to the packaged local asset model; validate before allocating or writing large user-controlled structures. Prefer a single serialized writer rather than unnecessary parallel mutation. Propagate filesystem and parser errors with context, close handles, clean only owned temporary files, and retain recovery evidence when cleanup cannot safely finish.

Cancellation and process termination cannot always run cleanup; durable recovery must not depend solely on a finally block. A dry run is safe precisely because it does not start a transaction. Prove these properties with fault-injection tests and platform lanes, not prose assertions.
