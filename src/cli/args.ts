/**
 * Approved CLI argument grammar (S023).
 *
 * Only the reviewed surface is parsed, before any side effect:
 *
 * - commands `info`, `init`, `view`, `add`, `sync`, `doctor`;
 * - `view`/`add` take exactly one item; a bare `view`/`add` is a usage error;
 * - global `--json` and `--cwd <path>` may precede or follow the command;
 * - `--dry-run` belongs only to `init`/`add`/`sync`, `--source` only to `view`
 *   and `--strict` only to `doctor`;
 * - duplicate flags, unknown flags, missing values, extra positionals and
 *   invalid item ids are usage errors.
 *
 * `--help`/`-h` and `--version`/`-V` remain stable and are valid only alone.
 * Rejected force/remove/auto-install/remote-registry options fail explicitly
 * rather than being quietly accepted.
 */
import { isItemId } from "../project/requests.js";

export const PRODUCT_COMMANDS = [
  "info",
  "init",
  "view",
  "add",
  "sync",
  "doctor",
] as const;
export type ProductCommand = (typeof PRODUCT_COMMANDS)[number];

export interface CommandRequest {
  readonly kind: "command";
  readonly command: ProductCommand;
  readonly item: string | null;
  readonly json: boolean;
  readonly cwd: string | null;
  readonly dryRun: boolean;
  readonly source: boolean;
  readonly strict: boolean;
}

export type CliRequest =
  | { readonly kind: "help" }
  | { readonly kind: "version" }
  | CommandRequest
  | {
      readonly kind: "usage-error";
      readonly message: string;
      readonly argv: readonly string[];
    };

function usage(message: string, argv: readonly string[]): CliRequest {
  return { kind: "usage-error", message, argv: [...argv] };
}

function isProductCommand(value: string): value is ProductCommand {
  return (PRODUCT_COMMANDS as readonly string[]).includes(value);
}

/** Classify `argv` (already sliced past the executable/script). */
export function parseCliArgs(argv: readonly string[]): CliRequest {
  if (argv.length === 0) return { kind: "help" };
  const first = argv[0];
  if (argv.length === 1 && (first === "--help" || first === "-h")) {
    return { kind: "help" };
  }
  if (argv.length === 1 && (first === "--version" || first === "-V")) {
    return { kind: "version" };
  }

  let command: string | null = null;
  const positionals: string[] = [];
  const seen = new Set<string>();
  let json = false;
  let cwd: string | null = null;
  let dryRun = false;
  let source = false;
  let strict = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (
      arg === "--help" ||
      arg === "-h" ||
      arg === "--version" ||
      arg === "-V"
    ) {
      return usage(`${arg} must be used alone`, argv);
    }
    if (arg === "--json") {
      if (seen.has("json")) return usage("duplicate --json", argv);
      seen.add("json");
      json = true;
      continue;
    }
    if (arg === "--dry-run") {
      if (seen.has("dry-run")) return usage("duplicate --dry-run", argv);
      seen.add("dry-run");
      dryRun = true;
      continue;
    }
    if (arg === "--source") {
      if (seen.has("source")) return usage("duplicate --source", argv);
      seen.add("source");
      source = true;
      continue;
    }
    if (arg === "--strict") {
      if (seen.has("strict")) return usage("duplicate --strict", argv);
      seen.add("strict");
      strict = true;
      continue;
    }
    if (arg === "--cwd") {
      if (seen.has("cwd")) return usage("duplicate --cwd", argv);
      const value = argv[index + 1];
      if (value === undefined || value.startsWith("-")) {
        return usage("--cwd requires a directory value", argv);
      }
      seen.add("cwd");
      cwd = value;
      index += 1;
      continue;
    }
    if (arg.startsWith("--cwd=")) {
      if (seen.has("cwd")) return usage("duplicate --cwd", argv);
      const value = arg.slice("--cwd=".length);
      if (value === "") return usage("--cwd requires a directory value", argv);
      seen.add("cwd");
      cwd = value;
      continue;
    }
    if (arg.startsWith("-")) {
      return usage(`unsupported option: ${arg}`, argv);
    }
    if (command === null) command = arg;
    else positionals.push(arg);
  }

  if (command === null) return usage("no command was given", argv);
  if (!isProductCommand(command)) {
    return usage(`unknown command: ${command}`, argv);
  }

  const takesItem = command === "view" || command === "add";
  if (takesItem) {
    if (positionals.length === 0) {
      return usage(`"${command}" requires exactly one item`, argv);
    }
    if (positionals.length > 1) {
      return usage(`"${command}" accepts exactly one item`, argv);
    }
    if (!isItemId(positionals[0])) {
      return usage(`invalid item id: ${positionals[0]}`, argv);
    }
  } else if (positionals.length > 0) {
    return usage(`"${command}" does not accept positional arguments`, argv);
  }

  if (
    dryRun &&
    !(command === "init" || command === "add" || command === "sync")
  ) {
    return usage(`--dry-run is only valid for init, add and sync`, argv);
  }
  if (source && command !== "view") {
    return usage(`--source is only valid for view`, argv);
  }
  if (strict && command !== "doctor") {
    return usage(`--strict is only valid for doctor`, argv);
  }

  return {
    kind: "command",
    command,
    item: takesItem ? positionals[0] : null,
    json,
    cwd,
    dryRun,
    source,
    strict,
  };
}
