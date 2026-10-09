# Filesystem transactions, concurrency and recovery

Scope: physical validation, authenticated plan application, writer coordination,
journals, durability, publication and recovery. `src/codegen/transaction-*`,
`apply.ts`, recovery helpers and `tests/integration` own the executable protocol.
Use the public [recovery guide](../guides/recovery.md) for manual operations.

## Threat model and paths

The model is a trusted local developer checkout with accidental unsafe paths,
cooperative concurrent writers, interruptions and user edits. Node containment
checks and rename are not capability-relative hostile multi-user guarantees.
Windows is unsupported; actual macOS/Linux evidence does not qualify hostile
syscall races, network filesystems or power loss.

Reject unsafe lexical relative paths, traversal, reserved segments, drives/UNC,
overlap, duplicate/case-colliding targets and inappropriate file kinds. Observe
actual ancestry with non-following checks; broken/parent/final symlinks, root
aliases and nonregular targets cannot be mistaken for safe absence. Use
segment-aware containment and safe logical diagnostics, not raw path leakage.
Revalidate ancestry, modes/identities, native dependencies and expected preimages
under coordination before any mutation. Planned output cannot authenticate itself.

## Ordered application and publication

Plans, diagnosis and dry runs write nothing, including hidden state. Genuine
application obtains exclusive cooperative coordination, validates the complete
plan/read set, stages on the same filesystem, journals expected old/new states
and performs supported atomic per-file replacement. The batch includes config,
source, CSS, export/layout integration and semantic lock; dependency installation
is outside because the CLI never performs it. There is no native multi-file atomicity.

Phases are planned → prepared → applied → published → cleaned. Prepared/applied
may roll back through recovery; published may only be cleaned. Planned has no
live writes. Canonical kit.lock.json replacement is the semantic commit point
and occurs last. Dispositions are no_change, applied, committed_needs_cleanup or
refused. Durable publication witnesses distinguish byte-equal locks; equality,
age, PID reuse and finally blocks do not prove a successful commit or takeover.

The reserved transient namespace is `<uiDir>/_kit/.svelte-ui-kit/`: cooperative
writer.lock and owned per-attempt transactions containing journal, staged,
backups and progress. Directories are 0700 and journal/staged files 0600. A single
planned ignore entry preserves existing app ignore rules. Clean only proven
owned temporary entries; unsafe cleanup retains actionable recovery evidence.
These transients are distinct from app-owned desired/semantic metadata.

## Recovery and unchanged refusal

Inject failures before/after staging, each replacement, lock publication and
cleanup, including real process termination. Restart must recover consistently
or refuse safely. Restoration/roll-forward validates exact old/staged images and
must preserve post-crash edits. Corrupt/foreign/ambiguous journals, owner mismatch,
missing backups and ambiguous publication are causal errors. Journal contents
cannot certify their own mapping or authorize operations outside it.

Before unchanged init/add/sync, including dry-run, inspect physical safety first,
then writer evidence and retained journal state without acquiring coordination,
reclaiming a lock or cleaning transactions. Only absent writer/transaction state
permits clean no_change. WRITER_BUSY/WRITER_LOCK_UNAVAILABLE and existing causal
recovery errors refuse; otherwise RECOVERY_PENDING preserves retained state,
including committed cleanup. Clean replay is not proof recovery occurred.
Do not invent a request/metadata write to trigger cleanup or add recover/force APIs.

Manual quarantine requires a verified external complete backup, independent
owner/process-namespace proof and stopped writers; move only the verified lock
to a fresh same-filesystem external quarantine. PID lookup failure or age alone
does not authorize this. Missing/corrupt owner evidence means stop. Never remove
journals or staged state recursively as a production recovery procedure.

Owning tests cover path kinds/overlap, concurrent writers, preimage drift,
durability/order, lock publication/witnesses, authenticated transaction authority,
cleanup/restart, corrupt journals, foreign state and actual process crashes.
Keep whole-tree byte/mode/link/hidden-state preservation assertions and causal
mutation controls. Canceled processes cannot rely on finally cleanup.
Run the actual supported-platform filesystem matrix in [testing](testing.md);
configured remote jobs are not execution evidence.
