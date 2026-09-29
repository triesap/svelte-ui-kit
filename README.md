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
pnpm run check:contracts
pnpm run test:contracts
pnpm run format:check
```

The CLI entrypoint is `src/cli/main.ts`, compiled with the pinned `tsc` to
`dist/cli/main.js` (build output is ignored and never committed).

## Contributing

See `CONTRIBUTING.md`.

## License

MIT OR Apache-2.0. See `LICENSE-MIT` and `LICENSE-APACHE`.
