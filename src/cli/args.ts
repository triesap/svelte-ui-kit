/**
 * Pure CLI argument classification.
 *
 * This module performs no I/O, reads no package metadata and writes nothing;
 * it only maps an argument list to a small discriminated request that the CLI
 * adapter can apply. Product commands are intentionally not modelled here.
 */
export type CliRequest =
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | { readonly kind: "usage-error"; readonly argv: readonly string[] };

/**
 * Classify `argv` (already sliced past the executable/script) into a help,
 * version or usage-error request. Only the exact single-argument help/version
 * flags are accepted; every other list is a usage error.
 */
export function parseCliArgs(argv: readonly string[]): CliRequest {
  const first = argv[0];
  if (first === undefined) return { kind: "help" };
  if (argv.length === 1 && (first === "--help" || first === "-h")) {
    return { kind: "help" };
  }
  if (argv.length === 1 && (first === "--version" || first === "-V")) {
    return { kind: "version" };
  }
  return { kind: "usage-error", argv: [...argv] };
}
