# CLI reference

Invoke the installed local executable with `node "$CLI" --cwd "$APP" <command>`.
Follow [getting started](../getting-started.md) to prepare the separate CLI host
and application. The CLI is ESM, local and bundled; it neither fetches a registry
nor runs the application's configuration or package manager.

## Commands

| Command       | Result                                                                               | Mutation                                |
| ------------- | ------------------------------------------------------------------------------------ | --------------------------------------- |
| `info`        | Project identity, mappings, dependency requirements and readiness.                   | None.                                   |
| `init`        | Desired configuration, integration, export infrastructure and initial semantic lock. | Apply the guarded plan unless dry-run.  |
| `view <item>` | One bundled item's manifest; `--source` includes source inspection.                  | None.                                   |
| `add <item>`  | One explicit root request and its registry dependency closure.                       | Apply the guarded batch unless dry-run. |
| `sync`        | Reconcile desired requests and incoming registry with existing ownership.            | Apply the guarded batch unless dry-run. |
| `doctor`      | Dependencies, ownership, structural integration, customization and unsafe state.     | None.                                   |

Global `--cwd <path>` and `--json` can precede or follow the command. Write commands
accept `--dry-run`; view accepts `--source`; doctor accepts `--strict`. Help uses
`--help`/`-h`; version uses `--version`/`-V`. Help can be structured with `--json`.
Unknown commands/options, missing values and conflicting arguments fail before
writes. Add accepts exactly one ID. There is no remove, force, merge, auto-install,
multi-item add, remote registry or upstream compatibility alias.

`requested` holds explicit roots; the installed closure also includes dependencies.
See [configuration](configuration.md), [upgrading](../guides/upgrading.md) and
[recovery](../guides/recovery.md). Diagnosis does not execute recovery.

## Structured output and exits

The [command envelope schema](../../schema/v1/command-envelope.schema.json) owns
the independent v1 format: `{ schemaVersion, command, status, diagnostics,
changes, data }`. Status is success/planned/no_change/warning/conflict/error/unsupported.
Diagnostics have stable code, info/warn/error level, message and optional safe
logical locator/guidance. Changes distinguish create/update/retire and whether
the action was applied. Planned output cannot prove that writes occurred.

JSON mode emits exactly one complete stdout envelope, including failures, without
progress/color/extra error objects. Human failures use stderr. Equivalent logical
inputs have deterministic semantic output; absolute sensitive paths, transient
journal IDs, timestamps and filesystem iteration order are not public identities.

| Exit | Meaning                                                                    |
| ---- | -------------------------------------------------------------------------- |
| 0    | Success, planned, no_change or non-strict warning.                         |
| 1    | Ordinary failure, including unavailable coordination or retained recovery. |
| 2    | Usage error or unsupported operation.                                      |
| 3    | Strict doctor finds broken/unsafe installation evidence.                   |
| 10   | Genuine reconciliation conflict; the whole batch is refused.               |
| 11   | Unsafe physical path.                                                      |
| 12   | Registry authentication/validation failure.                                |

The most specific causal class wins deterministically. JSON intent and command
attribution remain stable even if argument validation fails before the command
token. Valid customization alone does not fail strict doctor. Readiness is not
a replacement for the application's strict typecheck, production build, SSR,
browser and accessibility verification.

## Read-only plans and unchanged commands

Dry runs, info/view/doctor and validation create no project files, including
hidden coordination. Before init/add/sync can report no_change, they inspect
the approved mapping's physical safety, writer evidence and transaction state
without acquiring a writer or doing cleanup. Present valid writer coordination
reports WRITER_BUSY; ambiguous/unreadable coordination reports
WRITER_LOCK_UNAVAILABLE. Both exit 1. More specific corrupt/foreign/unsafe journal
diagnostics remain causal. Otherwise retained transactions, including committed
cleanup, report RECOVERY_PENDING and preserve all evidence. An exit-0 replay
does not mean recovery occurred.

Genuine writes retain recoverable transactions and preimage revalidation. Lock
metadata is the final publication witness. A safe unrelated change cannot conceal
an unsafe path, conflict or incompatible component/source/style/export cohort.

## Dependency instructions

Plans describe direct runtime/tooling requirements, peers, declarations, installed
versions and appropriate detected-manager commands. Installation is a separate
application operation. Only the authentic application-owned Bits archive can
normalize its explicit local-file declaration into the qualified internal version;
installed distribution provenance and full inventory must also match. Unknown,
linked/escaping/changed archives, same-version fabricated packages and semver-only
declarations cannot certify readiness. Follow the complete native extraction,
digest check and explicit local install in [getting started](../getting-started.md).

Authoritative implementation and regression sources are repository references:
[argument grammar](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/src/cli/args.ts),
[protocol](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/src/cli/protocol.ts),
[output presentation](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/src/cli/output.ts)
and [protocol tests](https://github.com/triesap/svelte-ui-kit/blob/ae136d7d08ac4efeffdd2056d49dd554557dd68d/tests/unit/protocol.test.ts).
