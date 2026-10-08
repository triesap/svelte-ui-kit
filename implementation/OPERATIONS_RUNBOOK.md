# Installation, upgrade, and recovery runbook contract

<!-- Adopted at S002 from the governing RCLD sequence. This file governs product intent; implementation/COMMIT_SEQUENCE.md remains the execution/status authority. -->

Status: operational guidance for the locally built or locally installed private
CLI. The [README workflow](../README.md#use-the-local-built-cli) records actual
commands; no npm publication is assumed. Original acceptance and the separate
final S203 gate remain required.

#### Initial installation

Start at one authorized SvelteKit application root (or use --cwd). Preserve a clean known baseline or record existing changes. Run info to inspect integration/dependency state. Inspect an item's metadata/source with view. Review init/add dry runs and all proposed paths. Apply initialization and requested items. Install reported consumer dependencies explicitly using the actual project manager. Check the generated app with Svelte check, production build and relevant browser tests. Commit application source/CSS/config/lock/contract metadata; do not commit transient writer state.

The init contract does not preinstall the complete catalog. Component requests remain distinct from their dependencies. Existing themes.css/app.css/layouts are application-owned and must survive integration.

The complete-catalog runtime pins are Svelte 5.57.1, Bits UI 2.19.3 and its date
peer 3.12.4. Install them explicitly with the detected project manager; pnpm
11.22.0 is the executed baseline. The [consumer manifest](../tests/fixtures/consumer/package.json)
records the separate tested framework/check/build tooling. The CLI package uses
its own parser/validation dependencies and is not an application runtime facade.
Use the actual local archive returned by pack; do not substitute an assumed
published package version. Preserve the distribution's source/license notices.

#### Customization

Use application theme/override styles for portable changes or edit generated source/managed blocks directly. Preserve class/property contracts as needed by related parts. A valid local edit is not a broken installation by itself. Record substantive source changes in application Git history; CLI lock baselines must not be rewritten manually just to hide drift.

#### Upgrades

Choose a tested CLI/registry version and review dependency compatibility. Run sync --dry-run. Untouched generated content can update, local-only edits remain, already-incoming content is satisfied, and genuine conflicts stop the batch. Inspect incoming source through view --source and reconcile deliberately. Source/CSS/export compatibility cohorts must update safely together. Rerun dry-run, apply, then typecheck/build/browser/doctor. Commit the result and metadata truthfully.

Do not use invented --force, auto-merge, accept-hash or dependency-install options. Hashes alone cannot reconstruct a merge base. An application's Git history is useful to review changes but must not be silently treated as authority to overwrite local content.

Keep the incoming executable in a separately installed CLI host while reviewing
an upgrade. A conflict exits 10 with no application writes; valid customization
alone does not make strict doctor fail. Missing or broken owned content does.
Review both source versions and reconcile explicitly, then repeat dry sync,
sync, strict doctor and application check/build/browser verification. Do not
rewrite ownership hashes to suppress a conflict. The current registry's stable
replay is verified independently of synthetic test revisions; test revisions
are not claimed as actual release history.

#### Removing desired items

Edit the explicit requested set in kit.json and inspect sync --dry-run. Shared dependencies remain while needed. Clean obsolete owned targets may retire under the frozen policy; customized assets remain with diagnostics and explicit ownership changes. Resolve remaining application imports manually; the CLI does not promise arbitrary source rewriting. No remove command is part of the approved interface.

`RETIRED_IMPORTS_REVIEW_REQUIRED` is a manual application-import review warning,
including clean-only retirement. An exit-0 warning can accompany an applied
retirement, so inspect the envelope, not just the process status. Run the app's
verification after repairing imports. A replay with nothing left to retire does
not repeat a new retirement warning.

#### Interrupted writes

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

An `init` replay that reports `no_change` performs no recovery. Run strict
doctor again: retained evidence still requires review, even after exit 0.
When a subsequent intentional component write passes planning, its guarded
boundary can clean provably committed evidence. Do not invent a component
request, force a change or delete evidence merely to trigger cleanup.

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

##### Stale writer coordination after a killed writer

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

#### Agent specification after each commit

Use STEP_REPORT_TEMPLATE.md. State exact commands/working directories/results and unverified lanes, preserve failed evidence, commit only scoped changes, and name the next numbered step. Do not claim a final release when any required acceptance criterion remains blocked. Package construction/testing does not authorize publication or a remote push.
