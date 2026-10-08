# Filesystem platform qualification

Candidate S193 evidence; independent RCLD-10 acceptance remains required.
This matrix concerns the frozen trusted-local transaction model, not general
browser/runtime compatibility or release acceptance.

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

The CI job runs the same eleven files with pinned dependencies on the two
configured labels. The existing browser harness invocation removes a literal
separator that Playwright would treat as an operand. Runner labels are from
[GitHub's runner reference](https://docs.github.com/en/actions/reference/runners/github-hosted-runners).
Configuration does not establish remote execution, architecture equality or
equivalence to the measured local filesystem.

## Explicit limits

Windows lexical portability is tested on POSIX; it is not Windows rename,
directory-fsync, mode or recovery evidence. No Windows pass or support claim is
made. Linux filesystem-only evidence does not qualify Linux browser/rendering,
the packed executable, every distribution/architecture, NFS/network mounts,
cross-device staging, power-loss guarantees or ordinary-user access controls.
Atomic replacement is per file and staging must remain on the same filesystem;
the lock is the final publication marker, not native multi-file atomicity.
Observed ancestry/preimage checks do not eliminate hostile directory replacement
between syscalls. The accepted trusted-local race boundary remains unchanged.

No Rust workspace is present or affected; conditional Cargo checks are N/A.
Final AC20, package/runtime/browser compatibility and S203 acceptance remain
open. This matrix adds evidence and configured checks without waiving them.
