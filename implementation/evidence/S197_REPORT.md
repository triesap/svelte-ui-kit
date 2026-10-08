# S197 implementation report — installation and safe upgrades

Author: Codex. Candidate; separate final S203 acceptance remains required.
Implementation commit: `5b28f4b1738970722b77bde79a95d9e7c02f6928`.

<!-- checkpoint-evidence
{"schemaVersion":1,"checkpoint":"S197","kind":"report","commit":"5b28f4b1738970722b77bde79a95d9e7c02f6928","disposition":"candidate"}
-->

README, CONTRIBUTING and the operations runbook now describe the actual private
local archive and built executable, explicit application dependency installation,
source ownership, portable theme overrides, customization versus breakage,
incoming archive review, whole-batch conflicts and retirement warnings. No
publication, automatic installation, merge or import rewriting is promised.

The new integration qualification executes the README's seven initial commands,
six bundled-item commands and four incoming-upgrade commands in both default and
custom layouts. It installs the retained actual tarball using the documented
`pnpm add --ignore-scripts` operation in a separate private CLI host, authenticates
archive/executable bytes, deletes the input archive and executes the installed
binary with runtime-boundary guards. The helper exposes an already-retained
archive path; production behavior and dependency pins are unchanged.

Both fixtures distinguish valid customized source from deliberately missing
source, preserve application manifests and local source/CSS overrides, adopt a
safe synthetic incoming revision, and refuse a genuine conflict with exit 10
and an identical complete application tree. Deliberate operator reconciliation
then succeeds. Retirement preserves needed dependencies and customized content,
reports `RETIRED_IMPORTS_REVIEW_REQUIRED`, and reaches a stable read-only replay.
Actual application check, production build and SSR complete in both layouts;
the rendered button contains the reviewed incoming source attribute. Synthetic
copied revisions are test inputs, not published release history.

The initial run failed during offline fixture dependency setup because the cache
lacked newly resolved Rollup 4.64.2. An explicitly installed owned throwaway
consumer populated the cache, then was removed. No repository manifest, lockfile,
CLI auto-install behavior or runtime pin changed. The failed log is preserved.
After qualification and the additional documented archive-install assertion,
the final owning run passes all four tests, with no skips, failures or TODOs:

```sh
node tools/run-unit-tests.mjs --suite integration tests/integration/docs-upgrade.test.ts tests/integration/documented-workflow.test.ts
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

Owning logs are retained beneath `implementation/evidence/logs`:
`s197-doc-workflows.log` (setup failure), `s197-explicit-bootstrap.log`,
`s197-doc-workflows-qualified.log` and `s197-doc-workflows-final.log` (4/4).
Root typecheck, lint, full formatting and contract validation all exit 0;
their logs are `s197-{typecheck,lint,format,contracts}.log`.

Consumer library checking retains its previously qualified temporary setting.
These checks do not resolve the two raw upstream TS2590 errors recorded in
[the separate strict assessment](S196_STRICT_ASSESSMENT.md); final AC20 remains
blocked. Original requirements and independent acceptance remain unchanged.
Cargo guards are N/A for documentation and TypeScript test-helper changes.
S198 recovery qualification follows the green candidate commit.
