# Upgrading and retiring requests

Preserve the existing CLI, its exact archive/digest, CLI-host manifest/lock and a
verified full application snapshot before reviewing an incoming distribution.
A version string alone does not identify a matching binary. Prepare the incoming
CLI in a separate host using [local installation](../getting-started.md).

## Canonical format adoption

The in-progress 0.1.0 package uses one target-bearing project/lock format 1 and durable journal
format 3. Old targetless project format 1 and old format 2 are refused. Changing
a format number, removing ownership evidence or running ordinary sync does not
establish a supported migration.

Rehearse this procedure in an isolated working area before any separately
reviewed application cutover:

1. Stop writers and preserve the complete old application, including hidden
   `_kit` state, journals, staged images, backups, publication evidence, modes,
   links and unmanaged work. Verify file hashes, kinds, permissions and link
   targets against the backup. Preserve native archives, dependency inputs and
   the matching previous CLI archive and host lock. Account explicitly for
   externally referenced dependency files; copying a link does not copy its
   destination.
2. Retain the original physical installation. A byte-copy backup changes file
   and directory identities and is archival evidence, not authority to recover
   a journal in another root. Use the matching previous CLI at its original root
   only for provable interrupted state. Follow the bounded writer-coordination
   procedure in [recovery](recovery.md) when its actual prerequisites are proven.
   Ambiguous evidence or a planning refusal means preserve and stop; do not
   invent a request to trigger recovery.
3. After verified old recovery, preserve a settled snapshot and the original
   physical installation for rollback. Review strict diagnosis and old app
   checks. Create a separate clean candidate from reviewed application source
   and dependency inputs, leaving the original untouched. Do not copy old kit
   metadata or stale managed layout/export/CSS regions into a fresh installation.
   Review their app-owned content and customizations separately.
4. Declare canonical target intent and supply modern SvelteKit child rendering,
   an Astro default slot or a library stylesheet as appropriate. Run canonical
   info/init dry-run/init, restore deliberate root requests through normal
   add/sync plans, and reapply reviewed source/theme customizations. Verify the
   candidate with strict doctor, app checks/builds and relevant SSR/browser tests.
   Generated success alone does not qualify application behavior.
5. Keep original and candidate independent until review. Before an authorized
   switch, preserve both complete installations and their exact CLI pairings.
   A same-filesystem move preserves physical objects; a copied backup does not.
   Recover interrupted state before relocation rather than assuming a saved
   journal can be replayed at a new location.
6. Rollback returns to the preserved settled old installation with its matching
   previous binary and dependency state, retaining the candidate for diagnosis.
   Verify the complete saved inventory and old diagnosis again. A backup with
   retained physical evidence that cannot be restored consistently requires
   review; do not edit journal identities/hashes to make it pass.

Neither the incoming CLI nor these steps automatically rewrite an old project.
The archived interrupted snapshot, settled snapshot, previous binary and original
physical installation serve different purposes; keep each until review is complete.

## Updates within the canonical format

Use the following normal source reconciliation only for a compatible canonical
installation. Set `INCOMING_CLI` to its independently installed executable and
`APP` to that application package root.

<!-- documented-upgrade-workflow:start -->

```sh
node "$INCOMING_CLI" --cwd "$APP" view button --source
node "$INCOMING_CLI" --cwd "$APP" sync --dry-run
node "$INCOMING_CLI" --cwd "$APP" sync
node "$INCOMING_CLI" --cwd "$APP" doctor --strict
```

<!-- documented-upgrade-workflow:end -->

The dry plan reports actual prospective source, CSS, export and metadata changes.
Dependencies are instructions, not automatic package installation. Verify the
application-owned native archive and installed runtime graph explicitly when
requirements change; a version label alone is not authenticated readiness.

## Preserve customization

Reconciliation compares base, local and incoming bytes. Local edits with unchanged
upstream remain intact and retain their real base. Local bytes already equal to
incoming are satisfied. A genuine local/incoming conflict exits 10 and refuses
the whole batch. Coupled source/style/export changes form compatibility cohorts;
a safe unrelated item cannot conceal a conflicted cohort.

Keep theme overrides in app-owned CSS after `kit.css`, for example
`:root { --kit-color-primary: rgb(12, 34, 56); }`. Direct component edits are also
application work. Review both versions, reconcile deliberately, then rerun dry
sync, sync, strict doctor and application check/build/browser tests. The CLI does
not provide an automatic merge or force overwrite. Never alter baseline hashes
to disguise customization or conflict.

## Retire desired requests

Edit only the desired `requested` list in `_kit/kit.json`, then review
`sync --dry-run`. Registry dependencies needed by surviving requests remain.
A clean unneeded target can be retired; a customized target remains app-owned
with truthful detached ownership and diagnostics. There is no remove command.

`RETIRED_IMPORTS_REVIEW_REQUIRED` means application imports may need manual repair
even when sync exits 0. Inspect imports of every retired export and rerun app
verification. Sync does not rewrite arbitrary application source. Re-adding an
item does not grant permission to overwrite an untracked collision or silently
adopt identical unmanaged bytes for later deletion.

## Diagnose interruption

Stop on retained, ambiguous or corrupt transaction state and follow
[recovery](recovery.md). Do not delete journals or introduce a fake component
request to trigger cleanup. A no-change refusal protects retained evidence;
an exit-0 replay does not mean recovery occurred.
