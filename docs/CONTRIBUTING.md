# Contributing

Changes should address a concrete current contract or defect, preserve app-owned
source and retain meaningful causal controls. Discuss substantial new scope through
the [repository](https://github.com/triesap/svelte-ui-kit) before implementation;
the current package remains private and unpublished. Extension direction is not
approval to invent select/combobox/popover/date/higher-level APIs.

## Set up and verify

Clone a checkout, create a task branch and use Node 24.22.1/pnpm 12.16.1. From the
repository root, prepare the authentic archive before frozen strict installation:

```sh
node tools/prepare-native-artifacts.ts --fixture
pnpm install --frozen-lockfile --strict-peer-dependencies --engine-strict
pnpm run typecheck
pnpm run build
pnpm run test:cli-bootstrap
pnpm run test:harness
pnpm run lint
pnpm run format:check
pnpm run check:ci
pnpm run test:ci
pnpm run check:docs
pnpm run test:docs
```

Preparation and initial dependency setup may require network access. Do not
modify pins, patch installed declarations or suppress compiler/accessibility
diagnostics. See the [native guide](agents/native-dependency.md) for reproduction.
Use [getting started](getting-started.md) to test an actual local tarball installed
in a separate CLI host; app dependencies are explicit app-owned operations.

Select the owning checks from [testing](agents/testing.md). Its runner semantics,
full cumulative commands, platform and installed-package requirements are the
maintenance contract. A focused pass is not final release qualification. Shared
fixture/compiler/native/package writers must run serially. Browser tests own
their production server lifecycle and fail unexpected page/console/hydration errors.

## Formatting and lint ownership

`biome.json` pins the policy, with Biome's version in the shared pnpm catalog.
Use `pnpm run format`, `pnpm run format:check` and `pnpm run lint`; CI runs the
same commands. Biome owns TypeScript/JavaScript, JSON and CSS formatting and its
recommended lint preset. Prettier owns Svelte, Astro, Markdown and YAML formatting,
with disjoint Biome formatter overrides. Biome's framework support is experimental;
ESLint remains necessary for Svelte compiler/accessibility, framework rules and
TypeScript recommendations. Do not remove those checks merely to reduce tooling.

The config documents narrow exceptions through explicit paths: dynamic FieldLabel
association and Separator roles use native/compiler/browser checks; qualification
fixtures intentionally exercise native button defaults, decorative ARIA and semantic
roles. Browser tests use rendered `innerText` where visibility matters. Non-null
assertions remain available for checked invariants; strict TypeScript, rather than
Biome's uninitialized-let heuristic, owns evolving variable types. Callback cleanup
and Playwright fixture `void` types retain their actual upstream contracts. Generated
outputs, lockfiles and vendored producer artifacts retain their owning formats.
Inline suppressions explain deliberate literal Actions expressions and hostile-input
controls. They do not waive actual compiler, accessibility or browser qualification.

All authored modules under `tests/` and `tools/` use `.ts`, including executable
helpers. `pnpm run check:source` rejects JavaScript entrypoints, hidden escapes,
symlinks and narrowed tooling coverage. The tooling compiler covers every such
module; framework fixtures retain their separate strict application checks.

## Change and review policy

Inspect current status and the relevant contracts/tests before edits. Preserve
unrelated work, public repository identity, authenticated inputs, source boundaries
and application bytes. Make the smallest complete change that fixes the root cause.
Generated archives/build outputs, local evidence, secrets and runtime state are
not contributions. Use checked-in formatting/lint rules and actual native types;
do not turn off SSR, weaken types or disable tests to make a lane green.

Update docs, schemas/registry/fixtures/tests together when an approved contract
changes. Preserve source notices and both root license texts. Test the real result,
including default/custom mappings, dry-run/refusal tree preservation, conflicts,
customized retirement and strict diagnosis where affected. Retired app imports
need explicit review even after a successful sync; generation does not rewrite
arbitrary application code. Recovery retains corrupt/ambiguous and post-crash
evidence; use the [runbook](guides/recovery.md) rather than deleting journals.

Use small coherent verified commits only when authorized. Review the actual diff
and report the problem/result, commands/exits, limits and unrun checks. New failures
block the owning change until repaired or honestly identified as external/pre-existing.
Independent acceptance, when required, uses a separate reviewer. No self-review,
commit count or configured CI job grants that acceptance. Push, publication,
deployment or reference-source mutation requires its own authorization.

## Accessibility and release readiness

Changed keyboard/focus/forms/labels/snippets require actual generated-app evidence.
Preserve native reset/callback/SSR/portal behavior and document supported limits.
Computed text/geometry, RTL, reduced motion and theme/CSP tests do not certify
arbitrary themes or screen-reader speech. Keep [contrast and native boundaries](reference/compatibility.md)
explicit; any demonstrated required violation remains a release blocker.

A release needs full current checks, clean-checkout bootstrap and a real installed
archive independent of source/CLI host, complete offline public-doc link closure,
honest compatibility/provenance and any required separate acceptance. Local packing
is inspection, not publication. No external mutation is implied by contribution.

Contributions are licensed under [MIT](../LICENSE-MIT) OR
[Apache-2.0](../LICENSE-APACHE); retain [notices](../NOTICE.md).

When an external build runtime supplies `EXTBUILD_EXECUTABLE`,
`EXTBUILD_MACHINE_CONFIG` and `EXTBUILD_PROJECT_ROOT`, repository-owned pnpm
subprocesses re-enter it for each source or generated workspace. Unmanaged
checkouts retain ordinary pnpm behavior. The runtime owns path admission and
locks; this optional tooling adapter does not change package resolution or
authenticate dependency payloads. Native inventories remain complete, including
the exact pnpm shim template with its physical dependency locations checked.
