# Native installer metadata fixture

`pnpm-12.21-acorn-8.19.fixture` is measured data from an ordinary pnpm12.21.0
installation of the qualified Svelte archive with Acorn8.19.0. It is not a
maintained executable helper. Tests never execute this fixture; they authenticate
its exact bytes and exercise altered, linked, missing and shadowing refusals.

The generated pnpm launcher is MIT licensed; its upstream notice is retained in
[LICENSE.txt](LICENSE.txt), from pnpm's v12.21.0 release. No application, private
workspace or credential paths are present.

`pnpm-12.16-acorn-8.18-relocatable.fixture` records the exact pnpm12.16.1
launcher template measured during native external-storage adoption. Only its
two NODE_PATH fields and final target locator are tokenized. Runtime checks bind
those fields to the physically resolved Acorn dependency before hashing the
complete remaining script. No executable statements or inventory entries are
ignored. Tampered or redirected fields must continue to fail.
