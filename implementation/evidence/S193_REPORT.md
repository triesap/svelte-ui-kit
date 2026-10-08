# S193 implementation report — filesystem platform lanes

Author: Codex. Candidate; mandatory separate S193/RCLD-10 acceptance gates S194.
Implementation commit will be recorded after the green commit.

The new owning platform integration controls execute portable path/case rules,
real production replacement/mode/open-inode behavior and post-plan symlink
substitution with complete tree preservation. The existing process-platform
assertion now rejects unqualified platforms explicitly. No transaction product
policy, dependency or registry asset changes.

[PLATFORMS.md](PLATFORMS.md) records actual macOS and isolated Linux results,
filesystem/case observations, exact pinned toolchain and owning safety commands.
It distinguishes configured but unexecuted remote Linux/macOS jobs and blocked
Windows qualification. Both actual safety lanes pass 83/83 with zero skips;
Linux additionally passes frozen/strict-peer install, build and typecheck.
The archive-sidecar compilation failure and corrected transfer remain retained.

The public CI workflow adds the same eleven-file filesystem job on
ubuntu-24.04/macos-15 and corrects the browser harness argument separator.
These workflow changes are configured coverage, not remote passing evidence.
Broader platform/browser/packaged-runtime and final AC20 acceptance remain open.

Verification uses extbuild following green doctor/current guard. Final local
typecheck, lint, format, contracts and staged diff review are recorded before
the candidate commit. The exact corrected browser harness command also passes
23/23 Chromium cases, zero skips, after a successful maintained fixture build
(`logs/s193-browser-harness.log`). Cargo checks N/A: no Rust changes. Reference source and
unrelated work remain untouched. No publication, deployment or remote push.

S192's mixed-export cohort repair remains a verified candidate requiring
separate acceptance together with all twelve original S182–S193 checkpoints.
No checkpoint is self-accepted by this report; S194 remains dependency-gated.
