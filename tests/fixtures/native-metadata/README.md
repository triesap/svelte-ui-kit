# Native installer metadata fixture

`pnpm-12.21-acorn-8.19.fixture` is measured data from an ordinary pnpm12.21.0
installation of the qualified Svelte archive with Acorn8.19.0. It is not a
maintained executable helper. Tests never execute this fixture; they authenticate
its exact bytes and exercise altered, linked, missing and shadowing refusals.

The generated pnpm launcher is MIT licensed; its upstream notice is retained in
[LICENSE.txt](LICENSE.txt), from pnpm's v12.21.0 release. No application, private
workspace or credential paths are present.
