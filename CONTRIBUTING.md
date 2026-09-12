# Contributing

Thanks for your interest in contributing to svelte-ui-kit.

## Ways to help

- Improve the scaffold and documentation.
- Report problems with the development tooling.
- Discuss component, theming, accessibility, and CLI requirements in
  [GitHub Issues](https://github.com/triesap/svelte-ui-kit/issues) before proposing
  substantial implementation work.

## Development setup

This project is pre-implementation. There are no components, CLI, build, or test
suite yet. The private root package provides formatting tools and is not published.

1. Fork and clone the repository, then create a branch for your change.
2. Install Node.js 24 or newer and pnpm 11.22.0, as pinned in `package.json`.
3. Run these commands from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm format
pnpm format:check
```

Commit dependency changes together with `pnpm-lock.yaml`.

## Pull request checklist

- Keep changes focused and well-scoped.
- Explain the change and how you verified it.
- Run `pnpm format:check`.
- Update documentation when setup or scope changes.
- Add meaningful tests and public API documentation when implementation begins.

## Code style

- Let the checked-in formatter handle supported file formats.
- Keep documentation clear and repository-relative.
- Keep generated output, credentials, and local runtime state out of contributions.

## Accessibility

Future components should follow WAI-ARIA APG patterns where applicable.
When implementation begins, changes affecting keyboard interaction or focus
should include tests.

## License

By contributing, you agree that your contributions are released under the
project's dual-license terms:
[MIT](LICENSE-MIT) OR [Apache-2.0](LICENSE-APACHE).
