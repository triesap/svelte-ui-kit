# Upgrading and retiring requests

Start with the [local installation procedure](../getting-started.md), preserve
an external backup or reviewed version-control baseline, and inspect the incoming
archive and its dependency requirements. An incoming CLI host is separate from
both the existing host and application. Explicitly install the reviewed local
archive there, then set `INCOMING_CLI` to its absolute installed executable.
Keep `APP` set to the application package root.

## Inspect before applying

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
