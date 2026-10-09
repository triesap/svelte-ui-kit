# Filesystem platform qualification

Original S193 evidence was independently accepted through RCLD-10.
This matrix concerns the frozen trusted-local transaction model, not general
browser/runtime compatibility or release acceptance.

## Current repaired candidate

R11-F03 replayed all 17 owning filesystem, durability, process, recovery and
no-change inspection files on the selected authenticated Bits
2.19.5-svelte-ui-kit.2 baseline. Each lane passed 172/172, zero skips or
cancellations. [Current cumulative qualification](FINAL_VERIFICATION.md) freshly
replays the same 17 owning files on macOS and unprivileged Linux successfully.
These are author qualification results; separate S203 acceptance remains open.

| Lane                                                    | Actual execution                                                           | Filesystem observation                                  | Result                                                             |
| ------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------ |
| macOS arm64, kernel 25.5.0                              | Local Node 24.21.0 / pnpm 11.22.0                                          | Native temporary directory, type 26, case-insensitive   | 172 safety/recovery tests passed, zero skips                       |
| Linux arm64, kernel 7.0.14-orbstack-00380-ga7e0a2dc9535 | Isolated Debian bookworm, Node 24.21.0 / pnpm 11.22.0; tests uid/gid 65534 | Container-owned case-sensitive overlay, type 2035054128 | 172 passed, zero skips; actual owner-record EACCES controls passed |
| GitHub ubuntu-24.04 / macos-15                          | Configured complete 17-file filesystem jobs; unexecuted                    | Unmeasured                                              | No passing hosted result claimed                                   |
| Windows                                                 | No native execution                                                        | Unmeasured                                              | Unsupported/unqualified                                            |

The current Linux image remains the immutable digest below. Preparation,
frozen strict installation and build run in the disposable container; its test
process drops to uid/gid 65534 before accessing owned temporary project trees.
Unreadable-owner controls chmod the actual record to mode 0 and observe EACCES;
the test owner restores only read access for complete-tree comparison. No
ordinary-user access-control claim extends beyond these measured controls.
Total preparation/install/build/replay took 298853 ms, exit 0, null signal/error.
The transferred source archive SHA-256 is
`4d85319c90c1d434de55365acb9858f94d719422d577435926012e698038c072`.
Read-only source/tool mounts, writable owned evidence and container removal
remain the execution boundary. Actual transcripts and inventories are retained
under `logs/r11-f03-linux-replay/` and `logs/r11-f03-current-recovery-macos.log`.

The [current CI command map](COMMANDS.md) and actual workflow list all 17 files;
R11-F04 validates the same scope and Linux/macOS matrix. The six additions to
the historical eleven-file lane are cleanup-restart-matrix, docs-recovery,
lock-publication, publication-witness, transaction-cleanup and unchanged-state.
They preserve real SIGKILL, pending cleanup, owner-bound publication,
post-interruption edits and exact unchanged-command refusal. Remote runner
configuration does not establish execution or filesystem equivalence.

## Historical S193 execution

The following 83-case records retain their original pins and root-user Linux
limitation; they are not the current repaired candidate's execution.

| Lane                                                    | Actual execution                                                | Filesystem observation                                                      | Result                                                     |
| ------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------- |
| macOS arm64, kernel 25.5.0                              | Local Node 24.21.0 / pnpm 11.22.0                               | Native temporary directory, type 26, case-insensitive                       | 83 safety tests passed, zero skips                         |
| Linux arm64, kernel 7.0.14-orbstack-00380-ga7e0a2dc9535 | Isolated Debian bookworm container, Node 24.21.0 / pnpm 11.22.0 | Container-owned `/tmp` and `/work`, overlay type 2035054128, case-sensitive | 83 safety tests passed, zero skips; build/typecheck passed |
| GitHub ubuntu-24.04 / macos-15                          | Configured filesystem jobs; not remotely executed               | Unmeasured                                                                  | Unproven; no passing remote result claimed                 |
| Windows                                                 | No native runner available or execution performed               | Unmeasured                                                                  | Qualification blocked; unsupported/unqualified             |

The Linux image is `node:24.21.0-bookworm`, resolved digest
`sha256:3d27e5c11e5786e309ec3e03f93ae536eb36e6e5eb3714d5eb3300a36157add0`.
It runs as the image's default root user. POSIX modes, rename, symlinks, FIFO,
process coordination and interrupted recovery are measured; root execution
does not qualify ordinary-user permission denial. Source/tool archives are
mounted read-only, and only the owned evidence directory is mounted writable.
The tested project and temporary target trees are container-owned, not host
bind-mounted directories. The container is removed after execution; no existing
container or machine is modified to construct the test fixtures.

## Owning controls and reproduction

After the pinned frozen/strict-peer install and build, both actual lanes run:

```sh
node tools/run-unit-tests.mjs --suite integration \
  tests/integration/platform-filesystem.test.ts \
  tests/integration/transaction-processes.test.ts \
  tests/integration/transaction-safety.test.ts \
  tests/integration/filesystem-paths.test.ts \
  tests/integration/durability-ordering.test.ts \
  tests/integration/durability-flush-paths.test.ts \
  tests/integration/recovery-prepublication.test.ts \
  tests/integration/recovery-published.test.ts \
  tests/integration/recovery-invalid.test.ts \
  tests/integration/recovery-ownership.test.ts \
  tests/integration/transaction-authority.test.ts
```

Three new owning controls cover portable invalid/reserved/drive/UNC paths,
case-folded collisions and segment-aware sibling acceptance without mutation;
actual production replacement preserving mode/device and the open preimage
inode; and a substituted symlink ancestor refusing the batch while preserving
both complete local/outside trees. Space/Unicode temporary paths execute on
both lanes. The remaining 80 existing controls exercise real FIFO/symlink/kind
rejection, root/ancestor/preimage identity, cooperative process exclusion,
SIGKILL before/after publication, ownership-bound recovery, corrupt evidence,
post-crash user edits and causal flush/removal failure propagation. No safety
failure is skipped. The formerly unconditional process-platform assertion now
explicitly rejects platforms outside the measured POSIX lane set.

The source snapshot, archive checksums, exact invocation and observed machine
records are retained with `logs/s193-platform-{macos,linux}-final.log` and
`logs/platform-filesystem/`. Logs are relative to this evidence directory.
The initial Linux transfer included AppleDouble metadata sidecars; the typed
runner rejected them during compilation. The corrected transfer disables
archive metadata, with the original failure retained separately. No test or
production safety check was suppressed.

The historical CI job ran the same eleven files with pinned dependencies on the two
configured labels; current CI uses the 17-file lane above and the full configured
Chromium suite. The historical browser harness invocation removed a literal
separator that Playwright would treat as an operand. Runner labels are from
[GitHub's runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
Configuration does not establish remote execution, architecture equality or
equivalence to the measured local filesystem.

## Explicit limits

Windows lexical portability is tested on POSIX; it is not Windows rename,
directory-fsync, mode or recovery evidence. No Windows pass or support claim is
made. Linux filesystem-only evidence does not qualify Linux browser/rendering,
the packed executable, every distribution/architecture, NFS/network mounts,
cross-device staging, power-loss guarantees or access-control behavior beyond
the current narrowly measured owner-record permission-denial controls.
Atomic replacement is per file and staging must remain on the same filesystem;
the lock is the final publication marker, not native multi-file atomicity.
Observed ancestry/preimage checks do not eliminate hostile directory replacement
between syscalls. The accepted trusted-local race boundary remains unchanged.

No Rust workspace is present or affected; conditional Cargo checks are N/A.
Final AC20, package/runtime/browser compatibility and S203 acceptance remain
open. This matrix adds evidence and configured checks without waiving them.
