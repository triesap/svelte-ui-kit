# Dependency compatibility evidence — S003

Implementation evidence for the S003 checkpoint ("Select a reproducible Node and
dependency baseline"). This file is implementation evidence, not a governing
contract. `implementation/COMMIT_SEQUENCE.md` remains the execution/status
authority, and the adopted `specs/` documents govern product intent.

- Checkpoint: S003 (RCLD-01), contract anchors R01, R10, R12, R20, R32, R33, R34.
- Author/provider: Pi, provider `ollama`, model `deepseek-v4.1-flash:cloud`.
- Status and accepted commit: see the governing ledger and `S003_REVIEW.md`.
- Repository root: this package root (`.`); branch `master`.
- Starting commit: `9ed224f60249ee67732c05737170436e06301c38` (S002 complete).
- Metadata inspection date: 2026-09-29.

## 1. Scope and development-versus-consumer separation

S003 pins a reproducible **development** baseline for this private CLI package.
The selected npm packages are development tooling for the compiler, typed build
boundary and the scheduled SvelteKit consumer fixture. S003 does not create a
consumer-facing runtime/peer facade, a consumer scaffold, or application
auto-install; those belong to later checkpoints (R10, S007–S012, S090).

Role split for the selected packages:

| Package                        | S003 role                                                               | Future consumer role                                                    |
| ------------------------------ | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `svelte`                       | dev compiler/runtime baseline for generated-source checks               | real application runtime dependency                                     |
| `@sveltejs/kit`                | dev baseline for the scheduled consumer fixture harness                 | application framework dependency of the generated app                   |
| `bits-ui`                      | dev primitive baseline; typed primitive boundary is proven later (S011) | real application runtime dependency emitted by installed items          |
| `@internationalized/date`      | required Bits peer satisfier only                                       | explicit required peer when Bits is used; emitted plans qualified later |
| `typescript`                   | dev compiler for the typed CLI/build boundary (S004 onward)             | application tooling dependency (not this package's runtime)             |
| `vite`                         | dev build baseline for the consumer fixture                             | application build tool dependency                                       |
| `@sveltejs/vite-plugin-svelte` | dev Svelte plugin for the consumer fixture                              | application build tool dependency                                       |
| `@types/node`                  | dev Node 24 ambient types; satisfies Vite's optional types peer         | not a consumer-facing requirement of this package                       |
| `prettier`                     | preserved dev formatter                                                 | none                                                                    |

`package.json` remains `private: true`, ESM (`type: module`), license
`(MIT OR Apache-2.0)`, product/package name `svelte-ui-kit`, with the existing
four scripts, `packageManager` `pnpm@11.22.0` and engine `>=24` unchanged. The
workspace file still lists only the root package. No package is added to a
runtime `dependencies` or `peerDependencies` block.

## 2. Node runtime pin

`.node-version` records `24.21.0`. The `package.json` engine stays the broader
supported range `>=24`; the exact pin is a reproducible development selection,
not a narrowed package contract.

Public source (retrieved 2026-09-29):

- `https://nodejs.org/dist/index.json` — entry `v24.21.0`: release date
  `2026-09-07`, `lts: "Krypton"`, bundled `npm 11.19.0`, `v8 13.6.233.17`,
  `openssl 3.5.8`, `modules 137`.
- `https://nodejs.org/en/blog/release/v24.21.0` — release announcement titled
  `Node.js 24.21.0 (LTS)` dated 2026-09-08.

Observed locally with the selected runtime: `node --version` → `v24.21.0`.

## 3. Exact approved selections

Eight newly selected npm packages were added as exact `devDependencies`
(no ranges). `prettier` is preserved.

| Package                        | Exact version | Declared engines               | Declared peer dependencies (from exact-version metadata)                                                                                                                                                                                                                              |
| ------------------------------ | ------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `svelte`                       | `5.57.1`      | `>=18`                         | none                                                                                                                                                                                                                                                                                  |
| `@sveltejs/kit`                | `2.70.3`      | `>=18.13`                      | `vite ^5.0.3 \|\| ^6.0.0 \|\| ^7.0.0-beta.0 \|\| ^8.0.0`, `svelte ^4.0.0 \|\| ^5.0.0-next.0`, `@sveltejs/vite-plugin-svelte ^3.0.0 \|\| ^4.0.0-next.1 \|\| ^5.0.0 \|\| ^6.0.0-next.0 \|\| ^7.0.0`, `typescript ^5.3.3 \|\| ^6.0.0` (optional), `@opentelemetry/api ^1.0.0` (optional) |
| `bits-ui`                      | `2.19.3`      | `>=20`                         | `svelte ^5.33.0`, `@internationalized/date ^3.8.1` (non-optional)                                                                                                                                                                                                                     |
| `typescript`                   | `6.0.3`       | `>=14.17`                      | none                                                                                                                                                                                                                                                                                  |
| `vite`                         | `8.3.1`       | `^20.19.0 \|\| >=22.12.0`      | `tsx ^4.8.1`, `jiti >=1.21.0`, `less ^4.0.0`, `sass ^1.70.0`, `yaml ^2.4.2`, `stylus >=0.54.8`, `terser ^5.16.0`, `esbuild ^0.27.0 \|\| ^0.28.0`, `sugarss ^5.0.0`, `@types/node ^20.19.0 \|\| >=22.12.0`, `sass-embedded ^1.70.0`, `@vitejs/devtools ^0.7.1` (all optional)          |
| `@sveltejs/vite-plugin-svelte` | `7.3.1`       | `^20.19 \|\| ^22.12 \|\| >=24` | `vite ^8.0.0-beta.7 \|\| ^8.0.0`, `svelte ^5.46.4` (non-optional)                                                                                                                                                                                                                     |
| `@internationalized/date`      | `3.12.4`      | none                           | none                                                                                                                                                                                                                                                                                  |
| `@types/node`                  | `24.19.0`     | none                           | none (empty map)                                                                                                                                                                                                                                                                      |
| `prettier`                     | `3.9.6`       | `>=14`                         | none                                                                                                                                                                                                                                                                                  |

`@internationalized/date` is present only to satisfy Bits UI's required peer
range `^3.8.1`. Its presence does **not** authorize date-related components;
those remain deferred under the approved extension gate (R31,
`specs/COMPONENT_CATALOG.md`).

### Literal inspection commands

Exact-version metadata (one call per package; public registry, no
authentication):

```sh
curl -sS https://registry.npmjs.org/svelte/5.57.1
curl -sS https://registry.npmjs.org/@sveltejs%2Fkit/2.70.3
curl -sS https://registry.npmjs.org/bits-ui/2.19.3
curl -sS https://registry.npmjs.org/typescript/6.0.3
curl -sS https://registry.npmjs.org/vite/8.3.1
curl -sS https://registry.npmjs.org/@sveltejs%2Fvite-plugin-svelte/7.3.1
curl -sS https://registry.npmjs.org/@internationalized%2Fdate/3.12.4
curl -sS https://registry.npmjs.org/@types%2Fnode/24.19.0
```

Relevant fields were read with `jq '{name,version,engines,peerDependencies,peerDependenciesMeta,dependencies,optionalDependencies}'`.
Publish timestamps were read from each package's full packument `time` map at
`https://registry.npmjs.org/<name>` (for example
`jq -r '.time["5.57.1"]'`). All eight exact-version documents returned HTTP 200
on 2026-09-29. Recorded `time` values:

| Package                        | Version   | Published (UTC)        |
| ------------------------------ | --------- | ---------------------- |
| `svelte`                       | `5.57.1`  | `2026-09-18T23:52:47Z` |
| `@sveltejs/kit`                | `2.70.3`  | `2026-08-18T15:02:00Z` |
| `bits-ui`                      | `2.19.3`  | `2026-09-22T21:47:32Z` |
| `typescript`                   | `6.0.3`   | `2026-04-16T23:38:27Z` |
| `vite`                         | `8.3.1`   | `2026-09-24T12:26:19Z` |
| `@sveltejs/vite-plugin-svelte` | `7.3.1`   | `2026-09-23T10:38:42Z` |
| `@internationalized/date`      | `3.12.4`  | `2026-09-01T14:27:23Z` |
| `@types/node`                  | `24.19.0` | `2026-09-25T22:09:25Z` |

These are exact-version documents; moving `latest` tags are discovery inputs and
are not used as pins. The historical Bits UI source observation recorded at
`specs/API_CONTRACTS.md` (Svelte `^5.33.0`, date `^3.8.1`, Node `>=20`) matches
the inspected `2.19.3` distribution metadata, but the distribution metadata —
not the earlier source observation — is the compatibility basis.

## 4. Peer and engine findings

### Direct constraints satisfied by the selections

- Kit's non-optional peers: `vite` → `8.3.1` (in `^8.0.0`), `svelte` → `5.57.1`
  (in `^5.0.0-next.0`), `@sveltejs/vite-plugin-svelte` → `7.3.1` (in `^7.0.0`).
- Kit's optional peers: `typescript` → `6.0.3` supplied (in `^6.0.0`);
  `@opentelemetry/api` not installed (optional, unused).
- Bits's non-optional peers: `svelte` → `5.57.1` (in `^5.33.0`),
  `@internationalized/date` → `3.12.4` (in `^3.8.1`).
- Plugin's non-optional peers: `vite` → `8.3.1` (in `^8.0.0`),
  `svelte` → `5.57.1` (in `^5.46.4`).
- Vite's optional `@types/node ^20.19.0 || >=22.12.0` peer → `24.19.0` supplied.
- Engine checks against Node `24.21.0`: Kit `>=18.13` ok; Bits `>=20` ok; Vite
  `^20.19.0 || >=22.12.0` ok; plugin `^20.19 || ^22.12 || >=24` ok; Svelte
  `>=18` ok; TypeScript `>=14.17` ok; Prettier `>=14` ok.

### Transitive peer resolutions in the lockfile

- `runed@0.35.1` (Bits dependency): peers `svelte ^5.7.0` (resolved `5.57.1`)
  and optional `@sveltejs/kit ^2.21.0` (resolved `2.70.3`, present in the tree).
- `svelte-toolbelt@0.10.6` and `bits-ui@2.19.3`: propagate the optional
  `@sveltejs/kit` peer (`transitivePeerDependencies: - '@sveltejs/kit'`).
- `@sveltejs/acorn-typescript@1.0.13`: peer `acorn ^8.9.0` (resolved `8.18.0`).
- `svelte-toolbelt@0.10.6`: direct peer `svelte ^5.30.2` resolves `5.57.1`.
- `fdir@6.5.0`: optional peer `picomatch ^3 || ^4` resolves `4.0.7`.
- `vitefu@1.1.3`: optional Vite peer accepts majors 3–8 and resolves `8.3.1`.

### Optional peers not installed, and why

- `@opentelemetry/api` (Kit, optional): no tracing/instrumentation is selected
  or needed for a private CLI package.
- `esrap@2.4.0` has optional peer `@typescript-eslint/types ^8.2.0`, absent
  from this lock. The Svelte compiler smoke passes without this optional type
  package; no lint integration is claimed at this checkpoint.
- Vite optional peers `tsx`, `jiti`, `less`, `sass`, `yaml`, `stylus`, `terser`,
  `esbuild`, `sugarss`, `sass-embedded`, `@vitejs/devtools`: none is required by
  a pure-CSS, rolldown-based Vite 8 development baseline. No CSS preprocessor is
  introduced, matching the product's "pure authored CSS" contract.
- Vite's optional peer `@types/node` **is** supplied (`24.19.0`), so it is not
  counted as unused.

### Automatic peer installation

The lockfile retains the existing `autoInstallPeers: true` convention; it was
not changed and no package-management configuration was added. Inspection shows
the importer declares exactly the nine `devDependencies` above and has no
importer-level `dependencies` block, i.e. no peer was silently promoted into the
package's own declarations. The only platform `optionalDependencies` resolved
are the expected binaries: `fsevents@2.3.3` (macOS, via Vite) and the
cross-platform `rolldown`/`lightningcss` binding packages recorded for lockfile
reproducibility.

## 5. Install procedure, determinism and results

Two separate installations were recorded, both under Node
`24.21.0` with `pnpm 11.22.0` and engine checking enabled (`--engine-strict`),
routed through the repository's required execution wrapper:

```sh
# 1. Initial lock-generating installation
pnpm install --engine-strict --strict-peer-dependencies

# 2. Separate frozen, strict installation
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
```

| Step                       | Exit | Result                                                                                |
| -------------------------- | ---- | ------------------------------------------------------------------------------------- |
| Initial lock-generating    | `0`  | Added the eight devDependencies; resolved 92 packages, installed 67; no peer warnings |
| Frozen `--frozen-lockfile` | `0`  | `Already up to date`; no lock or manifest rewrite                                     |

Observed tool versions: `node --version` → `v24.21.0`; `pnpm --version` →
`11.22.0`.

Byte-level determinism (SHA-256):

| File                  | Before baseline                                                    | After initial install                                              | After frozen install                                               |
| --------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `package.json`        | `5cc02dbe7d56510374903e480d25a9f1435f6c6886fdd0b5fccfdc23ea9dabfa` | `3d313d4f639b03164efac186ef7968db5c6e0155f13c18c5e1b6016c8f16e0ab` | `3d313d4f639b03164efac186ef7968db5c6e0155f13c18c5e1b6016c8f16e0ab` |
| `pnpm-lock.yaml`      | `c5a3a699074fc8fca51af9bdc2d373ac7d6e1d728b149de3341ad7b95bea665f` | `81b9ba06e6fc68932d6cdc83fb33c175f139828c62d36b9cf9bedeaab54a3dff` | `81b9ba06e6fc68932d6cdc83fb33c175f139828c62d36b9cf9bedeaab54a3dff` |
| `pnpm-workspace.yaml` | `226909e7726c235c6b854540949bc8144625420ccdd6298fca1f7885d8bfe524` | unchanged                                                          | unchanged                                                          |

The frozen installation left `package.json` and `pnpm-lock.yaml` byte-identical
to their post-initial-install state. Codex additionally repeated the frozen,
strict-peer, engine-strict installation in a disposable directory with no
existing modules, copying only the manifest, lock, workspace and runtime pin.
It installed 68 packages successfully and preserved all four input hashes.
This proves clean installation on the reviewed host, not all-platform support.
The lockfile keeps `lockfileVersion: '9.0'` and the existing settings
(`autoInstallPeers: true`, `excludeLinksFromLockfile: false`). No dependency
build script or new script approval was needed; no build script was enabled.

## 6. Package-entry and compiler smoke checks

A temporary probe (not a product file, removed after running) verified that the
selected packages resolve through their declared `exports` and that the
compiler/runtime versions match the pins. It deliberately did **not** execute
`bits-ui` or any `.svelte` module in bare Node, because bare-Node execution of
`.svelte` modules is not a supported test; only its package entry was resolved.

Observed (Node `v24.21.0`):

- `import.meta.resolve` succeeded for `prettier`, `svelte`, `svelte/compiler`,
  `@sveltejs/kit`, `@sveltejs/vite-plugin-svelte`, `bits-ui`, `typescript`,
  `vite` and `@internationalized/date`.
- `svelte/compiler` reports `VERSION=5.57.1` and compiled a minimal
  `$state` component (`generate: 'client'`).
- `typescript` reports `version=6.0.3` and `transpileModule` produced the
  expected ES module output.
- `vite` reports `version=8.3.1`.
- `@internationalized/date` is importable and evaluates `today()`.
- `prettier` reports `version=3.9.6`.
- Installed manifests confirm `@sveltejs/kit@2.70.3`, plugin `7.3.1`,
  `bits-ui@2.19.3` and `@types/node@24.19.0`.

This proves package resolution, compiler versions and basic compiler execution.
It does **not** prove SvelteKit build/SSR/hydration, component rendering, or any
generated-consumer behavior; those remain later gates.

## 7. Not proven at S003

- No consumer scaffold, runtime facade, auto-install or generated application
  exists; no consumer `svelte-check`/build/SSR/browser lane is claimed.
- No lint or typecheck lane is claimed; those scripts do not exist yet.
- No date/select/combobox/popover components are authorized or implemented.
- No package/tarball acceptance or publication is claimed.
- Prettier's default directory expansion skips dotfiles, so `.node-version` is
  not covered by `pnpm run format:check` (consistent with the existing
  `.editorconfig`/`.prettierrc.json` behavior).
- The target has no Cargo manifest; target Rust checks remain N/A. The
  conditional reference guard is recorded in `implementation/evidence/S003_REPORT.md`.

## S004 addendum — typed CLI build boundary

S004 adds the typed executable boundary on top of the unchanged S003 baseline.
No dependency version, lockfile, engine, package-manager or workspace change
was made.

- `tsconfig.json` compiles `src/**/*.ts` with the pinned `typescript@6.0.3`
  using ES2023 `target`/`lib`, NodeNext `module`/`moduleResolution`,
  `types: ["node"]`, `strict: true`, `noEmitOnError: true`, `rootDir: src` and
  `outDir: dist`, with no `skipLibCheck` or suppressions.
- `package.json` gains the development version `0.1.0`, the `svelte-ui-kit` →
  `./dist/cli/main.js` bin mapping and real `build`, `typecheck` and
  `test:cli-bootstrap` scripts. The private/ESM/license flags, engine,
  `packageManager`, root-only workspace and all S003 dependencies and existing
  scripts are preserved.
- The built entrypoint reads and validates `name`/`version` from this package's
  `package.json` relative to the built module (`import.meta.url`), so its output
  is independent of cwd, Git and invoking-application metadata. The name must be
  the exact product identity `svelte-ui-kit`, and the version must match the
  full SemVer 2.0.0 grammar (prerelease and build metadata included), validated
  inline with no added dependency. Only the product/package version `0.1.0` is
  new; every S003 dependency version remains unchanged.

Observed with Node `24.21.0` and pnpm `11.22.0`: `pnpm run
format:check` and `pnpm run typecheck` exit 0; a temporary negative type fixture
produced `TS2322` and exit 2; `pnpm run build` emits only `dist/cli/main.js` with
the shebang preserved; the strengthened `pnpm run test:cli-bootstrap` passes
41/41 (help/version, rejected argument lists, metadata-precedes-arguments,
exact-name/SemVer metadata matrix, deterministic content snapshots and
disposable-copy mutation probes). `dist/`
remains gitignored and uncommitted.

This is a build-boundary change only. Consumer rendering, SSR/hydration,
browser, lint and package/tarball acceptance lanes are still not present and are
not claimed green.

## S007 addendum — SSR consumer fixture baseline

S007 adds the maintained consumer qualification fixture on top of the unchanged
S006 authoring baseline. It does not change any S003–S006 root dependency pin,
the root package identity, the engine range, `packageManager` or the CLI
source. Two new exact dependency selections (`@sveltejs/adapter-node 5.5.7`,
`svelte-check 4.7.6`) are introduced **inside the fixture package**, not in the
root `svelte-ui-kit` manifest.

### Fixture identity and workspace membership

- Package: `svelte-ui-kit-consumer-fixture`, private, ESM (`"type": "module"`),
  version `0.0.0`, path `tests/fixtures/consumer/`.
- `pnpm-workspace.yaml` now lists exactly two explicit members: `"."` and
  `"tests/fixtures/consumer"`. There is no wildcard membership, no nested
  lockfile and no nested `pnpm-workspace.yaml`; the single root `pnpm-lock.yaml`
  remains authoritative.
- The root `svelte-ui-kit` package stays `private: true` with its existing
  sixteen exact development pins and no runtime `dependencies` block. The
  fixture is the only workspace member with a runtime dependency (`svelte`).
- Fixture `dependencies`: `svelte 5.57.1` only.
- Fixture `devDependencies` (seven exact pins): `@sveltejs/kit 2.70.3`,
  `@sveltejs/vite-plugin-svelte 7.3.1`, `vite 8.3.1`, `typescript 6.0.3`,
  `@types/node 24.19.0`, `@sveltejs/adapter-node 5.5.7`, `svelte-check 4.7.6`.
- No Bits UI or `@internationalized/date` consumer dependency is added; Bits
  compatibility remains S011 scope. No automatic install hook was added to any
  check/build/test script.

### New package selections — installed manifest facts

Inspected from the installed fixture manifests on 2026-09-29 (Node `24.21.0`,
pnpm `11.22.0`):

| Package                  | Pin     | Engines (installed document) | Declared peers (installed document)                                 |
| ------------------------ | ------- | ---------------------------- | ------------------------------------------------------------------- |
| `@sveltejs/adapter-node` | `5.5.7` | none declared                | `@sveltejs/kit ^2.4.0`                                              |
| `svelte-check`           | `4.7.6` | `>= 18.0.0`                  | `svelte ^4.0.0 \|\| ^5.0.0-next.0`, `typescript ^5.0.0 \|\| ^6.0.0` |

Compatibility against the existing pins:

- adapter-node requires `@sveltejs/kit ^2.4.0`; the fixture (and root) pin
  `@sveltejs/kit 2.70.3` satisfies it.
- svelte-check requires Svelte `^4.0.0 || ^5.0.0-next.0`; the pinned
  `svelte 5.57.1` satisfies it, and TypeScript `^5.0.0 || ^6.0.0`; the pinned
  `typescript 6.0.3` satisfies it. Its `>= 18.0.0` engine admits Node 24.21.0.
- Kit's non-optional peers (`vite ^8.0.0`, `svelte ^5.0.0-next.0`,
  `@sveltejs/vite-plugin-svelte ^7.0.0`) are all satisfied by the fixture pins;
  its optional `typescript` and `@opentelemetry/api` peers are supplied/omitted
  exactly as at S003.

The two installs below (exit 0) qualify the selection; no substitution or
downgrade was required.

### Install results

| Step                    | Command                                                                     | Exit | Result                                        |
| ----------------------- | --------------------------------------------------------------------------- | ---- | --------------------------------------------- |
| Lock-generating install | `pnpm install --engine-strict --strict-peer-dependencies`                   | 0    | Added the fixture importer; 26 packages added |
| Frozen strict install   | `pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict` | 0    | `Already up to date`; 2 workspace projects    |

### Fixture check/build/SSR and controls

| Step                          | Command                               | Observed                                                        | Result                                                                     |
| ----------------------------- | ------------------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Fixture check (maintained)    | `pnpm run fixture:check`              | exit 0                                                          | 0 errors, 0 warnings                                                       |
| Fixture build (maintained)    | `pnpm run fixture:build`              | exit 0                                                          | Vite 8.3.1 + adapter-node production build                                 |
| Fixture SSR + lifecycle suite | `pnpm run test:fixture`               | exit 0                                                          | build + 16 tests, 16 pass, 0 fail                                          |
| Negative: Svelte/TS mismatch  | disposable copy `fixture:check`       | exit 1 then restored exit 0                                     | real assignability diagnostic; restored input passes                       |
| Negative: SSR disabled        | disposable copy build + SSR assertion | build exit 0; only the specific missing-markup assertion throws | copy builds, HTTP 200/HTML transport passes, visible server value absent   |
| Negative: HTTP 500            | fault server + transport assertion    | `assertHtmlTransport` throws                                    | HTTP 500 is rejected, not accepted as missing markup                       |
| Negative: wrong content type  | fault server + transport assertion    | `assertHtmlTransport` throws                                    | `text/plain` is rejected, not accepted as missing markup                   |
| Lifecycle faults              | `tests/smoke/owned-server.test.mjs`   | observed failures detected                                      | startup failure, stderr, post-ready exit 17, stalled headers/body, cleanup |

### Not proven at S007

- No generated-wrapper, tarball/package acceptance or installed-tarball
  consumer run is claimed.
- No browser/hydration interaction assertion, accessibility audit or reduced
  motion/RTL qualification is claimed; S008 owns the browser harness.
- No Bits UI component rendering, binding, or SSR/hydration compatibility is
  claimed; S011 owns that integration.
- The fixture is a hand-authored baseline, not evidence that the future
  generator produces it.
- Only macOS on Node 24.21.0 was exercised; no cross-platform claim is made.

### Conditional reference guard

The owner-authorized batch explicitly reuses the audited S007 reference guard
through S011 while the reference identity, Rust scope and evidence remain
unchanged. The reference worktree was verified clean at
`a10fbf06334f4648f5755e05a7147414e4e5fc98`; the audited guard recorded
`cargo fmt --all -- --check`, `cargo check --workspace --all-targets` and
`cargo test --workspace --all-targets` at exit 0 with 562 top-level plus 16
nested passes, zero failures and four ignored tests. No fresh Rust run or
reference mutation is claimed at S007; a fresh guard runs at the S012
milestone. Exact results and captured exits are recorded in
`implementation/evidence/S007_REPORT.md`.

## S008 addendum — production browser harness

S008 adds the production browser qualification lane for the maintained
consumer fixture. It changes no S003–S007 root dependency pin and no CLI
source. One new exact root development pin is added: `@playwright/test 1.63.0`.

### New package selection — installed manifest facts

Inspected from the installed root manifest on 2026-09-29 (Node `24.21.0`,
pnpm `11.22.0`):

| Package            | Pin      | Engines (installed document) | Dependency (installed document) |
| ------------------ | -------- | ---------------------------- | ------------------------------- |
| `@playwright/test` | `1.63.0` | `>=20`                       | `playwright 1.63.0`             |

`@playwright/test 1.63.0` is installed at the root with the other exact pins;
the lockfile change is limited to its importer entries. The frozen strict
install (`--frozen-lockfile --strict-peer-dependencies --engine-strict`) exits 0.

### Browser setup and lane

- Bundled headless Chromium was installed explicitly for the pinned version
  with `pnpm exec playwright install chromium` (exit 0). No test performs an
  automatic browser install, and no browser channel substitution or host
  configuration is used.
- `playwright.config.ts` runs Playwright's real runner with `testDir`
  `tests/browser`, one worker, `retries: 0`, failure traces/screenshots in the
  ignored `tests/browser/.output/` directory, and a single `chromium` project
  using bundled Chromium (`devices["Desktop Chrome"]`).
- `pnpm run test:browser` builds the maintained production fixture first, then
  runs `tests/browser/harness.spec.ts`.
- The spec starts the built Node-adapter production handler through the shared
  owned-server boundary (`tests/smoke/owned-server.mjs`) on an OS-assigned
  loopback port and stops it on teardown.

### Fixture-only hydration interaction

`tests/fixtures/consumer/src/routes/+page.svelte` adds a fixture-only
`$state` counter with an `onclick` handler, a `data-testid="click-count"`
output and a `data-hydrated` client-mount marker set in `onMount`. The marker
lets the harness wait deterministically for hydration (no fixed sleep) before
interacting; the counter proves client state updates the DOM after hydration.
SSR still renders `Clicks: 0` and `data-hydrated="false"`.

### Harness results

| Step                | Command                                                  | Exit | Result                        |
| ------------------- | -------------------------------------------------------- | ---- | ----------------------------- |
| Browser install     | `pnpm exec playwright install chromium`                  | 0    | pinned browser available      |
| Scoped browser lane | `pnpm run test:browser -- tests/browser/harness.spec.ts` | 0    | `6 passed` (bundled Chromium) |

The six tests cover: accessible heading and labelled controls; Tab and
Shift+Tab focus order; native checkbox Space activation; form submission
navigation with a request-time query update; hydration plus client state
update; and the gate control that detects injected page exceptions, console
errors and hydration warnings.

### Not proven at S008

- Only bundled Chromium on macOS with Node 24.21.0 was exercised; no
  Firefox/WebKit/Windows qualification, no other Chromium channel and no
  remote CI execution is claimed.
- No Bits UI rendering/binding/hydration compatibility is claimed; S011 owns
  that integration.
- No package/tarball acceptance or release-readiness claim is made.
- The production build strips Svelte's dev-only hydration diagnostics; the
  hydration-warning branch of the gate is proven by a control rather than by a
  naturally mismatching page.

### Conditional reference guard

S008 reuses the audited S007 reference guard under the owner-authorized batch
(clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98`, fmt/check/test exit 0,
562 top-level plus 16 nested passes, four ignored). No fresh Rust run or
reference mutation is claimed at S008; a fresh guard runs at S012.

## S009 addendum — isolated typed integration helpers

S009 adds no dependency. It generalizes the dependency-free typed runner
(`tools/run-unit-tests.mjs`) to a `--suite <name>` selector and adds the typed
integration helpers and their suite. No product/runtime code, schema, registry
or generated output changes.

### Suite selector and isolated output

- `--suite unit` (the default) keeps the existing S005 unit entrypoint,
  discovery, fail-closed selection, compile-before-run, per-file summary and
  TODO-cancellation protections.
- `--suite integration` discovers `tests/integration/**/*.test.ts`, compiles
  them and their `tests/helpers/` imports through the new tracked
  `tsconfig.integration.json`, and executes the emitted files with Node's
  `node:test` runner.
- Each suite compiles into `.unit-test-build/<suite>/` and removes only its own
  output directory before compiling. A symlinked or non-directory
  `.unit-test-build` ancestor or suite output root is refused; the ancestor
  guard preserves the S005 message.
- `components` is a reserved suite name; its configuration/root are
  established by S011.
- `pnpm run typecheck` now also checks `tsconfig.integration.json`.

### Typed helpers (`tests/helpers/`)

- `project.ts`: `createTempProject` allocates an owned root under the OS
  temporary directory and exposes `writeFile`/`writeDir`/`symlink`/`cleanup`.
  `resolveWithin` rejects absolute, empty and parent-directory paths.
- `tree-snapshot.ts`: `snapshotTree` uses `lstat`/`readlink` only, recording
  path, kind, permission bits, byte size, SHA-256 and link target for hidden
  entries, directories and links without following them.
- `cli.ts`: `resolveCliEntrypoint` reads the package `bin` from the manifest;
  `runCli` spawns the real built executable with a bounded timeout and captures
  `status`, `signal`, `stdout`, `stderr` and timeout state verbatim.

### Integration harness results

| Step                        | Command                                                          | Exit | Result                               |
| --------------------------- | ---------------------------------------------------------------- | ---- | ------------------------------------ |
| Product build + integration | `pnpm run test:integration -- tests/integration/harness.test.ts` | 0    | 1 file; 9 tests, 9 pass              |
| Default integration suite   | `pnpm run test:integration`                                      | 0    | 1 file; 9 tests, 9 pass              |
| Unit suite                  | `pnpm run test:unit`                                             | 0    | 2 files; 14 tests, 14 pass           |
| Runner harness              | `pnpm run test:harness`                                          | 0    | 35 tests, 35 pass                    |
| Both compiler typechecks    | `pnpm run typecheck`                                             | 0    | includes `tsconfig.integration.json` |

The harness grew from 29 to 35 cases with new coverage for explicit
integration selection (both `--suite` forms), suite-scoped output isolation,
cross-suite operand rejection, unknown/missing suite names, integration compile
diagnostics and suite-specific empty discovery. The original 29 cases are
preserved with their assertions updated only for the new suite output path.

### Not proven at S009

- No production filesystem/transaction implementation, injected product
  boundary or registry asset behavior is introduced; S009 is test tooling.
- No cross-platform claim beyond the exercised macOS/Node 24.21.0 lane.
- No package/tarball acceptance or release-readiness claim is made.

### Conditional reference guard

S009 reuses the audited S007 reference guard under the owner-authorized batch
(clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98`). No fresh Rust run or
reference mutation is claimed; a fresh guard runs at S012.

## S011 addendum — pinned Bits state/ref/child qualification

S011 adds the pinned Bits UI integration qualification. Two runtime pins are
added to the maintained consumer fixture; no root package pin changes and no
public kit wrapper is created.

### Approved fixture pins

| Package                   | Pin      | Role                                             |
| ------------------------- | -------- | ------------------------------------------------ |
| `bits-ui`                 | `2.19.3` | fixture runtime dependency                       |
| `@internationalized/date` | `3.12.4` | fixture runtime dependency                       |
| `csstype`                 | `3.1.3`  | fixture dev dependency (see upstream constraint) |

Installed `bits-ui/package.json` declares Svelte `^5.33.0` and
`@internationalized/date` `^3.8.1`; the pinned `svelte 5.57.1` and
`@internationalized/date 3.12.4` satisfy both.

### Upgrade-relative evidence (package-relative paths)

- `bits-ui/dist/bits/switch/components/switch.svelte.d.ts` declares
  `Component<SwitchRootProps, {}, "ref" | "checked">` — `checked` and `ref` are
  bindable.
- `bits-ui/dist/bits/switch/types.d.ts` defines `SwitchRootProps` via
  `WithChild<{...}, SwitchRootSnippetProps>`; the `child` snippet receives
  `{ checked: boolean; props: Record<string, unknown> }`
  (`bits-ui/dist/internal/types.d.ts`).
- `bits-ui/dist/bits/switch/components/switch-thumb.svelte.d.ts` binds `ref`.
- The SSR/HTML output renders the delegated `<button role="switch">` with merged
  props and a sibling hidden `<input type="checkbox" name="...">` outside the
  child branch; no nested button is produced.

### Upstream constraints found

1. **Undeclared type dependency.** `bits-ui/dist/shared/index.d.ts` and
   `svelte-toolbelt/dist/types.d.ts` (pulled in by `bits-ui`) import
   `csstype`, but both declare it only under `devDependencies`. A strict pnpm
   consumer cannot resolve it. The fixture adds the exact direct pin
   `csstype 3.1.3` as a dev dependency to satisfy the published declarations.
2. **TypeScript union-complexity limit (qualified upstream exception).** With
   TypeScript `6.0.3`, `svelte-check` with `skipLibCheck: false` exits 1 with
   exactly two errors and zero warnings: `Expression produces a union type that
is too complex to represent` in the pinned `bits-ui 2.19.3` barrel
   declarations `dist/bits/button/components/button.svelte.d.ts:2:23` and
   `dist/bits/calendar/components/calendar.svelte.d.ts:2:25`. The fixture keeps
   `skipLibCheck: true` for its ordinary `fixture:check` and is paired with a
   mandatory strict declaration audit in `pnpm run test:components`. The audit
   runs the real checker with `skipLibCheck: false` in an owned copy and
   qualifies exactly those two pinned diagnostics by package/version,
   package-relative path, location, diagnostic identity and count. It rejects
   any additional or missing diagnostic, a warning, unknown output, a changed
   pin, a timeout or a tool failure. Controls in
   `tests/components/strict-declaration.test.ts` prove authored `.svelte`, `.ts`
   and `.d.ts` errors and an additional disposable dependency error fail the
   audit, and that removing them restores the known baseline.

This is a bootstrap compatibility exception, not a raw strict-check pass. It
does not reduce authored `strict: true` checking and no dependency pin changed.
Resolving the exception remains an open release AC20 obligation until a
reviewed minimal compatibility repair removes it.

### Fixture component and qualification results

| Step          | Command                                                  | Exit  | Result                                                                                                  |
| ------------- | -------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------- |
| Fixture check | `pnpm run fixture:check`                                 | 0     | 0 errors, 0 warnings                                                                                    |
| Components    | `pnpm run test:components`                               | 0     | 2 files; 7 tests, 7 pass (compatibility positive + 4 negatives; strict audit baseline + fault controls) |
| Consumer SSR  | `pnpm run test:fixture`                                  | 0     | 23 tests, 23 pass (includes the `/compatibility` route)                                                 |
| Browser       | `pnpm run test:browser -- tests/browser/harness.spec.ts` | 0     | 11 passed, including the nested failing-run control                                                     |
| Strict audit  | `pnpm run test:components` (strict-declaration case)     | 1 raw | 2 errors, 0 warnings; qualified upstream exception                                                      |

The compatibility component is `tests/fixtures/consumer/src/lib/compatibility/SwitchFixture.svelte`,
served at the fixture `/compatibility` route. It binds `checked`/`ref`, uses a
real `child` snippet that spreads the merged props onto a delegated native
`<button>` (no nested button, events/props/ref retained), and renders the
actual pinned `Switch.Thumb` as its state-marked child span. It exposes a
fixture-only programmatic toggle and focus control. The browser lane proves
pointer and keyboard Space activation, programmatic state flowing back into the
primitive, real ref identity/focus, accessible switch semantics and child
forwarding, and hydration; the SSR lane proves the switch and thumb are
server-rendered. The components lane proves incompatible `checked`, `ref`,
`child` and `Switch.Thumb` examples fail `svelte-check` with their intended
diagnostics in disposable copies and restore to green. No `any` cast is used.

### Not proven at S011

- No public kit wrapper, registry item, generator output or tarball acceptance
  is produced or claimed; S011 qualifies the upstream boundary only.
- Only bundled Chromium on macOS/Node 24.21.0 was exercised.
- No Firefox/WebKit/Windows or remote-CI claim is made.

### Conditional reference guard

S011 reuses the audited S007 reference guard under the owner-authorized batch
(clean at `a10fbf06334f4648f5755e05a7147414e4e5fc98`). No fresh Rust run or
reference mutation is claimed; the fresh guard runs at S012.

## S012 addendum — minimal production boundaries and RCLD-01 closure

S012 adds no dependency and no schema/registry/command implementation. It
separates the bootstrap CLI into pure modules behind the Node adapter and adds
minimal readonly interfaces for later responsibilities.

### Boundaries

- `src/cli/args.ts` — pure `parseCliArgs(argv): CliRequest` classification.
- `src/cli/run.ts` — pure `HELP_TEXT`, `formatUsageDiagnostic`, `applyRequest`
  and `runCli(argv, metadata, io)` result handling with injected effects.
- `src/cli/main.ts` — the Node adapter: package-relative metadata read/validation
  and the real stdout/stderr/exit effects. The exact help text, usage diagnostic,
  version line and exit codes are unchanged, and the S004 smoke mutation anchors
  (`import { readFileSync } from "node:fs";` and the metadata-derived version
  write) remain in the built entrypoint.
- `src/project/input.ts`, `src/registry/snapshot.ts`, `src/codegen/plan.ts` —
  readonly `ProjectInput`, `RegistrySnapshot` and `PlanningOutcome` interfaces
  only; no readers, validators or planners are implemented before their
  scheduled checkpoints.
- `tests/unit/boundaries.test.ts` — proves pure import/execution performs no
  filesystem writes, the injected result handling matches the real built adapter,
  the boundary types reject invalid values at compile time (`@ts-expect-error`),
  and consumer fixture sources import no CLI/Node/registry internals.

### RCLD-01 cumulative verification (S012 milestone)

All commands ran under Node `24.21.0`/`pnpm 11.22.0`, with logs under
`implementation/evidence/logs/`.

| Lane                        | Result                                                                                                                                                                                              |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frozen strict install       | exit 0                                                                                                                                                                                              |
| Format check / lint         | exit 0 / exit 0                                                                                                                                                                                     |
| Typecheck (4 configs)       | exit 0                                                                                                                                                                                              |
| Unit                        | 3 files; 20 tests, 20 pass                                                                                                                                                                          |
| Runner harness              | 35 tests, 35 pass                                                                                                                                                                                   |
| Integration                 | 9 tests, 9 pass                                                                                                                                                                                     |
| Components                  | 4 tests, 4 pass                                                                                                                                                                                     |
| CLI smoke                   | 41 tests, 41 pass                                                                                                                                                                                   |
| Fixture check / build       | 0 errors, 0 warnings / exit 0                                                                                                                                                                       |
| Consumer SSR + lifecycle    | 17 tests, 17 pass                                                                                                                                                                                   |
| Browser (Chromium)          | 11 passed                                                                                                                                                                                           |
| Contract validation / tests | 0 error(s), 0 warning(s) / 101 tests, 101 pass                                                                                                                                                      |
| Workflow validation         | `actionlint 1.7.12` exit 0 (shellcheck 0.11.0 present)                                                                                                                                              |
| Fresh reference guard       | `cargo fmt` 0, `cargo check --workspace --all-targets` 0, `cargo test --workspace --all-targets` 0; 578 passed, 0 failed, 4 ignored (43 result lines) at `a10fbf06334f4648f5755e05a7147414e4e5fc98` |

The reference is clean at the audited commit and was not modified.

### S007–S012 implementation commits (pending independent review)

| Checkpoint | Commit                                     |
| ---------- | ------------------------------------------ |
| S007       | `99212955c2b812ef6bc525c9cdca14fae4e6499a` |
| S008       | `f4dfa83aadc67850b6b8b999f80bd7199de4a6b2` |
| S009       | `023cdf811505f5803ede334c57ee4a993073483e` |
| S010       | `a148a3163e5fa38e4f684292c902ac5707637299` |
| S011       | `64a1acb48ad552b0c6097b34b7c58f0cdbcf0c6f` |
| S012       | `14de6da6fbeb58af2a3843874e86c391e4a17051` |

These are author implementation commits pending independent Codex review; they
do not count as accepted completion.

The owner-authorized `pfc through RCLD-01` batch is complete: S007–S012 are
committed and pending review, the completed-checkpoint counter remains `6 / 203`
(independent acceptance only), the authored/committed-pending-review range is
`S007–S012`, and S013 is not started. Codex independently reviews the sequence
and records acceptance; no acceptance is claimed here.

### Not proven at S012

- No product command, schema, registry read/validate, planning or transaction
  behavior is implemented or claimed; those are later checkpoints.
- No package/tarball acceptance, publication, deployment or remote CI execution
  is claimed.
- Only macOS/Node 24.21.0 (and bundled Chromium) was exercised locally.
