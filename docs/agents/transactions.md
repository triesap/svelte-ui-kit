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

The original snapshot carries regular-file preimage device/inode identities and root and
ancestor permission modes through composition and immutable plan sealing. Equal
bytes and modes at a replacement inode do not revalidate that original preimage.
File observations compare all permission bits, including intervening special-bit
edits. New physical evidence must come from a fresh plan, not a live recapture.

Replacement retains that original authority across returning hooks. Immediately
before backup and installation, it rechecks physical ancestry, permission modes,
read evidence and the actual held writer. A backup requires the original file
identity and exact preimage; installation requires target absence and the exact
staged creation receipt. A destination that appears after backup survives. Changed
or substituted staged bytes, mode, identity or ancestry cannot be installed.
The in-memory result records a completed rename before later hooks or flushes,
even when durable journal progress still lags that actual syscall. Refusal retains
the evidence needed to prove any safe rollback; it cannot grant blanket rollback.

Publication uses the same original canonical preimage. Returning staging or
publication hooks cannot bless changed canonical bytes, mode or identity by
recapturing them for the witness. The witness binds the original canonical
identity and the authentic staged creation receipt; both are rechecked before
the canonical rename. Intended lock bytes are copied before hooks run. Once the
rename completes, a later hook or flush failure reports a committed transaction
that needs cleanup, even when the durable journal still records publication intent.

Recovery freezes the approved current targets, backups, journal, witness and
physical ancestry after whole-journal preflight. It rechecks that held evidence
and the actual writer after returning restore or removal hooks. Late edits
survive; neither equal bytes at a new inode nor edited special permission bits
authorize restoration or deletion. Each completed recovery syscall advances only
its proven expected image. Recovery stops at the first failure, identifies any
filesystem rollback already completed, and retains pending work and journal
evidence. Created-file rollback flushes its parent directory as well.
Cleanup rechecks canonical and restored-source images after returning cleanup
hooks and requires the unchanged physical writer and directory ancestry. An empty
cleanup tail uses frozen directory identity rather than deleting a replacement
directory at the same name.

Normal apply cleanup carries the published canonical image directly from the
staged rename receipt; it does not approve a later canonical recapture. Each
returning cleanup hook is followed by proof of that image, the original root
and enclosing ancestry, and the actual held writer before further removal or
flush. Coordinated recovery also proves this authority before each empty
generated-directory removal and after its returning durability hooks. Only a
completed owned removal advances the expected directory state. Cleanup after
writer release and failed acquisition retains its separate receipt-only rules.

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
backups and progress. Directories are 0700; journals and witnesses are 0600;
staged images carry their exact planned modes. A single
planned ignore entry preserves existing app ignore rules. Clean only proven
owned temporary entries; unsafe cleanup retains actionable recovery evidence.
These transients are distinct from app-owned desired/semantic metadata.

Staging uses exclusive directory and file creation. Held in-process receipts
record physical identity before subsequent writes, mode changes, flushes or
verification can fail, including an empty or partially written file. Staging
cleanup first proves the complete receipt inventory and checks it again before
each individual unlink or empty-directory removal. Unknown entries, changed
bytes/modes/kinds, links and replacement identities retain the whole uncertain
inventory and report the cleanup cause alongside the staging failure. A path
or transaction-shaped name alone cannot authorize staging cleanup.

Early apply failures use the enclosing transaction's creation receipts, so
foreign state anywhere in that inventory prevents deletion of its staged files.
Journal writes carry empty/partial-file receipts through their rename, and
backup and publication creation keep physical ownership until cleanup. Published
and recovery cleanup freeze the validated inventory before cleanup hooks, then
recheck bytes, modes, kinds and identities before each individual removal. A
failed cleanup or parent flush stops removal and remains a secondary diagnostic;
an earlier staging or preparation error is still reported.

Writer acquisition records exclusive directory and owner-file creation before
later hooks, writes or durability checks can fail. Acquisition failures clean
only positively created entries and report secondary ancestry/cleanup failures.
Release requires the actual held acquisition handle and unchanged physical
directory/owner identities, modes and exact owner bytes. A copied handle,
byte-equivalent replaced record, link or foreign entry cannot authorize release.
Foreign content blocking an otherwise authentic held owner reports
WRITER_LOCK_RELEASE_FAILED; replaced or ambiguous ownership reports
WRITER_LOCK_UNOWNED. Both retain the evidence and drop the held claim.
Release restoration uses exclusive creation only inside the original unchanged
empty directory; foreign or replaced state remains untouched. New generated
ancestry receipts include permission modes; legacy journals keep their existing
optional-field interpretation.

## Recovery and unchanged refusal

Inject failures before/after staging, each replacement, lock publication and
cleanup, including real process termination. Restart must recover consistently
or refuse safely. Restoration/roll-forward validates exact old/staged images and
must preserve post-crash edits. Corrupt/foreign/ambiguous journals, owner mismatch,
missing backups and ambiguous publication are causal errors. Journal contents
cannot certify their own mapping or authorize operations outside it.

Schema-version-1 preimages require either an absent image with null digest/mode
or a regular file with its exact digest and permission mode. Incomplete historical
records are retained and refused, never upgraded by guessing the missing image.
Owned staged and backup identifiers must be strings, unique within their separate
directories and consistent with the operation: creates have no backup, retirements
have no staged result, and `kit.lock.json` is reserved for publication staging.
Both read-only inspection and recovery reject these contradictions before any
transaction cleanup or restoration.

Recovery uses the following logical and physical consistency matrix. Read-only
doctor and unchanged-command inspection use the same phase proof. The current
producer first persists `prepared`; `planned` is an in-memory phase and a
conservatively supported historical record, not a claimed durable production edge.

| Durable phase           | Logical progress                                                                             | Required physical disposition                                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `planned`               | No applied flags; reserved identifiers and unpublished lock intent are allowed.              | Every live target is its original image or original absence; no moved backup exists. Staged results match their intended images. Publication evidence must positively prove no canonical publication.         |
| `prepared`              | Applied flags form an ordered prefix, including an empty or complete prefix.                 | Old images, moved backups and installed results determine rollback; a rename may precede its durable applied flag. Publication staging or witnesses contradict this phase.                                    |
| `applied`               | Every operation is marked applied.                                                           | Without publication intent, prove rollback images. With intent, the physical witness decides prepublication rollback versus committed cleanup; ambiguity retains evidence.                                    |
| `published` / `cleaned` | Every operation is applied and the lock record claims publication.                           | Prove exact canonical digest, mode and rename witness; clean owned evidence only. Source edits never authorize rollback after publication.                                                                    |
| `rolled_back`           | Retain the original ordered forward progress, which may be partial. No published lock claim. | Every original target image is restored; any retained staged/backup bytes and modes match their records. A retained lock intent requires a matching prepublication witness. No restoration authority remains. |

The prepared record may lag a backup move, installation or retirement; its
complete progress prefix may also precede the durable `applied` phase. Canonical
rename may precede durable `published`, and completed restoration may precede
durable `rolled_back`. Physical evidence decides these windows. An unknown phase,
non-prefix progress, incomplete image, phase relabeling contradiction or foreign
witness refuses without discarding the recoverable inventory. `cleaned` remains a
supported terminal record; normal cleanup removes the published journal rather
than claiming a separate durable cleaned-record write.

Actual SIGKILL controls cover the in-memory planned setup, durable prepared and
applied records, canonical-rename publication lag, durable published records and
terminal rollback persistence. Create/update/retire controls independently kill
between the completed rename and durable progress, and after progress persists.
Each retained owner is matched to that exact terminated child before test-only
operator resolution; a fresh coordinating child first proves refusal with the
complete tree unchanged. These controls supplement interrupted-cleanup restart
qualification rather than treating thrown hooks as process termination.

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
