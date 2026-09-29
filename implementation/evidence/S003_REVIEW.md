# S003 independent review — accepted

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S003","kind":"review","commit":"91cdaaefd756021b343465f7ba7dd3afe2f71b6d","disposition":"accepted"}
-->

Reviewer: Codex. Review date: 2026-09-29. Implementation author: Pi,
`ollama` / `deepseek-v4.1-flash:cloud`, confirmed from the session model event
and assistant response metadata. Baseline:
`9ed224f60249ee67732c05737170436e06301c38`.

Verdict: accepted and complete at
`91cdaaefd756021b343465f7ba7dd3afe2f71b6d`. No implementation blocker
remains. S004 is authorized by the governing dispatch. Codex recorded this
actual hash after the commit without amending history; the factual update
travels with S004.

## Scope and findings

Reviewed the complete manifest/lock/runtime-pin change, compatibility and step
reports, installed/lock peer metadata, S003 authority, relevant product
contracts and author session/verification logs. The manifest adds exactly the
eight approved exact development dependencies; the existing formatter,
scripts, private flag, engine, package manager and root-only workspace remain.
No application code, runtime facade, consumer scaffold or scope substitution
was introduced. Earlier Codex S002 bookkeeping is preserved.

Codex corrected evidence, without changing Pi's implementation:

- Completed the transitive peer inventory: optional esrap type peer absent;
  supplied fdir/picomatch, vitefu/Vite and svelte-toolbelt/Svelte peers.
- Described the date package as an explicit required Bits peer, not merely an
  application transitive dependency. No date component scope is authorized.
- Removed private environment command names from the public step report.
- Reconciled the actual failure history: two smoke failures, an unavailable
  timeout utility, and explicit dotfile formatting without a parser. The
  author's final return mentioned only one smoke failure. All relevant retries
  passed; failed attempts remain failed. S004 requires separate attempt logs.
- Split Rust counts into top-level and nested subprocess passes.

The pre-existing shared-temp assertion limitation remains assigned to S005;
run independent contract suites sequentially until then. README/CONTRIBUTING
still contain scaffold-era guidance; their update is expressly included in
the next CLI-boundary checkpoint.

## Independent verification

Codex used Node 24.21.0 and pnpm 11.22.0 with required environment diagnostics
and routing. All final commands below exited 0:

- Frozen strict-peer engine-strict installation in the actual target.
- The same install in a new disposable directory containing only manifest,
  lockfile, workspace and runtime pin; 68 packages installed. All four files
  remained byte-identical in both directories; no package configuration or
  dependency build-script approval was changed.
- All nine installed versions match manifest pins; supported runtime package
  entries resolve, Svelte 5.57.1 compiles a small runes component, TypeScript
  6.0.3 transpiles, and a write-free Vite 8.3.1 library build exercises the
  native build dependency. No bare-Node execution of Bits Svelte files.
- `pnpm run check:contracts`: zero errors and warnings.
- `pnpm run test:contracts`: 83 passed, zero failed/skipped, sequential.
- `pnpm run format:check` and Git whitespace checks.

The reviewer's first temporary smoke had a missing closing brace and exited 1
after both installs succeeded. Correcting that disposable probe and rerunning
the complete verification passed. This was not a dependency defect. Temporary
fixtures were removed on success and failure. These checks qualify this host's
development baseline; they do not prove all platforms, consumer behavior or
release packaging.

## Reference guard and limitations

Codex inspected Pi's fresh S003 reference executions: formatting, workspace
check and workspace tests all exited 0. The tests record 562 top-level passes
plus 16 nested subprocess passes, zero failures and four explicitly ignored
slow lanes. Codex independently verified unchanged clean reference revision
`a10fbf06334f4648f5755e05a7147414e4e5fc98`; Codex did not rerun Rust. The
ignored tests are named in the report and remain unexecuted.

No CLI/consumer typecheck, SSR/hydration, browser or package release lane exists
at this checkpoint. The new dependency baseline is green; the product is not
ready for human release testing. S004's exact decisions and verification are
recorded in the single governing RCLD document.
