# S194 implementation report — installed runtime source independence

Author: Codex. Candidate; separate final S203 acceptance remains required.
Implementation commit will be recorded after the green commit.

The new `tests/helpers/packaged-cli.ts` builds an owned authoring copy using the
repository's exact `tsc -p tsconfig.json` compiler command, packs that copy and
installs the real tarball offline into a standalone host. It then deletes the
entire owned authoring tree, including actual source, compiled output and copied
consumer fixture inputs, and deletes the installation archive. The installed
package contains no source-checkout tests, tooling or implementation directory.
The actual tarball, identity digests and verbatim command transcripts are retained
under `implementation/evidence/logs/installed-runtime` for artifact inspection.

The executable runs with filesystem/module guards that reject accesses to the
live authoring checkout, and guards that reject network calls and subprocesses.
Real source, build and fixture reads, an actual ESM import, fetch and subprocess
controls prove these guards are active. Positive CLI invocations assert that no
guard event occurs. This is qualification instrumentation; the transaction's
real filesystem operations, flushes, replacement and lock publication still run.

`tests/package/installed-runtime.test.ts` views all 22 actual bundled items and
authenticates their returned source digests without project writes. In both
default/custom layouts it runs pure initialization planning, real init, Button,
Dialog, Field and Menu installation, dependency closure/base-hash verification,
pure sync planning, stable sync/re-add and strict doctor. Consumer dependencies
are explicitly installed from their declared pins by pnpm in separate owned
projects; the CLI performs no installation. Complete-tree snapshots include
hidden entries, bytes, modes and links. Copied compiled CLI controls bind all six
command asset roots to the deleted authoring tree or remove the bundled registry;
both fail with registry exit 12 and leave the application unchanged.

Four owning cases pass with zero skips. The full package lane passes 7/7, including
the existing actual package inventory and installed core application checks.
Root build, typecheck, lint, full formatting and contract validation pass. Commands:

```sh
pnpm run build
node tools/run-unit-tests.mjs --suite package tests/package/installed-runtime.test.ts
node tools/run-unit-tests.mjs --suite package
pnpm run typecheck
pnpm run lint
pnpm run format:check
pnpm run check:contracts
```

The harness invokes actual `pnpm pack --json --pack-destination` and offline,
strict-peer/engine installs. Initial failed setup evidence is retained: pnpm's
dependency refresh refused a linked build dependency directory; the harness now
uses the explicit compiler and removes that link before packing. An offline
consumer install initially lacked a pinned adapter tarball; an explicit owned
consumer bootstrap populated the cache, then actual offline installs passed.
Node permission mode disables `fsync` even with full grants, so it cannot qualify
real transactions. The final harness uses the deleted authoring copy and causal
read/module guards without replacing or suppressing durability operations.

Raw logs are `s194-build.log`, `s194-installed-runtime-fourth.log`,
`s194-package-full.log`, `s194-{typecheck,lint,format,contracts}.log` and the retained
earlier failed runs beneath `implementation/evidence/logs`. Cargo guards are N/A:
this checkpoint changes only TypeScript tests and evidence. No product/dependency
policy, source registry, reference source or publication state changes. Original
criteria and final strict-declaration/platform/AC20 obligations remain intact.
S195 is the next original checkpoint after the verified candidate commit.
