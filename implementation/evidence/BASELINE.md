# S001 — Repository baseline evidence

Repository-relative baseline record for checkpoint S001 (`RCLD-01`), contract
anchors R32, R33, R34, from `implementation/COMMIT_SEQUENCE.md`.

Scope of record: this target repository (`.`) and the read-only reference
`https://github.com/triesap/leptos_ui_kit` at revision
`a10fbf06334f4648f5755e05a7147414e4e5fc98`. No product code was authored and no
dependency was added, upgraded, or removed while producing this baseline.

## 1. Git identity and state

| Fact             | Observed value                                                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Git root         | This repository (`.`)                                                                                                           |
| Branch           | `master`                                                                                                                        |
| HEAD             | `0616306ff06f96f41b80062fbefa39829b0cf5f5` (`docs: update README.md`)                                                           |
| Remote           | `git@github.com:triesap/svelte-ui-kit.git`                                                                                      |
| Upstream         | `origin/master` at `e99ea789bb90d87dbb1c47b76e8f17c889910ea5` (local ahead by 1)                                                |
| Working tree     | Clean except untracked `implementation/`                                                                                        |
| Stash entries    | None                                                                                                                            |
| Effective author | `triesap <tyson@radroots.org>` (author and committer)                                                                           |
| Signing policy   | `commit.gpgsign=false`, `tag.gpgsign=false`, `gpg.format=openpgp`; a `user.signingkey` is configured but no signing is enforced |
| Git version      | `2.55.0`                                                                                                                        |

Observed recent commit subjects (only two commits exist):

- `0616306` — `docs: update README.md`
- `e99ea78` — `Initial commit`

No consistent multi-commit convention is yet established in the target. The one
non-initial commit uses a lowercase `area: imperative summary` shape, which is
consistent with the plan's recorded reference fallback. No Git settings were
changed while collecting this evidence.

## 2. Repository inventory

Tracked files (14). SHA-256 recorded for the working-tree content:

| Path                               | SHA-256                                                            |
| ---------------------------------- | ------------------------------------------------------------------ |
| `.editorconfig`                    | `49e53afa4ae47ecc7446a8b471792dbbc91575262b3d3b161b063801aa096f5f` |
| `.gitattributes`                   | `d60f352d0db1404c70afb4bb8b2ca3fd1c610572aa40720e8a0b7baa7885418c` |
| `.github/pull_request_template.md` | `71d9011debc4ff41fc036a256f286d019849fddc76dfdcc14e181649f7d75093` |
| `.gitignore`                       | `d2d21ce0626252aeb568f9f9563f446917044a8c41cb2d616bc3760ce8760306` |
| `.prettierignore`                  | `79c07b2955c0a09df912a78e7f95373f9349e9cd86bc0f3189aa6fc44882be9a` |
| `.prettierrc.json`                 | `1ee36199bc9b4ea2e333246dfc6007e3c1c0425e405b4fec49353c6341093e01` |
| `CHANGELOG.md`                     | `d2160f64b16d51ac0bd65320ecfe43b9d464286831f140f683df691277fa08dc` |
| `CONTRIBUTING.md`                  | `cc28f826ed975963a31ee16056eece0d963bba2ff46a77266224b7e007e87e6f` |
| `LICENSE-APACHE`                   | `1a3cd0ed73920ca7355d677206775f44ef752592a55c2ae1c4cef1a9e076f582` |
| `LICENSE-MIT`                      | `90c8e1280e4a1783f8401acc5eb2255190c071b61e45f0d98290f3ada155cd53` |
| `README.md`                        | `e3fed8a9a6efd91df4137f2b0fe7df5b6f5f84c0eb655da19ac044da9b230a66` |
| `package.json`                     | `5582f573e7e15b5747ff4cfe8ca0c1f292afb08ace0258785271fca434d77090` |
| `pnpm-lock.yaml`                   | `c5a3a699074fc8fca51af9bdc2d373ac7d6e1d728b149de3341ad7b95bea665f` |
| `pnpm-workspace.yaml`              | `226909e7726c235c6b854540949bc8144625420ccdd6298fca1f7885d8bfe524` |

Inventory findings:

- No product source, no `src/`, no tests, no scripts directory.
- No CI workflows: `.github/workflows/` does not exist; `.github/` contains only
  the pull request template.
- Package manager is pnpm, pinned by the `packageManager` field to `11.22.0`.
  `pnpm-workspace.yaml` declares exactly one explicit member, `"."`.
- `pnpm-lock.yaml` is lockfile version 9.0 with a single importer and a single
  dev dependency (`prettier@3.9.6`). No runtime dependencies exist.
- Scripts: `format` (`prettier --write .`) and `format:check`
  (`prettier --check .`).
- Formatting configuration: `.prettierrc.json`
  (`tabWidth: 2`, `useTabs: false`, `endOfLine: lf`, `proseWrap: preserve`) and
  `.prettierignore` (ignores `node_modules/`, build output, `pnpm-lock.yaml`,
  and the license files).
- Licensing: `MIT OR Apache-2.0`, with both license files present; the MIT text
  names copyright holder "Tyson Lupul".
- `engines.node` requires `>=24`.

## 3. Toolchain observed

| Tool             | Observed                                                            |
| ---------------- | ------------------------------------------------------------------- |
| Node (default)   | `v22.22.3` — below the declared `>=24` engine                       |
| Node (supported) | `v24.21.0` available and used for the supported-engine confirmation |
| pnpm             | `11.22.0`                                                           |
| Prettier         | `3.9.6` (dependency and working `node_modules` copy)                |
| Git              | `2.55.0`                                                            |
| Rust (reference) | `1.92.0` (`cargo` and `rustc`), edition 2024 per manifest           |

The default shell Node is below the declared engine. A `>=24` runtime is
available and the baseline checks were confirmed under it, so this is an
environment note rather than a repository failure. It is recorded because the
plan's review observation of `v26.10.0` is not reproducible here.

## 4. Cargo applicability — target vs reference

**Target (`.`): Cargo is N/A.** No `Cargo.toml` and no `rust-toolchain.toml`
exist anywhere in the target outside ignored dependency/planning directories.
Evidence: `find` over the target for `Cargo.toml`/`rust-toolchain*` returned no
matches. No Rust lane was run or claimed for the target.

**Reference: Cargo applies.** The reference at revision `a10fbf0` is a Rust
workspace with `Cargo.toml`, `rust-toolchain.toml` (channel `1.92.0`),
`rustfmt.toml` (edition 2024), and six workspace members
(`leptos_ui_kit`, `leptos_ui_kit_cli`, `leptos_ui_kit_codegen`,
`leptos_ui_kit_codegen_platform`, `leptos_ui_kit_primitives`,
`leptos_ui_kit_registry`). It is a separate, read-only checkout that was clean at
the exact revision before and after the guard commands, and it was not modified.

The reference guard was therefore executed rather than assumed. A seventh
directory, `crates/leptos_ui_kit_windows_fs`, exists but contains no
`Cargo.toml` and is not a workspace member; it does not expand the workspace.

## 5. Baseline checks executed

All commands were run from the target repository root or the reference
repository root as noted, using the active environment's build-output routing.
"Target" means this repository; "reference" means the read-only checkout above.

| #   | Check                                                    | Working dir | Exit | Result                                                                         |
| --- | -------------------------------------------------------- | ----------- | ---- | ------------------------------------------------------------------------------ |
| 1   | `pnpm run format:check`                                  | target      | 0    | "All matched files use Prettier code style!"; engine warning (Node `v22.22.3`) |
| 2   | `pnpm run format:check` (under Node `v24.21.0`)          | target      | 0    | Passed with no engine warning                                                  |
| 3   | `pnpm install --frozen-lockfile` (under Node `v24.21.0`) | target      | 0    | "Already up to date"; lockfile unchanged (hash above)                          |
| 4   | `git diff --check`                                       | target      | 0    | No whitespace diagnostics                                                      |
| 5   | `git diff --cached --check`                              | target      | 0    | No whitespace diagnostics; index empty                                         |
| 6   | `cargo fmt --all -- --check`                             | reference   | 0    | No formatting drift                                                            |
| 7   | `cargo check --workspace --all-targets`                  | reference   | 0    | Workspace checked in ~41s                                                      |
| 8   | `cargo test --workspace --all-targets`                   | reference   | 0    | 562 top-level passes plus 16 nested subprocess passes; 0 failed, 4 ignored     |

Check 3 was a non-destructive reproducibility confirmation of the existing
lockfile, not a dependency change.

## 6. Checks that exist, are missing, or are unavailable

**Exists and passes:** target `pnpm run format:check`; target frozen-lockfile
install; target whitespace/diff health; reference `cargo fmt`/`check`/`test`.

**Missing because implementation does not exist yet (unavailable, not passed):**
no lint, no typecheck, no unit/integration/registry/component test lane, no CLI
build, no consumer `svelte-check`/build, no browser lane, no package acceptance
lane, and no CI workflow. These are scheduled in later checkpoints (for example
S002–S010) and must not be reported as passing before they exist.

**Recorded but intentionally not run at S001:** the reference packaging and
provenance lanes (`cargo package …`, and the `--ignored` packaged-source and
packaged-runtime tests). The verification contract conditions those on actual
Rust packaging/provenance changes; S001 makes none. They are unrun, not passed
and not N/A.

**Failures/blockers:** none that block S001. The only anomaly is the default
Node runtime being below the declared engine, mitigated by confirming the
baseline under a supported Node runtime.

## 7. Prior observations checked against current state

| Prior observation                                            | Status now                                                       |
| ------------------------------------------------------------ | ---------------------------------------------------------------- |
| Target scaffold has 14 tracked files and no product/tests/CI | Confirmed (14 tracked files; no source, tests, or workflows)     |
| Last target commit `0616306`, branch `master`                | Confirmed                                                        |
| Scaffold clean before the planning document was added        | Confirmed; only `implementation/` is untracked                   |
| `pnpm run format:check` passed during review                 | Reconfirmed now under both default and supported Node runtimes   |
| Node `v26.10.0` observed on the review machine               | Not reproduced; default here is `v22.22.3`, supported `v24.21.0` |
| Reference at `a10fbf0` is a six-crate Rust workspace         | Confirmed; clean at the exact revision                           |
| Reference Rust checks had not been run during planning       | Now executed for the read-only reference (see checks 6–8)        |

## 8. Boundaries

- This evidence covers this target repository and the read-only reference named
  above. Unrelated sibling directories were excluded.
- The reference repository was inspected and its guard commands run read-only;
  it was not modified, and no Rust change was made to repair any result.
- No product implementation, dependency change, new test harness, contract
  extraction, or S002 validator work was performed.
