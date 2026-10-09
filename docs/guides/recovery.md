# Recovery after interrupted writes

Use the [local CLI setup](../getting-started.md) to set absolute `CLI` and `APP`
paths. The application owns its current files; protect them before any manual
intervention. Diagnosis is read-only and cannot authorize recovery by itself.

## Interrupted writes

Stop further mutation when a command reports pending/ambiguous recovery. Preserve current files and transaction evidence. Use read-only diagnosis to understand the state; do not delete lock/journal files based only on age, PID, or a guess. The implemented protocol must safely finish/revert a provable interrupted state or refuse with actionable guidance. It must not overwrite edits made after interruption.

Before any manual action, stop all writers and make an external backup of the
entire application, including hidden entries, modes, owner records, journals,
staged images and backups. Keep it outside the active project. Read-only
diagnosis never repairs or clears transaction evidence:

<!-- documented-recovery-diagnosis:start -->

```sh
node "$CLI" --cwd "$APP" doctor --strict
node "$CLI" --cwd "$APP" init --dry-run
```

<!-- documented-recovery-diagnosis:end -->

A nonzero diagnosis is expected for retained or broken state. A successful dry
run does not certify that a writer lock can be acquired. Preserve both output
and backup before deciding on recovery. There is no `recover` command or force
flag. Rerun the original write command only after resolving coordination safely;
its guarded boundary either recovers provable state or refuses.

Unchanged `init`, `add` and `sync`, including dry runs, inspect coordination and
transaction state without acquiring a writer or cleaning evidence. A valid
writer produces `WRITER_BUSY`; ambiguous ownership produces
`WRITER_LOCK_UNAVAILABLE`. Otherwise valid retained transactions, including
committed cleanup, produce `RECOVERY_PENDING`. Corrupt or foreign evidence
retains its specific recovery diagnostic. Physical safety checks precede writer
and journal diagnosis. A clean exit-0 `no_change` requires absent writer
evidence and no retained transaction directories; it still proves no recovery
occurred. Empty coordination namespaces are harmless and remain untouched.
When a subsequent intentional write passes planning, its guarded boundary can
recover provable state. Do not invent a component request, force a change or
delete evidence merely to trigger cleanup.

Planning can also stop with `INIT_OWNERSHIP_CONFLICT` before guarded recovery
when interrupted integration lacks canonical ownership. This is a safe stop,
not proof that recovery ran or permission to delete the partial integration.
Keep current work, external backup and transaction evidence for review.

Prepared or partially applied uncommitted transactions can roll back only
recorded images. If current bytes or modes have changed since interruption,
recovery refuses and retains those edits and transaction evidence. Stop and
review the external backup and recorded images; do not replace user work to
make recovery pass. Published-but-not-cleaned state is already committed:
qualified cleanup preserves committed content and subsequent user edits rather
than reverting the installation. Missing/corrupt journals, foreign entries or
ambiguous publication evidence require a safe stop and evidence review. Never
delete a journal, backup, staged image, publication witness or canonical lock to
silence a diagnostic.

### Stale writer coordination after a killed writer

A writer that is killed leaving `_kit/.svelte-ui-kit/writer.lock` in place is
never reclaimed automatically: the protocol refuses with a busy/coordination
diagnostic (`WRITER_BUSY`) and retains the owner record and transaction
evidence, because PID equality, age and lock-directory names are not proof that
no writer is live. Automatic recovery therefore always refuses first. When a
real operator has confirmed the recorded owner process is no longer running,
the bounded manual procedure is:

1. Back up the entire current application outside the project, preserving the
   transaction and journal evidence; verify the backup before proceeding.
2. Independently confirm the recorded `owner.json` belongs to the interrupted
   writer, that this process has exited in its actual namespace, and that all
   other project writers have stopped. An old PID or failed PID lookup alone
   does not establish these facts. Missing/corrupt owner evidence means stop.
3. Move only the verified `writer.lock` coordination directory into a fresh
   external quarantine on the same filesystem, leaving every transaction and
   other transient entry untouched. Preserve the owner record in quarantine;
   do not overwrite an existing destination. If these prerequisites cannot be
   established or the move fails, stop without clearing other state.
4. Re-run the original `init`/`add`/`sync` command and inspect its envelope and
   strict doctor afterward. If planning stops or the result is `no_change`,
   do not claim recovery ran. A genuine planned write acquires coordination
   and performs provable recovery or refuses with retained evidence.

Recursively deleting transaction, journal or staged state is not part of this
procedure and is not a qualified production recovery path.

After a successful write, repeat strict doctor and application verification.
Retain the external backup and quarantined owner evidence until review is
complete. The default coordination path above is illustrative: with custom
mapping use `<uiDir>/_kit/.svelte-ui-kit/writer.lock`, resolved from the actual
configuration. Never apply these manual actions to an unverified project path.
