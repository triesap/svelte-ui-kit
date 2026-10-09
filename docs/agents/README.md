# Agent task routing

Use this index to read the context needed for the task. Application use and
repository maintenance have different boundaries; no task requires reading
every historical document. Public reference is shared with human users.

| Task                             | Minimum context                                                                                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Install/use in an application    | [Getting started](../getting-started.md), [CLI](../reference/cli.md), [configuration](../reference/configuration.md), relevant [component](../reference/components/README.md). |
| Change a component               | [Product contract](product-contract.md), relevant component, [compatibility](../reference/compatibility.md), authored types/manifests and owning tests.                        |
| Change planning/sync             | [Architecture](architecture.md), [synchronization](synchronization.md), [transactions](transactions.md), CLI/config schemas and owning tests.                                  |
| Change filesystem/recovery       | Transactions, [recovery guide](../guides/recovery.md), actual platform/refusal/process tests.                                                                                  |
| Change native dependency tooling | [Native producer](native-dependency.md), compatibility, recipe/patch/locks and bootstrap/strict/package tests.                                                                 |
| Change docs/packaging/CI         | [Contributing](../CONTRIBUTING.md), [testing](testing.md), current checker/readers, package inventory/link policy and actual CI policy.                                        |

Repository maintenance must preserve application ownership, real native types,
SSR/hydration, strict diagnostics, zero-write planning/refusal, authenticated
export/cohort authority and recoverable lock-last publication. Inspect current
status, instructions, contracts and tests before editing; protect unrelated work
and standalone repository identity. Small verified commits need explicit authority.
Push/publication/deployment/reference-source edits are separate actions.

Machine facts live in package.json, registry/manifests, versioned schemas, authored
types and producer inputs. Docs interpret guarantees; a discovered implementation
disagreement needs investigation and evidence, not silent weakening. A separate
reviewer must perform independent acceptance when the task requires it.
Completed original scheduling/report machinery is historical [provenance](../provenance.md).

Application agents must select the actual package with --cwd, install dependencies
explicitly, preserve app edits and review dry plans before writes. Upgrades and
recovery need their specific guides. Never use a retained transaction as authority
to delete state, falsify hashes or trigger cleanup with a fake request.
