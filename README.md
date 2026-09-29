# svelte-ui-kit

Source-first UI kit for Svelte with installable component source and a CLI.

## Status

Bootstrap. The repository currently provides the pinned development toolchain,
contract validation, and a minimal CLI that implements only `--help`/`-h` and
`--version`/`-V`. Component install/inspect/update commands are planned but not
implemented yet.

## Goals

- Provide a consistent component and theming foundation.
- Install components as project-owned source files.
- Use a CLI to add, inspect, and update components.
- Keep primitives, styling, and accessibility behavior predictable.

## Development

Requires Node.js `24.21.0` (see `.node-version`) and pnpm `11.22.0` (see
`packageManager` in `package.json`).

```sh
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run build
pnpm run test:cli-bootstrap
pnpm run test:unit -- tests/unit/cli-bootstrap.test.ts
pnpm run test:harness
pnpm run check:contracts
pnpm run test:contracts
pnpm run format:check
```

The unit runner is dependency-free: for every discovered `*.test.ts` entry
(including dot-prefixed and `..`-prefixed names) it writes an ephemeral
compiler configuration inside the ignored `.unit-test-build/` tree, extends the
tracked `tsconfig.unit.json`, and compiles with the pinned `tsc` into that
output tree before executing the selected tests with Node's built-in
`node:test` runner. Operands are repository-relative `*.test.ts` files; absolute
operands, parent-directory components and symlinked test roots or ancestors are
rejected, discovery is deterministic, and every selected file must actually
execute a passing test. Any `test:fail` event — including a TODO-marked one —
fails the run wherever the test was defined. `pnpm run test:harness` runs the
runner's own regression suite.

The CLI entrypoint is `src/cli/main.ts`, compiled with the pinned `tsc` to
`dist/cli/main.js` (build output is ignored and never committed).

## Contributing

See `CONTRIBUTING.md`.

## License

MIT OR Apache-2.0. See `LICENSE-MIT` and `LICENSE-APACHE`.
