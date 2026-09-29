# Contributing

Thanks for your interest in contributing to svelte-ui-kit.

## Ways to help

- Improve the CLI boundary, tooling, and documentation.
- Report problems with the development tooling.
- Discuss component, theming, accessibility, and CLI requirements in
  [GitHub Issues](https://github.com/triesap/svelte-ui-kit/issues) before proposing
  substantial implementation work.

## Development setup

Node.js `24.21.0` and pnpm `11.22.0` are pinned by `.node-version` and
`package.json`. This root package is private and is not published.

1. Fork and clone the repository, then create a branch for your change.
2. Install the frozen dependency set:

```sh
pnpm install --frozen-lockfile
```

3. Type-check and build the CLI boundary:

```sh
pnpm run typecheck
pnpm run build
```

4. Run the bootstrap CLI smoke, the unit suite and the contract suites:

```sh
pnpm run test:cli-bootstrap
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
pnpm run test:harness
pnpm run check:contracts
pnpm run test:contracts
```

`pnpm run test:unit` builds the product, compiles every discovered
`tests/unit/**/*.test.ts` entry through an ephemeral configuration that extends
`tsconfig.unit.json`, then runs the selected typed files. It accepts
repository-relative `*.test.ts` operands (with one optional leading `--`); with
no operands it discovers every unit test deterministically, including
dot-prefixed names and directories. Absolute operands, parent-directory
components, symlinked test roots/ancestors and a symlinked owned output root all
fail closed instead of running the whole suite, and a selected file that
executes no passing test fails. Explicit selection controls which files run, not
which ordinary unit inputs are typechecked. Any `test:fail` event, including a
TODO-marked one, fails the run. `pnpm run test:harness` exercises the runner
itself.

Both `typecheck` and `test:unit` are required: standalone `typecheck` uses the
tracked compiler includes, while the unit runner also compiles every discovered
unit entry, including dot-prefixed files and directories.

5. Check formatting:

```sh
pnpm run format:check
```

Commit dependency changes together with `pnpm-lock.yaml`.

## Current scope

Only help and version output are implemented: `--help`/`-h` and `--version`/`-V`
exit 0, and every other argument list (including `--json` and `--cwd`, and all
product command names) is rejected with a stderr diagnostic and exit code 2.
Component install/inspect/update work is planned but not implemented yet.

## Pull request checklist

- Keep changes focused and well-scoped.
- Explain the change and how you verified it.
- Run `pnpm run typecheck`, `pnpm run build`, `pnpm run test:cli-bootstrap`,
  `pnpm run test:unit`, `pnpm run test:harness` and `pnpm run format:check`
  (plus `pnpm run check:contracts` and `pnpm run test:contracts` for contract or
  evidence changes).
- Update documentation when setup or scope changes.
- Add meaningful tests and public API documentation when implementation begins.

## Code style

- Let the checked-in formatter handle supported file formats.
- Keep documentation clear and repository-relative.
- Keep generated output, credentials, and local runtime state out of contributions.

## Accessibility

Future components should follow WAI-ARIA APG patterns where applicable.
When component implementation begins, changes affecting keyboard interaction or
focus should include tests.

## License

By contributing, you agree that your contributions are released under the
project's dual-license terms:
[MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE).
