# S196 implementation report — bounded release metadata

Author: Codex. Candidate; separate final S203 acceptance remains required.
Implementation commit will be recorded after the green commit.

The package engine now bounds Node to `>=24.21.0 <25`, matching the executed
Node 24 baseline without advertising future untested majors or earlier patches.
The product name, version, ESM/bin identity, private publication state and exact
CLI dependency pins are preserved. `NOTICE.md` records adapted source attribution
at the immutable reference revision and separates imported application libraries
from authored wrappers. It is explicitly included in the packed inventory and
the isolated authoring-copy pack inputs. Both original license files were checked
byte-for-byte against the reference; neither reference source nor license changed.

`tests/package/metadata.test.ts` inspects the actual isolated installed
tarball's executable metadata, engine acceptance/refusal, dependency roles and
byte-identical shipped licenses/notice. It verifies application runtime versus
tooling pins and the absence of a kit runtime/peer dependency. The existing
inventory test now authenticates the notice and still rejects private/unrelated
distribution files. No dependency auto-install or publication behavior changed.

The exact npm name lookup returned `ERR_PNPM_FETCH_404` on 2026-10-08. No name
conflict was observed, but availability, reservation, publisher identity and
publication authority remain separate questions. The product was not renamed.
The verbatim registry response is retained under `implementation/evidence/logs`
as `s196-name-registry.json`; other selected-version observations are retained
in `s196-ts59-registry.json` and `s196-bits-registry.json`.

Fresh, explicitly installed owned fixtures with `skipLibCheck: false` reproduce
two upstream TS2590 diagnostics on the current pair, TypeScript 5.9.3 alone,
Bits 2.19.5 alone, Svelte 5.46.4 alone, and the native producer's Svelte/TypeScript
pair. Their real installed versions and complete install/check outcomes are
retained in `implementation/evidence/logs/s196-strict-probes`. None of these failed
alternatives was adopted. These are actual failures, not accepted raw strict
passes; final AC20 remains blocked until a genuine solution is qualified.

TypeScript 5.8.3 and stricter `exactOptionalPropertyTypes: true` checking also
reproduce exactly those two upstream errors. Seven explicit owned strict probes
failed; no shared installed packages or repository dependency pins changed.
The [separate reviewer](S196_STRICT_ASSESSMENT.md) inspected all seven outcomes and the actual
upstream declarations/compiler limits, confirming the current representability
blocker. This technical assessment accepts no checkpoint or final delivery.

Owning metadata verification passes 1/1. The other four package files passed
9/9 in the preceding full run; that run correctly failed its new metadata test
because the harness combined `--help` with `--cwd`, an unsupported invocation.
The corrected test exercises real bundled `view button --source` with its
explicit working directory. This is a focused repair verification, not a claim
that the earlier ten-test run passed. Its initial missing-working-directory
compile failure and later usage failure are retained.

Full registry verification passes 63/63 with zero skips. Root build, typecheck,
lint, full formatting, contract validation, ordinary maintained fixture check
(zero errors/warnings) and production build pass. The ordinary fixture retains
its previously qualified library-check setting and does not resolve raw strict
debt. Commands:

```sh
pnpm run build
node tools/run-unit-tests.mjs --suite package
node tools/run-unit-tests.mjs --suite package tests/package/metadata.test.ts
node tools/run-unit-tests.mjs --suite registry
pnpm run fixture:check
pnpm run fixture:build
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

Retained logs beneath `implementation/evidence/logs` are `s196-build.log`,
`s196-package-full.log` (initial compile failure), `s196-package-qualified.log`
(9 passes/1 usage failure), `s196-metadata-final.log` (1/1),
`s196-registry-full.log` (63/63), `s196-fixture-{check,build}.log`, and
`s196-{typecheck,lint,format,contracts}.log` (all exit 0).

The updated compatibility evidence distinguishes current implementation results,
separate acceptance, historical results, local macOS/Chromium qualification,
Linux safety qualification, unexecuted remote CI and explicitly unsupported
Windows transactions. Cargo guards are N/A for package metadata, documentation
and TypeScript tests. Original requirements remain intact. S197 follows a green
S196 candidate commit; final strict-declaration debt cannot be self-accepted.
